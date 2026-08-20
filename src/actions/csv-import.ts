'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface CSVImportRow {
  [key: string]: string;
}

export async function importRawMaterialsCSV(rows: CSVImportRow[]) {
  try {
    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = (row['Code'] || row['code'] || row['RM Code'] || `RM-CSV-${i + 1}`).trim().toUpperCase();
      const name = row['Name'] || row['name'] || row['Material Name'] || row['materialName'];

      if (!name) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Missing material name`);
        continue;
      }

      const stock = parseFloat(row['Stock'] || row['stock'] || row['Quantity'] || '0') || 0;
      const unit = row['Unit'] || row['unit'] || 'KG';
      const reorderLevel = parseFloat(row['Reorder Level'] || row['reorderLevel'] || '0') || 0;

      try {
        const existing = await prisma.rawMaterial.findFirst({
          where: { code },
          orderBy: { createdAt: 'desc' },
        });

        if (existing) {
          await prisma.rawMaterial.update({
            where: { id: existing.id },
            data: {
              name: name.trim(),
              brand: row['Brand'] || row['brand'] || null,
              batchNumber: row['Batch Number'] || row['batchNumber'] || `BATCH-${Date.now().toString().slice(-4)}`,
              stock,
              unit,
              reorderLevel,
              maxStock: row['Max Stock'] ? parseFloat(row['Max Stock']) : null,
              supplier: row['Supplier'] || row['supplier'] || null,
              location: row['Location'] || row['location'] || null,
              expiryDate: row['Expiry Date'] || row['expiryDate'] ? new Date(row['Expiry Date'] || row['expiryDate']) : null,
              status: stock <= reorderLevel ? 'Low Stock' : 'Active',
            },
          });
        } else {
          await prisma.rawMaterial.create({
            data: {
              code,
              name: name.trim(),
              brand: row['Brand'] || row['brand'] || null,
              batchNumber: row['Batch Number'] || row['batchNumber'] || `BATCH-${Date.now().toString().slice(-4)}`,
              stock,
              unit,
              reorderLevel,
              maxStock: row['Max Stock'] ? parseFloat(row['Max Stock']) : null,
              supplier: row['Supplier'] || row['supplier'] || null,
              location: row['Location'] || row['location'] || null,
              expiryDate: row['Expiry Date'] || row['expiryDate'] ? new Date(row['Expiry Date'] || row['expiryDate']) : null,
              status: stock <= reorderLevel ? 'Low Stock' : 'Active',
            },
          });
        }
        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${i + 1} (${code}): ${err.message}`);
      }
    }

    revalidatePath('/');
    return { success: true, importedCount, skippedCount, errors };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to import CSV' };
  }
}

export async function importPackagingMaterialsCSV(rows: CSVImportRow[]) {
  try {
    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const code = (row['Code'] || row['code'] || row['PM Code'] || `PM-CSV-${i + 1}`).trim().toUpperCase();
      const name = row['Name'] || row['name'] || row['Material Name'] || row['materialName'];

      if (!name) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Missing material name`);
        continue;
      }

      const stock = parseFloat(row['Stock'] || row['stock'] || '0') || 0;
      const unit = row['Unit'] || row['unit'] || 'Units';
      const reorderLevel = parseFloat(row['Reorder Level'] || row['reorderLevel'] || '0') || 0;

      try {
        await prisma.packagingMaterial.upsert({
          where: { code },
          update: {
            name: name.trim(),
            brand: row['Brand'] || row['brand'] || null,
            batchNumber: row['Batch Number'] || row['batchNumber'] || `BATCH-${Date.now().toString().slice(-4)}`,
            stock,
            unit,
            reorderLevel,
            maxStock: row['Max Stock'] ? parseFloat(row['Max Stock']) : null,
            supplier: row['Supplier'] || row['supplier'] || null,
            location: row['Location'] || row['location'] || null,
            expiryDate: row['Expiry Date'] || row['expiryDate'] ? new Date(row['Expiry Date'] || row['expiryDate']) : null,
            status: stock <= reorderLevel ? 'Low Stock' : 'Active',
          },
          create: {
            code,
            name: name.trim(),
            brand: row['Brand'] || row['brand'] || null,
            batchNumber: row['Batch Number'] || row['batchNumber'] || `BATCH-${Date.now().toString().slice(-4)}`,
            stock,
            unit,
            reorderLevel,
            maxStock: row['Max Stock'] ? parseFloat(row['Max Stock']) : null,
            supplier: row['Supplier'] || row['supplier'] || null,
            location: row['Location'] || row['location'] || null,
            expiryDate: row['Expiry Date'] || row['expiryDate'] ? new Date(row['Expiry Date'] || row['expiryDate']) : null,
            status: stock <= reorderLevel ? 'Low Stock' : 'Active',
          },
        });
        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${i + 1} (${code}): ${err.message}`);
      }
    }

    revalidatePath('/');
    return { success: true, importedCount, skippedCount, errors };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to import CSV' };
  }
}
