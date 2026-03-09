import { useState, useEffect } from "react";
import { plans as plansApi } from "../api";
import type { AccountPlan, PlanType } from "../types";
import { PLAN_TYPE_LABELS, ARTIFACT_CATEGORIES } from "../types";
import ReactMarkdown from "react-markdown";

const PLAN_TYPE_DESCRIPTIONS: Record<PlanType, string> = {
  full: "Comprehensive account strategy with goals, tactics, and timeline",
  use_cases: "Identify and prioritize relevant use cases for the account",
  messaging: "Tailored messaging and value propositions for key personas",
  stakeholder_map: "Map decision-makers, influencers, and champions",
  deal_strategy: "Tactical plan to advance and close the deal",
  beachhead: "Identify the best initial entry point into the account",
  executive_summary: "Concise brief for leadership review and alignment",
  roi_business_case: "Build a compelling financial justification",
  battle_card: "Competitive positioning and objection handling",
  talk_track: "Discovery questions and conversation guides",
  email_sequences: "Multi-touch outreach sequences for key personas",
  win_loss_analysis: "Analyze factors behind deal outcomes",
  qbr_brief: "Quarterly review preparation with key metrics and updates",
  expansion_plan: "Land-and-expand strategy from beachhead to platform",
  land_expand: "Visual land & expand diagram with value waterfall",
  next_steps: "Prioritized actions based on deal stage and recent activity",
  meeting_prep: "One-page brief to review before a customer meeting",
};

export default function PlanSection({ accountId }: { accountId: number }) {
  const [plansList, setPlans] = useState<AccountPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<AccountPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genContent, setGenContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ARTIFACT_CATEGORIES[0].label);
  const [planType, setPlanType] = useState<PlanType>(ARTIFACT_CATEGORIES[0].types[0]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const currentCategory = ARTIFACT_CATEGORIES.find((c) => c.label === selectedCategory) || ARTIFACT_CATEGORIES[0];

  useEffect(() => {
    loadPlans();
  }, [accountId]);

  // Reset plan type when category changes
  useEffect(() => {
    setPlanType(currentCategory.types[0]);
  }, [selectedCategory]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await plansApi.list(accountId);
      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    setGenContent("");
    setSelectedPlan(null);

    try {
      const response = await plansApi.generate(accountId, planType);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setGenContent(accumulated);
              }
              if (data.plan_id) {
                await loadPlans();
              }
            } catch {
              // Skip malformed
            }
          }
        }
      }
    } catch (err) {
      setGenContent(`Error: ${err instanceof Error ? err.message : "Failed to generate"}`);
    } finally {
      setGenerating(false);
    }
  };

  const exportPlan = (plan: AccountPlan) => {
    const blob = new Blob([plan.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deletePlan = async (planId: number) => {
    if (!confirm("Delete this artifact?")) return;
    await plansApi.delete(planId);
    if (selectedPlan?.id === planId) setSelectedPlan(null);
    loadPlans();
  };

  // Group saved plans by category
  const getPlanCategory = (pt: string) => {
    for (const cat of ARTIFACT_CATEGORIES) {
      if (cat.types.includes(pt as PlanType)) return cat.label;
    }
    return "Other";
  };

  return (
    <div className="space-y-6">
      {/* Copy Toast */}
      {copied && (
        <div className="toast animate-fade-in">
          Copied to clipboard
        </div>
      )}

      {/* Generator */}
      <div className="animate-fade-in bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-[#001C3D] mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Generate Artifact
        </h2>

        {/* Category Pill Buttons */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {ARTIFACT_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.label
                  ? "bg-[#802DC8] text-white shadow-sm"
                  : "bg-[#ECE1F0] text-[#802DC8] hover:bg-[#e0d0e8]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Artifact Type Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {currentCategory.types.map((type) => (
            <button
              key={type}
              onClick={() => setPlanType(type)}
              disabled={generating}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                planType === type
                  ? "border-[#802DC8] bg-[#ECE1F0]/50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-[#ECE1F0] hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              <p className={`text-sm font-semibold ${planType === type ? "text-[#802DC8]" : "text-[#001C3D]"}`}>
                {PLAN_TYPE_LABELS[type]}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                {PLAN_TYPE_DESCRIPTIONS[type]}
              </p>
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePlan}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#802DC8] text-white rounded-xl font-semibold text-base hover:bg-[#6b24a8] disabled:opacity-60 transition-all shadow-sm"
        >
          {generating ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" />
            </svg>
          )}
          {generating ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Streaming output */}
      {(generating || genContent) && !selectedPlan && (
        <div className="animate-fade-in bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Navy header bar */}
          <div className="bg-[#001C3D] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white text-sm">
                {PLAN_TYPE_LABELS[planType] || "Generated Artifact"}
              </h2>
              {generating && (
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="thinking-dot" />
                  <span className="thinking-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="thinking-dot" style={{ animationDelay: "0.4s" }} />
                  streaming
                </span>
              )}
            </div>
            {!generating && genContent && (
              <div className="flex items-center gap-1">
                {/* Copy icon button */}
                <button
                  onClick={() => copyToClipboard(genContent)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                {/* Export icon button */}
                <button
                  onClick={() => {
                    const blob = new Blob([genContent], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${(PLAN_TYPE_LABELS[planType] || "artifact").replace(/\s+/g, "_")}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Export"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                {/* Close icon button */}
                <button
                  onClick={() => setGenContent("")}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="p-8 max-w-4xl mx-auto">
            <div className="prose-ai">
              <ReactMarkdown>{genContent}</ReactMarkdown>
              {generating && <span className="streaming-cursor" />}
            </div>
          </div>
        </div>
      )}

      {/* Selected plan viewer */}
      {selectedPlan && (
        <div className="animate-fade-in bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Navy header bar */}
          <div className="bg-[#001C3D] px-5 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">{selectedPlan.title}</h2>
            <div className="flex items-center gap-1">
              {/* Copy icon button */}
              <button
                onClick={() => copyToClipboard(selectedPlan.content)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Copy"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {/* Export icon button */}
              <button
                onClick={() => exportPlan(selectedPlan)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Export"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              {/* Close icon button */}
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-8 max-w-4xl mx-auto">
            <div className="prose-ai">
              <ReactMarkdown>{selectedPlan.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Saved Artifacts */}
      <div className="animate-fade-in">
        <h2 className="font-semibold text-[#001C3D] mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Saved Artifacts
        </h2>
        {loading ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <svg className="animate-spin h-5 w-5 text-[#802DC8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : plansList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No artifacts generated yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {ARTIFACT_CATEGORIES.map((cat) => {
              const catPlans = plansList.filter((p) => getPlanCategory(p.plan_type) === cat.label);
              if (catPlans.length === 0) return null;
              return (
                <div key={cat.label}>
                  <h3
                    className="text-xs font-semibold text-[#001C3D] uppercase tracking-wider mb-3"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    {cat.label}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="animate-fade-in bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group relative"
                        onClick={() => { setSelectedPlan(plan); setGenContent(""); }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-[#001C3D] group-hover:text-[#802DC8] transition-colors line-clamp-1">
                            {plan.title}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-[#FF4F59] transition-all rounded"
                            title="Delete"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#ECE1F0] text-[#802DC8]">
                          {PLAN_TYPE_LABELS[plan.plan_type as PlanType] || plan.plan_type}
                        </span>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {plan.content.slice(0, 100)}
                          {plan.content.length > 100 ? "..." : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
