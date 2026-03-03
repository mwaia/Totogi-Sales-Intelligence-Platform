import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accounts as api } from "../api";
import type { Account } from "../types";
import { STATUS_LABELS, STATUS_COLORS } from "../types";

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">BSS Magic Sales Intelligence</p>
        </div>
        <Link
          to="/accounts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Account
        </Link>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Deal Pipeline</h2>
        <div className="flex gap-3">
          {pipeline.map((stage) => (
            <div
              key={stage.status}
              className="flex-1 text-center p-4 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div className="text-2xl font-bold text-gray-900">{stage.count}</div>
              <div className="text-xs text-gray-500 mt-1">
                {STATUS_LABELS[stage.status]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Accounts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Accounts</h2>
          <Link to="/accounts" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : accountsList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No accounts yet</p>
            <p className="text-sm mt-1">Add your first account to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accountsList.slice(0, 5).map((account) => (
              <Link
                key={account.id}
                to={`/accounts/${account.id}`}
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-900 text-sm">{account.company_name}</span>
                  {account.industry && (
                    <span className="text-xs text-gray-400 ml-2">{account.industry}</span>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
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
  );
}
