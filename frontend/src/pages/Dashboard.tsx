import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accounts as api } from "../api";
import type { Account } from "../types";
import { STATUS_LABELS, STATUS_COLORS } from "../types";

const PIPELINE_STAGE_STYLES: Record<string, { border: string; text: string; bg: string }> = {
  prospect: { border: "border-gray-400", text: "text-gray-700", bg: "bg-gray-50" },
  qualified: { border: "border-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  discovery: { border: "border-[#802DC8]", text: "text-[#802DC8]", bg: "bg-purple-50" },
  poc: { border: "border-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  negotiation: { border: "border-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
  closed_won: { border: "border-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  closed_lost: { border: "border-red-500", text: "text-red-700", bg: "bg-red-50" },
};

export default function Dashboard() {
  const [accountsList, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.list().then(setAccounts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const pipeline = [
    { status: "prospect", count: 0 },
    { status: "qualified", count: 0 },
    { status: "discovery", count: 0 },
    { status: "poc", count: 0 },
    { status: "negotiation", count: 0 },
    { status: "closed_won", count: 0 },
  ];

  for (const a of accountsList) {
    const stage = pipeline.find((p) => p.status === a.current_status);
    if (stage) stage.count++;
  }

  return (
    <div className="p-8" style={{ backgroundColor: "#f7f5f9", minHeight: "100%" }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[#001C3D]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Totogi Sales Intelligence Overview</p>
        </div>
        <Link
          to="/accounts/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#802DC8] text-white rounded-lg text-sm font-semibold hover:bg-[#6b22a8] transition-colors shadow-md shadow-purple-200"
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Account
        </Link>
      </div>

      {/* Pipeline */}
      <div className="mb-8">
        <h2
          className="font-semibold text-[#001C3D] mb-4 text-lg"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Deal Pipeline
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {pipeline.map((stage) => {
            const styles = PIPELINE_STAGE_STYLES[stage.status] || PIPELINE_STAGE_STYLES.prospect;
            return (
              <div
                key={stage.status}
                className={`bg-white rounded-xl shadow-sm border-t-4 ${styles.border} p-5 text-center hover:shadow-md transition-shadow`}
              >
                <div className={`text-3xl font-bold ${styles.text}`}>
                  {stage.count}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">
                  {STATUS_LABELS[stage.status]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Accounts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2
            className="font-semibold text-[#001C3D] text-lg"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Recent Accounts
          </h2>
          <Link
            to="/accounts"
            className="text-sm text-[#802DC8] hover:text-[#6b22a8] font-medium transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#802DC8] border-t-transparent" />
            </div>
          ) : accountsList.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-[#802DC8]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">No accounts yet</p>
              <p className="text-sm text-gray-400 mt-1">Get started by adding your first account</p>
              <Link
                to="/accounts/new"
                className="inline-block mt-4 px-5 py-2 bg-[#802DC8] text-white rounded-lg text-sm font-medium hover:bg-[#6b22a8] transition-colors"
              >
                Add Account
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {accountsList.slice(0, 5).map((account) => (
                <Link
                  key={account.id}
                  to={`/accounts/${account.id}`}
                  className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all group -mx-2"
                >
                  <div className="flex items-center gap-3">
                    {/* Company initial circle */}
                    <div className="w-10 h-10 rounded-full bg-[#802DC8] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {account.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 text-sm group-hover:text-[#802DC8] transition-colors">
                        {account.company_name}
                      </span>
                      {account.industry && (
                        <span className="text-xs text-gray-400 ml-2">{account.industry}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      STATUS_COLORS[account.current_status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[account.current_status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
