import React, { useState } from "react";
import { DetectedChange, AIInsight } from "../types/index.ts";
import { PriorityBadge, ChangeTypeBadge } from "./PriorityBadge.tsx";
import {
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  ListTodo,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { api } from "../services/api.ts";
import { useApp } from "../context/AppContext.tsx";

interface ChangeCardProps {
  change: DetectedChange & { competitor_name?: string; ai_insight?: AIInsight };
  onStatusChange?: () => void;
}

export const ChangeCard: React.FC<ChangeCardProps> = ({ change, onStatusChange }) => {
  const { addToast } = useApp();
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(false);

  const insight = change.ai_insight;

  const handleUpdateStatus = async (status: string) => {
    setLoading(true);
    try {
      await api.updateChangeStatus(change.id, status);
      addToast({
        type: status === "task_created" ? "success" : "info",
        title: status === "task_created" ? "Action Item Created" : "Change Dismissed",
        message:
          status === "task_created"
            ? "Added to your strategic opportunity backlog."
            : "This change has been archived from your active feed.",
      });
      onStatusChange?.();
    } catch (err: any) {
      addToast({ type: "error", title: "Update Failed", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(change.detected_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`p-5 bg-white rounded-xl border transition-all ${
        change.importance === "critical"
          ? "border-red-200 shadow-xs hover:border-red-300"
          : change.importance === "high"
          ? "border-orange-200 shadow-xs hover:border-orange-300"
          : "border-slate-200 shadow-2xs hover:border-slate-300"
      }`}
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={change.importance} />
          <ChangeTypeBadge type={change.change_type} />
          {change.is_demo && (
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              Demo Data
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Main Headline */}
      <div className="mt-3">
        <div className="text-xs font-semibold text-blue-600 mb-0.5">
          {change.competitor_name || "Competitor Website"}
        </div>
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {insight?.summary || change.new_value.slice(0, 100)}
        </h3>
        <a
          href={change.page_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-1 truncate"
        >
          <span>{change.page_url}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </div>

      {/* Strategic AI Breakdown (Fact vs Inference vs Recommendation) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Why it matters */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Why it matters (Inference)</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {insight?.business_impact ||
              "Competitor updated their offerings to attract prospective customers in your sector."}
          </p>
        </div>

        {/* Recommended Action */}
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60">
          <div className="flex items-center gap-1.5 font-semibold text-blue-900 mb-1">
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            <span>Recommended Next Step</span>
          </div>
          <p className="text-blue-800 leading-relaxed font-medium">
            {insight?.recommendation ||
              "Audit your matching service page and emphasize your specific customer benefits."}
          </p>
        </div>
      </div>

      {/* Diff Inspector Toggle */}
      {showDiff && (
        <div className="mt-4 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono space-y-2 animate-in fade-in">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Raw Content Snapshot Diff
          </div>
          <div className="p-2 bg-red-950/50 text-red-300 rounded border border-red-900/50">
            <span className="font-bold text-red-400">- PREVIOUS: </span>
            {change.old_value || "[None]"}
          </div>
          <div className="p-2 bg-emerald-950/50 text-emerald-300 rounded border border-emerald-900/50">
            <span className="font-bold text-emerald-400">+ CURRENT: </span>
            {change.new_value}
          </div>
        </div>
      )}

      {/* Card Action Controls */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setShowDiff(!showDiff)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showDiff ? "Hide Raw Diff" : "View Change Diff"}</span>
        </button>

        <div className="flex items-center gap-2">
          {change.status === "task_created" ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" /> Task Created
            </span>
          ) : (
            <button
              disabled={loading}
              onClick={() => handleUpdateStatus("task_created")}
              className="text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ListTodo className="w-3.5 h-3.5 text-blue-600" />
              <span>Create Action Item</span>
            </button>
          )}

          {change.status !== "dismissed" && (
            <button
              disabled={loading}
              onClick={() => handleUpdateStatus("dismissed")}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded transition-colors"
              title="Dismiss"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
