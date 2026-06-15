import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"
import { emailsAutorizados } from "../utils/emailsAutorizados"

export default function Dashboard() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [carregandoSessao, setCarregandoSessao] = useState(true)
  const navigate = useNavigate()

  const viagens = []

  useEffect(() => {
    async function verificarAcesso() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        navigate("/login")
        return
      }

      const emailUsuario = data?.session?.user?.email?.toLowerCase()

      if (!emailUsuario) {
        navigate("/login")
        return
      }

      if (!emailsAutorizados.includes(emailUsuario)) {
        await supabase.auth.signOut()
        navigate("/login")
        return
      }

      setCarregandoSessao(false)
    }

    verificarAcesso()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const emailUsuario = session?.user?.email?.toLowerCase()

      if (!emailUsuario || !emailsAutorizados.includes(emailUsuario)) {
        navigate("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  if (carregandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Verificando acesso...</p>
      </div>
    )
  }

  return (
    <>
      <Sidebar aberto={menuAberto} onClose={() => setMenuAberto(false)} />

      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      <div className="min-h-screen bg-slate-100 p-6 font-sans">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuAberto(true)}
              className="text-slate-700 text-2xl hover:text-indigo-700"
            >
              ☰
            </button>

            <h1 className="text-2xl font-semibold text-slate-800">
              Painel de Controle • Turismo
            </h1>
          </div>

          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">
            + Nova viagem
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Viagens em andamento</p>
            <h2 className="text-3xl font-semibold text-slate-800 mt-2">0</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Solicitações pendentes</p>
            <h2 className="text-3xl font-semibold text-slate-800 mt-2">0</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Prestações em análise</p>
            <h2 className="text-3xl font-semibold text-slate-800 mt-2">0</h2>
          </div>
        </section>

        {viagens.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">
              Nenhuma viagem cadastrada no momento.
            </p>
          </div>
        ) : null}
      </div>
    </>
  )
}