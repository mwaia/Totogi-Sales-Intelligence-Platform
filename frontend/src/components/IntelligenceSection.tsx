import { useState, useEffect } from "react";
import { intelligence as intelApi } from "../api";
import type { IntelligenceBrief, NewsItem } from "../types";
import { INTELLIGENCE_CATEGORIES } from "../types";

const SIGNAL_COLORS: Record<string, string> = {
  positive: "bg-green-50 border-green-200 text-green-800",
  neutral: "bg-gray-50 border-gray-200 text-gray-700",
  negative: "bg-red-50 border-red-200 text-red-800",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-600",
};

export default function IntelligenceSection({ accountId }: { accountId: number }) {
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadIntelligence();
  }, [accountId]);

  const loadIntelligence = async () => {
    setLoading(true);
    try {
      const data = await intelApi.get(accountId);
      setBrief(data.brief);
      setItems(data.items);
    } catch {
      setError("Failed to load intelligence");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      await intelApi.refresh(accountId);
      await loadIntelligence();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading intelligence...</div>;

  // Group items by category
  const grouped: Record<string, NewsItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>
      )}

      {/* Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Account Intelligence</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? "Gathering Intelligence..." : "Refresh Intelligence"}
        </button>
      </div>

      {refreshing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          Searching across multiple sources and generating AI brief. This may take 15-30 seconds...
        </div>
      )}

      {/* Executive Summary */}
      {brief && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Executive Summary</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{brief.summary}</p>
          <p className="text-xs text-gray-400 mt-3">
            Generated {new Date(brief.generated_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Signals Grid */}
      {brief && (brief.key_highlights.length > 0 || brief.risk_signals.length > 0 || brief.opportunity_signals.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Highlights */}
          {brief.key_highlights.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 text-sm mb-3">Key Highlights</h4>
              <div className="space-y-2">
                {brief.key_highlights.map((h, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded-lg border ${SIGNAL_COLORS[h.signal_type] || SIGNAL_COLORS.neutral}`}
                  >
                    {h.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Signals */}
          {brief.risk_signals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 text-sm mb-3">Risk Signals</h4>
              <div className="space-y-2">
                {brief.risk_signals.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${SEVERITY_COLORS[r.severity] || SEVERITY_COLORS.medium}`}>
                      {r.severity}
                    </span>
                    <span className="text-xs text-gray-700">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunity Signals */}
          {brief.opportunity_signals.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 text-sm mb-3">Opportunities</h4>
              <div className="space-y-2">
                {brief.opportunity_signals.map((o, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${PRIORITY_COLORS[o.priority] || PRIORITY_COLORS.medium}`}>
                      {o.priority}
                    </span>
                    <span className="text-xs text-gray-700">{o.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categorized Intelligence Items */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Intelligence Items</h3>
          {Object.entries(grouped).map(([category, categoryItems]) => {
            const catInfo = INTELLIGENCE_CATEGORIES[category] || { label: category, color: "bg-gray-100 text-gray-700" };
            return (
              <div key={category} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>
                    {catInfo.label}
                  </span>
                  <span className="text-xs text-gray-400">{categoryItems.length} items</span>
                </div>
                <div className="space-y-2">
                  {categoryItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.summary && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.summary}</p>
                        )}
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex-shrink-0"
                        >
                          Read
                        </a>
                      )}
                    </div>
                  ))}
                  {categoryItems.length > 5 && (
                    <p className="text-xs text-gray-400">+{categoryItems.length - 5} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!brief && items.length === 0 && !refreshing && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-2">No intelligence gathered yet.</p>
          <p className="text-gray-400 text-xs">Click "Refresh Intelligence" to search for news, financial updates, executive changes, and more.</p>
        </div>
      )}
    </div>
  );
}
