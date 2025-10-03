import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ModernSidebar } from "../components/layout/ModernSidebar";
import { ModernHeader } from "../components/layout/ModernHeader";

export function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">

      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-72 z-20">
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
      <header className="fixed top-0 right-0 left-0 lg:left-72 h-20 z-10">
        <ModernHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 pb-8 lg:pl-72 lg:pr-8 min-h-screen">
        <div className="max-w-7xl mx-auto py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
