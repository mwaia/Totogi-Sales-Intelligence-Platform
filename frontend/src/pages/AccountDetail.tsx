import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { accounts as api } from "../api";
import type { Account } from "../types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_OPTIONS } from "../types";
import ChatPanel from "../components/ChatPanel";
import PlanSection from "../components/PlanSection";
import DocumentSection from "../components/DocumentSection";
import IntelligenceSection from "../components/IntelligenceSection";

type Tab = "overview" | "documents" | "intelligence" | "plans" | "chat";

const TAB_ICONS: Record<Tab, JSX.Element> = {
  overview: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  documents: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  intelligence: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  plans: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Account>>({});

  useEffect(() => {
    if (id) loadAccount();
  }, [id]);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const data = await api.get(Number(id));
      setAccount(data);
      setEditForm(data);
    } catch {
      navigate("/accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!account) return;
    try {
      const updated = await api.update(account.id, editForm);
      setAccount(updated);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const handleDelete = async () => {
    if (!account || !confirm("Delete this account? This cannot be undone.")) return;
    await api.delete(account.id);
    navigate("/accounts");
  };

  if (loading || !account) {
    return (
      <div className="min-h-screen bg-[#f7f5f9] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "documents", label: "Documents" },
    { key: "intelligence", label: "Intelligence" },
    { key: "plans", label: "Artifacts" },
    { key: "chat", label: "Chat" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f9]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/accounts" className="text-[#802DC8] hover:text-[#6b24a8] font-medium transition-colors">
            Accounts
          </Link>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#001C3D] font-medium">{account.company_name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#802DC8] text-white font-bold flex items-center justify-center text-lg shrink-0">
              {account.company_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {account.company_name}
              </h1>
              <span
                className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  STATUS_COLORS[account.current_status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {STATUS_LABELS[account.current_status] || account.current_status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 border-2 border-[#802DC8] text-[#802DC8] rounded-xl text-sm font-semibold hover:bg-[#802DC8]/5 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Pill Tabs */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  tab === t.key
                    ? "bg-[#802DC8] text-white shadow-sm"
                    : "text-gray-500 hover:bg-[#ECE1F0] hover:text-[#001C3D]"
                }`}
              >
                {TAB_ICONS[t.key]}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {tab === "overview" && (
          <div className="space-y-6">
            {editing ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                <h2 className="font-bold text-[#001C3D] text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Edit Account
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      value={editForm.industry || ""}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      value={editForm.country || ""}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      value={editForm.website || ""}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.current_status || ""}
                      onChange={(e) => setEditForm({ ...editForm, current_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employees</label>
                    <input
                      value={editForm.employee_count || ""}
                      onChange={(e) => setEditForm({ ...editForm, employee_count: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revenue</label>
                    <input
                      value={editForm.annual_revenue || ""}
                      onChange={(e) => setEditForm({ ...editForm, annual_revenue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2 bg-[#802DC8] text-white rounded-xl text-sm font-semibold hover:bg-[#6b24a8] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditForm(account);
                    }}
                    className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-l-[#802DC8]">
                <h2
                  className="font-bold text-[#001C3D] text-lg mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Company Info
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {account.industry && (
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Industry</span>
                      <p className="text-[#001C3D] font-medium mt-0.5">{account.industry}</p>
                    </div>
                  )}
                  {account.country && (
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Country</span>
                      <p className="text-[#001C3D] font-medium mt-0.5">{account.country}</p>
                    </div>
                  )}
                  {account.website && (
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Website</span>
                      <p className="mt-0.5">
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#802DC8] hover:underline font-medium"
                        >
                          {account.website}
                        </a>
                      </p>
                    </div>
                  )}
                  {account.employee_count && (
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Employees</span>
                      <p className="text-[#001C3D] font-medium mt-0.5">{account.employee_count}</p>
                    </div>
                  )}
                  {account.annual_revenue && (
                    <div>
                      <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Revenue</span>
                      <p className="text-[#001C3D] font-medium mt-0.5">{account.annual_revenue}</p>
                    </div>
                  )}
                </div>
                {account.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Notes</span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{account.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Key Contacts */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2
                className="font-bold text-[#001C3D] text-lg mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Key Contacts
              </h2>
              {account.key_contacts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#ECE1F0] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#802DC8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">No contacts added yet</p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {account.key_contacts.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#f7f5f9] hover:bg-[#ECE1F0]/60 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#802DC8] text-white font-semibold flex items-center justify-center text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#001C3D] text-sm truncate">{c.name}</span>
                          {c.is_champion && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              Champion
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.title}</p>
                        {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "documents" && <DocumentSection accountId={account.id} />}
        {tab === "intelligence" && <IntelligenceSection accountId={account.id} />}
        {tab === "plans" && <PlanSection accountId={account.id} />}
        {tab === "chat" && <ChatPanel accountId={account.id} accountName={account.company_name} />}
      </div>
    </div>
  );
}
