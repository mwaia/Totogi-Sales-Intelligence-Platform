import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accounts as api, dashboard as dashApi } from "../api";
import type { Account, PipelineSummary } from "../types";
import { STATUS_LABELS, STATUS_COLORS } from "../types";

const PIPELINE_STAGES = ["prospect", "qualified", "discovery", "poc", "negotiation", "closed_won"];

const PIPELINE_STAGE_STYLES: Record<string, { border: string; text: string; bg: string }> = {
  prospect: { border: "border-gray-400", text: "text-gray-700", bg: "bg-gray-50" },
  qualified: { border: "border-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  discovery: { border: "border-[#802DC8]", text: "text-[#802DC8]", bg: "bg-purple-50" },
  poc: { border: "border-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  negotiation: { border: "border-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
  closed_won: { border: "border-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  closed_lost: { border: "border-red-500", text: "text-red-700", bg: "bg-red-50" },
};

const STAGE_PROBABILITY: Record<string, number> = {
  prospect: 5, qualified: 15, discovery: 30, poc: 50, negotiation: 75, closed_won: 100,
};

export default function Dashboard() {
  const [accountsList, setAccounts] = useState<Account[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.list().then(setAccounts),
      dashApi.pipelineSummary().then(setPipelineData),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredAccounts = selectedStage
    ? accountsList.filter((a) => a.current_status === selectedStage)
    : accountsList;

  return (
    <div className="p-8" style={{ backgroundColor: "#f7f5f9", minHeight: "100%" }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Totogi Sales Intelligence Overview</p>
        </div>
        <Link
          to="/accounts/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#802DC8] text-white rounded-lg text-sm font-semibold hover:bg-[#6b22a8] transition-colors shadow-md shadow-purple-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Account
        </Link>
      </div>

      {/* Pipeline Summary Cards */}
      {pipelineData && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Pipeline</p>
            <p className="text-2xl font-bold text-[#001C3D] mt-1">
              ${pipelineData.total_pipeline.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{pipelineData.total_deals} deals</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Weighted Pipeline</p>
            <p className="text-2xl font-bold text-[#802DC8] mt-1">
              ${pipelineData.total_weighted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Probability-adjusted forecast</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Stale Deals</p>
            <p className={`text-2xl font-bold mt-1 ${pipelineData.stale_deals.length > 0 ? "text-[#FF4F59]" : "text-green-600"}`}>
              {pipelineData.stale_deals.length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">No activity in 14+ days</p>
          </div>
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#001C3D] text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Deal Pipeline
          </h2>
          {selectedStage && (
            <button onClick={() => setSelectedStage(null)} className="text-xs text-[#802DC8] hover:underline font-medium">
              Clear filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PIPELINE_STAGES.map((status) => {
            const styles = PIPELINE_STAGE_STYLES[status];
            const stageData = pipelineData?.stages[status];
            const count = stageData?.count || 0;
            const value = stageData?.value || 0;
            const isSelected = selectedStage === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStage(isSelected ? null : status)}
                className={`bg-white rounded-xl shadow-sm border-t-4 ${styles.border} p-5 text-center hover:shadow-md transition-all ${
                  isSelected ? "ring-2 ring-[#802DC8] ring-offset-2" : ""
                }`}
              >
                <div className={`text-3xl font-bold ${styles.text}`}>{count}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">
                  {STATUS_LABELS[status]}
                </div>
                {value > 0 && (
                  <div className="text-[10px] text-gray-400 mt-1">
                    ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-gray-300 ml-1">({STAGE_PROBABILITY[status]}%)</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stale Deal Alerts */}
      {pipelineData && pipelineData.stale_deals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-red-800 text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Deals Needing Attention
          </h3>
          <div className="space-y-2">
            {pipelineData.stale_deals.map((d) => (
              <Link
                key={d.id}
                to={`/accounts/${d.account_id}`}
                className="flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center text-xs">
                    {d.company_name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[#001C3D]">{d.company_name}</span>
                    <span className="text-xs text-gray-400 ml-1">— {d.deal_title}</span>
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[d.status]}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#FF4F59] font-medium">{d.days_inactive} days inactive</span>
                  {d.deal_value > 0 && (
                    <span className="text-xs text-gray-400 ml-3">${d.deal_value.toLocaleString()}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Account List (filtered by selected stage) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-[#001C3D] text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {selectedStage ? `${STATUS_LABELS[selectedStage]} Accounts` : "Recent Accounts"}
          </h2>
          <Link to="/accounts" className="text-sm text-[#802DC8] hover:text-[#6b22a8] font-medium transition-colors">
            View All
          </Link>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#802DC8] border-t-transparent" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#802DC8]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">{selectedStage ? "No accounts in this stage" : "No accounts yet"}</p>
              <p className="text-sm text-gray-400 mt-1">Get started by adding your first account</p>
              <Link to="/accounts/new" className="inline-block mt-4 px-5 py-2 bg-[#802DC8] text-white rounded-lg text-sm font-medium hover:bg-[#6b22a8] transition-colors">
                Add Account
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredAccounts.slice(0, selectedStage ? 20 : 5).map((account) => (
                <Link
                  key={account.id}
                  to={`/accounts/${account.id}`}
                  className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all group -mx-2"
                >
                  <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-3">
                    {account.deal_value > 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        ${account.deal_value.toLocaleString()}
                      </span>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[account.current_status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[account.current_status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
