import { useState, useEffect, useRef } from "react";
import { documents as docsApi } from "../api";
import type { AccountDocument } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeBadge(filename: string): { color: string; label: string } {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
      return { color: "bg-red-500", label: ext };
    case "doc":
    case "docx":
      return { color: "bg-blue-500", label: ext };
    case "xls":
    case "xlsx":
      return { color: "bg-green-500", label: ext };
    case "csv":
      return { color: "bg-emerald-500", label: ext };
    case "txt":
      return { color: "bg-gray-500", label: ext };
    default:
      return { color: "bg-purple-500", label: ext || "?" };
  }
}

export default function DocumentSection({ accountId }: { accountId: number }) {
  const [docs, setDocs] = useState<AccountDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocs();
  }, [accountId]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await docsApi.list(accountId);
      setDocs(data);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        await docsApi.upload(accountId, file);
      }
      await loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: AccountDocument) => {
    try {
      const res = await docsApi.download(doc.id);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed");
    }
  };

  const handleDelete = async (doc: AccountDocument) => {
    if (!confirm(`Delete "${doc.original_filename}"?`)) return;
    try {
      await docsApi.delete(doc.id);
      await loadDocs();
    } catch {
      setError("Delete failed");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading documents...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-100 animate-fade-in">{error}</div>
      )}

      {/* Upload Zone */}
      <div
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-[#802DC8] bg-[#ECE1F0]"
            : "border-gray-300 hover:border-[#802DC8] hover:bg-[#faf8fc]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        {/* Cloud upload icon */}
        <svg
          className={`w-12 h-12 mx-auto mb-3 transition-colors ${
            dragOver ? "text-[#802DC8]" : "text-gray-400"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {uploading ? (
          <div>
            <p className="text-sm text-[#802DC8] font-semibold mb-3">Uploading...</p>
            {/* Indeterminate progress bar */}
            <div className="h-1 bg-[#ECE1F0] rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-[#802DC8] rounded-full"
                style={{
                  width: "40%",
                  animation: "indeterminate 1.5s ease-in-out infinite",
                }}
              />
            </div>
            <style>{`
              @keyframes indeterminate {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(200%); }
                100% { transform: translateX(-100%); }
              }
            `}</style>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              <span className="text-[#802DC8] font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, CSV, TXT, images, and more (max 50MB)</p>
          </>
        )}
      </div>

      {/* Document List */}
      {docs.length === 0 ? (
        <p className="text-sm text-gray-500">No documents uploaded yet. Upload files to provide AI context for this account.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
          {docs.map((doc) => {
            const badge = getFileTypeBadge(doc.original_filename);
            return (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {/* File type badge */}
                  <div className={`w-10 h-10 rounded-lg ${badge.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-bold text-white uppercase">
                      {badge.label.slice(0, 4)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{doc.original_filename}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatSize(doc.file_size)}</span>
                      {doc.has_extracted_text && (
                        <span className="text-green-600 flex items-center gap-1">
                          {/* Green check circle */}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Text extracted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Download icon button */}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 rounded-lg text-gray-400 hover:text-[#802DC8] hover:bg-[#ECE1F0] transition-colors"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  {/* Delete icon button */}
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
