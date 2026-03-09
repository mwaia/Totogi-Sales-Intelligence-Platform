import { useState, useEffect } from "react";
import { notesApi } from "../api";
import type { AccountNote } from "../types";

export default function NoteSection({ accountId }: { accountId: number }) {
  const [notes, setNotes] = useState<AccountNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotes();
  }, [accountId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const data = await notesApi.list(accountId);
      setNotes(data);
    } catch {
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const note = await notesApi.create(accountId, content.trim());
      setNotes((prev) => [note, ...prev]);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this note?")) return;
    await notesApi.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <svg className="animate-spin h-5 w-5 text-[#802DC8]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-500">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Header */}
      <h2 className="text-lg font-semibold text-[#001C3D]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        Notes
      </h2>

      {/* Add Note */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note... (meeting observations, follow-up items, key takeaways)"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="px-4 py-2 bg-[#802DC8] text-white rounded-xl text-sm font-medium hover:bg-[#6b24a8] disabled:opacity-60 transition-all"
          >
            {submitting ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>

      {/* Notes Timeline */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl shadow-sm p-4 group hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{formatDate(note.created_at)}</span>
                    {note.created_by_name && (
                      <>
                        <span>&middot;</span>
                        <span>{note.created_by_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 animate-fade-in">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#ECE1F0] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#802DC8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-[#001C3D] text-sm font-medium mb-1">No notes yet</p>
          <p className="text-gray-400 text-xs">
            Start a journal for this account. Add meeting notes, observations, and follow-ups.
          </p>
        </div>
      )}
    </div>
  );
}
