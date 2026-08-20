'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  resolveStockStatus,
  sumStockByCode,
  syncRawMaterialStatusByCode,
} from '@/lib/inventory-utils';

// ==========================================
// 1. RAW MATERIALS ACTIONS
// ==========================================

export async function getRawMaterials(search?: string, statusFilter?: string) {
  try {
    const where: any = { isMaster: false };
    if (search && search.trim() !== '') {
      where.AND = [
        { isMaster: false },
        {
          OR: [
            { code: { contains: search } },
            { name: { contains: search } },
            { brand: { contains: search } },
            { batchNumber: { contains: search } },
            { supplier: { contains: search } },
          ],
        },
      ];
    }
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const items = await prisma.rawMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' }, // Order by entry time: latest on top
    });

    // A material's real stock is the sum of all its arrival entries
    const allEntries = await prisma.rawMaterial.findMany({
      where: { isMaster: false },
      select: { code: true, stock: true },
    });
    const totalsByCode = sumStockByCode(allEntries);

    const data = items.map((item) => {
      const materialStock = totalsByCode.get(item.code) ?? item.stock;
      return {
        ...item,
        materialStock,
        isLowStock: resolveStockStatus(materialStock, item.reorderLevel) === 'Low Stock',
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching raw materials:', error);
    return { success: false, error: error.message || 'Failed to fetch raw materials' };
  }
}

export async function getRawMaterialMasters() {
  try {
    const materials = await prisma.rawMaterial.findMany({
      orderBy: [{ isMaster: 'desc' }, { createdAt: 'desc' }],
    });

    // Deduplicate by code, prioritizing the master record if defined
    const map = new Map<string, any>();
    for (const m of materials) {
      if (!map.has(m.code) || m.isMaster) {
        map.set(m.code, m);
      }
    }

    return { success: true, data: Array.from(map.values()) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch raw material masters' };
  }
}

export async function getRawMaterialByCode(code: string) {
  try {
    const item = await prisma.rawMaterial.findFirst({
      where: { code: code.trim().toUpperCase() },
      orderBy: [{ isMaster: 'desc' }, { createdAt: 'desc' }],
    });
    if (!item) return { success: false, error: 'Raw Material code not found' };
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Master creation (Add tab) - Registers material SKU in catalog without logging fake stock/batch arrival
export async function createRawMaterial(data: {
  code: string;
  name: string;
  brand?: string;
  unit: string;
  reorderLevel: number;
  maxStock?: number;
  supplier?: string;
  location?: string;
  stock?: number;
  batchNumber?: string;
  expiryDate?: string | Date;
}) {
  try {
    const codeClean = data.code.trim().toUpperCase();

    const existingMaster = await prisma.rawMaterial.findFirst({
      where: { code: codeClean, isMaster: true },
    });
    if (existingMaster) {
      return { success: false, error: `Raw Material Master with code "${codeClean}" already exists.` };
    }

    const newItem = await prisma.rawMaterial.create({
      data: {
        code: codeClean,
        name: data.name.trim(),
        brand: data.brand?.trim() || null,
        batchNumber: '',
        stock: 0,
        unit: data.unit.trim(),
        reorderLevel: Number(data.reorderLevel) || 0,
        maxStock: data.maxStock ? Number(data.maxStock) : null,
        supplier: data.supplier?.trim() || null,
        location: data.location?.trim() || 'RM Store A',
        expiryDate: null,
        status: 'Active',
        isMaster: true,
        remarks: null,
      },
    });

    revalidatePath('/');
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error('Error creating raw material master:', error);
    return { success: false, error: error.message || 'Failed to create raw material master' };
  }
}

// Inward arrival for existing RM (RM tab) - Creates a separate logged arrival entry for each arrived batch!
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
}) {
  try {
    const qty = Number(data.inwardQty);
    if (qty <= 0) {
      return { success: false, error: 'Inward quantity must be greater than zero' };
    }

    const codeClean = data.code.trim().toUpperCase();
    const rmTemplate = await prisma.rawMaterial.findFirst({
      where: { code: codeClean },
      orderBy: [{ isMaster: 'desc' }, { createdAt: 'desc' }],
    });

    const reorderLevel = rmTemplate ? rmTemplate.reorderLevel : 0;
    const existingStock = await prisma.rawMaterial.aggregate({
      where: { code: codeClean, isMaster: false },
      _sum: { stock: true },
    });
    const totalStock = (existingStock._sum.stock ?? 0) + qty;
    const status = resolveStockStatus(totalStock, reorderLevel);

    // Log the actual arrival entry into inventory
    const newItem = await prisma.rawMaterial.create({
      data: {
        code: codeClean,
        name: data.name ? data.name.trim() : (rmTemplate?.name || 'Raw Material'),
        brand: data.brand ? data.brand.trim() : (rmTemplate?.brand || null),
        batchNumber: data.batchNumber.trim(),
        stock: qty,
        unit: data.unit ? data.unit.trim() : (rmTemplate?.unit || 'KG'),
        reorderLevel: reorderLevel,
        maxStock: rmTemplate?.maxStock || null,
        supplier: data.supplier ? data.supplier.trim() : (rmTemplate?.supplier || null),
        location: data.location ? data.location.trim() : (rmTemplate?.location || 'RM Store A'),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : (rmTemplate?.expiryDate || null),
        status,
        isMaster: false,
        remarks: null,
      },
    });

    await syncRawMaterialStatusByCode(codeClean);

    revalidatePath('/');
    return { success: true, data: newItem };
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

    await syncRawMaterialStatusByCode(updated.code);

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update raw material' };
  }
}

export async function deleteRawMaterial(id: string) {
  try {
    const removed = await prisma.rawMaterial.delete({ where: { id } });
    await syncRawMaterialStatusByCode(removed.code);
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
        { code: { contains: search } },
        { name: { contains: search } },
        { brand: { contains: search } },
        { batchNumber: { contains: search } },
        { supplier: { contains: search } },
      ];
    }
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const items = await prisma.packagingMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

export async function createPackagingMaterial(data: {
  code: string;
  name: string;
  brand?: string;
  batchNumber?: string;
  stock: number;
  unit?: string;
  reorderLevel: number;
  maxStock?: number;
  supplier?: string;
  location?: string;
  expiryDate?: string | Date;
  status?: string;
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
        batchNumber: data.batchNumber?.trim() || `PB-${Date.now().toString().slice(-4)}`,
        stock: Number(data.stock),
        unit: data.unit?.trim() || 'Units',
        reorderLevel: Number(data.reorderLevel),
        maxStock: data.maxStock ? Number(data.maxStock) : null,
        supplier: data.supplier?.trim(),
        location: data.location?.trim() || 'PM Warehouse',
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status,
        remarks: null,
      },
    });

    revalidatePath('/');
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error('Error creating packaging material:', error);
    return { success: false, error: error.message || 'Failed to create packaging material' };
  }
}

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
      return { success: false, error: `Packaging Material "${codeClean}" not found.` };
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
        remarks: null,
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
