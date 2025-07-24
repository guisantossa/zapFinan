import { Link, useNavigate } from "react-router-dom";
import { getUsuarioLogado } from "../utils/auth";
import { FiLogOut, FiBell, FiMessageCircle } from "react-icons/fi";

export default function Navbar({ ativo = "Dashboard" }) {
  const usuario = getUsuarioLogado();
  const navigate = useNavigate();

  const menus = [
    { label: "Dashboard", path: "/" },
    { label: "Transações", path: "/transacoes" },
    { label: "Relatórios", path: "/relatorios" },
  ];

  const logout = () => {
    localStorage.removeItem("zapgastos_usuario");
    navigate(0);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow border-b border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src="/favicon.ico" alt="Logo ZapGastos" className="w-6 h-6" />
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">ZapGastos</h1>
      </div>

      {/* Menu */}
      <ul className="flex gap-6 items-center">
        {menus.map((item) => (
          <li key={item.label}>
            <Link
              to={item.path}
              className={`text-sm font-medium transition ${
                ativo === item.label
                  ? "text-emerald-600 border-b-2 border-emerald-600 pb-1"
                  : "text-gray-600 hover:text-emerald-500"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Ações */}
      <div className="flex items-center gap-4">
        {/* Notificação (sino) com ícone discreto */}
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition bg-transparent">
          <FiBell />
        </button>

        {/* Assistente */}
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-sm shadow transition">
          <FiMessageCircle />
          Assistente
        </button>

        {/* Avatar + nome */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold shadow">
            {usuario?.nome?.charAt(0) || "U"}
          </div>
          <span className="text-sm text-gray-800">{usuario.nome || "Usuário"}</span>
        </div>

        {/* Logout minimalista */}
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition bg-transparent"
        >
          <FiLogOut className="text-lg" />
          Sair
        </button>
      </div>
    </nav>
  );
}
