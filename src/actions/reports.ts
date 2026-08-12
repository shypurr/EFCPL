'use server';

import { prisma } from '@/lib/prisma';

export async function getReportsData() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany({
      include: { location: true },
    });
    const finishedGoods = await prisma.finishedGood.findMany({
      include: { location: true },
    });
    const packagingMaterials = await prisma.packagingMaterial.findMany();
    const movements = await prisma.inventoryMovement.findMany({
      orderBy: { movementDate: 'desc' },
      take: 100,
    });

    // Valuation calculation
    const totalRMValuation = rawMaterials.reduce(
      (sum, r) => sum + r.qty * (r.lastPurchaseRate || 0),
      0
    );

    // Aging calculation for FG
    const today = new Date();
    const fgAging = finishedGoods
      .map((f) => {
        const stock = f.qtyProduced - f.qtyDispatched;
        const diffMs = new Date(f.expiryDate).getTime() - today.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const ageMs = today.getTime() - new Date(f.mfgDate).getTime();
        const ageDays = Math.ceil(ageMs / (1000 * 60 * 60 * 24));
        return {
          id: f.id,
          sku: f.sku,
          name: f.name,
          batchNumber: f.batchNumber,
          stock,
          unit: f.unit,
          ageDays,
          expiryDate: f.expiryDate,
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
        movements,
        totalRMValuation,
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
        movements: [],
        totalRMValuation: 0,
        fgAging: [],
      },
    };
  }
}
