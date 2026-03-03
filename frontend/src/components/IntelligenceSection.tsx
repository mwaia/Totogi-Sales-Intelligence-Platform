import { useState, useEffect } from "react";
import { intelligence as intelApi } from "../api";
import type { IntelligenceBrief, NewsItem } from "../types";
import { INTELLIGENCE_CATEGORIES } from "../types";

const SIGNAL_COLORS: Record<string, string> = {
  positive: "border-l-[#10b981]",
  neutral: "border-l-gray-300",
  negative: "border-l-[#FF4F59]",
};

const SIGNAL_BG: Record<string, string> = {
  positive: "bg-white",
  neutral: "bg-white",
  negative: "bg-white",
};

const SIGNAL_BADGE: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  neutral: "bg-gray-100 text-gray-600",
  negative: "bg-red-100 text-[#FF4F59]",
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

const CATEGORY_ICONS: Record<string, string> = {
  news: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  press_release: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  social: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z",
  financial_update: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  executive_change: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  competitor_activity: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  industry_trend: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  technology_initiative: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
};

const CATEGORY_COLORS: Record<string, string> = {
  news: "bg-blue-500",
  press_release: "bg-[#802DC8]",
  social: "bg-pink-500",
  financial_update: "bg-green-500",
  executive_change: "bg-yellow-500",
  competitor_activity: "bg-[#FF4F59]",
  industry_trend: "bg-indigo-500",
  technology_initiative: "bg-teal-500",
};

