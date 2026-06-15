import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"
import { emailsAutorizados } from "../utils/emailsAutorizados"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  async function handleLogin(e) {
    e.preventDefault()

    setLoading(true)
    setErro("")

    const emailNormalizado = email.trim().toLowerCase()

    if (!emailsAutorizados.includes(emailNormalizado)) {
      setErro("Este e-mail não possui autorização de acesso.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password: senha,
    })

    setLoading(false)

    if (error) {
      setErro("E-mail ou senha inválidos")
      return
    }

    navigate("/agenda")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
            Turismo
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Plataforma de Governança de Viagens
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm text-slate-600 mb-2">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@empresa.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">
              Senha
            </label>

            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="Digite sua senha"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {erro && (
            <p className="text-sm text-red-600 text-center">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 transition text-white py-3 rounded-xl font-medium shadow-sm"
          >
            {loading ? "Entrando..." : "Acessar Sistema"}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            Sistema de Governança • Turismo v1.0
          </p>
        </div>
      </div>
    </div>
  )
}