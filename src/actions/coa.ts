'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Certificate of Analysis (COA) — lab testing between production and packaging.
 *
 * A certificate belongs to a PRODUCED BATCH, not to an SKU, because testing is done
 * batch-wise. Dispatches link to it by matching `Dispatch.batchCode` against
 * `CoaCertificate.batchNumber`.
 *
 * The file bytes live in the `data` column. NEVER select that column in list
 * queries — it is served on demand by `src/app/api/coa/[id]/route.ts`.
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

/** Metadata only — the `data` column is deliberately excluded. */
const LIST_SELECT = {
  id: true,
  fgSku: true,
  batchNumber: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  testedBy: true,
  remarks: true,
  uploadedBy: true,
  uploadedAt: true,
} as const;

export async function getCoaCertificates(search?: string) {
  try {
    const where: any = {};
    const term = search?.trim();
    if (term) {
      where.OR = [
        { batchNumber: { contains: term, mode: 'insensitive' } },
        { fgSku: { contains: term, mode: 'insensitive' } },
        { fileName: { contains: term, mode: 'insensitive' } },
        { testedBy: { contains: term, mode: 'insensitive' } },
      ];
    }
    const data = await prisma.coaCertificate.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { uploadedAt: 'desc' },
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching COA certificates:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Batches a lab tester can certify: every batch number that production has actually
 * created. Sourced from FinishedGood (the live batch on each SKU) plus historical
 * ProductionLog runs, so an older batch stays selectable after newer output lands.
 */
export async function getTestableBatches() {
  try {
    const [fgs, certs] = await Promise.all([
      prisma.finishedGood.findMany({
        where: { isArchived: false, batchNumber: { not: '' } },
        select: { sku: true, name: true, batchNumber: true, mfgDate: true, expiryDate: true, totalStock: true, unit: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.coaCertificate.findMany({ select: { batchNumber: true } }),
    ]);

    const certified = new Set(certs.map((c) => c.batchNumber));

    const data = fgs.map((f) => ({
      sku: f.sku,
      name: f.name,
      batchNumber: f.batchNumber,
      mfgDate: f.mfgDate,
      expiryDate: f.expiryDate,
      totalStock: f.totalStock,
      unit: f.unit,
      hasCertificate: certified.has(f.batchNumber),
    }));

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching testable batches:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function uploadCoaCertificate(formData: FormData) {
  try {
    const file = formData.get('file');
    const fgSku = String(formData.get('fgSku') || '').trim().toUpperCase();
    const batchNumber = String(formData.get('batchNumber') || '').trim();
    const testedBy = String(formData.get('testedBy') || '').trim();
    const remarks = String(formData.get('remarks') || '').trim();

    if (!batchNumber) {
      return { success: false, error: 'Select the FG batch this certificate belongs to.' };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Attach the certificate file.' };
    }
    if (file.size > MAX_FILE_BYTES) {
      return {
        success: false,
        error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`,
      };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Only PDF, PNG, JPEG or WebP files are accepted.' };
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const created = await prisma.coaCertificate.create({
      data: {
        fgSku,
        batchNumber,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        data: bytes,
        testedBy: testedBy || null,
        remarks: remarks || null,
      },
      select: LIST_SELECT,
    });

    revalidatePath('/');
    return { success: true, data: created };
  } catch (error: any) {
    console.error('Error uploading COA certificate:', error);
    return { success: false, error: error.message || 'Failed to upload certificate' };
  }
}

export async function deleteCoaCertificate(id: string) {
  try {
    await prisma.coaCertificate.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete certificate' };
  }
}

/**
 * Batch number -> certificate id, for rendering the COA link in the dispatch table.
 * If a batch was re-tested, the newest certificate wins.
 */
export async function getCoaLinksByBatch() {
  try {
    const certs = await prisma.coaCertificate.findMany({
      select: { id: true, batchNumber: true, fileName: true, uploadedAt: true },
      orderBy: { uploadedAt: 'desc' },
    });
    const map: Record<string, { id: string; fileName: string }> = {};
    for (const c of certs) {
      if (!map[c.batchNumber]) map[c.batchNumber] = { id: c.id, fileName: c.fileName };
    }
    return { success: true, data: map };
  } catch (error: any) {
    return { success: false, error: error.message, data: {} };
  }
}
