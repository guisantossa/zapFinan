import { createBrowserRouter, Navigate } from "react-router-dom";
import { NewLandingPage } from './pages/NewLandingPage';
// ...existing code...
// Layout Components
import { RootLayout } from "./layouts/RootLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Auth Pages
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

// Dashboard Pages
import { DashboardPage } from "./pages/DashboardPage";
import { TransacoesPage } from "./pages/TransacoesPage";
import { OrcamentosPage } from "./pages/OrcamentosPage";
import { CompromissosPage } from "./pages/CompromissosPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { PerfilPage } from "./pages/PerfilPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";
import PlanosPage from "./pages/PlanosPage";

// Admin Pages
import PlansAdminPage from "./pages/admin/PlansAdminPage";

// Protected Route Wrapper
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Landing page (public)
      {
        index: true,
        element: <NewLandingPage />,
      },

      // Auth routes (public)
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: <LoginPage />,
          },
          {
            path: "register",
            element: <RegisterPage />,
          },
          {
            path: "",
            element: <Navigate to="/auth/login" replace />,
          },
        ],
      },

      // Dashboard routes (protected)
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "transacoes",
            element: <TransacoesPage />,
          },
          {
            path: "orcamentos",
            element: <OrcamentosPage />,
          },
          {
            path: "compromissos",
            element: <CompromissosPage />,
          },
          {
            path: "relatorios",
            element: <RelatoriosPage />,
          },
          {
            path: "perfil",
            element: <PerfilPage />,
          },
          {
            path: "configuracoes",
            element: <ConfiguracoesPage />,
          },
          {
            path: "planos",
            element: <PlanosPage />,
          },
          {
            path: "admin/planos",
            element: <PlansAdminPage />,
          },
        ],
      },

      // Catch all - redirect to landing
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);