import { prisma } from '@/lib/prisma';

/**
 * Serves a stored COA certificate inline so the dispatch table's link opens the
 * real document in a new tab. The bytes live in Postgres (see prisma/schema.prisma),
 * which is why this cannot be a static file under /public.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cert = await prisma.coaCertificate.findUnique({
    where: { id },
    select: { data: true, mimeType: true, fileName: true, fileSize: true },
  });

  if (!cert) {
    return new Response('Certificate not found', { status: 404 });
  }

  // Quote the filename so spaces and commas cannot break the header
  const safeName = cert.fileName.replace(/"/g, '');

  return new Response(new Uint8Array(cert.data), {
    status: 200,
    headers: {
      'Content-Type': cert.mimeType,
      'Content-Length': String(cert.fileSize),
      'Content-Disposition': `inline; filename="${safeName}"`,
      // Certificates are immutable once uploaded
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}
