import React from "react";
import { ImportanceLevel, ChangeType } from "../types/index.ts";

interface PriorityBadgeProps {
  priority: ImportanceLevel;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = "" }) => {
  const styles: Record<ImportanceLevel, string> = {
    critical: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-400/20",
    high: "bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-400/20",
    medium: "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-400/20",
    low: "bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-400/20",
  };

  const dots: Record<ImportanceLevel, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-amber-500",
    low: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[priority]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority]}`} />
      <span className="capitalize">{priority}</span>
    </span>
  );
};

export const ChangeTypeBadge: React.FC<{ type: ChangeType; className?: string }> = ({ type, className = "" }) => {
  const formatLabel = (t: string) => {
    return t
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const colorClasses: Partial<Record<ChangeType, string>> = {
    pricing_change: "bg-emerald-50 text-emerald-700 border-emerald-200",
    service_change: "bg-indigo-50 text-indigo-700 border-indigo-200",
    promotion_change: "bg-purple-50 text-purple-700 border-purple-200",
    new_page: "bg-blue-50 text-blue-700 border-blue-200",
    deleted_page: "bg-rose-50 text-rose-700 border-rose-200",
    faq_change: "bg-cyan-50 text-cyan-700 border-cyan-200",
    cta_change: "bg-amber-50 text-amber-700 border-amber-200",
    heading_change: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        colorClasses[type] || "bg-gray-100 text-gray-700 border-gray-200"
      } ${className}`}
    >
      {formatLabel(type)}
    </span>
  );
};
