import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { DetectedChange, AIInsight, ImportanceLevel, ChangeType } from "../types/index.ts";
import { ChangeCard } from "../components/ChangeCard.tsx";
import {
  GitCommit,
  Filter,
  Search,
  RotateCw,
  Download,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ChangesPageProps {
  onNavigate: (route: string) => void;
}

export const ChangesPage: React.FC<ChangesPageProps> = ({ onNavigate }) => {
  const { addToast } = useApp();
  const [changes, setChanges] = useState<(DetectedChange & { competitor_name: string; ai_insight?: AIInsight })[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadChanges = async () => {
    setLoading(true);
    try {
      const res = await api.getChanges();
      setChanges(res.changes);
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to load changes", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, []);

  const filteredChanges = changes.filter((c) => {
    if (priorityFilter !== "all" && c.importance !== priorityFilter) return false;
    if (typeFilter !== "all" && c.change_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchComp = c.competitor_name?.toLowerCase().includes(q);
      const matchSummary = c.ai_insight?.summary.toLowerCase().includes(q);
      const matchContent = c.new_value.toLowerCase().includes(q);
      if (!matchComp && !matchSummary && !matchContent) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredChanges.length === 0) return;
    const headers = ["Competitor", "Change Type", "Priority", "Summary", "Detected Date", "URL"];
    const rows = filteredChanges.map((c) => [
      `"${c.competitor_name}"`,
      `"${c.change_type}"`,
      `"${c.importance}"`,
      `"${(c.ai_insight?.summary || c.new_value).replace(/"/g, '""')}"`,
      `"${new Date(c.detected_at).toISOString()}"`,
      `"${c.page_url}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `competitor_changes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ type: "success", title: "CSV Exported", message: "Exported changes feed to CSV." });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Competitive Changes Feed</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stream of detected competitor pricing, promotions, and service updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadChanges}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg shadow-2xs"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search competitor, price, or keyword..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
            >
              <option value="all">All Types</option>
              <option value="pricing_change">Pricing Changes</option>
              <option value="service_change">Service Changes</option>
              <option value="promotion_change">Promotions</option>
              <option value="new_page">New Pages</option>
              <option value="faq_change">FAQ Changes</option>
              <option value="cta_change">Call-to-Action</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400 text-xs">
          Showing <strong className="text-slate-700">{filteredChanges.length}</strong> of {changes.length} events
        </div>
      </div>

      {/* Changes list */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading change feed...</div>
      ) : filteredChanges.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 space-y-2">
          <GitCommit className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">No matching changes found</p>
          <p>Try loosening your priority or search filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChanges.map((change) => (
            <ChangeCard key={change.id} change={change} onStatusChange={loadChanges} />
          ))}
        </div>
      )}
    </div>
  );
};
