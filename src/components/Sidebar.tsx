import React from "react";
import { useApp } from "../context/AppContext.tsx";
import {
  LayoutDashboard,
  Users,
  GitCommit,
  Lightbulb,
  FileText,
  CreditCard,
  ShieldAlert,
  TestTube2,
  TrendingUp,
  PlusCircle,
  ExternalLink,
} from "lucide-react";
import { PLAN_CONFIGS } from "../constants/plans.ts";

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { user, subscription, activeProject } = useApp();

  const plan = subscription?.plan || "free";
  const planLimits = PLAN_CONFIGS[plan];

  const navItems = [
    { label: "Dashboard", route: "/dashboard", icon: LayoutDashboard },
    {
      label: "Competitors",
      route: activeProject ? `/projects/${activeProject.id}/competitors` : "/competitors",
      icon: Users,
    },
    { label: "Change Feed", route: "/changes", icon: GitCommit },
    { label: "AI Opportunities", route: "/opportunities", icon: Lightbulb },
    { label: "Monthly Reports", route: "/reports", icon: FileText },
    { label: "Billing & Plans", route: "/billing", icon: CreditCard },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Admin Operations", route: "/admin", icon: ShieldAlert });
  }

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col justify-between shrink-0 min-h-[calc(100vh-53px)]">
      <div className="p-4 space-y-6">
        {/* Active Project Card */}
        {activeProject && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Active Project
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {activeProject.industry}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">{activeProject.name}</h3>
            <a
              href={activeProject.business_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1 truncate"
            >
              <span className="truncate">{activeProject.business_url.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route || (item.route.includes("competitors") && currentRoute.includes("competitors"));

            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Plan Usage Card */}
      <div className="p-4 border-t border-slate-200 bg-white/70 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Plan Quota</span>
          <span className="text-[11px] uppercase font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
            {plan}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Scan Frequency</span>
            <span className="font-medium text-slate-700 capitalize">{planLimits.scanFrequency}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Competitor Limit</span>
            <span className="font-medium text-slate-700">{planLimits.competitors} sites</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "30%" }} />
          </div>
        </div>

        {plan === "free" && (
          <button
            onClick={() => onNavigate("/billing")}
            className="w-full py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Upgrade Plan
          </button>
        )}
      </div>
    </aside>
  );
};
