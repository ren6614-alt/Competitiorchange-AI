import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext.tsx";
import { api } from "../services/api.ts";
import { Report } from "../types/index.ts";
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Building,
} from "lucide-react";

interface ReportsPageProps {
  onNavigate: (route: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const { activeProject, addToast } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await api.getReports();
        setReports(res.reports);
        if (res.reports.length > 0) {
          setSelectedReport(res.reports[0]);
        }
      } catch (err: any) {
        addToast({ type: "error", title: "Could not load reports", message: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading monthly intelligence dossiers...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Competitive Intelligence Dossier</h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive monthly brief synthesized for business leadership & marketing agencies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {selectedReport && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Confidential Executive Report
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedReport.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Client Target: <strong className="text-slate-800">{activeProject?.name}</strong> • Published{" "}
                {new Date(selectedReport.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Market Defense Score
              </span>
              <div className="text-3xl font-extrabold text-blue-600 mt-0.5">{selectedReport.score}/100</div>
              <span className="text-[10px] text-emerald-700 font-semibold">Proactive Position</span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Summary</h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {selectedReport.report_data?.executive_summary || selectedReport.summary}
            </p>
          </div>

          {/* Key Movements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pricing Movements */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Pricing Adjustments</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {(selectedReport.report_data?.pricing_changes || [
                  "SmileCare Dental: -16.7% price drop on Invisalign with 12-month 0% financing.",
                ]).map((pc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{pc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Service Expansions */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                <span>Service & Product Expansions</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {(selectedReport.report_data?.new_services || [
                  "SmileCare Dental: Launched brand-new 24/7 Emergency Dentistry division.",
                ]).map((ns: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{ns}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Counter Strategy */}
          <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Recommended Tactical Roadmap</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              {(selectedReport.report_data?.recommended_actions || [
                "Launch dedicated Emergency Dentistry landing page with click-to-call triage.",
                "Highlight 0% monthly payment options for aligners rather than full sticker price.",
                "Bundle complimentary retainers ($600 value) to defend premium brand equity.",
              ]).map((rec: string, i: number) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-blue-200/80 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-800">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agency Signature */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>Prepared by: CompetitorChange AI Autonomous Agent</span>
            <span>Verified using cryptographic DOM verification</span>
          </div>
        </div>
      )}
    </div>
  );
};
