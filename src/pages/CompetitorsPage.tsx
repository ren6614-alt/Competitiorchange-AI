import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { Competitor } from "../types/index.ts";
import {
  Users,
  Plus,
  Play,
  RotateCw,
  ExternalLink,
  Trash2,
  Pause,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface CompetitorsPageProps {
  onNavigate: (route: string) => void;
}

export const CompetitorsPage: React.FC<CompetitorsPageProps> = ({ onNavigate }) => {
  const { activeProject, subscription, addToast } = useApp();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningId, setScanningId] = useState<string | null>(null);

  // Add Competitor Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [scanFrequency, setScanFrequency] = useState<"daily" | "weekly">("daily");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCompetitors = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const res = await api.getCompetitors(activeProject.id);
      setCompetitors(res.competitors);
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to load competitors", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitors();
  }, [activeProject?.id]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setFormError(null);
    setSubmitting(true);

    try {
      await api.addCompetitor(activeProject.id, {
        name,
        website_url: websiteUrl,
        description,
        scan_frequency: scanFrequency,
      });

      addToast({
        type: "success",
        title: "Competitor Added",
        message: `${name} is now scheduled for automated competitive monitoring.`,
      });

      setName("");
      setWebsiteUrl("");
      setDescription("");
      setShowAddModal(false);
      await loadCompetitors();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScan = async (comp: Competitor) => {
    setScanningId(comp.id);
    addToast({
      type: "info",
      title: `Scanning ${comp.name}`,
      message: "Crawling pages, calculating cryptographic hashes, and running Gemini AI analysis...",
    });

    try {
      const res = await api.scanCompetitor(comp.id);
      addToast({
        type: "success",
        title: "Scan Succeeded",
        message: `Extracted ${res.scan.page_count} pages and detected ${res.changes.length} changes.`,
      });
      await loadCompetitors();
    } catch (err: any) {
      addToast({ type: "error", title: "Scan Failed", message: err.message });
    } finally {
      setScanningId(null);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.toggleCompetitor(id);
      await loadCompetitors();
      addToast({ type: "info", title: "Status Changed", message: "Monitoring status toggled." });
    } catch (err: any) {
      addToast({ type: "error", title: "Update Failed", message: err.message });
    }
  };

  const handleDelete = async (comp: Competitor) => {
    if (!confirm(`Are you sure you want to stop monitoring ${comp.name}? Historical scans will be archived.`)) {
      return;
    }
    try {
      await api.deleteCompetitor(comp.id);
      addToast({ type: "info", title: "Removed", message: `${comp.name} was removed.` });
      await loadCompetitors();
    } catch (err: any) {
      addToast({ type: "error", title: "Delete Failed", message: err.message });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Competitor Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking {competitors.length} active competitors for{" "}
            <span className="font-semibold text-slate-700">{activeProject?.name}</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Competitor</span>
        </button>
      </div>

      {/* Competitors Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map((comp) => (
          <div
            key={comp.id}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{comp.name}</span>
                    {comp.is_demo && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        Demo
                      </span>
                    )}
                  </h3>
                  <a
                    href={comp.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-[200px]"
                  >
                    <span>{comp.website_url.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    comp.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {comp.is_active ? "Active" : "Paused"}
                </span>
              </div>

              {comp.description && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{comp.description}</p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Scan Frequency:</span>
                  <span className="font-semibold text-slate-700 capitalize">{comp.scan_frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Checked:</span>
                  <span className="font-medium text-slate-700">
                    {comp.last_scanned_at
                      ? new Date(comp.last_scanned_at).toLocaleDateString([], { month: "short", day: "numeric" })
                      : "Not yet"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                disabled={scanningId === comp.id}
                onClick={() => handleScan(comp)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Play className={`w-3.5 h-3.5 ${scanningId === comp.id ? "animate-spin text-blue-600" : ""}`} />
                <span>{scanningId === comp.id ? "Scanning..." : "Scan Now"}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onNavigate(`/competitors/${comp.id}`)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => handleToggleActive(comp.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                  title={comp.is_active ? "Pause Crawls" : "Resume Crawls"}
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(comp)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                  title="Remove Competitor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Competitor to Monitor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCompetitor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Competitor Business Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Dental Group"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL *</label>
                <input
                  type="text"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://competitor.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  We'll monitor key pages (home, pricing, services, promotions).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Competitive Notes / Focus</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Watch for local price discounting and aligner promos."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scan Frequency</label>
                <select
                  value={scanFrequency}
                  onChange={(e) => setScanFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
                >
                  <option value="daily">Daily Automated Crawl (Recommended)</option>
                  <option value="weekly">Weekly Automated Crawl</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {submitting ? "Registering..." : "Start Monitoring"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
