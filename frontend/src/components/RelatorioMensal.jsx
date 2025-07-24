import { useEffect, useState } from "react";
import { getUsuarioLogado } from "../utils/auth";

export default function RelatorioMensal() {
  const usuario = getUsuarioLogado();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [categoriaExpandida, setCategoriaExpandida] = useState(null);
  const [transacoes, setTransacoes] = useState([]);

  useEffect(() => {
    const carregarRelatorio = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/relatorios/mensal/${usuario.id}?mes=${mes}&ano=${ano}`
        );
        const data = await res.json();
        const transRes = await fetch(
          `http://localhost:8000/usuarios/${usuario.id}/transacoes/?limite=1000`
        );
        const transData = await transRes.json();
        setTransacoes(transData);
        setDados(data);
        setErro("");
      } catch (err) {
        setErro("Erro ao carregar relatório.");
      }
    };

    carregarRelatorio();
  }, [mes, ano]);

  const toggleCategoria = (categoria) => {
    setCategoriaExpandida((prev) => (prev === categoria ? null : categoria));
  };

  const categoriasComQtd = dados?.por_categoria.map((cat) => ({
    ...cat,
    qtd: dados.qtd_por_categoria[cat.nome] || 0,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Filtros */}
      <div className="flex gap-4">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#00B37E]"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#00B37E]"
        >
          {[2024, 2025, 2026].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
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

          {/* Categorias Detalhadas */}
          <div className="card">
            <h2 className="section-title mb-2">📌 Categorias mais gastas</h2>
            <div className="divide-y divide-gray-200">
              {categoriasComQtd.map((cat) => (
                <div key={cat.nome} className="py-3">
                  <div
                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition"
                    onClick={() => toggleCategoria(cat.nome)}
                  >
                    <div className="text-sm font-medium capitalize flex gap-2 items-center">
                      📂 {cat.nome}
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p>R$ {Number(cat.valor).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{cat.qtd} transações</p>
                    </div>
                  </div>

                  {categoriaExpandida === cat.nome && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                      {transacoes
                        .filter(
                          (t) =>
                            t.categoria === cat.nome &&
                            new Date(t.data).getMonth() + 1 === mes &&
                            new Date(t.data).getFullYear() === ano
                        )
                        .map((t, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start bg-white rounded shadow-sm p-3"
                          >
                            <span className="text-sm text-gray-600 italic">
                              “{t.mensagem_original}”
                            </span>
                            <span className="text-sm font-semibold text-red-600">
                              R$ {Number(t.valor).toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
