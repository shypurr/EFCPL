'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getFinishedGoods(query?: string) {
  try {
    const goods = await prisma.finishedGood.findMany({
      include: { location: true },
      orderBy: { updatedAt: 'desc' },
    });

    let filtered = goods;
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.sku.toLowerCase().includes(q) ||
          f.batchNumber.toLowerCase().includes(q)
      );
    }

    return { success: true, data: filtered };
  } catch (error: any) {
    console.error('Error fetching finished goods:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createFinishedGood(formData: {
  sku: string;
  name: string;
  batchNumber: string;
  qtyProduced: number;
  qtyDispatched?: number;
  unit?: string;
  qtyReserved?: number;
  salesOrderRef?: string;
  mfgDate: string;
  expiryDate: string;
  shelfLifeDays?: number;
  locationId?: string;
  tempCondition?: string;
  attributes?: any;
}) {
  try {
    const good = await prisma.finishedGood.create({
      data: {
        sku: formData.sku,
        name: formData.name,
        batchNumber: formData.batchNumber,
        qtyProduced: Number(formData.qtyProduced) || 0,
        qtyDispatched: Number(formData.qtyDispatched) || 0,
        unit: formData.unit || 'Units',
        qtyReserved: Number(formData.qtyReserved) || 0,
        salesOrderRef: formData.salesOrderRef || null,
        mfgDate: new Date(formData.mfgDate),
        expiryDate: new Date(formData.expiryDate),
        shelfLifeDays: formData.shelfLifeDays ? Number(formData.shelfLifeDays) : null,
        locationId: formData.locationId || null,
        tempCondition: formData.tempCondition || '-18°C (Deep Frozen)',
        attributes: formData.attributes || null,
      },
    });

    revalidatePath('/');
    return { success: true, data: good };
  } catch (error: any) {
    console.error('Error creating finished good:', error);
    return { success: false, error: error.message };
  }
}

export async function postDispatch(formData: {
  finishedGoodId: string;
  qtyDispatched: number;
  dispatchDate: string;
  customerName: string;
  salesOrderRef?: string;
  dispatchedBy?: string;
  remarks?: string;
}) {
  try {
    const fg = await prisma.finishedGood.findUnique({
      where: { id: formData.finishedGoodId },
    });

    if (!fg) return { success: false, error: 'Product not found' };

    const availStock = fg.qtyProduced - fg.qtyDispatched;
    if (formData.qtyDispatched > availStock) {
      return {
        success: false,
        error: `Cannot dispatch ${formData.qtyDispatched}. Only ${availStock} units available in stock.`,
      };
    }

    // Generate dispatch number
    const count = await prisma.dispatchEntry.count();
    const dispatchNo = `DSP-${String(count + 1).padStart(3, '0')}`;

    // Execute atomic transaction
    const result = await prisma.$transaction([
      prisma.finishedGood.update({
        where: { id: formData.finishedGoodId },
        data: {
          qtyDispatched: { increment: Number(formData.qtyDispatched) },
        },
      }),
      prisma.dispatchEntry.create({
        data: {
          dispatchNo,
          dispatchDate: new Date(formData.dispatchDate),
          finishedGoodId: formData.finishedGoodId,
          qtyDispatched: Number(formData.qtyDispatched),
          unit: fg.unit,
          customerName: formData.customerName,
          salesOrderRef: formData.salesOrderRef || null,
          dispatchedBy: formData.dispatchedBy || 'Warehouse Manager',
          remarks: formData.remarks || null,
        },
      }),
      prisma.inventoryMovement.create({
        data: {
          refNumber: dispatchNo,
          type: 'DISPATCH',
          category: 'Finished Goods',
          finishedGoodId: formData.finishedGoodId,
          itemTitle: fg.name,
          qty: Number(formData.qtyDispatched),
          unit: fg.unit,
          party: formData.customerName,
          performedBy: formData.dispatchedBy || 'Warehouse Manager',
          remarks: formData.remarks || null,
          movementDate: new Date(formData.dispatchDate),
        },
      }),
    ]);

    revalidatePath('/');
    return { success: true, data: result[1] };
  } catch (error: any) {
    console.error('Error posting dispatch:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFinishedGood(id: string) {
  try {
    await prisma.finishedGood.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
