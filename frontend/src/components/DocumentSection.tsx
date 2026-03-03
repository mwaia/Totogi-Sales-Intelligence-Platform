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
    case "pdf": return { color: "bg-red-500", label: ext };
    case "doc": case "docx": return { color: "bg-blue-500", label: ext };
    case "xls": case "xlsx": return { color: "bg-green-500", label: ext };
    case "csv": return { color: "bg-emerald-500", label: ext };
    case "txt": return { color: "bg-gray-500", label: ext };
    default: return { color: "bg-purple-500", label: ext || "?" };
  }
}

function UploadZone({
  label,
  description,
  onUpload,
  uploading,
}: {
  label: string;
  description: string;
  onUpload: (files: FileList) => void;
  uploading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
        dragOver
          ? "border-[#802DC8] bg-[#ECE1F0]"
          : "border-gray-200 hover:border-[#802DC8] hover:bg-[#faf8fc]"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files); }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />
      {uploading ? (
        <p className="text-sm text-[#802DC8] font-semibold">Uploading...</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            <span className="text-[#802DC8] font-semibold">{label}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </>
      )}
    </div>
  );
}

function DocRow({
  doc,
  onDownload,
  onDelete,
}: {
  doc: AccountDocument;
  onDownload: (doc: AccountDocument) => void;
  onDelete: (doc: AccountDocument) => void;
}) {
  const badge = getFileTypeBadge(doc.original_filename);
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg ${badge.color} flex items-center justify-center flex-shrink-0`}>
          <span className="text-[10px] font-bold text-white uppercase">{badge.label.slice(0, 4)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{doc.original_filename}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatSize(doc.file_size)}</span>
            {doc.has_extracted_text && (
              <span className="text-green-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extracted
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onDownload(doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#802DC8] hover:bg-[#ECE1F0] transition-colors" title="Download">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button onClick={() => onDelete(doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function DocumentSection({ accountId }: { accountId: number }) {
  const [docs, setDocs] = useState<AccountDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<"knowledge" | "activity" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { loadDocs(); }, [accountId]);

  const loadDocs = async () => {
    setLoading(true);
    try { setDocs(await docsApi.list(accountId)); }
    catch { setError("Failed to load documents"); }
    finally { setLoading(false); }
  };

  const handleUpload = async (files: FileList, docType: "knowledge" | "activity") => {
    setUploading(docType);
    setError("");
    try {
      for (const file of Array.from(files)) {
        await docsApi.upload(accountId, file, docType);
      }
      await loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
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
    } catch { setError("Download failed"); }
  };

  const handleDelete = async (doc: AccountDocument) => {
    if (!confirm(`Delete "${doc.original_filename}"?`)) return;
    try { await docsApi.delete(doc.id); await loadDocs(); }
    catch { setError("Delete failed"); }
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading documents...</div>;

  const knowledgeDocs = docs.filter((d) => d.doc_type === "knowledge");
  const activityDocs = docs.filter((d) => d.doc_type !== "knowledge");

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-100 animate-fade-in">{error}</div>
      )}

      {/* Knowledge Base Section */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-[#802DC8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="font-semibold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Knowledge Base
          </h3>
          <span className="text-xs text-gray-400">Persistent context — BrainLift, Account BrainLift</span>
        </div>

        <UploadZone
          label="Upload to Knowledge Base"
          description="BrainLift docs, account profiles, strategic documents — always included as AI context"
          onUpload={(files) => handleUpload(files, "knowledge")}
          uploading={uploading === "knowledge"}
        />

        {knowledgeDocs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden mt-3">
            {knowledgeDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} onDownload={handleDownload} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Activity Log Section */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-[#802DC8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="font-semibold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Activity Log
          </h3>
          <span className="text-xs text-gray-400">Temporal — call transcripts, emails, meeting notes</span>
        </div>

        <UploadZone
          label="Upload to Activity Log"
          description="Call transcripts, emails, meeting notes — used for intelligence briefs and recent context"
          onUpload={(files) => handleUpload(files, "activity")}
          uploading={uploading === "activity"}
        />

        {activityDocs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden mt-3">
            {activityDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} onDownload={handleDownload} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {docs.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No documents uploaded yet.</p>
      )}
    </div>
  );
}
