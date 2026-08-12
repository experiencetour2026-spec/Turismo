import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Viagens() {
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
  const [viagens, setViagens] = useState([])
  const [loading, setLoading] = useState(true)

  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("Todas")

  const [limiteExibicao, setLimiteExibicao] = useState(6)
  const [detalhesAbertos, setDetalhesAbertos] = useState({})

  const [excluindoId, setExcluindoId] = useState(null)

  // =========================================================
  // CARREGAR
  // =========================================================

  useEffect(() => {
    carregarViagens()
  }, [])

  useEffect(() => {
    setLimiteExibicao(6)
  }, [busca, filtroStatus])

  async function carregarViagens() {
    setLoading(true)

    try {
      const agora = new Date().toISOString()

      const { data, error } = await supabase
        .from("reservas")
        .select(`
          *,
          clientes (
            nome,
            cpf_cnpj
          )
        `)
        .gte("data_retorno", agora)
        .order("data_saida", {
          ascending: true,
        })

      if (error) {
        throw error
      }

      setViagens(data || [])
    } catch (error) {
      console.error(
        "Erro ao carregar viagens:",
        error
      )

      alert("Erro ao carregar viagens.")
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // EXCLUIR
  // =========================================================

  async function excluirViagem(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta viagem?"
    )

    if (!confirmar) return

    setExcluindoId(id)

    try {
      const { error } = await supabase
        .from("reservas")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      await carregarViagens()
    } catch (error) {
      console.error(
        "Erro ao excluir viagem:",
        error
      )

      alert("Erro ao excluir viagem.")
    } finally {
      setExcluindoId(null)
    }
  }

  // =========================================================
  // DETALHES
  // =========================================================

  function alternarDetalhes(id) {
    setDetalhesAbertos((atual) => ({
      ...atual,
      [id]: !atual[id],
    }))
  }

  // =========================================================
  // FORMATAÇÃO
  // =========================================================

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    )
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )
  }

  function statusClasse(status) {
    switch (status) {
      case "Cancelada":
        return "border border-red-100 bg-red-50 text-red-700"

      case "Em andamento":
        return "border border-emerald-100 bg-emerald-50 text-emerald-700"

      case "Finalizada":
        return "border border-slate-200 bg-slate-100 text-slate-700"

      case "Confirmada":
      default:
        return "border border-green-100 bg-green-50 text-green-700"
    }
  }

  function pagamentoClasse(status) {
    switch (status) {
      case "Quitado":
        return "text-emerald-700"

      case "Sinal pago":
      case "Pagamento Parcial":
        return "text-indigo-700"

      default:
        return "text-slate-600"
    }
  }

  function mostrarMotorista(viagem) {
    if (
      Number(viagem.quantidade_motoristas) === 2 &&
      viagem.matricula_motorista_2
    ) {
      return `${viagem.matricula_motorista_1 || "-"} / ${
        viagem.matricula_motorista_2
      }`
    }

    return (
      viagem.matricula_motorista_1 || "-"
    )
  }

  // =========================================================
  // FILTRO
  // =========================================================

  const viagensFiltradas = useMemo(() => {
    const texto = busca
      .toLowerCase()
      .trim()

    let resultado = viagens

    if (filtroStatus !== "Todas") {
      resultado = resultado.filter(
        (viagem) =>
          (viagem.status_viagem ||
            "Confirmada") === filtroStatus
      )
    }

    if (!texto) {
      return resultado
    }

    return resultado.filter((viagem) =>
      `
        ${viagem.clientes?.nome || ""}
        ${viagem.clientes?.cpf_cnpj || ""}
        ${viagem.status_viagem || ""}
        ${viagem.tipo_viagem || ""}
        ${viagem.origem || ""}
        ${viagem.destino || ""}
        ${viagem.numero_carro || ""}
        ${viagem.tipo_onibus || ""}
        ${mostrarMotorista(viagem)}
      `
        .toLowerCase()
        .includes(texto)
    )
  }, [
    viagens,
    busca,
    filtroStatus,
  ])

  const viagensExibidas =
    viagensFiltradas.slice(
      0,
      limiteExibicao
    )

  // =========================================================
  // RESUMO
  // =========================================================

  const resumo = useMemo(() => {
    const total = viagens.length

    const confirmadas = viagens.filter(
      (viagem) =>
        (viagem.status_viagem ||
          "Confirmada") ===
        "Confirmada"
    ).length

    const canceladas = viagens.filter(
      (viagem) =>
        viagem.status_viagem ===
        "Cancelada"
    ).length

    return {
      total,
      confirmadas,
      canceladas,
    }
  }, [viagens])

  // =========================================================
  // CLASSES
  // =========================================================

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm"

  // =========================================================
  // TELA
  // =========================================================

  return (
    <>
      <Sidebar
        aberto={menuAberto}
        onClose={() =>
          setMenuAberto(false)
        }
      />

      {menuAberto && (
        <div
          onClick={() =>
            setMenuAberto(false)
          }
          className="fixed inset-0 z-40 bg-black/40"
        />
      )}

      <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 md:p-6">
        <div className="mx-auto max-w-[1500px]">

          {/* ================================================= */}
          {/* CABEÇALHO */}
          {/* ================================================= */}

          <header className="mb-5">

            <div className="flex items-start gap-3">

              <button
                type="button"
                onClick={() =>
                  setMenuAberto(true)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                aria-label="Abrir menu"
              >
                ☰
              </button>

              <div>

                <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                  Viagens
                </h1>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Acompanhamento das viagens
                  atuais e futuras
                </p>

              </div>

            </div>

          </header>

          {/* ================================================= */}
          {/* INDICADORES */}
          {/* ================================================= */}

          <section className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">

            <div
              className={`${cardClass} p-3 sm:p-5`}
            >

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                Total
              </p>

              <div className="mt-1 flex items-end justify-between sm:mt-2">

                <p className="text-2xl font-semibold text-slate-800 sm:text-3xl">
                  {resumo.total}
                </p>

                <span className="hidden rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 sm:block">
                  VIAGENS
                </span>

              </div>

            </div>

            <div
              className={`${cardClass} p-3 sm:p-5`}
            >

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                Confirmadas
              </p>

              <div className="mt-1 flex items-end justify-between sm:mt-2">

                <p className="text-2xl font-semibold text-emerald-700 sm:text-3xl">
                  {
                    resumo.confirmadas
                  }
                </p>

                <span className="hidden rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 sm:block">
                  OK
                </span>

              </div>

            </div>

            <div
              className={`${cardClass} p-3 sm:p-5`}
            >

              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                Canceladas
              </p>

              <div className="mt-1 flex items-end justify-between sm:mt-2">

                <p className="text-2xl font-semibold text-red-600 sm:text-3xl">
                  {
                    resumo.canceladas
                  }
                </p>

                <span className="hidden rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 sm:block">
                  X
                </span>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* PESQUISA E FILTRO */}
          {/* ================================================= */}

          <section
            className={`${cardClass} mb-4 p-4 sm:p-5`}
          >

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
                  Lista de viagens
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {
                    viagensFiltradas.length
                  }{" "}
                  {viagensFiltradas.length ===
                  1
                    ? "viagem encontrada"
                    : "viagens encontradas"}
                </p>

              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_170px] lg:w-[580px]">

                {/* BUSCA */}

                <div className="relative">

                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ⌕
                  </span>

                  <input
                    value={busca}
                    onChange={(e) =>
                      setBusca(
                        e.target.value
                      )
                    }
                    placeholder="Cliente, rota, ônibus, carro..."
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  {busca && (
                    <button
                      type="button"
                      onClick={() =>
                        setBusca("")
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  )}

                </div>

                {/* STATUS */}

                <select
                  value={
                    filtroStatus
                  }
                  onChange={(e) =>
                    setFiltroStatus(
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Todas">
                    Todas
                  </option>

                  <option value="Confirmada">
                    Confirmadas
                  </option>

                  <option value="Cancelada">
                    Canceladas
                  </option>
                </select>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* LISTA */}
          {/* ================================================= */}

          <section
            className={`${cardClass} p-4 sm:p-5`}
          >

            {loading ? (

              /* LOADING */

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

                {Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-2xl border border-slate-100 p-4"
                    >

                      <div className="h-4 w-1/2 rounded bg-slate-200" />

                      <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />

                      <div className="mt-5 h-14 rounded-xl bg-slate-100" />

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="h-12 rounded-xl bg-slate-100" />
                        <div className="h-12 rounded-xl bg-slate-100" />
                        <div className="h-12 rounded-xl bg-slate-100" />
                      </div>

                    </div>
                  )
                )}

              </div>

            ) : viagensFiltradas.length ===
              0 ? (

              /* VAZIO */

              <div className="py-12 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                  V
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Nenhuma viagem encontrada
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Tente alterar a pesquisa ou
                  o filtro de status.
                </p>

              </div>

            ) : (

              <>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

                  {viagensExibidas.map(
                    (viagem) => {
                      const detalhesAberto =
                        detalhesAbertos[
                          viagem.id
                        ]

                      const statusViagem =
                        viagem.status_viagem ||
                        "Confirmada"

                      return (
                        <article
                          key={
                            viagem.id
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
                        >

                          {/* CLIENTE */}

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <h3 className="line-clamp-2 text-sm font-semibold text-slate-800">
                                {viagem
                                  .clientes
                                  ?.nome ||
                                  "Cliente não informado"}
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                {viagem
                                  .clientes
                                  ?.cpf_cnpj ||
                                  "Documento não informado"}
                              </p>

                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClasse(
                                statusViagem
                              )}`}
                            >
                              {
                                statusViagem
                              }
                            </span>

                          </div>

                          {/* ROTA */}

                          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">

                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Rota
                            </p>

                            <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                              {viagem.origem ||
                                "-"}{" "}
                              <span className="text-slate-300">
                                →
                              </span>{" "}
                              {viagem.destino ||
                                "-"}
                            </p>

                          </div>

                          {/* RESUMO */}

                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">

                            <div className="rounded-xl border border-slate-100 p-2.5">

                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Saída
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-700">
                                {formatarData(
                                  viagem.data_saida
                                )}
                              </p>

                            </div>

                            <div className="rounded-xl border border-slate-100 p-2.5">

                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Tipo
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-700">
                                {viagem.tipo_viagem ||
                                  "-"}
                              </p>

                            </div>

                            <div className="rounded-xl border border-slate-100 p-2.5">

                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Valor
                              </p>

                              <p className="mt-1 text-xs font-semibold text-indigo-700">
                                {formatarMoeda(
                                  viagem.valor_total
                                )}
                              </p>

                            </div>

                            <div className="rounded-xl border border-slate-100 p-2.5">

                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Pagamento
                              </p>

                              <p
                                className={`mt-1 text-xs font-semibold ${pagamentoClasse(
                                  viagem.status
                                )}`}
                              >
                                {viagem.status ||
                                  "Reservada"}
                              </p>

                            </div>

                          </div>

                          {/* EXPANDIR */}

                          <button
                            type="button"
                            onClick={() =>
                              alternarDetalhes(
                                viagem.id
                              )
                            }
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            {detalhesAberto
                              ? "Ocultar informações"
                              : "+ Mais informações"}
                          </button>

                          {/* DETALHES */}

                          {detalhesAberto && (
                            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">

                              <div className="rounded-xl bg-slate-50 p-2.5">

                                <p className="text-[10px] text-slate-400">
                                  Retorno
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-700">
                                  {formatarData(
                                    viagem.data_retorno
                                  )}
                                </p>

                              </div>

                              <div className="rounded-xl bg-slate-50 p-2.5">

                                <p className="text-[10px] text-slate-400">
                                  KM total
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-700">
                                  {viagem.km_total ||
                                    0}{" "}
                                  km
                                </p>

                              </div>

                              <div className="rounded-xl bg-slate-50 p-2.5">

                                <p className="text-[10px] text-slate-400">
                                  Ônibus
                                </p>

                                <p className="mt-1 break-words text-xs font-medium text-slate-700">
                                  {viagem.tipo_onibus ||
                                    "Não informado"}
                                </p>

                              </div>

                              <div className="rounded-xl bg-slate-50 p-2.5">

                                <p className="text-[10px] text-slate-400">
                                  Nº do carro
                                </p>

                                <p className="mt-1 text-xs font-medium text-slate-700">
                                  {viagem.numero_carro ||
                                    "-"}
                                </p>

                              </div>

                              <div className="col-span-2 rounded-xl bg-slate-50 p-2.5">

                                <p className="text-[10px] text-slate-400">
                                  Motorista
                                </p>

                                <p className="mt-1 break-words text-xs font-medium text-slate-700">
                                  {mostrarMotorista(
                                    viagem
                                  )}
                                </p>

                              </div>

                            </div>
                          )}

                          {/* AÇÕES */}

                          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/viagens/${viagem.id}`
                                )
                              }
                              className="rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                            >
                              Ver detalhes
                            </button>

                            <button
                              type="button"
                              disabled={
                                excluindoId ===
                                viagem.id
                              }
                              onClick={() =>
                                excluirViagem(
                                  viagem.id
                                )
                              }
                              className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {excluindoId ===
                              viagem.id
                                ? "..."
                                : "Excluir"}
                            </button>

                          </div>

                        </article>
                      )
                    }
                  )}

                </div>

                {/* PAGINAÇÃO */}

                <div className="mt-5 border-t border-slate-100 pt-4">

                  <p className="mb-3 text-center text-xs text-slate-400">
                    Mostrando{" "}
                    {
                      viagensExibidas.length
                    }{" "}
                    de{" "}
                    {
                      viagensFiltradas.length
                    }{" "}
                    viagens
                  </p>

                  {limiteExibicao <
                    viagensFiltradas.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setLimiteExibicao(
                          (atual) =>
                            atual + 6
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Carregar mais viagens
                    </button>
                  )}

                </div>
              </>
            )}

          </section>

        </div>
      </div>
    </>
  )
}