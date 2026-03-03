import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { accounts as api } from "../api";
import type { Account } from "../types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_OPTIONS } from "../types";
import ChatPanel from "../components/ChatPanel";
import PlanSection from "../components/PlanSection";
import NewsSection from "../components/NewsSection";

type Tab = "overview" | "plans" | "news" | "chat";

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
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "plans", label: "Plans" },
    { key: "news", label: "News" },
    { key: "chat", label: "Chat" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/accounts")} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{account.company_name}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[account.current_status] || "bg-gray-100 text-gray-700"}`}>
            {STATUS_LABELS[account.current_status] || account.current_status}
          </span>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
              Edit
            </button>
          )}
          <button onClick={handleDelete} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-6">
          {editing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Edit Account</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input value={editForm.industry || ""} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input value={editForm.country || ""} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input value={editForm.website || ""} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.current_status || ""} onChange={(e) => setEditForm({ ...editForm, current_status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employees</label>
                  <input value={editForm.employee_count || ""} onChange={(e) => setEditForm({ ...editForm, employee_count: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revenue</label>
                  <input value={editForm.annual_revenue || ""} onChange={(e) => setEditForm({ ...editForm, annual_revenue: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                <button onClick={() => { setEditing(false); setEditForm(account); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Company Info</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {account.industry && <div><span className="text-gray-500">Industry:</span> <span className="text-gray-900 ml-2">{account.industry}</span></div>}
                {account.country && <div><span className="text-gray-500">Country:</span> <span className="text-gray-900 ml-2">{account.country}</span></div>}
                {account.website && <div><span className="text-gray-500">Website:</span> <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 ml-2 hover:underline">{account.website}</a></div>}
                {account.employee_count && <div><span className="text-gray-500">Employees:</span> <span className="text-gray-900 ml-2">{account.employee_count}</span></div>}
                {account.annual_revenue && <div><span className="text-gray-500">Revenue:</span> <span className="text-gray-900 ml-2">{account.annual_revenue}</span></div>}
              </div>
              {account.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{account.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Key Contacts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Key Contacts</h2>
            {account.key_contacts.length === 0 ? (
              <p className="text-sm text-gray-500">No contacts added yet</p>
            ) : (
              <div className="space-y-3">
                {account.key_contacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                        {c.is_champion && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Champion</span>}
                      </div>
                      <span className="text-xs text-gray-500">{c.title}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {c.email && <span>{c.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "plans" && <PlanSection accountId={account.id} />}
      {tab === "news" && <NewsSection accountId={account.id} />}
      {tab === "chat" && <ChatPanel accountId={account.id} accountName={account.company_name} />}
    </div>
  );
}
