'use server';

import { prisma } from '@/lib/prisma';

export async function getPurchaseOrderSuggestions() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany();
    const packagingMaterials = await prisma.packagingMaterial.findMany();

    const lowRM = rawMaterials.filter((r) => r.qty <= r.reorderLevel);
    const lowPM = packagingMaterials.filter((p) => p.qty <= p.reorderLevel);

    const suggestions = [
      ...lowRM.map((r) => {
        const target = r.maxStock ? r.maxStock : r.reorderLevel * 3;
        const suggestQty = Math.max(0, target - r.qty);
        const estValue = suggestQty * (r.lastPurchaseRate || 0);
        return {
          id: r.id,
          category: 'Raw Material',
          code: r.code,
          name: r.name,
          qty: r.qty,
          reorderLevel: r.reorderLevel,
          maxStock: r.maxStock,
          suggestQty,
          unit: r.unit,
          supplier: r.supplierName || '—',
          leadTimeDays: r.leadTimeDays,
          estValue,
        };
      }),
      ...lowPM.map((p) => {
        const target = p.reorderLevel * 3;
        const suggestQty = Math.max(0, target - p.qty);
        const estValue = suggestQty * (p.lastPurchaseRate || 0);
        return {
          id: p.id,
          category: 'Packaging',
          code: p.code,
          name: p.description,
          qty: p.qty,
          reorderLevel: p.reorderLevel,
          maxStock: null,
          suggestQty,
          unit: p.unit,
          supplier: p.supplier || '—',
          leadTimeDays: p.leadTimeDays,
          estValue,
        };
      }),
    ];

    return { success: true, data: suggestions };
  } catch (error: any) {
    console.error('Error calculating PO suggestions:', error);
    return { success: false, error: error.message, data: [] };
  }
}
