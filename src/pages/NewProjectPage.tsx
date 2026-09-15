import React, { useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { ArrowLeft, Building2, Globe, Sparkles } from "lucide-react";

interface NewProjectPageProps {
  onNavigate: (route: string) => void;
}

export const NewProjectPage: React.FC<NewProjectPageProps> = ({ onNavigate }) => {
  const { addToast, refreshProjects, setActiveProject } = useApp();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [industry, setIndustry] = useState("Healthcare & Dental");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createProject({
        name: name || `${businessName} Monitoring`,
        business_name: businessName,
        business_url: businessUrl,
        industry,
        description,
      });

      addToast({
        type: "success",
        title: "Project Created",
        message: `Project "${res.project.name}" initialized. You can now add competitor URLs.`,
      });

      await refreshProjects();
      setActiveProject(res.project);
      onNavigate(`/projects/${res.project.id}/competitors/new`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <button
        onClick={() => onNavigate("/dashboard")}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create New Monitoring Project</h1>
          <p className="text-xs text-slate-500 mt-1">
            Define your company website and sector so our AI can accurately benchmark your competitors.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Your Business Name *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Metro Dental Clinic"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Your Website URL *</label>
            <input
              type="text"
              required
              value={businessUrl}
              onChange={(e) => setBusinessUrl(e.target.value)}
              placeholder="https://metrodentalclinic.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Metro Dental Competitive Defense"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Industry / Sector</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
            >
              <option value="Healthcare & Dental">Healthcare & Dental</option>
              <option value="Legal & Professional Services">Legal & Professional Services</option>
              <option value="Home Services & Contractors">Home Services & Contractors</option>
              <option value="SaaS & Software">SaaS & Software</option>
              <option value="E-Commerce & Retail">E-Commerce & Retail</option>
              <option value="Marketing & Consulting">Marketing & Consulting</option>
              <option value="Local Small Business">Local Small Business</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Strategy / Tracking Objectives</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monitor competitor aligner pricing drops, emergency triage offerings, and weekend hours."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onNavigate("/dashboard")}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              {loading ? "Creating..." : "Save Project & Add Competitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
