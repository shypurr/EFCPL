'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper function to calculate shelf life in days
function calculateShelfLifeDays(mfgDate: Date | string, expiryDate: Date | string): number {
  const mfg = new Date(mfgDate);
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - mfg.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// ==========================================
// 1. TAB 1: RM ISSUE ACTIONS
// ==========================================

export async function getRMIssues(search?: string) {
  try {
    const where: any = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { rmCode: { contains: search, mode: 'insensitive' } },
        { materialName: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { issueFor: { contains: search, mode: 'insensitive' } },
      ];
    }
    const issues = await prisma.rMIssue.findMany({
      where,
      orderBy: { issuedDate: 'desc' },
    });
    return { success: true, data: issues };
  } catch (error: any) {
    console.error('Error fetching RM issues:', error);
    return { success: false, error: error.message || 'Failed to fetch RM issues' };
  }
}

export async function getRMDetailsForIssue(rmCode: string) {
  try {
    const rm = await prisma.rawMaterial.findFirst({
      where: { code: rmCode.trim().toUpperCase(), isArchived: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!rm) {
      return { success: false, error: `Raw Material Code "${rmCode}" not found` };
    }
    return {
      success: true,
      data: {
        rmCode: rm.code,
        materialName: rm.name,
        batchNumber: rm.batchNumber,
        expiryDate: rm.expiryDate,
        quantityInBatch: rm.stock,
        unit: rm.unit,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createRMIssue(data: {
  rmCode: string;
  materialName: string;
  batchNumber: string;
  issueFor: string;
  expiryDate?: string | Date;
  quantityInBatch: number;
  issuedStock: number;
  remarks?: string;
  issuedBy?: string;
}) {
  try {
    const issuedQty = Number(data.issuedStock);
    if (issuedQty <= 0) {
      return { success: false, error: 'Issued quantity must be greater than zero' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const rm = (data.batchNumber
        ? await tx.rawMaterial.findFirst({
            where: {
              code: data.rmCode.trim().toUpperCase(),
              batchNumber: data.batchNumber.trim(),
              isArchived: false,
            },
            orderBy: { createdAt: 'desc' },
          })
        : null) || await tx.rawMaterial.findFirst({
            where: { code: data.rmCode.trim().toUpperCase(), isArchived: false },
            orderBy: { createdAt: 'desc' },
          });

      if (!rm) {
        throw new Error(`Raw Material "${data.rmCode}" not found or has been deleted.`);
      }

      if (rm.stock < issuedQty) {
        throw new Error(`Insufficient stock for ${rm.name}. Current batch stock: ${rm.stock}, requested: ${issuedQty}`);
      }

      const updatedStock = rm.stock - issuedQty;
      const newStatus = updatedStock <= rm.reorderLevel ? 'Low Stock' : 'Active';

      await tx.rawMaterial.update({
        where: { id: rm.id },
        data: {
          stock: updatedStock,
          status: newStatus,
        },
      });

      const issueLog = await tx.rMIssue.create({
        data: {
          rmCode: rm.code,
          materialName: data.materialName || rm.name,
          batchNumber: data.batchNumber || rm.batchNumber,
          issueFor: data.issueFor.trim(),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : rm.expiryDate,
          quantityInBatch: rm.stock,
          issuedStock: issuedQty,
          remarks: null,
          issuedBy: data.issuedBy || 'Store Manager',
        },
      });

      return issueLog;
    });

    revalidatePath('/');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating RM issue:', error);
    return { success: false, error: error.message || 'Failed to process RM issue' };
  }
}

export async function deleteRMIssue(id: string) {
  try {
    await prisma.rMIssue.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete RM issue' };
  }
}

// Alias export for backward compatibility
export const postIssue = createRMIssue;

// ==========================================
// 2. TAB 2: PRODUCTION LOG ACTIONS
// ==========================================

export async function getProductionLogs(search?: string) {
  try {
    const where: any = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { fgCode: { contains: search, mode: 'insensitive' } },
        { fgName: { contains: search, mode: 'insensitive' } },
        { operator: { contains: search, mode: 'insensitive' } },
      ];
    }
    const logs = await prisma.productionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: logs };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch production logs' };
  }
}

export async function createProductionLog(data: {
  fgCode: string;
  fgName: string;
  totalBatchesMade: number;
  totalOutput: number;
  unit?: string;
  wastage?: number;
  mfgDate: string | Date;
  expiryDate: string | Date;
  remarks?: string;
  operator?: string;
  batchNumber?: string;
  location?: string;
}) {
  try {
    const totalOutput = Number(data.totalOutput);
    const mfg = new Date(data.mfgDate);
    const exp = new Date(data.expiryDate);
    const shelfLife = calculateShelfLifeDays(mfg, exp);
    const batchNo = data.batchNumber || `BATCH-FG-${Date.now().toString().slice(-4)}`;

    const result = await prisma.$transaction(async (tx) => {
      const prodLog = await tx.productionLog.create({
        data: {
          fgCode: data.fgCode.trim().toUpperCase(),
          fgName: data.fgName.trim(),
          totalBatchesMade: Number(data.totalBatchesMade),
          totalOutput,
          unit: data.unit || 'KG',
          wastage: data.wastage ? Number(data.wastage) : 0,
          mfgDate: mfg,
          expiryDate: exp,
          remarks: null,
          operator: data.operator || 'Production Supervisor',
        },
      });

      const existingFG = await tx.finishedGood.findUnique({
        where: { sku: data.fgCode.trim().toUpperCase() },
      });

      if (existingFG?.isArchived) {
        // Rolls back the production log created above
        throw new Error(`Finished Good SKU "${data.fgCode}" has been deleted and can no longer be used.`);
      }

      if (existingFG) {
        await tx.finishedGood.update({
          where: { id: existingFG.id },
          data: {
            quantityProduced: existingFG.quantityProduced + totalOutput,
            totalStock: existingFG.totalStock + totalOutput,
            batchNumber: batchNo,
            mfgDate: mfg,
            expiryDate: exp,
            shelfLifeDays: shelfLife,
            status: 'In Stock',
          },
        });
      } else {
        await tx.finishedGood.create({
          data: {
            sku: data.fgCode.trim().toUpperCase(),
            name: data.fgName.trim(),
            batchNumber: batchNo,
            quantityProduced: totalOutput,
            totalStock: totalOutput,
            unit: data.unit || 'KG',
            mfgDate: mfg,
            expiryDate: exp,
            shelfLifeDays: shelfLife,
            location: data.location || 'Cold Store Zone A',
            status: 'In Stock',
          },
        });
      }

      return prodLog;
    });

    revalidatePath('/');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating production log:', error);
    return { success: false, error: error.message || 'Failed to record production' };
  }
}

export async function deleteProductionLog(id: string) {
  try {
    await prisma.productionLog.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete production log' };
  }
}

// Alias export for backward compatibility
export const postGRN = createProductionLog;

// ==========================================
// 3. TAB 3: PACKAGING ISSUE ACTIONS
// ==========================================

export async function getPackagingIssues(search?: string) {
  try {
    const where: any = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { pmCode: { contains: search, mode: 'insensitive' } },
        { pmName: { contains: search, mode: 'insensitive' } },
        { issueFor: { contains: search, mode: 'insensitive' } },
      ];
    }
    const issues = await prisma.packagingIssue.findMany({
      where,
      orderBy: { issuedDate: 'desc' },
    });
    return { success: true, data: issues };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch packaging issues' };
  }
}

export async function getPMDetailsForIssue(pmCode: string) {
  try {
    const pm = await prisma.packagingMaterial.findUnique({
      where: { code: pmCode.trim().toUpperCase() },
    });
    if (!pm || pm.isArchived) {
      return { success: false, error: `Packaging Material Code "${pmCode}" not found` };
    }
    return {
      success: true,
      data: {
        pmCode: pm.code,
        pmName: pm.name,
        batchNumber: pm.batchNumber,
        quantityInBatch: pm.stock,
        unit: pm.unit,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPackagingIssue(data: {
  pmCode: string;
  pmName: string;
  issueFor: string;
  quantityInBatch: number;
  issuedQty: number;
  remarks?: string;
  issuedBy?: string;
}) {
  try {
    const issuedQty = Number(data.issuedQty);
    if (issuedQty <= 0) {
      return { success: false, error: 'Issued quantity must be greater than zero' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const pm = await tx.packagingMaterial.findUnique({
        where: { code: data.pmCode.trim().toUpperCase() },
      });

      if (!pm) {
        throw new Error(`Packaging Material "${data.pmCode}" not found.`);
      }

      if (pm.isArchived) {
        throw new Error(`Packaging Material "${data.pmCode}" has been deleted and can no longer be used.`);
      }

      if (pm.stock < issuedQty) {
        throw new Error(`Insufficient stock for ${pm.name}. Available: ${pm.stock}, requested: ${issuedQty}`);
      }

      const updatedStock = pm.stock - issuedQty;
      const newStatus = updatedStock <= pm.reorderLevel ? 'Low Stock' : 'Active';

      await tx.packagingMaterial.update({
        where: { id: pm.id },
        data: {
          stock: updatedStock,
          status: newStatus,
        },
      });

      const issueLog = await tx.packagingIssue.create({
        data: {
          pmCode: pm.code,
          pmName: data.pmName || pm.name,
          issueFor: data.issueFor.trim(),
          quantityInBatch: pm.stock,
          issuedQty,
          remarks: null,
          issuedBy: data.issuedBy || 'Store Manager',
        },
      });

      return issueLog;
    });

    revalidatePath('/');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating packaging issue:', error);
    return { success: false, error: error.message || 'Failed to process packaging issue' };
  }
}

export async function deletePackagingIssue(id: string) {
  try {
    await prisma.packagingIssue.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete packaging issue' };
  }
}

// ==========================================
// 4. TAB 4: FINISHED GOODS (FG) ACTIONS
// ==========================================

export async function getFinishedGoods(search?: string) {
  try {
    const where: any = { isArchived: false };
    if (search && search.trim() !== '') {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    const fgList = await prisma.finishedGood.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return { success: true, data: fgList };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch finished goods' };
  }
}

// Catalog registration for an FG SKU (Add Materials Hub).
// Introduces the product to the system only — batch number, produced quantity and
// MFG/expiry dates belong to a production run and stay empty until one is logged.
export async function createFinishedGood(data: {
  sku: string;
  name: string;
  unit: string;
  batchNumber?: string;
  quantityProduced?: number;
  totalStock?: number;
  mfgDate?: string | Date | null;
  expiryDate?: string | Date | null;
  location?: string;
  status?: string;
}) {
  try {
    const skuClean = data.sku.trim().toUpperCase();
    const existing = await prisma.finishedGood.findUnique({ where: { sku: skuClean } });
    if (existing) {
      return { success: false, error: `Finished Good SKU "${skuClean}" already exists.` };
    }

    const mfg = data.mfgDate ? new Date(data.mfgDate) : null;
    const exp = data.expiryDate ? new Date(data.expiryDate) : null;
    const shelfLifeDays = mfg && exp ? calculateShelfLifeDays(mfg, exp) : null;
    const totalStock = Number(data.totalStock ?? 0);

    const fg = await prisma.finishedGood.create({
      data: {
        sku: skuClean,
        name: data.name.trim(),
        batchNumber: data.batchNumber?.trim() || '',
        quantityProduced: Number(data.quantityProduced ?? 0),
        totalStock,
        unit: data.unit.trim(),
        mfgDate: mfg,
        expiryDate: exp,
        shelfLifeDays,
        location: data.location?.trim() || 'Cold Store Zone A',
        status: data.status || (totalStock > 0 ? 'In Stock' : 'Out of Stock'),
      },
    });

    revalidatePath('/');
    return { success: true, data: fg };
  } catch (error: any) {
    console.error('Error creating finished good:', error);
    return { success: false, error: error.message || 'Failed to create finished good' };
  }
}

export async function inwardFinishedGood(data: {
  sku: string;
  name?: string;
  batchNumber: string;
  quantityProduced: number;
  unit?: string;
  mfgDate: string | Date;
  expiryDate: string | Date;
  location?: string;
}) {
  try {
    const qty = Number(data.quantityProduced);
    if (qty <= 0) {
      return { success: false, error: 'Quantity must be greater than zero' };
    }

    const skuClean = data.sku.trim().toUpperCase();
    const fg = await prisma.finishedGood.findUnique({
      where: { sku: skuClean },
    });

    if (!fg) {
      return { success: false, error: `Finished Good SKU "${skuClean}" not found. Please add it in Add Materials Hub first.` };
    }

    if (fg.isArchived) {
      return { success: false, error: `Finished Good SKU "${skuClean}" has been deleted and can no longer be used.` };
    }

    const mfg = new Date(data.mfgDate);
    const exp = new Date(data.expiryDate);
    const shelfLifeDays = calculateShelfLifeDays(mfg, exp);

    const updatedStock = fg.totalStock + qty;
    const updatedProduced = fg.quantityProduced + qty;

    const updated = await prisma.finishedGood.update({
      where: { id: fg.id },
      data: {
        name: data.name ? data.name.trim() : fg.name,
        batchNumber: data.batchNumber.trim(),
        quantityProduced: updatedProduced,
        totalStock: updatedStock,
        unit: data.unit ? data.unit.trim() : fg.unit,
        mfgDate: mfg,
        expiryDate: exp,
        shelfLifeDays,
        location: data.location ? data.location.trim() : fg.location,
        status: 'In Stock',
      },
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error logging inward finished good:', error);
    return { success: false, error: error.message || 'Failed to log inward finished good' };
  }
}

export async function updateFinishedGood(
  id: string,
  data: Partial<{
    name: string;
    batchNumber: string;
    quantityProduced: number;
    totalStock: number;
    unit: string;
    mfgDate: string | Date;
    expiryDate: string | Date;
    location: string;
    status: string;
  }>
) {
  try {
    const updateData: any = { ...data };
    if (data.quantityProduced !== undefined) updateData.quantityProduced = Number(data.quantityProduced);
    if (data.totalStock !== undefined) updateData.totalStock = Number(data.totalStock);

    if (data.mfgDate || data.expiryDate) {
      const current = await prisma.finishedGood.findUnique({ where: { id } });
      if (current) {
        const mfg = data.mfgDate ? new Date(data.mfgDate) : current.mfgDate;
        const exp = data.expiryDate ? new Date(data.expiryDate) : current.expiryDate;
        updateData.mfgDate = mfg;
        updateData.expiryDate = exp;
        // A SKU that has never been produced has no dates, and therefore no shelf life.
        updateData.shelfLifeDays = mfg && exp ? calculateShelfLifeDays(mfg, exp) : null;
      }
    }

    const updated = await prisma.finishedGood.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update finished good' };
  }
}

export async function deleteFinishedGood(id: string) {
  try {
    await prisma.finishedGood.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete finished good' };
  }
}

// Soft-delete: retires an FG SKU. Production logs and dispatch history stay untouched.
export async function archiveFinishedGood(id: string) {
  try {
    const fg = await prisma.finishedGood.findUnique({ where: { id } });
    if (!fg || fg.isArchived) {
      return { success: false, error: 'Finished Good not found or already deleted.' };
    }

    await prisma.finishedGood.update({
      where: { id },
      data: { isArchived: true, status: 'Archived' },
    });

    revalidatePath('/');
    return { success: true, data: { sku: fg.sku } };
  } catch (error: any) {
    console.error('Error archiving finished good:', error);
    return { success: false, error: error.message || 'Failed to delete finished good' };
  }
}

// ==========================================
// 5. TAB 5: DISPATCH ACTIONS
// ==========================================

export async function getDispatches(search?: string) {
  try {
    const where: any = {};
    if (search && search.trim() !== '') {
      where.OR = [
        { skuCode: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { partyName: { contains: search, mode: 'insensitive' } },
        { batchCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    const dispatches = await prisma.dispatch.findMany({
      where,
      orderBy: { dispatchDate: 'desc' },
    });
    return { success: true, data: dispatches };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch dispatches' };
  }
}

export async function createDispatch(data: {
  skuCode: string;
  productName: string;
  batchCode: string;
  dispatchQty: number;
  dispatchDate?: string | Date;
  partyName: string;
  mfgDate: string | Date;
  expiryDate: string | Date;
  location?: string;
  coaStatus?: string;
  remarks?: string;
  dispatchedBy?: string;
}) {
  try {
    const dispatchQty = Number(data.dispatchQty);
    if (dispatchQty <= 0) {
      return { success: false, error: 'Dispatch quantity must be greater than zero' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const fg = await tx.finishedGood.findUnique({
        where: { sku: data.skuCode.trim().toUpperCase() },
      });

      if (!fg) {
        throw new Error(`Finished Good SKU "${data.skuCode}" not found.`);
      }

      if (fg.isArchived) {
        throw new Error(`Finished Good SKU "${data.skuCode}" has been deleted and can no longer be used.`);
      }

      if (fg.totalStock < dispatchQty) {
        throw new Error(`Insufficient FG stock for ${fg.name}. Total stock available: ${fg.totalStock}, requested: ${dispatchQty}`);
      }

      // A dispatch always ships a produced batch, so it must carry real dates.
      const mfgDate = data.mfgDate ? new Date(data.mfgDate) : fg.mfgDate;
      const expiryDate = data.expiryDate ? new Date(data.expiryDate) : fg.expiryDate;
      if (!mfgDate || !expiryDate) {
        throw new Error(
          `Finished Good "${fg.sku}" has no manufacturing or expiry date yet. Log a production batch before dispatching it.`
        );
      }

      const newStock = fg.totalStock - dispatchQty;
      await tx.finishedGood.update({
        where: { id: fg.id },
        data: {
          totalStock: newStock,
          status: newStock === 0 ? 'Out of Stock' : fg.status,
        },
      });

      const dispatchLog = await tx.dispatch.create({
        data: {
          skuCode: fg.sku,
          productName: data.productName || fg.name,
          batchCode: data.batchCode || fg.batchNumber,
          dispatchQty,
          dispatchDate: data.dispatchDate ? new Date(data.dispatchDate) : new Date(),
          partyName: data.partyName.trim(),
          mfgDate,
          expiryDate,
          location: data.location || fg.location,
          coaStatus: data.coaStatus || 'Approved',
          remarks: null,
          dispatchedBy: data.dispatchedBy || 'Dispatch Officer',
        },
      });

      return dispatchLog;
    });

    revalidatePath('/');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating dispatch log:', error);
    return { success: false, error: error.message || 'Failed to record dispatch' };
  }
}

export async function deleteDispatch(id: string) {
  try {
    await prisma.dispatch.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete dispatch entry' };
  }
}

// Alias export for backward compatibility
export const postDispatch = createDispatch;
