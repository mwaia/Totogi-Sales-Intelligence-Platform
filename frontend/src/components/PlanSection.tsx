import { useState, useEffect } from "react";
import { plans as plansApi } from "../api";
import type { AccountPlan, PlanType } from "../types";
import { PLAN_TYPE_LABELS, ARTIFACT_CATEGORIES } from "../types";
import ReactMarkdown from "react-markdown";

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
      {/* Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Generate Artifact</h2>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4">
          {ARTIFACT_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.label
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Type Selector + Generate */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as PlanType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={generating}
            >
              {currentCategory.types.map((type) => (
                <option key={type} value={type}>{PLAN_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Streaming output */}
      {(generating || genContent) && !selectedPlan && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              {generating ? "Generating..." : "Generated Artifact"}
            </h2>
            <div className="flex gap-2">
              {!generating && genContent && (
                <>
                  <button
                    onClick={() => copyToClipboard(genContent)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => setGenContent("")}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{genContent}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Selected plan viewer */}
      {selectedPlan && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{selectedPlan.title}</h2>
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(selectedPlan.content)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => exportPlan(selectedPlan)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Export
              </button>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{selectedPlan.content}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Saved Artifacts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Saved Artifacts</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : plansList.length === 0 ? (
          <p className="text-sm text-gray-500">No artifacts generated yet</p>
        ) : (
          <div className="space-y-4">
            {ARTIFACT_CATEGORIES.map((cat) => {
              const catPlans = plansList.filter((p) => getPlanCategory(p.plan_type) === cat.label);
              if (catPlans.length === 0) return null;
              return (
                <div key={cat.label}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat.label}</h3>
                  <div className="space-y-1">
                    {catPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                      >
                        <button
                          onClick={() => { setSelectedPlan(plan); setGenContent(""); }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium text-left"
                        >
                          {plan.title}
                        </button>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{PLAN_TYPE_LABELS[plan.plan_type as PlanType] || plan.plan_type}</span>
                          <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
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
