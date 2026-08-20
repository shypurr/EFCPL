import { prisma } from '@/lib/prisma';

/**
 * Stock model note:
 * A RawMaterial row is a single ARRIVAL (batch) of a material, so one material
 * `code` can own many rows. The physical stock of a material is therefore the
 * SUM of every row sharing that code — never a single row's `stock`.
 *
 * Reorder / low-stock decisions must always run against that material-level
 * total. Per-row `stock` stays untouched: it is the batch quantity used for
 * traceability, issuing and expiry tracking.
 */

export type StockStatus = 'Low Stock' | 'Active';

export function resolveStockStatus(totalStock: number, reorderLevel: number): StockStatus {
  return totalStock <= reorderLevel ? 'Low Stock' : 'Active';
}

/** Minimal shape needed to aggregate; matches RawMaterial rows. */
type CodedStockRow = { code: string; stock: number };

/** Sums stock per material code across all arrival entries. */
export function sumStockByCode(rows: CodedStockRow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.code, (totals.get(row.code) ?? 0) + row.stock);
  }
  return totals;
}

type PrismaLike = Pick<typeof prisma, 'rawMaterial'>;

/**
 * Returns the total physical stock of a material code across every arrival row.
 * Always queries the full table so an active search filter cannot skew the total.
 */
export async function getRawMaterialTotalStock(
  code: string,
  client: PrismaLike = prisma
): Promise<number> {
  const result = await client.rawMaterial.aggregate({
    where: { code },
    _sum: { stock: true },
  });
  return result._sum.stock ?? 0;
}

/**
 * Recomputes the material-level status for a code and writes it to EVERY
 * arrival row of that code, so the stored `status` never contradicts the total.
 * Call after any mutation that changes stock for a code.
 */
export async function syncRawMaterialStatusByCode(
  code: string,
  client: PrismaLike = prisma
): Promise<{ totalStock: number; status: StockStatus } | null> {
  const codeClean = code.trim().toUpperCase();
  const rows = await client.rawMaterial.findMany({ where: { code: codeClean } });
  if (rows.length === 0) return null;

  const totalStock = rows.reduce((sum, row) => sum + row.stock, 0);
  // Reorder level is a material-level setting; use the highest configured value
  // so a legacy row left at 0 cannot mask a genuine low-stock condition.
  const reorderLevel = Math.max(...rows.map((row) => row.reorderLevel));
  const status = resolveStockStatus(totalStock, reorderLevel);

  await client.rawMaterial.updateMany({
    where: { code: codeClean, status: { not: status } },
    data: { status },
  });

  return { totalStock, status };
}
