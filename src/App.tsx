import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext.tsx";
import { Navbar } from "./components/Navbar.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { ToastContainer } from "./components/ToastContainer.tsx";
import { LandingPage } from "./pages/LandingPage.tsx";
import { AuthPage } from "./pages/AuthPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { CompetitorsPage } from "./pages/CompetitorsPage.tsx";
import { CompetitorDetailPage } from "./pages/CompetitorDetailPage.tsx";
import { ChangesPage } from "./pages/ChangesPage.tsx";
import { OpportunitiesPage } from "./pages/OpportunitiesPage.tsx";
import { ReportsPage } from "./pages/ReportsPage.tsx";
import { BillingPage } from "./pages/BillingPage.tsx";
import { NewProjectPage } from "./pages/NewProjectPage.tsx";
import { AdminPage } from "./pages/AdminPage.tsx";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage.tsx";

function AppRouter() {
  const { user, isLoading } = useApp();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (route: string) => {
    window.history.pushState({}, "", route);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center animate-pulse">
            C
          </div>
          <span>Loading CompetitorChange AI...</span>
        </div>
      </div>
    );
  }

  // Determine if route is full-width (Landing, Auth, Payment) or Dashboard Layout with Sidebar
  const isPublicRoute =
    currentRoute === "/" ||
    currentRoute === "/login" ||
    currentRoute === "/signup" ||
    currentRoute.startsWith("/payment");

  const renderContent = () => {
    // 1. Landing
    if (currentRoute === "/") {
      return <LandingPage onNavigate={navigate} />;
    }

    // 2. Auth
    if (currentRoute === "/login") {
      return <AuthPage mode="login" onNavigate={navigate} />;
    }
    if (currentRoute === "/signup") {
      return <AuthPage mode="signup" onNavigate={navigate} />;
    }

    // 3. Payment Success
    if (currentRoute.startsWith("/payment/success")) {
      return <PaymentSuccessPage onNavigate={navigate} />;
    }

    // 4. Competitor Detail
    if (currentRoute.startsWith("/competitors/") && !currentRoute.includes("/new")) {
      const parts = currentRoute.split("/");
      const compId = parts[2];
      return <CompetitorDetailPage competitorId={compId} onNavigate={navigate} />;
    }

    // 5. New Project
    if (currentRoute === "/projects/new") {
      return <NewProjectPage onNavigate={navigate} />;
    }

    // 6. Competitors List
    if (currentRoute.includes("/competitors")) {
      return <CompetitorsPage onNavigate={navigate} />;
    }

    // 7. Changes Feed
    if (currentRoute === "/changes") {
      return <ChangesPage onNavigate={navigate} />;
    }

    // 8. Opportunities
    if (currentRoute === "/opportunities") {
      return <OpportunitiesPage onNavigate={navigate} />;
    }

    // 9. Reports
    if (currentRoute === "/reports") {
      return <ReportsPage onNavigate={navigate} />;
    }

    // 10. Billing
    if (currentRoute === "/billing") {
      return <BillingPage onNavigate={navigate} />;
    }

    // 11. Admin
    if (currentRoute === "/admin") {
      return <AdminPage onNavigate={navigate} />;
    }

    // Default: Dashboard
    return <DashboardPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased">
      <Navbar onNavigate={navigate} currentRoute={currentRoute} />

      {isPublicRoute ? (
        <main className="flex-1">{renderContent()}</main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar currentRoute={currentRoute} onNavigate={navigate} />
          <main className="flex-1 overflow-y-auto bg-slate-50/40 min-h-[calc(100vh-53px)]">
            {renderContent()}
          </main>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
