import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"

export default function Sidebar({ aberto, onClose }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate("/login")
  }

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
        aberto ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-5 py-4 border-b">
        <p className="text-sm font-semibold text-gray-800">
          Turismo
        </p>

        <p className="text-xs text-gray-500 mt-0.5">
          Governança de Viagens
        </p>
      </div>

      <div className="px-5 py-4 border-b flex justify-between items-center">
        <h2 className="text-base font-semibold text-indigo-700">
          Menu
        </h2>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <nav className="px-3 py-4 space-y-1 text-sm">
        <Link
          to="/agenda"
          onClick={onClose}
          className="block px-4 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          Agenda
        </Link>

        <Link
          to="/clientes"
          onClick={onClose}
          className="block px-4 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          Clientes
        </Link>

        <Link
          to="/reservas"
          onClick={onClose}
          className="block px-4 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          Reservas
        </Link>

        <Link
          to="/viagens"
          onClick={onClose}
          className="block px-4 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          Viagens
        </Link>

        <Link
          to="/historico-viagens"
          onClick={onClose}
          className="block px-4 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          Histórico de Viagens
        </Link>

        <Link
          to="/faturado"
          onClick={onClose}
          className="block px-4 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          Faturado
        </Link>

        <Link
          to="/relatorios"
          onClick={onClose}
          className="block px-4 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          Relatórios
        </Link>
      </nav>

      <div className="absolute bottom-0 w-full px-5 py-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-red-600 hover:underline"
        >
          Sair
        </button>
      </div>
    </div>
  )
}