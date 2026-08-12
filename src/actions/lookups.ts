'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSystemLookups(group?: string) {
  try {
    const lookups = await prisma.systemLookup.findMany({
      where: {
        ...(group ? { group } : {}),
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return { success: true, data: lookups };
  } catch (error: any) {
    console.error('Error fetching lookups:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createSystemLookup(data: {
  group: string;
  code: string;
  label: string;
  sortOrder?: number;
  metadata?: any;
}) {
  try {
    const newLookup = await prisma.systemLookup.create({
      data: {
        group: data.group.toUpperCase(),
        code: data.code,
        label: data.label,
        sortOrder: data.sortOrder || 0,
        metadata: data.metadata || null,
      },
    });
    revalidatePath('/');
    return { success: true, data: newLookup };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategoryMasters() {
  try {
    const categories = await prisma.categoryMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function getStorageLocations() {
  try {
    const locations = await prisma.storageLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: locations };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function getSystemSettings() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    return { success: true, data: settingsMap };
  } catch (error: any) {
    return { success: false, error: error.message, data: {} };
  }
}
