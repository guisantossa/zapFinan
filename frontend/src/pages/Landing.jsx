import Layout from "../components/Layout";

const planos = [
  {
    nome: "Basic",
    precoMensal: "11,90",
    precoAnual: "9,90",
    destaque: false,
    beneficios: [
      "Acesso básico",
      "1 canal de disparo",
      "Suporte padrão"
    ]
  },
  {
    nome: "Pro",
    precoMensal: "17,90",
    precoAnual: "14,90",
    destaque: true,
    beneficios: [
      "Automação completa",
      "Até 3 canais de disparo",
      "Suporte prioritário"
    ]
  }
];

export default function Landing() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 px-6 py-12">
        <h1 className="text-3xl font-bold text-center mb-10 text-gray-800">
          Escolha o plano ideal para você
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {planos.map((plano) => (
            <div
              key={plano.nome}
              className={`rounded-xl border shadow p-6 bg-white space-y-4 ${
                plano.destaque ? "border-emerald-500 ring-1 ring-emerald-300" : ""
              }`}
            >
              <h2 className="text-xl font-semibold text-gray-800">{plano.nome}</h2>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Mensal</p>
                <p className="text-2xl font-bold text-emerald-600">
                  R$ {plano.precoMensal}/mês
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Anual (p/ mês)</p>
                <p className="text-xl font-semibold text-emerald-500">
                  R$ {plano.precoAnual}/mês
                </p>
              </div>

              <ul className="text-sm text-gray-600 space-y-1 pt-2">
                {plano.beneficios.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    ✅ {item}
                  </li>
                ))}
              </ul>

              <button className="mt-4 w-full bg-emerald-600 text-white font-medium py-2 rounded hover:bg-emerald-700 transition">
                Assinar {plano.nome}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
