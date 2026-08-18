'use server';

import { prisma } from '@/lib/prisma';

export async function getReportsData() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany();
    const finishedGoods = await prisma.finishedGood.findMany();
    const packagingMaterials = await prisma.packagingMaterial.findMany();
    const dispatches = await prisma.dispatch.findMany({
      orderBy: { dispatchDate: 'desc' },
      take: 100,
    });

    // Aging calculation for FG
    const today = new Date();
    const fgAging = finishedGoods
      .map((f) => {
        const diffMs = new Date(f.expiryDate).getTime() - today.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const ageMs = today.getTime() - new Date(f.mfgDate).getTime();
        const ageDays = Math.ceil(ageMs / (1000 * 60 * 60 * 24));
        return {
          id: f.id,
          sku: f.sku,
          name: f.name,
          batchNumber: f.batchNumber,
          stock: f.totalStock,
          unit: f.unit,
          ageDays,
          mfgDate: f.mfgDate,
          expiryDate: f.expiryDate,
          shelfLifeDays: f.shelfLifeDays,
          daysLeft,
        };
      })
      .filter((f) => f.stock > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      success: true,
      data: {
        rawMaterials,
        finishedGoods,
        packagingMaterials,
        dispatches,
        fgAging,
      },
    };
  } catch (error: any) {
    console.error('Error compiling reports:', error);
    return {
      success: false,
      error: error.message,
      data: {
        rawMaterials: [],
        finishedGoods: [],
        packagingMaterials: [],
        dispatches: [],
        fgAging: [],
      },
    };
  }
}
