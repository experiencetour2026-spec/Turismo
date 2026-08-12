import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../services/supabase"
import { emailsAutorizados } from "../utils/emailsAutorizados"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  async function handleLogin(e) {
    e.preventDefault()

    if (loading) return

    setErro("")

    const emailNormalizado = email
      .trim()
      .toLowerCase()

    if (
      !emailsAutorizados.includes(
        emailNormalizado
      )
    ) {
      setErro(
        "Este e-mail não possui autorização de acesso."
      )
      return
    }

    setLoading(true)

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: emailNormalizado,
          password: senha,
        })

      if (error) {
        setErro(
          "E-mail ou senha inválidos. Verifique os dados e tente novamente."
        )
        return
      }

      navigate("/agenda")
    } catch (error) {
      console.error(
        "Erro ao realizar login:",
        error
      )

      setErro(
        "Não foi possível acessar o sistema. Tente novamente."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[minmax(0,1fr)_560px]">

      {/* ================================================= */}
      {/* ÁREA INSTITUCIONAL - DESKTOP */}
      {/* ================================================= */}

      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 lg:flex lg:flex-col lg:justify-between">

        {/* DECORAÇÃO */}

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5" />

        <div className="absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full bg-indigo-400/10" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">

          {/* MARCA */}

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-white backdrop-blur">
                T
              </div>

              <div>
                <p className="text-lg font-semibold text-white">
                  Turismo
                </p>

                <p className="text-xs text-indigo-200">
                  Sistema de Governança
                </p>
              </div>

            </div>
          </div>

          {/* TEXTO CENTRAL */}

          <div className="max-w-xl">

            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 backdrop-blur">
              Gestão de viagens
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white xl:text-5xl">
              Mais controle para organizar cada viagem.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-indigo-100/80">
              Centralize reservas, agenda, clientes,
              recebimentos e acompanhamento das viagens
              em uma única plataforma.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3">

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                <p className="text-sm font-semibold text-white">
                  Agenda
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-200">
                  Visualização das viagens
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                <p className="text-sm font-semibold text-white">
                  Reservas
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-200">
                  Orçamentos e operações
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">

                <p className="text-sm font-semibold text-white">
                  Financeiro
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-200">
                  Valores e recebimentos
                </p>

              </div>

            </div>
          </div>

          {/* RODAPÉ */}

          <p className="text-xs text-indigo-200/60">
            Plataforma interna • Turismo
          </p>

        </div>
      </section>

      {/* ================================================= */}
      {/* LOGIN */}
      {/* ================================================= */}

      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">

        <div className="w-full max-w-md">

          {/* MARCA MOBILE */}

          <div className="mb-8 text-center lg:hidden">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
              T
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
              Turismo
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Plataforma de Governança de Viagens
            </p>

          </div>

          {/* CARD */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

            <div>

              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Acesso restrito
              </span>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
                Bem-vindo
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Entre com suas credenciais para acessar
                o sistema.
              </p>

            </div>

            <form
              onSubmit={handleLogin}
              className="mt-7 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)

                    if (erro) {
                      setErro("")
                    }
                  }}
                  required
                  autoComplete="email"
                  placeholder="seuemail@empresa.com"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

              </div>

              {/* SENHA */}

              <div>

                <label
                  htmlFor="senha"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Senha
                </label>

                <div className="relative">

                  <input
                    id="senha"
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value)

                      if (erro) {
                        setErro("")
                      }
                    }}
                    required
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-20 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha(
                        (estado) => !estado
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600 transition hover:text-indigo-800"
                  >
                    {mostrarSenha
                      ? "Ocultar"
                      : "Mostrar"}
                  </button>

                </div>

              </div>

              {/* ERRO */}

              {erro && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3"
                >
                  <div className="flex items-start gap-2">

                    <span className="mt-0.5 text-sm text-red-500">
                      !
                    </span>

                    <p className="text-xs leading-5 text-red-700">
                      {erro}
                    </p>

                  </div>
                </div>
              )}

              {/* BOTÃO */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Entrando..."
                  : "Acessar sistema"}
              </button>

            </form>

            {/* RODAPÉ */}

            <div className="mt-7 border-t border-slate-100 pt-5">

              <p className="text-center text-[11px] text-slate-400">
                Sistema de Governança • Turismo v1.0
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  )
}