import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { Competitor, DetectedChange, AIInsight, OpportunityItem } from "../types/index.ts";
import { ChangeCard } from "../components/ChangeCard.tsx";
import {
  Users,
  GitCommit,
  AlertTriangle,
  Lightbulb,
  Plus,
  Play,
  RotateCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface DashboardPageProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { activeProject, subscription, addToast, projects } = useApp();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [changes, setChanges] = useState<(DetectedChange & { competitor_name?: string; ai_insight?: AIInsight })[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!activeProject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [compsRes, changesRes, oppsRes] = await Promise.all([
        api.getCompetitors(activeProject.id),
        api.getChanges(),
        api.getOpportunities(),
      ]);
      setCompetitors(compsRes.competitors);
      setChanges(changesRes.changes);
      setOpportunities(oppsRes.opportunities);
    } catch (err: any) {
      addToast({ type: "error", title: "Error loading dashboard", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeProject?.id]);

  const handleScanCompetitor = async (comp: Competitor) => {
    setScanningId(comp.id);
    addToast({
      type: "info",
      title: `Starting Scan: ${comp.name}`,
      message: "Fetching pages, normalizing content, and comparing hashes...",
    });

    try {
      const res = await api.scanCompetitor(comp.id);
      addToast({
        type: "success",
        title: "Scan Completed",
        message: `Extracted ${res.scan.page_count} pages. Found ${res.changes.length} changes with AI insights.`,
      });
      await loadDashboardData();
    } catch (err: any) {
      addToast({ type: "error", title: "Scan Failed", message: err.message });
    } finally {
      setScanningId(null);
    }
  };

  const handleToggleCompetitor = async (id: string) => {
    try {
      await api.toggleCompetitor(id);
      await loadDashboardData();
      addToast({ type: "info", title: "Status Updated", message: "Competitor monitoring status updated." });
    } catch (err: any) {
      addToast({ type: "error", title: "Update Failed", message: err.message });
    }
  };

  const criticalCount = changes.filter((c) => c.importance === "critical" || c.importance === "high").length;

  if (!activeProject && projects.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Plus className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Create Your First Project</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Add your business domain and industry to start tracking your local or global competitors with AI.
        </p>
        <button
          onClick={() => onNavigate("/projects/new")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring active moves for <span className="font-semibold text-slate-800">{activeProject?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate(`/projects/${activeProject?.id}/competitors/new`)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Competitor</span>
          </button>
          <button
            onClick={loadDashboardData}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Competitors Monitored */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Competitors Monitored</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{competitors.length}</span>
            <span className="text-[11px] text-slate-400">
              of {subscription?.plan === "pro" ? "10" : subscription?.plan === "business" ? "50" : "1"} limit
            </span>
          </div>
        </div>

        {/* Changes Detected */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Changes Detected</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitCommit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{changes.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Across active scans</span>
          </div>
        </div>

        {/* High / Critical Shifts */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">High / Critical Shifts</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-red-600">{criticalCount}</span>
            <span className="text-[11px] text-slate-400">Requires response</span>
          </div>
        </div>

        {/* AI Action Items */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AI Opportunities</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{opportunities.length}</span>
            <span className="text-[11px] text-amber-600 font-medium">Ready to counter</span>
          </div>
        </div>
      </div>

      {/* 2. Competitors Quick Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Monitored Competitors ({competitors.length})</span>
          </h2>
          <button
            onClick={() => onNavigate(`/projects/${activeProject?.id}/competitors`)}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Manage All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {competitors.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No competitors added yet. Add a competitor website URL to start tracking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Competitor</th>
                  <th className="px-4 py-3">Website</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Last Scanned</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {competitors.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{comp.name}</span>
                        {comp.is_demo && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            Demo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <a
                        href={comp.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-xs"
                      >
                        <span className="truncate">{comp.website_url.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{comp.scan_frequency}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {comp.last_scanned_at
                        ? new Date(comp.last_scanned_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          comp.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {comp.is_active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={scanningId === comp.id}
                          onClick={() => handleScanCompetitor(comp)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <Play className={`w-3 h-3 ${scanningId === comp.id ? "animate-spin text-blue-600" : ""}`} />
                          <span>{scanningId === comp.id ? "Scanning..." : "Scan Now"}</span>
                        </button>
                        <button
                          onClick={() => onNavigate(`/competitors/${comp.id}`)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-800 rounded text-xs"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Recent Strategic Changes Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-blue-600" />
            <span>Recent Detected Competitor Moves</span>
          </h2>
          <button
            onClick={() => onNavigate("/changes")}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>View All ({changes.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {changes.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No changes detected yet. Trigger a scan above to compare baseline snapshots.
          </div>
        ) : (
          <div className="space-y-3">
            {changes.slice(0, 3).map((change) => (
              <ChangeCard key={change.id} change={change} onStatusChange={loadDashboardData} />
            ))}
          </div>
        )}
      </div>

      {/* 4. Strategic AI Opportunities Widget */}
      {opportunities.length > 0 && (
        <div className="p-5 bg-gradient-to-br from-blue-50/70 via-slate-50 to-white rounded-xl border border-blue-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Recommended Counter-Tactics</h2>
            </div>
            <button
              onClick={() => onNavigate("/opportunities")}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All Opportunities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {opportunities.slice(0, 2).map((opp) => (
              <div key={opp.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-600">{opp.competitor_name}</span>
                  <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                    {opp.priority}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{opp.competitor_action}</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded">
                  <strong className="text-slate-800">Your Action:</strong> {opp.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
