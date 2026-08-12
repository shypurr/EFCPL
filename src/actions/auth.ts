'use server';

import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const SESSION_COOKIE = 'efcpl_session';

/**
 * Step 1 of Login Flow: Check if user exists & if first-time password setup is needed
 */
export async function checkUserLoginStatus(identifier: string) {
  try {
    const term = identifier.toLowerCase().trim();
    if (!term) {
      return { success: false, error: 'Please enter your Email Address or Username' };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: term },
          { username: term },
        ],
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) {
      return { success: false, error: 'Account not found. Please verify your Email or Username.' };
    }

    if (!user.isPasswordSet) {
      return {
        success: true,
        status: 'NEEDS_PASSWORD_SETUP',
        userId: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        roleName: user.role?.name || 'Staff',
      };
    }

    return {
      success: true,
      status: 'PASSWORD_REQUIRED',
      userId: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      roleName: user.role?.name || 'Staff',
    };
  } catch (error: any) {
    console.error('Error checking login status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * First-Time Password Setup Flow for Staff
 */
export async function setupFirstTimePassword(userId: string, password: string) {
  try {
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const passwordHash = hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        isPasswordSet: true,
      },
    });

    revalidatePath('/');
    return {
      success: true,
      message: '✅ Password created successfully! You can now sign in using your credentials.',
    };
  } catch (error: any) {
    console.error('Error setting up password:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Standard Login Verification for Users with Password Set
 */
export async function loginUser(data: { identifier: string; password: string }) {
  try {
    const term = data.identifier.toLowerCase().trim();
    if (!term || !data.password) {
      return { success: false, error: 'Username/Email and Password are required' };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: term },
          { username: term },
        ],
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return { success: false, error: 'Invalid credentials or account disabled' };
    }

    if (!user.isPasswordSet || !user.passwordHash) {
      return {
        success: false,
        error: 'First-time setup required. Please enter your email to create your password.',
      };
    }

    const isValid = verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }

    // Set Session Cookie
    const sessionData = JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      roleName: user.role?.name || 'Staff',
      isSystemAdmin: user.role?.isSystemAdmin || false,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    revalidatePath('/');
    return { success: true, user: sessionData };
  } catch (error: any) {
    console.error('Error logging in:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (!session || !session.value) return null;

    const sessionUser = JSON.parse(session.value);
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user || !user.isActive) return null;

    let effectivePermissions: string[] = [];
    if (user.role?.isSystemAdmin) {
      effectivePermissions = ['*'];
    } else if (user.useDefaultPermissions) {
      effectivePermissions = user.role?.rolePermissions.map((rp) => rp.permission.key) || [];
    } else {
      effectivePermissions = user.userPermissions.map((up) => up.permission.key);
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role?.name || 'Staff',
      colorTag: user.role?.colorTag || '#3B82F6',
      isSystemAdmin: user.role?.isSystemAdmin || false,
      useDefaultPermissions: user.useDefaultPermissions,
      permissions: effectivePermissions,
    };
  } catch (error) {
    return null;
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  revalidatePath('/');
  return { success: true };
}

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        userPermissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Admin Action: Create New Staff User (Name, Email, Role)
 * Automatically derives username from email prefix!
 */
export async function createStaffUser(formData: {
  name: string;
  email: string;
  roleId: string;
  useDefaultPermissions?: boolean;
  manualPermissionIds?: string[];
}) {
  try {
    const cleanEmail = formData.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      return { success: false, error: 'A staff user with this email address already exists' };
    }

    // Generate unique username from email prefix (e.g. suresh from suresh@efcpl.com)
    let baseUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
    if (!baseUsername) baseUsername = 'staff';

    let username = baseUsername;
    let count = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${count}`;
      count++;
    }

    const useDefault = formData.useDefaultPermissions !== undefined ? formData.useDefaultPermissions : true;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        username,
        name: formData.name.trim(),
        roleId: formData.roleId,
        isPasswordSet: false,
        passwordHash: null,
        useDefaultPermissions: useDefault,
      },
    });

    if (!useDefault && formData.manualPermissionIds && formData.manualPermissionIds.length > 0) {
      for (const permId of formData.manualPermissionIds) {
        await prisma.userPermission.create({
          data: {
            userId: user.id,
            permissionId: permId,
          },
        });
      }
    }

    revalidatePath('/');
    return {
      success: true,
      data: user,
      message: `Staff user "${formData.name}" created! Username: "${username}". Password will be created on first login.`,
    };
  } catch (error: any) {
    console.error('Error creating staff user:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
