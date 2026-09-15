import React, { useState } from "react";
import { useApp } from "../context/AppContext.tsx";
import {
  Bell,
  Check,
  ChevronDown,
  Layers,
  Shield,
  Plus,
  Sparkles,
  ExternalLink,
  LogOut,
  User as UserIcon,
  Search,
} from "lucide-react";
import { api } from "../services/api.ts";

interface NavbarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const {
    user,
    subscription,
    projects,
    activeProject,
    setActiveProject,
    notifications,
    unreadNotificationCount,
    currency,
    setCurrency,
    refreshNotifications,
    toggleAdminRole,
    logout,
    addToast,
  } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await refreshNotifications();
      addToast({ type: "success", title: "Notifications cleared", message: "All notifications marked as read." });
    } catch (err: any) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
  };

  const planName = subscription?.plan ? subscription.plan.toUpperCase() : "FREE";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 lg:px-8 py-2.5 flex items-center justify-between">
      {/* Left: Brand & Project Switcher */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate("/")}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-blue-600 transition-colors">
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                CompetitorChange
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-tight mt-0.5">
              Know what changed. Know what to do next.
            </p>
          </div>
        </button>

        {/* Project Selector (when logged in and on dashboard routes) */}
        {user && (
          <div className="relative ml-2 sm:ml-4 hidden md:block">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[140px] truncate font-semibold">
                {activeProject ? activeProject.name : "Select Project"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProjectMenu && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Your Projects ({projects.length})
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj);
                        setShowProjectMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${
                        activeProject?.id === proj.id ? "font-semibold text-blue-600 bg-blue-50/40" : "text-slate-700"
                      }`}
                    >
                      <span className="truncate">{proj.name}</span>
                      {activeProject?.id === proj.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
                <div className="p-1.5 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      onNavigate("/projects/new");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setCurrency("INR")}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              currency === "INR" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
            title="Switch to Indian Rupee (Cashfree India)"
          >
            ₹ INR
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              currency === "USD" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
            title="Switch to US Dollar"
          >
            $ USD
          </button>
        </div>

        {user ? (
          <>
            {/* Plan Badge / Upgrade */}
            <button
              onClick={() => onNavigate("/billing")}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                subscription?.plan === "free"
                  ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              } transition-colors`}
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>{planName} PLAN</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Notifications ({unreadNotificationCount} unread)
                    </span>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-left text-xs ${!n.is_read ? "bg-blue-50/30" : ""}`}
                        >
                          <div className="font-semibold text-slate-900 leading-snug">{n.title}</div>
                          <div className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role & User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs font-medium text-slate-700 hidden md:block max-w-[100px] truncate">
                  {user.full_name || "Account"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {user.role}
                      </span>
                      <button
                        onClick={() => {
                          toggleAdminRole();
                          setShowUserMenu(false);
                        }}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <Shield className="w-2.5 h-2.5" /> Toggle Admin View
                      </button>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate("/dashboard");
                      }}
                      className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate("/billing");
                      }}
                      className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      Billing & Plans
                    </button>
                    {user.role === "admin" && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate("/admin");
                        }}
                        className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        Admin Telemetry
                      </button>
                    )}
                  </div>

                  <div className="p-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        onNavigate("/");
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("/login")}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate("/signup")}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Start Monitoring Free
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
