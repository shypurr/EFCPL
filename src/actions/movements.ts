'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getMovements(limit?: number) {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      orderBy: { movementDate: 'desc' },
      take: limit || 100,
    });
    return { success: true, data: movements };
  } catch (error: any) {
    console.error('Error fetching movements:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function postGRN(formData: {
  category: 'Raw Material' | 'Packaging';
  itemId: string;
  qty: number;
  unit: string;
  receivedDate: string;
  supplierName: string;
  invoiceNo?: string;
  batchNo?: string;
  coaStatus?: string;
  enteredBy?: string;
  remarks?: string;
}) {
  try {
    const count = await prisma.inventoryMovement.count({ where: { type: 'GRN' } });
    const grnNo = `GRN-${String(count + 1).padStart(3, '0')}`;

    let itemTitle = '';
    const updateOps: any[] = [];

    if (formData.category === 'Raw Material') {
      const rm = await prisma.rawMaterial.findUnique({ where: { id: formData.itemId } });
      if (!rm) return { success: false, error: 'Raw material not found' };
      itemTitle = rm.name;
      updateOps.push(
        prisma.rawMaterial.update({
          where: { id: formData.itemId },
          data: { qty: { increment: Number(formData.qty) } },
        })
      );
    } else {
      const pm = await prisma.packagingMaterial.findUnique({ where: { id: formData.itemId } });
      if (!pm) return { success: false, error: 'Packaging material not found' };
      itemTitle = pm.description;
      updateOps.push(
        prisma.packagingMaterial.update({
          where: { id: formData.itemId },
          data: { qty: { increment: Number(formData.qty) } },
        })
      );
    }

    const movementOp = prisma.inventoryMovement.create({
      data: {
        refNumber: grnNo,
        type: 'GRN',
        category: formData.category,
        materialId: formData.category === 'Raw Material' ? formData.itemId : null,
        packagingId: formData.category === 'Packaging' ? formData.itemId : null,
        itemTitle,
        qty: Number(formData.qty),
        unit: formData.unit,
        party: formData.supplierName,
        invoiceRef: formData.invoiceNo || null,
        batchRef: formData.batchNo || null,
        coaStatus: formData.coaStatus || 'Approved',
        performedBy: formData.enteredBy || 'Store Manager',
        remarks: formData.remarks || null,
        movementDate: new Date(formData.receivedDate),
      },
    });

    const result = await prisma.$transaction([...updateOps, movementOp]);

    revalidatePath('/');
    return { success: true, data: result[result.length - 1] };
  } catch (error: any) {
    console.error('Error posting GRN:', error);
    return { success: false, error: error.message };
  }
}

export async function postIssue(formData: {
  category: 'Raw Material' | 'Packaging' | 'Finished Goods';
  itemId: string;
  qty: number;
  unit: string;
  issueDate: string;
  issuedTo: string;
  issuedBy?: string;
  remarks?: string;
}) {
  try {
    const count = await prisma.inventoryMovement.count({ where: { type: 'ISSUE' } });
    const misNo = `MIS-${String(count + 1).padStart(3, '0')}`;

    let itemTitle = '';
    const updateOps: any[] = [];

    if (formData.category === 'Raw Material') {
      const rm = await prisma.rawMaterial.findUnique({ where: { id: formData.itemId } });
      if (!rm) return { success: false, error: 'Raw material not found' };
      if (formData.qty > rm.qty) {
        return { success: false, error: `Insufficient stock. Only ${rm.qty} ${rm.unit} available.` };
      }
      itemTitle = rm.name;
      updateOps.push(
        prisma.rawMaterial.update({
          where: { id: formData.itemId },
          data: { qty: { decrement: Number(formData.qty) } },
        })
      );
    } else if (formData.category === 'Packaging') {
      const pm = await prisma.packagingMaterial.findUnique({ where: { id: formData.itemId } });
      if (!pm) return { success: false, error: 'Packaging material not found' };
      if (formData.qty > pm.qty) {
        return { success: false, error: `Insufficient stock. Only ${pm.qty} ${pm.unit} available.` };
      }
      itemTitle = pm.description;
      updateOps.push(
        prisma.packagingMaterial.update({
          where: { id: formData.itemId },
          data: { qty: { decrement: Number(formData.qty) } },
        })
      );
    } else {
      const fg = await prisma.finishedGood.findUnique({ where: { id: formData.itemId } });
      if (!fg) return { success: false, error: 'Finished good not found' };
      const avail = fg.qtyProduced - fg.qtyDispatched;
      if (formData.qty > avail) {
        return { success: false, error: `Insufficient stock. Only ${avail} ${fg.unit} available.` };
      }
      itemTitle = fg.name;
      updateOps.push(
        prisma.finishedGood.update({
          where: { id: formData.itemId },
          data: { qtyDispatched: { increment: Number(formData.qty) } },
        })
      );
    }

    const movementOp = prisma.inventoryMovement.create({
      data: {
        refNumber: misNo,
        type: 'ISSUE',
        category: formData.category,
        materialId: formData.category === 'Raw Material' ? formData.itemId : null,
        packagingId: formData.category === 'Packaging' ? formData.itemId : null,
        finishedGoodId: formData.category === 'Finished Goods' ? formData.itemId : null,
        itemTitle,
        qty: Number(formData.qty),
        unit: formData.unit,
        party: formData.issuedTo,
        performedBy: formData.issuedBy || 'Store Manager',
        remarks: formData.remarks || null,
        movementDate: new Date(formData.issueDate),
      },
    });

    const result = await prisma.$transaction([...updateOps, movementOp]);

    revalidatePath('/');
    return { success: true, data: result[result.length - 1] };
  } catch (error: any) {
    console.error('Error posting material issue:', error);
    return { success: false, error: error.message };
  }
}
