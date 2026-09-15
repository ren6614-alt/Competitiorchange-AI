import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { OpportunityItem } from "../types/index.ts";
import { PriorityBadge } from "../components/PriorityBadge.tsx";
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ListTodo,
} from "lucide-react";

interface OpportunitiesPageProps {
  onNavigate: (route: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ onNavigate }) => {
  const { addToast } = useApp();
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.getOpportunities();
      setOpportunities(res.opportunities);
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to load opportunities", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleUpdateStatus = async (id: string, status: "open" | "in_progress" | "done" | "dismissed") => {
    try {
      await api.updateOpportunity(id, status);
      addToast({
        type: status === "done" ? "success" : "info",
        title: status === "done" ? "Opportunity Completed" : "Status Updated",
        message: status === "done" ? "Great job countering competitor moves!" : `Updated to ${status}`,
      });
      await loadOpportunities();
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to update", message: err.message });
    }
  };

  const filtered = opportunities.filter((o) => {
    if (filter === "open") return o.status === "open" || o.status === "in_progress";
    if (filter === "done") return o.status === "done";
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Strategic Opportunities</h1>
          <p className="text-xs text-slate-500 mt-1">
            Actionable counter-tactics synthesized from competitor pricing and service changes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setFilter("open")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === "open" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Open Actions
            </button>
            <button
              onClick={() => setFilter("done")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === "done" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === "all" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={loadOpportunities}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg shadow-2xs"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading strategic opportunities...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 space-y-2">
          <Lightbulb className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">No active opportunities in this view</p>
          <p>Run a competitor scan to identify new defensive or offensive maneuvers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              className={`p-5 rounded-xl border bg-white shadow-2xs flex flex-col justify-between space-y-4 ${
                opp.priority === "critical" ? "border-red-200" : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">{opp.competitor_name}</span>
                  <PriorityBadge priority={opp.priority} />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Competitor Action:
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                    {opp.competitor_action}
                  </h3>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/70 space-y-1">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    Recommended Next Step:
                  </span>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    {opp.recommendation}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Detected {new Date(opp.detected_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {opp.status === "done" ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(opp.id, "done")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Done</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(opp.id, "dismissed")}
                        className="px-2 py-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
