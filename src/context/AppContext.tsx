import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Profile, Subscription, Project, NotificationItem } from "../types/index.ts";
import { api } from "../services/api.ts";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

interface AppContextType {
  user: Profile | null;
  subscription: Subscription | null;
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  currency: "INR" | "USD";
  setCurrency: (c: "INR" | "USD") => void;
  isLoading: boolean;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  refreshUserData: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleAdminRole: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setSubscription(data.subscription);
      if (data.user?.id) {
        localStorage.setItem("cc_user_id", data.user.id);
      }
    } catch (err: any) {
      console.warn("Failed to fetch user:", err.message);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
      if (data.projects.length > 0) {
        setActiveProject((prev) => {
          if (prev && data.projects.some((p) => p.id === prev.id)) {
            return data.projects.find((p) => p.id === prev.id)!;
          }
          return data.projects[0];
        });
      }
    } catch (err: any) {
      console.warn("Failed to fetch projects:", err.message);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
    } catch (err: any) {
      console.warn("Failed to fetch notifications:", err.message);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      await Promise.all([refreshUserData(), refreshProjects(), refreshNotifications()]);
      if (mounted) {
        setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [refreshUserData, refreshProjects, refreshNotifications]);

  const login = async (email: string) => {
    const data = await api.login({ email, password: "password123" });
    setUser(data.user);
    setSubscription(data.subscription);
    localStorage.setItem("cc_user_id", data.user.id);
    await refreshProjects();
    addToast({
      type: "success",
      title: "Signed In",
      message: `Welcome back, ${data.user.full_name}!`,
    });
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setSubscription(null);
    localStorage.removeItem("cc_user_id");
    addToast({
      type: "info",
      title: "Signed Out",
      message: "You have been securely signed out.",
    });
  };

  const toggleAdminRole = async () => {
    try {
      const res = await api.switchRole();
      if (res.profile) {
        setUser(res.profile);
        addToast({
          type: "info",
          title: "Role Switched",
          message: `Your current view role is now: ${res.profile.role.toUpperCase()}`,
        });
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Action Failed", message: err.message });
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        subscription,
        projects,
        activeProject,
        setActiveProject,
        notifications,
        unreadNotificationCount,
        currency,
        setCurrency,
        isLoading,
        toasts,
        addToast,
        removeToast,
        refreshUserData,
        refreshProjects,
        refreshNotifications,
        login,
        logout,
        toggleAdminRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
