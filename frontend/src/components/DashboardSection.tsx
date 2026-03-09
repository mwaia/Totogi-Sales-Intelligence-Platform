import { useState, useEffect, useRef } from "react";
import { dashboard as dashApi, brainlift as blApi } from "../api";
import type { Account, DashboardData } from "../types";
import { STATUS_LABELS, STATUS_COLORS, INTELLIGENCE_CATEGORIES } from "../types";

interface Props {
  account: Account;
  onNavigate: (tab: string) => void;
}

export default function DashboardSection({ account, onNavigate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDashboard();
  }, [account.id]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const d = await dashApi.get(account.id);
      setData(d);
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleBrainLiftUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await blApi.upload(account.id, file);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <svg className="animate-spin h-5 w-5 text-[#802DC8]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* BrainLift Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1" style={{ background: "linear-gradient(to right, #802DC8, #EF50FF)" }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#802DC8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="font-semibold text-[#001C3D]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Account BrainLift
              </h3>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
                onChange={handleBrainLiftUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-1.5 text-xs font-medium rounded-lg border-2 border-[#802DC8] text-[#802DC8] hover:bg-[#802DC8]/5 disabled:opacity-60 transition-all"
              >
                {uploading ? "Uploading..." : data.brainlift ? "Replace" : "Upload BrainLift"}
              </button>
            </div>
          </div>

          {data.brainlift ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-[#ECE1F0] text-[#802DC8] px-2 py-0.5 rounded-full font-medium">
                  {data.brainlift.original_filename}
                </span>
                <span className="text-xs text-gray-400">
                  Uploaded {new Date(data.brainlift.created_at).toLocaleDateString()}
                </span>
              </div>
              {data.brainlift.text_preview && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-4 bg-gray-50 rounded-lg p-3">
                  {data.brainlift.text_preview}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
              <svg className="w-10 h-10 text-[#ECE1F0] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-xs text-gray-500 font-medium">No BrainLift uploaded</p>
              <p className="text-xs text-gray-400 mt-0.5">Upload a master context document for this account</p>
            </div>
          )}
        </div>
      </div>

      {/* Stale Deal Alert */}
      {data.is_stale && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#FF4F59]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">Stale Deal Alert</p>
            <p className="text-xs text-red-600">No activity in {data.days_inactive} days. This deal needs attention to stay alive.</p>
          </div>
        </div>
      )}

      {/* Deals + Next Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deals */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#001C3D] text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Deals
            </h3>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs text-[#802DC8] hover:underline font-medium"
            >
              Manage
            </button>
          </div>
          {data.deals.length > 0 ? (
            <div className="space-y-3">
              {data.deals.map((deal) => (
                <div key={deal.id} className="p-3 rounded-xl bg-gray-50 hover:bg-[#ECE1F0]/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#001C3D] truncate">{deal.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[deal.current_status] || "bg-gray-100 text-gray-700"
                    }`}>
                      {STATUS_LABELS[deal.current_status] || deal.current_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini health ring */}
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#f0f0f0" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={deal.health_score >= 70 ? "#10b981" : deal.health_score >= 40 ? "#f59e0b" : "#FF4F59"}
                          strokeWidth="4"
                          strokeDasharray={`${deal.health_score}, 100`} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-gray-600">{deal.health_score}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 text-[10px] text-gray-500">
                      {deal.deal_value > 0 && <span className="font-medium">${deal.deal_value.toLocaleString()}</span>}
                      {deal.open_task_count > 0 && <span>{deal.open_task_count} open tasks</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No deals yet</p>
            </div>
          )}
        </div>

        {/* Next Best Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-[#001C3D] text-sm mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Recommended Actions
          </h3>
          {data.next_actions.length > 0 ? (
            <div className="space-y-2">
              {data.next_actions.map((a, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${
                  a.priority === "high" ? "bg-red-50" : a.priority === "medium" ? "bg-yellow-50" : "bg-gray-50"
                }`}>
                  <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.priority === "high" ? "bg-red-200" : a.priority === "medium" ? "bg-yellow-200" : "bg-gray-200"
                  }`}>
                    <svg className={`w-2.5 h-2.5 ${
                      a.priority === "high" ? "text-red-700" : a.priority === "medium" ? "text-yellow-700" : "text-gray-600"
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{a.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-green-600 font-medium">All caught up! No urgent actions needed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      {data.activity_timeline.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-[#001C3D] text-sm mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Recent Activity
          </h3>
          <div className="space-y-0">
            {data.activity_timeline.map((e, i) => {
              const icons: Record<string, { path: string; color: string }> = {
                note: { path: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", color: "text-blue-500" },
                task_done: { path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-500" },
                document: { path: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z", color: "text-purple-500" },
                artifact: { path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-[#802DC8]" },
              };
              const icon = icons[e.type] || icons.note;
              return (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <svg className={`w-4 h-4 ${icon.color} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                    </svg>
                    {i < data.activity_timeline.length - 1 && <div className="w-px h-full bg-gray-100 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-xs text-gray-700">{e.text}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      {e.at && <span>{new Date(e.at).toLocaleDateString()}</span>}
                      {e.by && <span>&middot; {e.by}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-Column: Company Info + Recent Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-l-[#802DC8]">
          <h3 className="font-semibold text-[#001C3D] text-sm mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Company Info
          </h3>
          <div className="space-y-2 text-sm">
            {account.industry && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Industry</span>
                <span className="text-[#001C3D] font-medium text-xs">{account.industry}</span>
              </div>
            )}
            {account.country && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Country</span>
                <span className="text-[#001C3D] font-medium text-xs">{account.country}</span>
              </div>
            )}
            {account.employee_count && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Employees</span>
                <span className="text-[#001C3D] font-medium text-xs">{account.employee_count}</span>
              </div>
            )}
            {account.annual_revenue && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">Revenue</span>
                <span className="text-[#001C3D] font-medium text-xs">{account.annual_revenue}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Status</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[account.current_status] || "bg-gray-100 text-gray-700"}`}>
                {STATUS_LABELS[account.current_status] || account.current_status}
              </span>
            </div>
          </div>

          {/* Key Contacts (condensed) */}
          {account.key_contacts.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-400 mb-2">KEY CONTACTS</h4>
              {account.key_contacts.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-6 h-6 rounded-full bg-[#802DC8] text-white text-[10px] font-semibold flex items-center justify-center">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-[#001C3D] truncate block">{c.name}</span>
                    <span className="text-[10px] text-gray-400 truncate block">{c.title}</span>
                  </div>
                  {c.is_champion && (
                    <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
                      Champion
                    </span>
                  )}
                </div>
              ))}
              {account.key_contacts.length > 3 && (
                <p className="text-[10px] text-gray-400 mt-1">+{account.key_contacts.length - 3} more</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#001C3D] text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Recent Notes
            </h3>
            <button
              onClick={() => onNavigate("notes")}
              className="text-xs text-[#802DC8] hover:underline font-medium"
            >
              View All
            </button>
          </div>
          {data.recent_notes.length > 0 ? (
            <div className="space-y-2">
              {data.recent_notes.map((n) => (
                <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-700 line-clamp-2">{n.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                    {n.created_by_name && <span>&middot; {n.created_by_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No notes yet</p>
              <button
                onClick={() => onNavigate("notes")}
                className="text-xs text-[#802DC8] font-medium mt-1 hover:underline"
              >
                Add first note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two-Column: Tasks + Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#001C3D] text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Upcoming Tasks
            </h3>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs text-[#802DC8] hover:underline font-medium"
            >
              View All
            </button>
          </div>
          {data.upcoming_tasks.length > 0 ? (
            <div className="space-y-2">
              {data.upcoming_tasks.map((t) => {
                const overdue = t.due_date && new Date(t.due_date) < new Date();
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      t.priority === "high" ? "bg-red-400" : t.priority === "medium" ? "bg-yellow-400" : "bg-gray-300"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#001C3D] truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.due_date && (
                          <span className={`text-[10px] ${overdue ? "text-[#FF4F59] font-medium" : "text-gray-400"}`}>
                            {new Date(t.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {t.assigned_to_name && (
                          <span className="text-[10px] text-gray-400">{t.assigned_to_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No upcoming tasks</p>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-xs text-[#802DC8] font-medium mt-1 hover:underline"
              >
                Create a task
              </button>
            </div>
          )}
        </div>

        {/* Intelligence Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#001C3D] text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Intelligence Signals
            </h3>
            <button
              onClick={() => onNavigate("intelligence")}
              className="text-xs text-[#802DC8] hover:underline font-medium"
            >
              View All
            </button>
          </div>
          {data.intelligence ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{data.intelligence.summary}</p>
              {data.intelligence.opportunity_signals.length > 0 && (
                <div className="pt-2">
                  {data.intelligence.opportunity_signals.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <svg className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-[10px] text-gray-600">{o.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.intelligence.risk_signals.length > 0 && (
                <div>
                  {data.intelligence.risk_signals.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <svg className="w-3 h-3 text-[#FF4F59] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                      </svg>
                      <span className="text-[10px] text-gray-600">{r.text}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-400 pt-1">
                Updated {new Date(data.intelligence.generated_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No intelligence gathered</p>
              <button
                onClick={() => onNavigate("intelligence")}
                className="text-xs text-[#802DC8] font-medium mt-1 hover:underline"
              >
                Refresh Intelligence
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent News (full width) */}
      {data.recent_news.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-[#001C3D] text-sm mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Latest News & Press Releases
          </h3>
          <div className="space-y-2">
            {data.recent_news.map((n) => {
              const catInfo = INTELLIGENCE_CATEGORIES[n.category] || { label: n.category, color: "bg-gray-100 text-gray-700" };
              return (
                <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(n.scraped_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#001C3D]">{n.title}</p>
                    {n.summary && (
                      <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{n.summary}</p>
                    )}
                  </div>
                  {n.url && (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#802DC8] hover:underline font-medium flex-shrink-0"
                    >
                      Read
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
