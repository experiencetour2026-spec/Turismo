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

  const [limiteExibicao, setLimiteExibicao] = useState(9)

  const [detalhesAbertos, setDetalhesAbertos] =
    useState({})

  const [excluindoId, setExcluindoId] = useState(null)

  // =========================================================
  // CARREGAR VIAGENS
  // =========================================================

  useEffect(() => {
    carregarViagens()
  }, [])

  useEffect(() => {
    setLimiteExibicao(9)
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
  // ABRIR / FECHAR DETALHES
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

  function formatarDataCompacta(data) {
    if (!data) return "-"

    return new Date(data).toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    )
  }

  // =========================================================
  // STATUS
  // =========================================================

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

  // =========================================================
  // MOTORISTA
  // =========================================================

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
          "Confirmada") === "Confirmada"
    ).length

    const canceladas = viagens.filter(
      (viagem) =>
        viagem.status_viagem === "Cancelada"
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
    "rounded-xl border border-slate-200 bg-white shadow-sm"

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

          <header className="mb-4">

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
          {/* INDICADORES COMPACTOS */}
          {/* ================================================= */}

          <section className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">

            {/* TOTAL */}

            <div
              className={`${cardClass} px-3 py-2.5 sm:px-4 sm:py-3`}
            >

              <div className="flex items-center justify-between gap-2">

                <div>

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    Total
                  </p>

                  <p className="mt-0.5 text-xl font-semibold leading-none text-slate-800 sm:text-2xl">
                    {resumo.total}
                  </p>

                </div>

                <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500 sm:flex">
                  V
                </div>

              </div>

            </div>

            {/* CONFIRMADAS */}

            <div
              className={`${cardClass} px-3 py-2.5 sm:px-4 sm:py-3`}
            >

              <div className="flex items-center justify-between gap-2">

                <div>

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    Confirmadas
                  </p>

                  <p className="mt-0.5 text-xl font-semibold leading-none text-emerald-700 sm:text-2xl">
                    {
                      resumo.confirmadas
                    }
                  </p>

                </div>

                <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-700 sm:flex">
                  OK
                </div>

              </div>

            </div>

            {/* CANCELADAS */}

            <div
              className={`${cardClass} px-3 py-2.5 sm:px-4 sm:py-3`}
            >

              <div className="flex items-center justify-between gap-2">

                <div>

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    Canceladas
                  </p>

                  <p className="mt-0.5 text-xl font-semibold leading-none text-red-600 sm:text-2xl">
                    {
                      resumo.canceladas
                    }
                  </p>

                </div>

                <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold text-red-600 sm:flex">
                  X
                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* PESQUISA E FILTRO */}
          {/* ================================================= */}

          <section
            className={`${cardClass} mb-3 p-3 sm:p-4`}
          >

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-sm font-semibold text-slate-800 sm:text-base">
                  Lista de viagens
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  {
                    viagensFiltradas.length
                  }{" "}
                  {viagensFiltradas.length ===
                  1
                    ? "viagem encontrada"
                    : "viagens encontradas"}
                </p>

              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_160px] lg:w-[560px]">

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
                    className="h-9 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-sm"
                  />

                  {busca && (
                    <button
                      type="button"
                      onClick={() =>
                        setBusca("")
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                      aria-label="Limpar pesquisa"
                    >
                      ✕
                    </button>
                  )}

                </div>

                {/* FILTRO */}

                <select
                  value={
                    filtroStatus
                  }
                  onChange={(e) =>
                    setFiltroStatus(
                      e.target.value
                    )
                  }
                  className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-sm"
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
            className={`${cardClass} p-3 sm:p-4`}
          >

            {/* ================================================= */}
            {/* LOADING */}
            {/* ================================================= */}

            {loading ? (

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">

                {Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-xl border border-slate-100 p-3"
                    >

                      <div className="h-4 w-1/2 rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />

                      <div className="mt-3 h-10 rounded-lg bg-slate-100" />

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="h-10 rounded-lg bg-slate-100" />
                        <div className="h-10 rounded-lg bg-slate-100" />
                      </div>

                    </div>
                  )
                )}

              </div>

            ) : viagensFiltradas.length ===
              0 ? (

              /* ============================================= */
              /* SEM RESULTADOS */
              /* ============================================= */

              <div className="py-10 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                  V
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Nenhuma viagem encontrada
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Tente alterar a pesquisa ou
                  o filtro de status.
                </p>

              </div>

            ) : (

              <>
                {/* =========================================== */}
                {/* GRID DE VIAGENS */}
                {/* =========================================== */}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">

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
                          className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-indigo-200 hover:shadow-sm"
                        >

                          {/* ================================= */}
                          {/* CLIENTE + STATUS */}
                          {/* ================================= */}

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <h3 className="truncate text-sm font-semibold text-slate-800">
                                {viagem
                                  .clientes
                                  ?.nome ||
                                  "Cliente não informado"}
                              </h3>

                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {viagem
                                  .clientes
                                  ?.cpf_cnpj ||
                                  "Documento não informado"}
                              </p>

                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusClasse(
                                statusViagem
                              )}`}
                            >
                              {
                                statusViagem
                              }
                            </span>

                          </div>

                          {/* ================================= */}
                          {/* ROTA */}
                          {/* ================================= */}

                          <div className="mt-2.5 rounded-lg bg-slate-50 px-2.5 py-2">

                            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                              Rota
                            </p>

                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-700">
                              {viagem.origem ||
                                "-"}{" "}
                              <span className="text-slate-300">
                                →
                              </span>{" "}
                              {viagem.destino ||
                                "-"}
                            </p>

                          </div>

                          {/* ================================= */}
                          {/* PRINCIPAIS INFORMAÇÕES */}
                          {/* ================================= */}

                          <div className="mt-2 grid grid-cols-2 gap-1.5">

                            {/* SAÍDA */}

                            <div className="min-w-0 rounded-lg border border-slate-100 px-2 py-1.5">

                              <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                Saída
                              </p>

                              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-700">
                                {formatarDataCompacta(
                                  viagem.data_saida
                                )}
                              </p>

                            </div>

                            {/* TIPO */}

                            <div className="min-w-0 rounded-lg border border-slate-100 px-2 py-1.5">

                              <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                Tipo
                              </p>

                              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-700">
                                {viagem.tipo_viagem ||
                                  "-"}
                              </p>

                            </div>

                            {/* VALOR */}

                            <div className="min-w-0 rounded-lg border border-slate-100 px-2 py-1.5">

                              <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                Valor
                              </p>

                              <p className="mt-0.5 truncate text-[11px] font-semibold text-indigo-700">
                                {formatarMoeda(
                                  viagem.valor_total
                                )}
                              </p>

                            </div>

                            {/* PAGAMENTO */}

                            <div className="min-w-0 rounded-lg border border-slate-100 px-2 py-1.5">

                              <p className="text-[9px] uppercase tracking-wide text-slate-400">
                                Pagamento
                              </p>

                              <p
                                className={`mt-0.5 truncate text-[11px] font-semibold ${pagamentoClasse(
                                  viagem.status
                                )}`}
                              >
                                {viagem.status ||
                                  "Reservada"}
                              </p>

                            </div>

                          </div>

                          {/* ================================= */}
                          {/* MAIS INFORMAÇÕES */}
                          {/* ================================= */}

                          <button
                            type="button"
                            onClick={() =>
                              alternarDetalhes(
                                viagem.id
                              )
                            }
                            className="mt-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            {detalhesAberto
                              ? "Ocultar informações"
                              : "+ Mais informações"}
                          </button>

                          {/* ================================= */}
                          {/* DETALHES EXPANDIDOS */}
                          {/* ================================= */}

                          {detalhesAberto && (
                            <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5">

                              {/* RETORNO */}

                              <div className="rounded-lg bg-slate-50 px-2 py-1.5">

                                <p className="text-[9px] text-slate-400">
                                  Retorno
                                </p>

                                <p className="mt-0.5 text-[10px] font-medium text-slate-700">
                                  {formatarDataCompacta(
                                    viagem.data_retorno
                                  )}
                                </p>

                              </div>

                              {/* KM */}

                              <div className="rounded-lg bg-slate-50 px-2 py-1.5">

                                <p className="text-[9px] text-slate-400">
                                  KM total
                                </p>

                                <p className="mt-0.5 text-[10px] font-medium text-slate-700">
                                  {viagem.km_total ||
                                    0}{" "}
                                  km
                                </p>

                              </div>

                              {/* ÔNIBUS */}

                              <div className="rounded-lg bg-slate-50 px-2 py-1.5">

                                <p className="text-[9px] text-slate-400">
                                  Ônibus
                                </p>

                                <p className="mt-0.5 line-clamp-2 text-[10px] font-medium text-slate-700">
                                  {viagem.tipo_onibus ||
                                    "Não informado"}
                                </p>

                              </div>

                              {/* CARRO */}

                              <div className="rounded-lg bg-slate-50 px-2 py-1.5">

                                <p className="text-[9px] text-slate-400">
                                  Nº do carro
                                </p>

                                <p className="mt-0.5 text-[10px] font-medium text-slate-700">
                                  {viagem.numero_carro ||
                                    "-"}
                                </p>

                              </div>

                              {/* MOTORISTA */}

                              <div className="col-span-2 rounded-lg bg-slate-50 px-2 py-1.5">

                                <p className="text-[9px] text-slate-400">
                                  Motorista
                                </p>

                                <p className="mt-0.5 break-words text-[10px] font-medium text-slate-700">
                                  {mostrarMotorista(
                                    viagem
                                  )}
                                </p>

                              </div>

                              {/* VALORES */}

                              <div className="rounded-lg bg-slate-50 px-2 py-1.5">

                                <p className="text-[9px] text-slate-400">
                                  Pago
                                </p>

                                <p className="mt-0.5 text-[10px] font-semibold text-emerald-700">
                                  {formatarMoeda(
                                    viagem.valor_pago
                                  )}
                                </p>

                              </div>

                              <div className="rounded-lg bg-slate-50 px-2 py-1.5">

                                <p className="text-[9px] text-slate-400">
                                  Restante
                                </p>

                                <p className="mt-0.5 text-[10px] font-semibold text-red-600">
                                  {formatarMoeda(
                                    viagem.valor_restante
                                  )}
                                </p>

                              </div>

                              {/* DATA COMPLETA */}

                              <div className="col-span-2 mt-0.5 border-t border-slate-100 pt-2">

                                <p className="text-[9px] leading-4 text-slate-400">
                                  Saída completa:{" "}
                                  <span className="font-medium text-slate-600">
                                    {formatarData(
                                      viagem.data_saida
                                    )}
                                  </span>
                                </p>

                              </div>

                            </div>
                          )}

                          {/* ================================= */}
                          {/* AÇÕES */}
                          {/* ================================= */}

                          <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-1.5">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/viagens/${viagem.id}`
                                )
                              }
                              className="rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-indigo-700"
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
                              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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

                {/* =========================================== */}
                {/* CARREGAR MAIS */}
                {/* =========================================== */}

                <div className="mt-4 border-t border-slate-100 pt-3">

                  <p className="mb-2 text-center text-[10px] text-slate-400">
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
                            atual + 9
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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