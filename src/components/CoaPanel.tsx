'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlaskConical, Upload, FileText, Trash2, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  getCoaCertificates,
  getTestableBatches,
  uploadCoaCertificate,
  deleteCoaCertificate,
} from '@/actions/coa';

interface Props {
  /** Display name recorded against the upload */
  currentUserName?: string;
  onChanged?: () => void;
}

const fmtSize = (bytes: number) =>
  bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';

const fmtDate = (d: unknown) => {
  if (!d) return '—';
  const dt = new Date(d as string);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString();
};

export default function CoaPanel({ currentUserName, onChanged }: Props) {
  const [batches, setBatches] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [batchNumber, setBatchNumber] = useState('');
  const [testedBy, setTestedBy] = useState(currentUserName || '');
  const [remarks, setRemarks] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [b, c] = await Promise.all([getTestableBatches(), getCoaCertificates(search)]);
    setBatches(b.data || []);
    setCerts(c.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedBatch = batches.find((b) => b.batchNumber === batchNumber);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!batchNumber) {
      setError('Select the FG batch this certificate belongs to.');
      return;
    }
    if (!file) {
      setError('Attach the certificate file (PDF, PNG, JPEG or WebP, up to 5 MB).');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('batchNumber', batchNumber);
    fd.append('fgSku', selectedBatch?.sku || '');
    fd.append('testedBy', testedBy);
    fd.append('remarks', remarks);

    setSaving(true);
    const res = await uploadCoaCertificate(fd);
    setSaving(false);

    if (res.success) {
      setBatchNumber('');
      setRemarks('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
      onChanged?.();
    } else {
      setError(res.error || 'Upload failed');
    }
  };

  const handleDelete = async (id: string, batch: string) => {
    if (!confirm(`Delete the COA certificate for batch "${batch}"? Dispatches carrying this batch will lose their certificate link.`)) return;
    const res = await deleteCoaCertificate(id);
    if (!res.success) {
      setError(res.error || 'Delete failed');
      return;
    }
    await load();
    onChanged?.();
  };

  const uncertified = batches.filter((b) => !b.hasCertificate);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-400" /> Certificate of Analysis (COA)
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
          Upload batch-wise test certificates. Dispatches carrying the batch code link to the document automatically.
        </p>
      </div>

      {/* Awaiting-certificate banner */}
      {!loading && uncertified.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs sm:text-sm text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">{uncertified.length}</strong> produced batch
            {uncertified.length === 1 ? '' : 'es'} awaiting a certificate:{' '}
            <span className="font-mono">{uncertified.slice(0, 6).map((b) => b.batchNumber).join(', ')}</span>
            {uncertified.length > 6 ? ' …' : ''}
          </div>
        </div>
      )}

      {/* Upload form */}
      <form
        onSubmit={handleUpload}
        className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl p-4 sm:p-5 space-y-4"
      >
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-400" /> Upload Certificate
        </h3>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs sm:text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">FG Batch Code *</label>
            <select
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono transition-all"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              required
            >
              <option value="" className="bg-[#162440] text-slate-400">-- Choose produced batch --</option>
              {batches.map((b) => (
                <option key={b.batchNumber + b.sku} value={b.batchNumber} className="bg-[#162440] text-white">
                  {b.batchNumber} — {b.sku} {b.name}
                  {b.hasCertificate ? '  (already certified)' : ''}
                </option>
              ))}
            </select>
            {batches.length === 0 && !loading && (
              <p className="text-[10px] text-slate-500 mt-1">
                No produced batches yet — log a production run first.
              </p>
            )}
          </div>

          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Certificate File *</label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="w-full text-xs sm:text-sm p-2 bg-[#162440] border border-[#2A3F66] rounded-lg text-slate-300 outline-none transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 mt-1">PDF, PNG, JPEG or WebP — max 5 MB</p>
          </div>
        </div>

        {selectedBatch && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-xs sm:text-sm text-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <span>Batch belongs to: </span>
              <strong className="text-white">{selectedBatch.sku} — {selectedBatch.name}</strong>
            </div>
            <div className="font-mono text-xs text-slate-400">
              MFG {fmtDate(selectedBatch.mfgDate)} · EXP {fmtDate(selectedBatch.expiryDate)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Tested By</label>
            <input
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="Lab technician name"
              value={testedBy}
              onChange={(e) => setTestedBy(e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks</label>
            <input
              className="w-full text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="Optional note about this test"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload Certificate
              </>
            )}
          </button>
        </div>
      </form>

      {/* Certificates table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white">Uploaded Certificates</h3>
        <input
          className="w-full sm:w-72 text-xs sm:text-sm p-2.5 bg-[#162440] border border-[#2A3F66] rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          placeholder="Search batch, SKU, file or tester"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-[#0D1B2E] border border-[#1E2F4A] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#162440] text-slate-300 font-semibold border-b border-[#1E2F4A]">
                <th className="p-3">Batch Code</th>
                <th className="p-3">FG SKU</th>
                <th className="p-3">Certificate</th>
                <th className="p-3 text-right">Size</th>
                <th className="p-3">Tested By</th>
                <th className="p-3">Remarks</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2F4A] text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">Loading certificates…</td>
                </tr>
              ) : certs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No certificates uploaded yet.
                  </td>
                </tr>
              ) : (
                certs.map((c) => (
                  <tr key={c.id} className="hover:bg-[#162440]/50 transition-all">
                    <td className="p-3 font-mono font-bold text-purple-400">{c.batchNumber}</td>
                    <td className="p-3 font-mono text-slate-400">{c.fgSku || '—'}</td>
                    <td className="p-3">
                      <a
                        href={`/api/coa/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[16rem]">{c.fileName}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">{fmtSize(c.fileSize)}</td>
                    <td className="p-3">{c.testedBy || '—'}</td>
                    <td className="p-3 text-slate-400">{c.remarks || '—'}</td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{fmtDate(c.uploadedAt)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`/api/coa/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          title="Open certificate"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(c.id, c.batchNumber)}
                          className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                          title="Delete certificate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
