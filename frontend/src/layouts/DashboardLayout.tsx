import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ModernSidebar } from "../components/layout/ModernSidebar";
import { ModernHeader } from "../components/layout/ModernHeader";

export function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 dark:from-blue-600/10 dark:to-indigo-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 dark:from-purple-600/10 dark:to-pink-800/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-teal-600/15 dark:from-emerald-600/8 dark:to-teal-800/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-tr from-amber-400/10 to-orange-600/10 dark:from-amber-600/5 dark:to-orange-800/5 rounded-full blur-3xl" />
      </div>

      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-72">
        <ModernSidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 lg:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ModernSidebar onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Header - Fixed */}
      <header className="fixed top-0 right-0 left-0 lg:left-72 h-20 z-20">
        <ModernHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
      </header>

      {/* Main Content */}
      <main className="pt-20 lg:pl-72 px-4 pb-8 lg:px-8 min-h-screen relative">
        <div className="max-w-7xl mx-auto py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
