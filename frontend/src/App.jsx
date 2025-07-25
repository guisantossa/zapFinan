import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import './styles/tailwind-theme.css';
import Transacoes from "./pages/Transacoes";
import Relatorios from "./pages/Relatorios";
import Projecoes from "./pages/Projecoes";
import Consultas from "./pages/Consultas";
import Login from "./components/Login";
import { getUsuarioLogado } from "./utils/auth";
import { useState, useEffect } from "react";

export default function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const u = getUsuarioLogado();
    setUsuario(u);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {!usuario ? (
          <>
            <Route path="/login" element={<Login setUsuario={setUsuario} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard usuario={usuario} />} />
            <Route path="/transacoes" element={<Transacoes />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/projecoes" element={<Projecoes />} />
            <Route path="/consultas" element={<Consultas />} />
            <Route path="*" element={<Navigate to="/" />} />
            <Route path="/planos" element={<Landing />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
