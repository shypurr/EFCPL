'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: roles };
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { label: 'asc' }],
    });
    return { success: true, data: permissions };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function createRole(formData: {
  name: string;
  colorTag?: string;
  description?: string;
  isDefault?: boolean;
  permissionIds: string[];
}) {
  try {
    const existing = await prisma.role.findUnique({
      where: { name: formData.name.trim() },
    });
    if (existing) {
      return { success: false, error: 'A role with this name already exists' };
    }

    const role = await prisma.role.create({
      data: {
        name: formData.name.trim(),
        colorTag: formData.colorTag || '#3B82F6',
        description: formData.description || null,
        isDefault: formData.isDefault || false,
      },
    });

    if (formData.permissionIds && formData.permissionIds.length > 0) {
      for (const permId of formData.permissionIds) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }

    revalidatePath('/');
    return { success: true, data: role };
  } catch (error: any) {
    console.error('Error creating role:', error);
    return { success: false, error: error.message };
  }
}

export async function updateRole(
  roleId: string,
  formData: {
    name: string;
    colorTag?: string;
    description?: string;
    isDefault?: boolean;
    permissionIds: string[];
  }
) {
  try {
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: formData.name.trim(),
        colorTag: formData.colorTag || '#3B82F6',
        description: formData.description || null,
        isDefault: formData.isDefault || false,
      },
    });

    // Replace role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    if (formData.permissionIds && formData.permissionIds.length > 0) {
      for (const permId of formData.permissionIds) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }

    revalidatePath('/');
    return { success: true, data: role };
  } catch (error: any) {
    console.error('Error updating role:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteRole(roleId: string) {
  try {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (role?.isSystemAdmin) {
      return { success: false, error: 'Cannot delete the System Admin role' };
    }

    await prisma.role.delete({ where: { id: roleId } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
