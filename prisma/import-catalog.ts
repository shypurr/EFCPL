/**
 * Bulk catalog import from prisma/data/catalog.json
 * (generated from prisma/data/catalog.xlsx — see docs/04_DATABASE_SCHEMA_AND_MODELS.md).
 *
 * Registers CATALOG entries only, following the same rules as the Add Materials Hub:
 *   - RM  -> master row (isMaster: true, stock 0). Stock arrives via "Log Inward RM".
 *   - FG  -> SKU with no batch, no dates, no stock. Filled in when production is logged.
 *
 * Idempotent: an existing code/SKU is left untouched, so re-running is safe.
 *
 *   npm run db:import-catalog
 */
import 'dotenv/config';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

type RawMaterialRow = { code: string; name: string; unit: string };
type FinishedGoodRow = { sku: string; name: string; unit: string };

async function main() {
  const file = path.join(process.cwd(), 'prisma', 'data', 'catalog.json');
  const catalog = JSON.parse(readFileSync(file, 'utf8')) as {
    rawMaterials: RawMaterialRow[];
    finishedGoods: FinishedGoodRow[];
  };

  let rmCreated = 0;
  let rmSkipped = 0;

  for (const row of catalog.rawMaterials) {
    const code = row.code.trim().toUpperCase();
    // Archived rows must not block a fresh import: the code was retired, and
    // RawMaterial.code is not unique, so a new active master can sit beside it.
    const existing = await prisma.rawMaterial.findFirst({
      where: { code, isMaster: true, isArchived: false },
    });
    if (existing) {
      rmSkipped++;
      continue;
    }
    await prisma.rawMaterial.create({
      data: {
        code,
        name: row.name.trim(),
        batchNumber: '',
        stock: 0,
        unit: row.unit,
        reorderLevel: 0,
        status: 'Active',
        isMaster: true,
      },
    });
    rmCreated++;
  }

  const fgArchivedBlocked: string[] = [];
  let fgCreated = 0;
  let fgSkipped = 0;

  for (const row of catalog.finishedGoods) {
    const sku = row.sku.trim().toUpperCase();
    // sku is unique, so an archived SKU blocks re-import and needs a human decision
    const existing = await prisma.finishedGood.findUnique({ where: { sku } });
    if (existing) {
      if (existing.isArchived) fgArchivedBlocked.push(sku + ' (' + existing.name + ')');
      fgSkipped++;
      continue;
    }
    await prisma.finishedGood.create({
      data: {
        sku,
        name: row.name.trim(),
        batchNumber: '',
        quantityProduced: 0,
        totalStock: 0,
        unit: row.unit,
        status: 'Out of Stock',
      },
    });
    fgCreated++;
  }

  console.log('Raw Materials : ' + rmCreated + ' created, ' + rmSkipped + ' already present');
  console.log('Finished Goods: ' + fgCreated + ' created, ' + fgSkipped + ' already present');
  if (fgArchivedBlocked.length > 0) {
    console.warn(
      'Skipped because an ARCHIVED SKU holds the code (restore or rename it manually): ' +
        fgArchivedBlocked.join(', ')
    );
  }
}

main()
  .catch((e) => {
    console.error('Catalog import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
