import React, { useEffect, useState } from "react";
import { getUsuarioLogado } from "../utils/auth";

export default function RelatorioAnual() {
  const [usuario, setUsuario] = useState(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [categoriaExpandida, setCategoriaExpandida] = useState(null);
  const [mesExpandido, setMesExpandido] = useState(null);

  useEffect(() => {
    const u = getUsuarioLogado();
    if (!u || !u.id) {
      setErro("Usuário não autenticado.");
    } else {
      setUsuario(u);
    }
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;

    const carregarRelatorio = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/relatorios/anual/${usuario.id}?ano=${ano}`
        );
        const data = await res.json();
        setDados(data);
        setErro("");
      } catch (err) {
        setErro("Erro ao carregar relatório anual.");
      }
    };

    carregarRelatorio();
  }, [ano, usuario]);

  const toggleCategoria = (categoria) => {
    setCategoriaExpandida((prev) => (prev === categoria ? null : categoria));
  };

  const toggleMes = (mes) => {
    setMesExpandido((prev) => (prev === mes ? null : mes));
    setCategoriaExpandida(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Filtro */}
      <div className="flex gap-4">
        <select
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#00B37E]"
        >
          {[2024, 2025, 2026].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {erro && <p className="text-red-500">{erro}</p>}

      {dados && (
        <>
          {/* Totalizadores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Receitas</p>
                <span className="text-xl">📈</span>
              </div>
              <p className="text-3xl font-bold text-green-600 mt-2">
                R$ {dados.resumo.receitas.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Despesas</p>
                <span className="text-xl">📉</span>
              </div>
              <p className="text-3xl font-bold text-red-600 mt-2">
                R$ {dados.resumo.despesas.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Saldo</p>
                <span className="text-xl">💰</span>
              </div>
              <p
                className={`text-3xl font-bold mt-2 ${
                  dados.resumo.saldo < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                R$ {dados.resumo.saldo.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Detalhamento */}
          <div className="card">
            <h2 className="section-title mb-2">📆 Resumo por mês</h2>
            <table className="w-full text-left table-auto text-sm">
              <thead>
                <tr className="text-gray-600 border-b">
                  <th className="p-2">Mês</th>
                  <th className="p-2">Receitas</th>
                  <th className="p-2">Despesas</th>
                  <th className="p-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {dados.meses.map((mes) => (
                  <React.Fragment key={mes.mes}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer border-b"
                      onClick={() => toggleMes(mes.mes)}
                    >
                      <td className="p-2 font-medium">
                        {String(mes.mes).padStart(2, "0")}
                      </td>
                      <td className="p-2 text-green-600">
                        R$ {mes.resumo.receitas.toFixed(2)}
                      </td>
                      <td className="p-2 text-red-600">
                        R$ {mes.resumo.despesas.toFixed(2)}
                      </td>
                      <td className={`p-2 font-semibold ${
                        mes.resumo.saldo < 0 ? "text-red-600" : "text-green-600"
                      }`}>
                        R$ {mes.resumo.saldo.toFixed(2)}
                      </td>
                    </tr>

                    {mesExpandido === mes.mes && (
                      <tr>
                        <td colSpan={4} className="bg-gray-50 p-4">
                          <h3 className="font-semibold text-sm mb-3">📂 Categorias</h3>
                          <div className="space-y-2">
                            {mes.por_categoria.map((cat) => (
                              <div key={cat.nome} className="mb-1">
                                <div
                                  onClick={() => toggleCategoria(cat.nome)}
                                  className="flex items-center justify-between bg-gray-100 hover:bg-gray-200 p-2 rounded cursor-pointer transition"
                                >
                                  <div className="flex items-center gap-2 font-medium text-sm">
                                    📌 <span>{cat.nome}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    R$ {Number(cat.valor).toFixed(2)} —{" "}
                                    {mes.qtd_por_categoria[cat.nome] || 0} transações
                                  </div>
                                </div>

                                {categoriaExpandida === cat.nome && (
                                  <div className="mt-2 ml-4 border-l-4 border-[#00B37E] pl-4 text-sm text-gray-700 bg-white rounded p-3 shadow">
                                    🔍 Transações individuais não disponíveis neste relatório.
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
