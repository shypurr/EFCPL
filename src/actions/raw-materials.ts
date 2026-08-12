'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getRawMaterials(query?: string, statusFilter?: string) {
  try {
    const materials = await prisma.rawMaterial.findMany({
      include: { location: true },
      orderBy: { updatedAt: 'desc' },
    });

    let filtered = materials;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          (m.supplierName || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((m) => {
        const isLow = m.qty <= m.reorderLevel;
        const isOver = m.maxStock ? m.qty >= m.maxStock : false;
        const status = isLow ? 'Low Stock' : isOver ? 'Overstocked' : 'OK';
        return status === statusFilter;
      });
    }

    return { success: true, data: filtered };
  } catch (error: any) {
    console.error('Error fetching raw materials:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createRawMaterial(formData: {
  code: string;
  name: string;
  grade?: string;
  qty: number;
  unit: string;
  reorderLevel: number;
  maxStock?: number;
  supplierName?: string;
  leadTimeDays?: number;
  lastPurchaseRate?: number;
  lastReceivedDate?: string;
  batchNumber?: string;
  coaStatus?: string;
  locationId?: string;
  expiryDate?: string;
  remarks?: string;
  attributes?: any;
}) {
  try {
    const material = await prisma.rawMaterial.create({
      data: {
        code: formData.code,
        name: formData.name,
        grade: formData.grade || null,
        qty: Number(formData.qty) || 0,
        unit: formData.unit || 'KG',
        reorderLevel: Number(formData.reorderLevel) || 0,
        maxStock: formData.maxStock ? Number(formData.maxStock) : null,
        supplierName: formData.supplierName || null,
        leadTimeDays: formData.leadTimeDays ? Number(formData.leadTimeDays) : 0,
        lastPurchaseRate: formData.lastPurchaseRate ? Number(formData.lastPurchaseRate) : 0,
        lastReceivedDate: formData.lastReceivedDate ? new Date(formData.lastReceivedDate) : new Date(),
        batchNumber: formData.batchNumber || null,
        coaStatus: formData.coaStatus || 'Approved',
        locationId: formData.locationId || null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        remarks: formData.remarks || null,
        attributes: formData.attributes || null,
      },
    });

    revalidatePath('/');
    return { success: true, data: material };
  } catch (error: any) {
    console.error('Error creating raw material:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteRawMaterial(id: string) {
  try {
    await prisma.rawMaterial.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
