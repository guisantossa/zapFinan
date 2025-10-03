import { Outlet } from "react-router-dom";
import { Toaster } from "../components/ui/sonner";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ErrorBoundary } from "../components/ErrorBoundary";

export function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen transition-colors duration-500 bg-[#FAFBFC] dark:bg-slate-900">
            <Outlet />

          {/* Background decoration */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-10]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/20 to-transparent dark:from-blue-900/10 rounded-full transform translate-x-48 -translate-y-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100/20 to-transparent dark:from-green-900/10 rounded-full transform -translate-x-48 translate-y-48" />
          </div>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--backdrop-blur)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
              }
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}