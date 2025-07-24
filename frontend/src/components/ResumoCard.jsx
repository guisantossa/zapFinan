export default function ResumoCard({ titulo, valor, icone, cor = "green" }) {
  const corBorda = {
    green: "border-green-500",
    red: "border-red-500",
    emerald: "border-emerald-500",
  }[cor];

  const corTexto = {
    green: "text-green-600",
    red: "text-red-600",
    emerald: "text-emerald-600",
  }[cor];

  return (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${corBorda}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{titulo}</p>
        <span className="text-xl">{icone}</span>
      </div>
      <p className={`text-3xl font-bold mt-2 ${corTexto}`}>
        R$ {Number(valor).toFixed(2)}
      </p>
    </div>
  );
}
