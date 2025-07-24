import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ResumoCard from "../components/ResumoCard";
import { getUsuarioLogado } from "../utils/auth";
import { API_URL } from '../constants';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#6366F1", "#EC4899", "#3B82F6", "#F87171"];

export default function Dashboard() {
  const usuario = getUsuarioLogado();
  const [resumo, setResumo] = useState(null);
  const [mensal, setMensal] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [ultimas, setUltimas] = useState([]);

  useEffect(() => {
    const fetchDados = async () => {
      const uid = usuario.id;

      const endpoints = [
        fetch(`${API_URL}/dashboard/resumo/${uid}`),
        fetch(`${API_URL}/dashboard/ultimos-meses/${uid}`),
        fetch(`${API_URL}/dashboard/por-categoria/${uid}`),
        fetch(`${API_URL}/dashboard/ranking/${uid}`),
        fetch(`${API_URL}/dashboard/ultimas-transacoes/${uid}`)
      ];

      const [r1, r2, r3, r4, r5] = await Promise.all(endpoints.map(r => r.then(res => res.json())));

      setResumo(r1);
      setMensal(r2);
      setCategorias(r3);
      setRanking(r4);
      setUltimas(r5);
    };

    fetchDados();
  }, []);

  return (
    <Layout ativo="Dashboard">
      <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">

        {/* Resumo */}
        {resumo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ResumoCard
              titulo="Receitas"
              valor={resumo.receitas}
              icone="📈"
              cor="green"
            />
            <ResumoCard
              titulo="Despesas"
              valor={resumo.despesas}
              icone="📉"
              cor="red"
            />
            <ResumoCard
              titulo="Saldo"
              valor={resumo.saldo}
              icone="💰"
              cor={resumo.saldo < 0 ? "red" : "emerald"}
            />
            <ResumoCard
              titulo="Transações no mês"
              valor={resumo.total_transacoes}
              icone="🧾"
              cor="green"
            />
          </div>
        )}

        {/* Gráfico de Barras */}
        <div className="card">
          <h2 className="section-title mb-2">📊 Receitas x Despesas (últimos 6 meses)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mensal}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="receita" fill="#10B981" name="Receitas" />
              <Bar dataKey="despesa" fill="#EF4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza */}
        <div className="card">
          <h2 className="section-title mb-2">🍰 Distribuição por Categoria</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categorias}
                dataKey="valor"
                nameKey="nome"
                outerRadius={100}
                label
              >
                {categorias.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking */}
        <div className="card">
          <h2 className="section-title mb-2">🏆 Top Categorias de Despesa</h2>
          <ul className="space-y-2 text-sm">
            {ranking.map((r, i) => (
              <li key={i} className="flex justify-between border-b pb-1">
                <span className="capitalize">{r.nome}</span>
                <span className="text-red-600 font-semibold">R$ {r.valor.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Últimas Transações */}
        <div className="card">
          <h2 className="section-title mb-2">🕒 Últimas Transações</h2>
          <ul className="space-y-3">
            {ultimas.map((t, idx) => (
              <li key={idx} className="border rounded p-3 flex justify-between items-start bg-gray-50 shadow-sm">
                <div>
                  <p className="font-medium capitalize">{t.nome || "sem categoria"}</p>
                  <p className="text-sm text-gray-500">{t.data}</p>
                  <p className="italic text-sm text-gray-600">"{t.mensagem_original}"</p>
                </div>
                <div className={`text-right font-semibold text-lg ${t.tipo === "despesa" ? "text-red-600" : "text-green-600"}`}>
                  {t.tipo === "despesa" ? "-" : "+"} R$ {Number(t.valor).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </Layout>
  );
}
