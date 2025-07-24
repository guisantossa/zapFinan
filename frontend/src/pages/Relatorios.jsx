import { useState } from "react";
import Layout from "../components/Layout";
import RelatorioMensal from "../components/RelatorioMensal";
import RelatorioAnual from "../components/RelatorioAnual";

export default function Relatorios() {
  const [abaAtiva, setAbaAtiva] = useState("mensal");
  const usuario = JSON.parse(localStorage.getItem("zapgastos_usuario"));

  return (
    <Layout ativo="Relatórios">
      <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
        {/* Abas */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            className={`px-4 py-2 rounded-t-md text-sm transition-all ${
              abaAtiva === "mensal"
                ? "bg-white shadow-sm text-[#00B37E] font-semibold border border-b-transparent"
                : "bg-gray-100 text-gray-600 hover:text-[#00B37E]"
            }`}
            onClick={() => setAbaAtiva("mensal")}
          >
            📅 Relatório Mensal
          </button>
          <button
            className={`px-4 py-2 rounded-t-md text-sm transition-all ${
              abaAtiva === "anual"
                ? "bg-white shadow-sm text-[#00B37E] font-semibold border border-b-transparent"
                : "bg-gray-100 text-gray-600 hover:text-[#00B37E]"
            }`}
            onClick={() => setAbaAtiva("anual")}
          >
            📆 Relatório Anual
          </button>
        </div>

        {/* Conteúdo */}
        <div className="card">
          {abaAtiva === "mensal" && (
            <RelatorioMensal key="mensal" usuario={usuario} />
          )}
          {abaAtiva === "anual" && (
            <RelatorioAnual key="anual" usuario={usuario} />
          )}
        </div>
      </div>
    </Layout>
  );
}