export default function IntelligenceSection({ accountId }: { accountId: number }) {
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

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

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <svg className="animate-spin h-5 w-5 text-[#802DC8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm text-gray-500">Loading intelligence...</span>
      </div>
    );
  }

  // Group items by category
  const grouped: Record<string, NewsItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100 animate-fade-in">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#001C3D]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Account Intelligence
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#802DC8] text-white rounded-xl text-sm font-medium hover:bg-[#6b24a8] disabled:opacity-60 transition-all shadow-sm"
        >
          {refreshing ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {refreshing ? "Gathering Intelligence..." : "Refresh Intelligence"}
        </button>
      </div>

      {/* Refreshing State */}
      {refreshing && (
        <div className="bg-[#ECE1F0] rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-[#802DC8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[#802DC8]">Gathering intelligence from multiple sources</p>
              <p className="text-xs text-[#802DC8]/70 mt-1">
                Searching news, financial data, social media, and more. This may take 15-30 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {brief && (
        <div className="animate-fade-in bg-white rounded-2xl shadow-sm overflow-hidden relative">
          <div className="h-1" style={{ background: "linear-gradient(to right, #802DC8, #001C3D)" }} />
          <div className="p-6">
            {/* AI sparkle icon */}
            <div className="absolute top-4 right-4">
              <svg className="h-5 w-5 text-[#802DC8]/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#001C3D] mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Executive Summary
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{brief.summary}</p>
            <p className="text-xs text-gray-400 mt-4">
              Generated {new Date(brief.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Signals Grid */}
      {brief && (brief.key_highlights.length > 0 || brief.risk_signals.length > 0 || brief.opportunity_signals.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Key Highlights */}
          {brief.key_highlights.length > 0 && (
            <div className="animate-fade-in">
              <h4 className="font-medium text-[#001C3D] text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                <svg className="h-4 w-4 text-[#802DC8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Key Highlights
              </h4>
              <div className="space-y-2">
                {brief.key_highlights.map((h, i) => (
                  <div
                    key={i}
                    className={`animate-fade-in bg-white rounded-xl shadow-sm p-3 border-l-4 ${SIGNAL_COLORS[h.signal_type] || SIGNAL_COLORS.neutral} ${SIGNAL_BG[h.signal_type] || SIGNAL_BG.neutral}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-700 leading-relaxed">{h.text}</p>
                    </div>
                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${SIGNAL_BADGE[h.signal_type] || SIGNAL_BADGE.neutral}`}>
                      {h.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Signals */}
          {brief.risk_signals.length > 0 && (
            <div className="animate-fade-in">
              <h4 className="font-medium text-[#001C3D] text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                <svg className="h-4 w-4 text-[#FF4F59]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Risk Signals
              </h4>
              <div className="space-y-2">
                {brief.risk_signals.map((r, i) => (
                  <div
                    key={i}
                    className="animate-fade-in bg-[#FFF5F5] rounded-xl shadow-sm p-3 border-l-4 border-l-[#FF4F59]"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${SEVERITY_COLORS[r.severity] || SEVERITY_COLORS.medium}`}>
                        {r.severity === "high" && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunity Signals */}
          {brief.opportunity_signals.length > 0 && (
            <div className="animate-fade-in">
              <h4 className="font-medium text-[#001C3D] text-sm mb-3 flex items-center gap-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                <svg className="h-4 w-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Opportunities
              </h4>
              <div className="space-y-2">
                {brief.opportunity_signals.map((o, i) => (
                  <div
                    key={i}
                    className="animate-fade-in bg-[#F0FDF4] rounded-xl shadow-sm p-3 border-l-4 border-l-[#10b981]"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${PRIORITY_COLORS[o.priority] || PRIORITY_COLORS.medium}`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        {o.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{o.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categorized Intelligence Items */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[#001C3D]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Intelligence Items
          </h3>
          {Object.entries(grouped).map(([category, categoryItems]) => {
            const catInfo = INTELLIGENCE_CATEGORIES[category] || { label: category, color: "bg-gray-100 text-gray-700" };
            const isCollapsed = collapsedCategories[category] === true;
            const iconPath = CATEGORY_ICONS[category] || CATEGORY_ICONS.news;
            const colorClass = CATEGORY_COLORS[category] || "bg-gray-500";

            return (
              <div key={category} className="animate-fade-in bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Category Header Bar */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-[#001C3D]">{catInfo.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {categoryItems.length} {categoryItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 space-y-2">
                    {categoryItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#001C3D] truncate">{item.title}</p>
                          {item.summary && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.summary}</p>
                          )}
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#802DC8] hover:underline flex-shrink-0 font-medium"
                          >
                            Read
                          </a>
                        )}
                      </div>
                    ))}
                    {categoryItems.length > 5 && (
                      <p className="text-xs text-gray-400 pl-3">+{categoryItems.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!brief && items.length === 0 && !refreshing && (
        <div className="text-center py-12 animate-fade-in">
          {/* Radar / Search SVG Illustration */}
          <div className="mx-auto w-24 h-24 mb-6 relative">
            <svg className="w-full h-full text-[#ECE1F0]" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer circle */}
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              {/* Middle circle */}
              <circle cx="48" cy="48" r="30" stroke="currentColor" strokeWidth="2" />
              {/* Inner circle */}
              <circle cx="48" cy="48" r="16" stroke="currentColor" strokeWidth="2" />
              {/* Center dot */}
              <circle cx="48" cy="48" r="4" fill="#802DC8" opacity="0.5" />
              {/* Radar sweep */}
              <path d="M48 48L48 4" stroke="#802DC8" strokeWidth="2" opacity="0.3" />
              <path d="M48 48L78 28" stroke="#802DC8" strokeWidth="2" opacity="0.2" />
              {/* Signal dots */}
              <circle cx="62" cy="32" r="3" fill="#802DC8" opacity="0.4" />
              <circle cx="35" cy="25" r="2" fill="#EF50FF" opacity="0.3" />
              <circle cx="70" cy="55" r="2.5" fill="#802DC8" opacity="0.25" />
            </svg>
          </div>
          <p className="text-[#001C3D] text-sm font-medium mb-1">No intelligence gathered yet</p>
          <p className="text-gray-400 text-xs">
            Click <span className="font-medium text-[#802DC8]">Refresh Intelligence</span> to begin searching for news, financial updates, executive changes, and more.
          </p>
        </div>
      )}
    </div>
  );
}
