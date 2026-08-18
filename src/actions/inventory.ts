'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ==========================================
// 1. RAW MATERIALS ACTIONS
// ==========================================

export async function getRawMaterials(search?: string, statusFilter?: string) {
  try {
    const where: any = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const items = await prisma.rawMaterial.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return { success: true, data: items };
  } catch (error: any) {
    console.error('Error fetching raw materials:', error);
    return { success: false, error: error.message || 'Failed to fetch raw materials' };
  }
}

export async function getRawMaterialByCode(code: string) {
  try {
    const item = await prisma.rawMaterial.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!item) return { success: false, error: 'Raw Material code not found' };
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Master creation (Add tab)
export async function createRawMaterial(data: {
  code: string;
  name: string;
  brand?: string;
  batchNumber?: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  maxStock?: number;
  supplier?: string;
  location?: string;
  expiryDate?: string | Date;
  status?: string;
  remarks?: string;
}) {
  try {
    const codeClean = data.code.trim().toUpperCase();
    const existing = await prisma.rawMaterial.findUnique({ where: { code: codeClean } });
    if (existing) {
      return { success: false, error: `Raw Material with code "${codeClean}" already exists.` };
    }

    let status = data.status || 'Active';
    if (data.stock <= data.reorderLevel) {
      status = 'Low Stock';
    }

    const newItem = await prisma.rawMaterial.create({
      data: {
        code: codeClean,
        name: data.name.trim(),
        brand: data.brand?.trim(),
        batchNumber: data.batchNumber?.trim() || `BATCH-${Date.now().toString().slice(-4)}`,
        stock: Number(data.stock),
        unit: data.unit.trim(),
        reorderLevel: Number(data.reorderLevel),
        maxStock: data.maxStock ? Number(data.maxStock) : null,
        supplier: data.supplier?.trim(),
        location: data.location?.trim() || 'RM Store A',
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status,
        remarks: data.remarks?.trim(),
      },
    });

    revalidatePath('/');
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error('Error creating raw material:', error);
    return { success: false, error: error.message || 'Failed to create raw material' };
  }
}

// Inward arrival for existing RM (RM tab)
export async function inwardRawMaterial(data: {
  code: string;
  name?: string;
  brand?: string;
  batchNumber: string;
  inwardQty: number;
  unit?: string;
  supplier?: string;
  location?: string;
  expiryDate?: string | Date;
  remarks?: string;
}) {
  try {
    const qty = Number(data.inwardQty);
    if (qty <= 0) {
      return { success: false, error: 'Inward quantity must be greater than zero' };
    }

    const codeClean = data.code.trim().toUpperCase();
    const rm = await prisma.rawMaterial.findUnique({
      where: { code: codeClean },
    });

    if (!rm) {
      return { success: false, error: `Raw Material "${codeClean}" not found. Please add it in Add Materials Hub first.` };
    }

    const updatedStock = rm.stock + qty;
    const newStatus = updatedStock <= rm.reorderLevel ? 'Low Stock' : 'Active';

    const updated = await prisma.rawMaterial.update({
      where: { id: rm.id },
      data: {
        name: data.name ? data.name.trim() : rm.name,
        brand: data.brand ? data.brand.trim() : rm.brand,
        batchNumber: data.batchNumber.trim(),
        stock: updatedStock,
        unit: data.unit ? data.unit.trim() : rm.unit,
        supplier: data.supplier ? data.supplier.trim() : rm.supplier,
        location: data.location ? data.location.trim() : rm.location,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : rm.expiryDate,
        status: newStatus,
        remarks: data.remarks ? data.remarks.trim() : rm.remarks,
      },
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error logging inward raw material:', error);
    return { success: false, error: error.message || 'Failed to log inward raw material' };
  }
}

export async function updateRawMaterial(
  id: string,
  data: Partial<{
    name: string;
    brand: string;
    batchNumber: string;
    stock: number;
    unit: string;
    reorderLevel: number;
    maxStock: number;
    supplier: string;
    location: string;
    expiryDate: string | Date;
    status: string;
    remarks: string;
  }>
) {
  try {
    const updateData: any = { ...data };
    if (data.stock !== undefined) updateData.stock = Number(data.stock);
    if (data.reorderLevel !== undefined) updateData.reorderLevel = Number(data.reorderLevel);
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock ? Number(data.maxStock) : null;
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);

    const updated = await prisma.rawMaterial.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update raw material' };
  }
}

export async function deleteRawMaterial(id: string) {
  try {
    await prisma.rawMaterial.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete raw material' };
  }
}

// ==========================================
// 2. PACKAGING MATERIALS ACTIONS
// ==========================================

export async function getPackagingMaterials(search?: string, statusFilter?: string) {
  try {
    const where: any = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const items = await prisma.packagingMaterial.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return { success: true, data: items };
  } catch (error: any) {
    console.error('Error fetching packaging materials:', error);
    return { success: false, error: error.message || 'Failed to fetch packaging materials' };
  }
}

export async function getPackagingMaterialByCode(code: string) {
  try {
    const item = await prisma.packagingMaterial.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!item) return { success: false, error: 'Packaging Material code not found' };
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Master creation (Add tab)
export async function createPackagingMaterial(data: {
  code: string;
  name: string;
  brand?: string;
  batchNumber?: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  maxStock?: number;
  supplier?: string;
  location?: string;
  expiryDate?: string | Date;
  status?: string;
  remarks?: string;
}) {
  try {
    const codeClean = data.code.trim().toUpperCase();
    const existing = await prisma.packagingMaterial.findUnique({ where: { code: codeClean } });
    if (existing) {
      return { success: false, error: `Packaging Material with code "${codeClean}" already exists.` };
    }

    let status = data.status || 'Active';
    if (data.stock <= data.reorderLevel) {
      status = 'Low Stock';
    }

    const newItem = await prisma.packagingMaterial.create({
      data: {
        code: codeClean,
        name: data.name.trim(),
        brand: data.brand?.trim(),
        batchNumber: data.batchNumber?.trim() || `P-BATCH-${Date.now().toString().slice(-4)}`,
        stock: Number(data.stock),
        unit: data.unit.trim(),
        reorderLevel: Number(data.reorderLevel),
        maxStock: data.maxStock ? Number(data.maxStock) : null,
        supplier: data.supplier?.trim(),
        location: data.location?.trim() || 'PM Warehouse',
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status,
        remarks: data.remarks?.trim(),
      },
    });

    revalidatePath('/');
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error('Error creating packaging material:', error);
    return { success: false, error: error.message || 'Failed to create packaging material' };
  }
}

// Inward arrival for existing PM (PM tab)
export async function inwardPackagingMaterial(data: {
  code: string;
  name?: string;
  brand?: string;
  batchNumber: string;
  inwardQty: number;
  unit?: string;
  supplier?: string;
  location?: string;
  expiryDate?: string | Date;
  remarks?: string;
}) {
  try {
    const qty = Number(data.inwardQty);
    if (qty <= 0) {
      return { success: false, error: 'Inward quantity must be greater than zero' };
    }

    const codeClean = data.code.trim().toUpperCase();
    const pm = await prisma.packagingMaterial.findUnique({
      where: { code: codeClean },
    });

    if (!pm) {
      return { success: false, error: `Packaging Material "${codeClean}" not found. Please add it in Add Materials Hub first.` };
    }

    const updatedStock = pm.stock + qty;
    const newStatus = updatedStock <= pm.reorderLevel ? 'Low Stock' : 'Active';

    const updated = await prisma.packagingMaterial.update({
      where: { id: pm.id },
      data: {
        name: data.name ? data.name.trim() : pm.name,
        brand: data.brand ? data.brand.trim() : pm.brand,
        batchNumber: data.batchNumber.trim(),
        stock: updatedStock,
        unit: data.unit ? data.unit.trim() : pm.unit,
        supplier: data.supplier ? data.supplier.trim() : pm.supplier,
        location: data.location ? data.location.trim() : pm.location,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : pm.expiryDate,
        status: newStatus,
        remarks: data.remarks ? data.remarks.trim() : pm.remarks,
      },
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error logging inward packaging material:', error);
    return { success: false, error: error.message || 'Failed to log inward packaging material' };
  }
}

export async function updatePackagingMaterial(
  id: string,
  data: Partial<{
    name: string;
    brand: string;
    batchNumber: string;
    stock: number;
    unit: string;
    reorderLevel: number;
    maxStock: number;
    supplier: string;
    location: string;
    expiryDate: string | Date;
    status: string;
    remarks: string;
  }>
) {
  try {
    const updateData: any = { ...data };
    if (data.stock !== undefined) updateData.stock = Number(data.stock);
    if (data.reorderLevel !== undefined) updateData.reorderLevel = Number(data.reorderLevel);
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock ? Number(data.maxStock) : null;
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);

    const updated = await prisma.packagingMaterial.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update packaging material' };
  }
}

export async function deletePackagingMaterial(id: string) {
  try {
    await prisma.packagingMaterial.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete packaging material' };
  }
}
