'use server';

import { prisma } from '@/lib/prisma';

export async function getPurchaseOrderSuggestions() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany();
    const packagingMaterials = await prisma.packagingMaterial.findMany();

    const lowRM = rawMaterials.filter((r) => r.stock <= r.reorderLevel);
    const lowPM = packagingMaterials.filter((p) => p.stock <= p.reorderLevel);

    const suggestions = [
      ...lowRM.map((r) => {
        const target = r.maxStock ? r.maxStock : (r.reorderLevel > 0 ? r.reorderLevel * 3 : 100);
        const suggestQty = Math.max(0, target - r.stock);
        return {
          id: r.id,
          category: 'Raw Material',
          code: r.code,
          name: r.name,
          stock: r.stock,
          reorderLevel: r.reorderLevel,
          maxStock: r.maxStock,
          suggestQty,
          unit: r.unit,
          supplier: r.supplier || '—',
          status: r.status,
        };
      }),
      ...lowPM.map((p) => {
        const target = p.maxStock ? p.maxStock : (p.reorderLevel > 0 ? p.reorderLevel * 3 : 100);
        const suggestQty = Math.max(0, target - p.stock);
        return {
          id: p.id,
          category: 'Packaging Material',
          code: p.code,
          name: p.name,
          stock: p.stock,
          reorderLevel: p.reorderLevel,
          maxStock: p.maxStock,
          suggestQty,
          unit: p.unit,
          supplier: p.supplier || '—',
          status: p.status,
        };
      }),
    ];

    return { success: true, data: suggestions };
  } catch (error: any) {
    console.error('Error calculating PO suggestions:', error);
    return { success: false, error: error.message, data: [] };
  }
}
