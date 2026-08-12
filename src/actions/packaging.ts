'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPackagingMaterials(query?: string) {
  try {
    const packaging = await prisma.packagingMaterial.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    let filtered = packaging;
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.description.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
      );
    }

    return { success: true, data: filtered };
  } catch (error: any) {
    console.error('Error fetching packaging materials:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createPackagingMaterial(formData: {
  code: string;
  type: string;
  description: string;
  specification?: string;
  qty: number;
  unit?: string;
  linkedSkus?: string;
  supplier?: string;
  moq?: number;
  leadTimeDays?: number;
  lastPurchaseRate?: number;
  reorderLevel?: number;
  avgConsumption?: number;
  attributes?: any;
}) {
  try {
    const pm = await prisma.packagingMaterial.create({
      data: {
        code: formData.code,
        type: formData.type,
        description: formData.description,
        specification: formData.specification || null,
        qty: Number(formData.qty) || 0,
        unit: formData.unit || 'Units',
        linkedSkus: formData.linkedSkus || null,
        supplier: formData.supplier || null,
        moq: formData.moq ? Number(formData.moq) : 0,
        leadTimeDays: formData.leadTimeDays ? Number(formData.leadTimeDays) : 0,
        lastPurchaseRate: formData.lastPurchaseRate ? Number(formData.lastPurchaseRate) : 0,
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 0,
        avgConsumption: formData.avgConsumption ? Number(formData.avgConsumption) : 0,
        attributes: formData.attributes || null,
      },
    });

    revalidatePath('/');
    return { success: true, data: pm };
  } catch (error: any) {
    console.error('Error creating packaging material:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePackagingMaterial(id: string) {
  try {
    await prisma.packagingMaterial.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
