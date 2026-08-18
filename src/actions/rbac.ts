'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const COOKIE_NAME = 'efcpl_session_user';

// ==========================================
// 1. PERMISSIONS ACTIONS
// ==========================================

export async function getPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });

    const grouped = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    }, {});

    return { success: true, data: permissions, grouped };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch permissions' };
  }
}

// ==========================================
// 2. DISCORD-STYLE ROLES ACTIONS
// ==========================================

export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = roles.map((r) => ({
      ...r,
      permissionKeys: r.rolePermissions.map((rp) => rp.permission.key),
      usersCount: r._count.users,
    }));

    return { success: true, data: formatted };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch roles' };
  }
}

export async function createRole(data: {
  name: string;
  colorTag?: string;
  description?: string;
  permissionKeys: string[];
}) {
  try {
    const nameClean = data.name.trim();
    const existing = await prisma.role.findUnique({ where: { name: nameClean } });
    if (existing) {
      return { success: false, error: `Role with name "${nameClean}" already exists.` };
    }

    const perms = await prisma.permission.findMany({
      where: { key: { in: data.permissionKeys } },
    });

    const newRole = await prisma.role.create({
      data: {
        name: nameClean,
        colorTag: data.colorTag || '#3B82F6',
        description: data.description?.trim(),
        rolePermissions: {
          create: perms.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    revalidatePath('/');
    return { success: true, data: newRole };
  } catch (error: any) {
    console.error('Error creating role:', error);
    return { success: false, error: error.message || 'Failed to create role' };
  }
}

export async function updateRole(
  roleId: string,
  data: {
    name?: string;
    colorTag?: string;
    description?: string;
    permissionKeys?: string[];
  }
) {
  try {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return { success: false, error: 'Role not found' };

    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: roleId },
        data: {
          name: data.name ? data.name.trim() : undefined,
          colorTag: data.colorTag,
          description: data.description,
        },
      });

      if (data.permissionKeys) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        const perms = await tx.permission.findMany({
          where: { key: { in: data.permissionKeys } },
        });

        if (perms.length > 0) {
          await tx.rolePermission.createMany({
            data: perms.map((p) => ({
              roleId,
              permissionId: p.id,
            })),
          });
        }
      }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update role' };
  }
}

export async function deleteRole(roleId: string) {
  try {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (role?.isSystemAdmin) {
      return { success: false, error: 'Cannot delete System Admin role' };
    }

    await prisma.role.delete({ where: { id: roleId } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete role' };
  }
}

// ==========================================
// 3. STAFF USER MANAGEMENT ACTIONS
// ==========================================

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    return { success: true, data: sanitized };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch users' };
  }
}

export async function createUser(data: {
  username: string;
  name: string;
  password?: string;
  roleId?: string;
}) {
  try {
    const usernameClean = data.username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { username: usernameClean } });
    if (existing) {
      return { success: false, error: `Username "${usernameClean}" is already taken.` };
    }

    const defaultPass = data.password || 'efcpl123';
    const pwdHash = hashPassword(defaultPass);

    const newUser = await prisma.user.create({
      data: {
        username: usernameClean,
        name: data.name.trim(),
        passwordHash: pwdHash,
        roleId: data.roleId || null,
        isActive: true,
      },
      include: { role: true },
    });

    const { passwordHash, ...sanitized } = newUser;
    revalidatePath('/');
    return { success: true, data: sanitized };
  } catch (error: any) {
    console.error('Error creating staff user:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
}

export const createStaffUser = createUser;

export async function updateUser(
  userId: string,
  data: Partial<{
    name: string;
    roleId: string;
    password?: string;
    isActive: boolean;
  }>
) {
  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.roleId !== undefined) updateData.roleId = data.roleId || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.password && data.password.trim() !== '') {
      updateData.passwordHash = hashPassword(data.password.trim());
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true },
    });

    const { passwordHash, ...sanitized } = updated;
    revalidatePath('/');
    return { success: true, data: sanitized };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update user' };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete user' };
  }
}

// ==========================================
// 4. AUTHENTICATION & LOGIN SESSION
// ==========================================

export async function loginUser(usernameInput: string, passwordInput: string) {
  try {
    const username = usernameInput.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    if (!user.isActive) {
      return { success: false, error: 'User account is deactivated. Contact Administrator.' };
    }

    const isValid = verifyPassword(passwordInput, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid username or password' };
    }

    const cookieStore = await cookies();
    const sessionData = JSON.stringify({
      id: user.id,
      username: user.username,
      name: user.name,
      roleName: user.role?.name || 'Staff User',
      colorTag: user.role?.colorTag || '#3B82F6',
      permissions: user.role?.rolePermissions.map((rp) => rp.permission.key) || [],
      isSystemAdmin: user.role?.isSystemAdmin || false,
    });

    cookieStore.set(COOKIE_NAME, sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    const { passwordHash, ...sanitizedUser } = user;
    return { success: true, data: sanitizedUser };
  } catch (error: any) {
    console.error('Error logging in user:', error);
    return { success: false, error: error.message || 'Login failed' };
  }
}

export async function checkUserLoginStatus(usernameInput: string) {
  try {
    const username = usernameInput.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return {
      success: true,
      isPasswordSet: true,
      name: user.name,
      username: user.username,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setupFirstTimePassword(usernameInput: string, passwordInput: string) {
  return loginUser(usernameInput, passwordInput);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return { success: false, data: null };
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const user = await prisma.user.findUnique({
      where: { id: sessionData.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return { success: false, data: null };
    }

    const { passwordHash, ...sanitized } = user;
    return {
      success: true,
      data: {
        ...sanitized,
        permissions: user.role?.rolePermissions.map((rp) => rp.permission.key) || [],
      },
    };
  } catch (error: any) {
    return { success: false, data: null };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
