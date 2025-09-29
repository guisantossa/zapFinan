import { Outlet } from "react-router-dom";
import { ModernSidebar } from "../components/layout/ModernSidebar";
import { ModernHeader } from "../components/layout/ModernHeader";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 dark:from-blue-600/10 dark:to-indigo-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 dark:from-purple-600/10 dark:to-pink-800/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-teal-600/15 dark:from-emerald-600/8 dark:to-teal-800/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-tr from-amber-400/10 to-orange-600/10 dark:from-amber-600/5 dark:to-orange-800/5 rounded-full blur-3xl" />
      </div>

      <ModernSidebar />
      <ModernHeader />

      {/* Main Content */}
      <main className="ml-72 pt-20 p-8 min-h-screen relative z-10">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
