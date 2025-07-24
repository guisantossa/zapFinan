import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getUsuarioLogado } from "../utils/auth";
import ResumoCard from "../components/ResumoCard";
import SelectBase from "../components/SelectBase";
import DatePickerBase from "../components/DatePickerBase";

export default function Transacoes() {
  const usuario = getUsuarioLogado();
  const [transacoes, setTransacoes] = useState([]);
  const [erro, setErro] = useState("");

  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [diasFiltro, setDiasFiltro] = useState("ultimos_7");
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchTransacoes = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/usuarios/${usuario.id}/transacoes/?limite=1000`
        );
        if (!res.ok) throw new Error("Erro ao buscar transações");
        const data = await res.json();
        setTransacoes(data);
      } catch (err) {
        setErro("Erro ao carregar transações.");
      }
    };
    const fetchCategorias = async () => {
      try {
        const res = await fetch("http://localhost:8000/categorias/");
        const data = await res.json();
        setCategorias(data);
      } catch (err) {
        console.error("Erro ao carregar categorias");
      }
    };
    fetchTransacoes();
    fetchCategorias();
  }, []);

  const transacoesFiltradas = transacoes.filter((t) => {
    const tipoOk = tipoFiltro === "todos" || t.tipo === tipoFiltro;
    const categoriaOk = !categoriaFiltro || t.categoria === categoriaFiltro;
    const data = new Date(t.data);
    const hoje = new Date();
    let dataOk = true;

    switch (diasFiltro) {
      case "hoje":
        dataOk = data.toDateString() === hoje.toDateString();
        break;
      case "ontem":
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);
        dataOk = data.toDateString() === ontem.toDateString();
        break;
      case "esta_semana":
        const diaSemana = hoje.getDay();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - diaSemana);
        dataOk = data >= inicioSemana && data <= hoje;
        break;
      case "semana_passada":
        const fimSemanaPassada = new Date(hoje);
        fimSemanaPassada.setDate(hoje.getDate() - hoje.getDay() - 1);
        const inicioSemanaPassada = new Date(fimSemanaPassada);
        inicioSemanaPassada.setDate(fimSemanaPassada.getDate() - 6);
        dataOk = data >= inicioSemanaPassada && data <= fimSemanaPassada;
        break;
      case "este_mes":
        dataOk = data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
        break;
      case "mes_passado":
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        dataOk = data.getMonth() === mesPassado.getMonth() && data.getFullYear() === mesPassado.getFullYear();
        break;
      case "ultimos_7":
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 7);
        dataOk = data >= seteDiasAtras && data <= hoje;
        break;
      case "personalizado":
        if (dataInicio && dataFim) {
          dataOk = data >= dataInicio && data <= dataFim;
        } else {
          dataOk = true;
        }
        break;
      case "todos":
      default:
        dataOk = true;
        break;
    }

    return tipoOk && categoriaOk && dataOk;
  });

  const total = transacoesFiltradas.length;
  const totalReceitas = transacoesFiltradas
    .filter((t) => t.tipo === "receita")
    .reduce((soma, t) => soma + Number(t.valor), 0);
  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === "despesa")
    .reduce((soma, t) => soma + Number(t.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <Layout ativo="Transações">
      <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ResumoCard
            titulo="Total de Transações"
            valor={total}
            icone="🧾"
            cor="green"
          />
          <ResumoCard
            titulo="Receitas"
            valor={totalReceitas}
            icone="📈"
            cor="green"
          />
          <ResumoCard
            titulo="Despesas"
            valor={totalDespesas}
            icone="📉"
            cor="red"
          />
          <ResumoCard
            titulo="Saldo"
            valor={saldo}
            icone="💰"
            cor={saldo < 0 ? "red" : "emerald"}
          />
        </div>

        {/* Filtros */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">🔍 Filtros Avançados</p>
            <button
              onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
              className="border rounded px-3 py-1 text-sm hover:bg-gray-100"
            >
              {filtrosVisiveis ? "Ocultar Filtros" : "Mostrar Filtros"}
            </button>
          </div>

          {filtrosVisiveis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectBase
                label="Tipo"
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                options={[
                  { label: "Todos", value: "todos" },
                  { label: "Receita", value: "receita" },
                  { label: "Despesa", value: "despesa" },
                ]}
              />

              <SelectBase
                label="Categoria"
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                options={[
                  { label: "Todas", value: "" },
                  ...categorias.map((c) => ({ label: c, value: c })),
                ]}
              />

              <SelectBase
                label="Período"
                value={diasFiltro}
                onChange={(e) => setDiasFiltro(e.target.value)}
                options={[
                  { value: "todos", label: "Todos os períodos" },
                  { value: "hoje", label: "Hoje" },
                  { value: "ontem", label: "Ontem" },
                  { value: "esta_semana", label: "Esta semana" },
                  { value: "semana_passada", label: "Semana passada" },
                  { value: "este_mes", label: "Este mês" },
                  { value: "mes_passado", label: "Mês passado" },
                  { value: "ultimos_7", label: "Últimos 7 dias" },
                  { value: "personalizado", label: "Personalizado" },
                ]}
              />
            </div>
          )}

          {filtrosVisiveis && diasFiltro === "personalizado" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerBase
                label="Data Início"
                selected={dataInicio}
                onChange={(date) => setDataInicio(date)}
              />
              <DatePickerBase
                label="Data Fim"
                selected={dataFim}
                onChange={(date) => setDataFim(date)}
              />
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="card">
          <h2 className="section-title">📋 Transações ({transacoesFiltradas.length})</h2>

          {erro && <p className="text-red-500">{erro}</p>}

          {transacoesFiltradas.length === 0 ? (
            <p className="text-gray-500">Nenhuma transação encontrada com os filtros aplicados.</p>
          ) : (
            <ul className="space-y-3">
              {transacoesFiltradas.map((t, idx) => (
                <li
                  key={idx}
                  className="border rounded p-4 flex justify-between items-start bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      💬 Texto WhatsApp
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-semibold text-white ${
                          t.tipo === "despesa" ? "bg-red-500" : "bg-green-600"
                        }`}
                      >
                        {t.tipo}
                      </span>
                      <span className="text-green-600 text-xs">✔ Pago</span>
                    </div>
                    <p className="text-base font-medium capitalize">{t.categoria || "sem categoria"}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span>📅 {t.data}</span>
                      <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                        {t.categoria || "sem categoria"}
                      </span>
                      <span className="italic">“{t.mensagem_original || 'mensagem original'}”</span>
                    </div>
                  </div>
                  <div className={`text-right font-semibold text-lg ${t.tipo === "despesa" ? "text-red-600" : "text-green-600"}`}>
                    {t.tipo === "despesa" ? "-" : "+"} R$ {Number(t.valor).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
