import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { Competitor, Project, Scan, DetectedChange } from "../types/index.ts";
import { ChangeCard } from "../components/ChangeCard.tsx";
import {
  ArrowLeft,
  Play,
  ExternalLink,
  GitCommit,
  Sparkles,
  FileCode,
  History,
  CheckCircle,
  Calendar,
  Layers,
  Clock,
} from "lucide-react";

interface CompetitorDetailPageProps {
  competitorId: string;
  onNavigate: (route: string) => void;
}

export const CompetitorDetailPage: React.FC<CompetitorDetailPageProps> = ({ competitorId, onNavigate }) => {
  const { addToast } = useApp();
  const [data, setData] = useState<{
    competitor: Competitor;
    project: Project;
    scans: Scan[];
    changes: any[];
    pages: any[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"changes" | "insights" | "pages" | "history">("changes");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getCompetitorDetail(competitorId);
      setData(res);
    } catch (err: any) {
      addToast({ type: "error", title: "Could not load competitor", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [competitorId]);

  const handleScanNow = async () => {
    setScanning(true);
    addToast({
      type: "info",
      title: "Running Crawl...",
      message: "Fetching competitor DOM, extracting content and diffing hashes.",
    });

    try {
      const res = await api.scanCompetitor(competitorId);
      addToast({
        type: "success",
        title: "Crawl Completed",
        message: `Extracted ${res.scan.page_count} pages and analyzed ${res.changes.length} changes.`,
      });
      await loadDetail();
    } catch (err: any) {
      addToast({ type: "error", title: "Scan Failed", message: err.message });
    } finally {
      setScanning(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading competitor intelligence profile...
      </div>
    );
  }

  const { competitor, project, scans, changes, pages } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Back button */}
      <button
        onClick={() => onNavigate("/competitors")}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Competitors</span>
      </button>

      {/* Competitor Header */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{competitor.name}</h1>
            {competitor.is_demo && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Demo Profile
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                competitor.is_active
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {competitor.is_active ? "Active" : "Paused"}
            </span>
          </div>

          <a
            href={competitor.website_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            <span>{competitor.website_url}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {competitor.description && (
            <p className="text-xs text-slate-600 mt-2 max-w-2xl">{competitor.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={scanning}
            onClick={handleScanNow}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${scanning ? "animate-spin text-blue-200" : ""}`} />
            <span>{scanning ? "Crawling & Analyzing..." : "Run Manual Scan"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("changes")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "changes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Detected Changes ({changes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("insights")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "insights"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Strategic AI Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("pages")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "pages"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Monitored Pages ({pages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Crawl Logs ({scans.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "changes" && (
        <div className="space-y-4">
          {changes.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              No changes detected for this competitor yet.
            </div>
          ) : (
            changes.map((change) => (
              <ChangeCard
                key={change.id}
                change={{ ...change, competitor_name: competitor.name }}
                onStatusChange={loadDetail}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Competitor Movement Assessment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Synthesized by Gemini 3.8 Flash from verified DOM delta extractions.
            </p>
          </div>

          <div className="space-y-4">
            {changes
              .filter((c) => c.ai_insight)
              .map((c) => {
                const ins = c.ai_insight;
                return (
                  <div key={ins.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{c.change_type.replace("_", " ").toUpperCase()}</span>
                      <span className="text-[10px] font-bold text-blue-600 uppercase">
                        Confidence: {Math.round(ins.confidence * 100)}%
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{ins.summary}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Impact Analysis</span>
                        <p className="text-slate-600 leading-relaxed">{ins.business_impact}</p>
                      </div>
                      <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                        <span className="font-bold text-blue-900 block mb-1">Recommended Response</span>
                        <p className="text-blue-800 leading-relaxed">{ins.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === "pages" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700">
            Tracked DOM Snapshots ({pages.length})
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {pages.map((p) => (
              <div key={p.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.title || "Untitled Page"}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    SHA: {p.content_hash.slice(0, 16)}...
                  </span>
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>{p.url}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Scan ID</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scans.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-slate-600">{s.id}</td>
                  <td className="px-4 py-3 text-slate-700">{new Date(s.started_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {s.completed_at ? new Date(s.completed_at).toLocaleString() : "Running..."}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{s.page_count} pages</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        s.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
