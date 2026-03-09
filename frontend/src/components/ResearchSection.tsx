import { useState, useEffect, useRef } from "react";
import { research as researchApi, embeddings as embeddingsApi } from "../api";
import type { ResearchReport, SimilarityResult, EmbeddingStatus } from "../types";
import ReactMarkdown from "react-markdown";

type ResearchTab = "research" | "search" | "embeddings";

export default function ResearchSection({ accountId }: { accountId: number }) {
  const [activeTab, setActiveTab] = useState<ResearchTab>("research");

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-sm inline-flex">
        {([
          { key: "research" as const, label: "Deep Research", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
          { key: "search" as const, label: "Web Search", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { key: "embeddings" as const, label: "Semantic Search", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === t.key
                ? "bg-[#802DC8] text-white shadow-sm"
                : "text-gray-500 hover:bg-[#ECE1F0] hover:text-[#001C3D]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "research" && <DeepResearchPanel accountId={accountId} />}
      {activeTab === "search" && <WebSearchPanel accountId={accountId} />}
      {activeTab === "embeddings" && <EmbeddingsPanel accountId={accountId} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deep Research Panel
// ---------------------------------------------------------------------------

function DeepResearchPanel({ accountId }: { accountId: number }) {
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [streamCitations, setStreamCitations] = useState<{ title: string; url: string }[]>([]);
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState("");
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReports();
  }, [accountId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await researchApi.list(accountId);
      setReports(data);
    } catch {
      setError("Failed to load research reports");
    } finally {
      setLoading(false);
    }
  };

  const handleResearch = async () => {
    if (!query.trim() || streaming) return;
    setStreaming(true);
    setStreamContent("");
    setStreamCitations([]);
    setError("");
    setSelectedReport(null);

    try {
      const response = await researchApi.stream(accountId, query.trim());
      if (!response.ok) throw new Error("Research request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") {
              setStreamContent((prev) => prev + event.content);
              streamRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            } else if (event.type === "citations") {
              setStreamCitations(event.citations || []);
            } else if (event.type === "error") {
              setError(event.content);
            }
          } catch {
            // skip malformed events
          }
        }
      }

      // Save the completed report
      const saved = await researchApi.create(accountId, query.trim(), "deep_research");
      setReports((prev) => [saved, ...prev]);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
    } finally {
      setStreaming(false);
    }
  };

  const handleDelete = async (id: number) => {
    await researchApi.delete(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    if (selectedReport?.id === id) setSelectedReport(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Research Input */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-[#001C3D] mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Deep Research
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          OpenAI-powered comprehensive research with web search, multi-source analysis, and citations.
        </p>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
            placeholder="e.g., What is this company's BSS transformation strategy and competitive landscape?"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
            disabled={streaming}
          />
          <button
            onClick={handleResearch}
            disabled={streaming || !query.trim()}
            className="px-5 py-2.5 bg-[#802DC8] text-white rounded-xl text-sm font-medium hover:bg-[#6b24a8] disabled:opacity-60 transition-all shadow-sm flex items-center gap-2"
          >
            {streaming ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Researching...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Research
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streaming Result */}
      {(streaming || streamContent) && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="h-1" style={{ background: "linear-gradient(to right, #802DC8, #10b981)" }} />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              {streaming && (
                <svg className="animate-spin h-4 w-4 text-[#802DC8]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <h4 className="font-semibold text-[#001C3D] text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {streaming ? "Researching..." : "Research Complete"}
              </h4>
            </div>
            <div ref={streamRef} className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{streamContent}</ReactMarkdown>
            </div>
            {streamCitations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {streamCitations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#802DC8] hover:underline bg-[#ECE1F0] px-2 py-1 rounded-lg"
                    >
                      {c.title || c.url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Reports */}
      {selectedReport && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="h-1" style={{ background: "linear-gradient(to right, #802DC8, #001C3D)" }} />
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-[#001C3D] text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {selectedReport.query}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(selectedReport.created_at).toLocaleString()} &middot; {selectedReport.model_used}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Close
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{selectedReport.content}</ReactMarkdown>
            </div>
            {selectedReport.citations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#802DC8] hover:underline bg-[#ECE1F0] px-2 py-1 rounded-lg"
                    >
                      {c.title || c.url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report History */}
      {reports.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h4 className="font-semibold text-[#001C3D] text-sm mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Research History
          </h4>
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => setSelectedReport(r)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#001C3D] truncate">{r.query}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      r.report_type === "deep_research"
                        ? "bg-[#ECE1F0] text-[#802DC8]"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {r.report_type === "deep_research" ? "Deep Research" : "Web Search"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    {r.citations.length > 0 && (
                      <span className="text-xs text-gray-400">{r.citations.length} sources</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && !streaming && !streamContent && (
        <div className="text-center py-12 animate-fade-in">
          <div className="mx-auto w-20 h-20 mb-4 relative">
            <svg className="w-full h-full text-[#ECE1F0]" viewBox="0 0 80 80" fill="none">
              <circle cx="36" cy="36" r="24" stroke="currentColor" strokeWidth="3" />
              <path d="M54 54L70 70" stroke="#802DC8" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
              <circle cx="36" cy="36" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
          <p className="text-[#001C3D] text-sm font-medium mb-1">No research yet</p>
          <p className="text-gray-400 text-xs">
            Enter a research question above to get comprehensive, AI-powered analysis with citations.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <svg className="animate-spin h-5 w-5 text-[#802DC8]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Web Search Panel
// ---------------------------------------------------------------------------

function WebSearchPanel({ accountId }: { accountId: number }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ text: string; citations: { title: string; url: string }[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setError("");
    setResult(null);

    try {
      const data = await researchApi.webSearch(accountId, query.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-[#001C3D] mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Quick Web Search
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Fast OpenAI-powered web search with real-time results and citations.
        </p>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g., Latest 5G network investments by this company"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
            disabled={searching}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-5 py-2.5 bg-[#802DC8] text-white rounded-xl text-sm font-medium hover:bg-[#6b24a8] disabled:opacity-60 transition-all shadow-sm flex items-center gap-2"
          >
            {searching ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            Search
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in">
          <div className="h-1 bg-blue-500" />
          <div className="p-6">
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{result.text}</ReactMarkdown>
            </div>
            {result.citations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Sources ({result.citations.length})</p>
                <div className="flex flex-wrap gap-2">
                  {result.citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#802DC8] hover:underline bg-[#ECE1F0] px-2 py-1 rounded-lg"
                    >
                      {c.title || c.url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Embeddings Panel
// ---------------------------------------------------------------------------

function EmbeddingsPanel({ accountId }: { accountId: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [statuses, setStatuses] = useState<EmbeddingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStatus();
  }, [accountId]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await embeddingsApi.status(accountId);
      setStatuses(data);
    } catch {
      setError("Failed to load embedding status");
    } finally {
      setLoading(false);
    }
  };

  const handleEmbedAll = async () => {
    setEmbedding(true);
    setError("");
    try {
      await embeddingsApi.embedAll(accountId);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Embedding failed");
    } finally {
      setEmbedding(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setError("");

    try {
      const data = await embeddingsApi.search(accountId, query.trim());
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const embeddedCount = statuses.filter((s) => s.is_embedded).length;
  const totalChunks = statuses.reduce((sum, s) => sum + s.chunk_count, 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Embedding Status */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-[#001C3D]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Document Embeddings
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {embeddedCount}/{statuses.length} documents embedded &middot; {totalChunks} chunks indexed
            </p>
          </div>
          <button
            onClick={handleEmbedAll}
            disabled={embedding || statuses.length === 0}
            className="px-4 py-2 bg-[#802DC8] text-white rounded-xl text-sm font-medium hover:bg-[#6b24a8] disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {embedding ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Embedding...
              </>
            ) : (
              "Embed All Documents"
            )}
          </button>
        </div>

        {statuses.length > 0 && (
          <div className="space-y-1.5 mt-3">
            {statuses.map((s) => (
              <div
                key={s.document_id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${s.is_embedded ? "bg-green-400" : "bg-gray-300"}`} />
                  <span className="text-sm text-[#001C3D] truncate">{s.original_filename}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {s.is_embedded ? `${s.chunk_count} chunks` : "Not embedded"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Semantic Search */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-[#001C3D] mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Semantic Search
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Search across your uploaded documents using natural language. Finds the most relevant passages by meaning, not just keywords.
        </p>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g., What pricing models were discussed?"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
            disabled={searching}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim() || totalChunks === 0}
            className="px-5 py-2.5 bg-[#802DC8] text-white rounded-xl text-sm font-medium hover:bg-[#6b24a8] disabled:opacity-60 transition-all shadow-sm"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <h4 className="font-medium text-[#001C3D] text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Matching Passages ({results.length})
          </h4>
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-l-[#802DC8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#802DC8] bg-[#ECE1F0] px-2 py-0.5 rounded-full">
                  {r.original_filename}
                </span>
                <span className="text-xs text-gray-400">
                  Score: {(r.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <svg className="animate-spin h-5 w-5 text-[#802DC8]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );
}
