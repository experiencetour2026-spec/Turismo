import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Agenda() {
  const [menuAberto, setMenuAberto] =
    useState(false)

  const [viagens, setViagens] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [mesAtual, setMesAtual] =
    useState(new Date())

  const [
    diaSelecionado,
    setDiaSelecionado,
  ] = useState(new Date())

  // =========================================================
  // CARREGAR AGENDA
  // =========================================================

  useEffect(() => {
    carregarAgenda()
  }, [])

  async function carregarAgenda() {
    setLoading(true)

    try {
      const { data, error } =
        await supabase
          .from("reservas")
          .select(`
            *,
            clientes (
              nome,
              cpf_cnpj
            )
          `)
          .order("data_saida", {
            ascending: true,
          })

      if (error) {
        throw error
      }

      setViagens(data || [])
    } catch (error) {
      console.error(
        "Erro ao carregar agenda:",
        error
      )

      alert("Erro ao carregar agenda.")
    } finally {
      setLoading(false)
    }
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

    return new Date(
      data
    ).toLocaleDateString("pt-BR")
  }

  function formatarHora(data) {
    if (!data) return "-"

    return new Date(
      data
    ).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // =========================================================
  // DATA LOCAL
  // Evita problema de UTC / alteração de dia
  // =========================================================

  function dataLocalInput(data) {
    const dataConvertida =
      data instanceof Date
        ? data
        : new Date(data)

    const ano =
      dataConvertida.getFullYear()

    const mes = String(
      dataConvertida.getMonth() + 1
    ).padStart(2, "0")

    const dia = String(
      dataConvertida.getDate()
    ).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
  }

  // =========================================================
  // DIAS DA VIAGEM
  // =========================================================

  function gerarDiasViagem(
    dataInicio,
    dataFim
  ) {
    if (!dataInicio) return []

    const inicio =
      new Date(dataInicio)

    const fim = dataFim
      ? new Date(dataFim)
      : new Date(dataInicio)

    inicio.setHours(0, 0, 0, 0)
    fim.setHours(0, 0, 0, 0)

    const dias = []

    const atual =
      new Date(inicio)

    while (atual <= fim) {
      dias.push(
        dataLocalInput(atual)
      )

      atual.setDate(
        atual.getDate() + 1
      )
    }

    return dias
  }

  // =========================================================
  // NAVEGAÇÃO
  // =========================================================

  function irMesAnterior() {
    const novoMes = new Date(
      mesAtual.getFullYear(),
      mesAtual.getMonth() - 1,
      1
    )

    setMesAtual(novoMes)
    setDiaSelecionado(novoMes)
  }

  function irProximoMes() {
    const novoMes = new Date(
      mesAtual.getFullYear(),
      mesAtual.getMonth() + 1,
      1
    )

    setMesAtual(novoMes)
    setDiaSelecionado(novoMes)
  }

  function irParaHoje() {
    const hoje = new Date()

    setMesAtual(
      new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
      )
    )

    setDiaSelecionado(hoje)
  }

  function buscarPorData(e) {
    const valor =
      e.target.value

    if (!valor) return

    const [ano, mes, dia] =
      valor
        .split("-")
        .map(Number)

    const novaData = new Date(
      ano,
      mes - 1,
      dia
    )

    setMesAtual(
      new Date(
        ano,
        mes - 1,
        1
      )
    )

    setDiaSelecionado(
      novaData
    )
  }

  // =========================================================
  // VIAGENS AGRUPADAS POR DIA
  // =========================================================

  const viagensPorDia =
    useMemo(() => {
      const agrupado = {}

      viagens.forEach(
        (viagem) => {
          const dias =
            gerarDiasViagem(
              viagem.data_saida,
              viagem.data_retorno
            )

          dias.forEach((dia) => {
            if (!agrupado[dia]) {
              agrupado[dia] = []
            }

            agrupado[dia].push(
              viagem
            )
          })
        }
      )

      return agrupado
    }, [viagens])

  // =========================================================
  // DIAS DO CALENDÁRIO
  // =========================================================

  const diasDoCalendario =
    useMemo(() => {
      const ano =
        mesAtual.getFullYear()

      const mes =
        mesAtual.getMonth()

      const primeiroDiaMes =
        new Date(
          ano,
          mes,
          1
        )

      const ultimoDiaMes =
        new Date(
          ano,
          mes + 1,
          0
        )

      const inicioCalendario =
        new Date(
          primeiroDiaMes
        )

      inicioCalendario.setDate(
        primeiroDiaMes.getDate() -
          primeiroDiaMes.getDay()
      )

      const fimCalendario =
        new Date(
          ultimoDiaMes
        )

      fimCalendario.setDate(
        ultimoDiaMes.getDate() +
          (6 -
            ultimoDiaMes.getDay())
      )

      const dias = []

      const data =
        new Date(
          inicioCalendario
        )

      while (
        data <=
        fimCalendario
      ) {
        dias.push(
          new Date(data)
        )

        data.setDate(
          data.getDate() + 1
        )
      }

      return dias
    }, [mesAtual])

  // =========================================================
  // VIAGENS DO DIA SELECIONADO
  // =========================================================

  const viagensDoDiaSelecionado =
    useMemo(() => {
      const chave =
        dataLocalInput(
          diaSelecionado
        )

      return (
        viagensPorDia[chave] ||
        []
      )
    }, [
      diaSelecionado,
      viagensPorDia,
    ])

  // =========================================================
  // QUANTIDADE NO MÊS
  // =========================================================

  const quantidadeViagensMes =
    useMemo(() => {
      const ano =
        mesAtual.getFullYear()

      const mes =
        mesAtual.getMonth()

      return viagens.filter(
        (viagem) => {
          if (
            !viagem.data_saida
          ) {
            return false
          }

          const data =
            new Date(
              viagem.data_saida
            )

          return (
            data.getFullYear() ===
              ano &&
            data.getMonth() ===
              mes
          )
        }
      ).length
    }, [viagens, mesAtual])

  // =========================================================
  // STATUS
  // =========================================================

  function corStatus(status) {
    switch (status) {
      case "Reservada":
        return "border border-amber-100 bg-amber-50 text-amber-700"

      case "Sinal pago":
        return "border border-orange-100 bg-orange-50 text-orange-700"

      case "Quitado":
        return "border border-green-100 bg-green-50 text-green-700"

      case "Confirmada":
        return "border border-indigo-100 bg-indigo-50 text-indigo-700"

      case "Em andamento":
        return "border border-emerald-100 bg-emerald-50 text-emerald-700"

      case "Finalizada":
        return "border border-slate-200 bg-slate-100 text-slate-700"

      case "Cancelada":
        return "border border-red-100 bg-red-50 text-red-700"

      default:
        return "border border-slate-200 bg-slate-50 text-slate-600"
    }
  }

  // =========================================================
  // VARIÁVEIS VISUAIS
  // =========================================================

  const hoje =
    dataLocalInput(
      new Date()
    )

  const chaveSelecionada =
    dataLocalInput(
      diaSelecionado
    )

  const nomeMes =
    mesAtual.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    )

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

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

              <div className="flex items-start gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setMenuAberto(
                      true
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                  aria-label="Abrir menu"
                >
                  ☰
                </button>

                <div>

                  <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                    Agenda
                  </h1>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Calendário mensal
                    de viagens
                  </p>

                </div>

              </div>

              {/* AÇÕES */}

              <div className="flex flex-col gap-2 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    irParaHoje
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                >
                  Hoje
                </button>

                <input
                  type="date"
                  value={
                    chaveSelecionada
                  }
                  onChange={
                    buscarPorData
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-auto"
                />

              </div>

            </div>

          </header>

          {/* ================================================= */}
          {/* CARREGAMENTO */}
          {/* ================================================= */}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="animate-pulse">

                <div className="h-5 w-40 rounded bg-slate-200" />

                <div className="mt-3 h-3 w-64 max-w-full rounded bg-slate-100" />

                <div className="mt-6 grid grid-cols-7 gap-2">

                  {Array.from({
                    length: 35,
                  }).map((_, index) => (
                    <div
                      key={
                        index
                      }
                      className="h-16 rounded-xl bg-slate-100"
                    />
                  ))}

                </div>

              </div>

            </div>
          ) : (

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">

              {/* ============================================= */}
              {/* CALENDÁRIO */}
              {/* ============================================= */}

              <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">

                {/* CABEÇALHO DO CALENDÁRIO */}

                <div className="mb-5 flex items-center justify-between gap-2">

                  <button
                    type="button"
                    onClick={
                      irMesAnterior
                    }
                    className="flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    aria-label="Mês anterior"
                  >
                    ←
                    <span className="ml-2 hidden sm:inline">
                      Anterior
                    </span>
                  </button>

                  <div className="min-w-0 text-center">

                    <h2 className="truncate text-base font-semibold capitalize text-slate-800 sm:text-lg">
                      {nomeMes}
                    </h2>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {
                        quantidadeViagensMes
                      }{" "}
                      viagem(ns) com
                      saída neste mês
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      irProximoMes
                    }
                    className="flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    aria-label="Próximo mês"
                  >
                    <span className="mr-2 hidden sm:inline">
                      Próximo
                    </span>
                    →
                  </button>

                </div>

                {/* DIAS DA SEMANA */}

                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:gap-2 sm:text-xs">

                  <div>Dom</div>
                  <div>Seg</div>
                  <div>Ter</div>
                  <div>Qua</div>
                  <div>Qui</div>
                  <div>Sex</div>
                  <div>Sáb</div>

                </div>

                {/* DIAS */}

                <div className="grid grid-cols-7 gap-1 sm:gap-2">

                  {diasDoCalendario.map(
                    (dia) => {
                      const chave =
                        dataLocalInput(
                          dia
                        )

                      const viagensDia =
                        viagensPorDia[
                          chave
                        ] || []

                      const foraDoMes =
                        dia.getMonth() !==
                        mesAtual.getMonth()

                      const selecionado =
                        chave ===
                        chaveSelecionada

                      const diaAtual =
                        chave === hoje

                      return (
                        <button
                          key={chave}
                          type="button"
                          onClick={() =>
                            setDiaSelecionado(
                              dia
                            )
                          }
                          className={`
                            relative
                            min-h-[58px]
                            overflow-hidden
                            rounded-xl
                            border
                            p-1.5
                            text-left
                            transition
                            sm:min-h-[88px]
                            sm:p-2.5
                            ${
                              selecionado
                                ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-100"
                                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                            }
                            ${
                              foraDoMes
                                ? "opacity-35"
                                : "opacity-100"
                            }
                          `}
                        >

                          {/* NÚMERO */}

                          <div className="flex items-start justify-between gap-1">

                            <span
                              className={`
                                flex
                                h-6
                                min-w-6
                                items-center
                                justify-center
                                rounded-lg
                                px-1
                                text-xs
                                font-semibold
                                sm:text-sm
                                ${
                                  diaAtual
                                    ? "bg-indigo-600 text-white"
                                    : selecionado
                                      ? "text-indigo-700"
                                      : "text-slate-700"
                                }
                              `}
                            >
                              {dia.getDate()}
                            </span>

                          </div>

                          {/* VIAGENS */}

                          {viagensDia.length >
                            0 && (
                            <>
                              {/* MOBILE */}

                              <div className="mt-1.5 flex sm:hidden">

                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1 text-[10px] font-bold text-indigo-700">
                                  {
                                    viagensDia.length
                                  }
                                </span>

                              </div>

                              {/* DESKTOP */}

                              <div className="mt-3 hidden sm:block">

                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">

                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                                  {
                                    viagensDia.length
                                  }{" "}
                                  {viagensDia.length ===
                                  1
                                    ? "viagem"
                                    : "viagens"}

                                </div>

                              </div>
                            </>
                          )}

                        </button>
                      )
                    }
                  )}

                </div>

                {/* LEGENDA */}

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-[11px] text-slate-400">

                  <div className="flex items-center gap-1.5">

                    <span className="h-2 w-2 rounded-full bg-indigo-600" />

                    Hoje

                  </div>

                  <div className="flex items-center gap-1.5">

                    <span className="h-2 w-2 rounded-full bg-indigo-200" />

                    Possui viagem

                  </div>

                </div>

              </section>

              {/* ============================================= */}
              {/* VIAGENS DO DIA */}
              {/* ============================================= */}

              <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-4">

                {/* CABEÇALHO */}

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                      Dia selecionado
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-slate-800">
                      {formatarData(
                        diaSelecionado
                      )}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        viagensDoDiaSelecionado.length
                      }{" "}
                      {viagensDoDiaSelecionado.length ===
                      1
                        ? "viagem encontrada"
                        : "viagens encontradas"}
                    </p>

                  </div>

                  <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-indigo-50 px-2 text-sm font-bold text-indigo-700">
                    {
                      viagensDoDiaSelecionado.length
                    }
                  </span>

                </div>

                {/* LISTA */}

                <div className="mt-5 space-y-3">

                  {viagensDoDiaSelecionado.length ===
                  0 ? (

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                        ○
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-600">
                        Nenhuma viagem
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Não existem
                        viagens cadastradas
                        para esta data.
                      </p>

                    </div>

                  ) : (

                    viagensDoDiaSelecionado.map(
                      (viagem) => (
                        <article
                          key={
                            viagem.id
                          }
                          className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300"
                        >

                          {/* CLIENTE + STATUS */}

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-800">
                                {viagem
                                  .clientes
                                  ?.nome ||
                                  "Cliente não informado"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  viagem.origem
                                }{" "}
                                <span className="text-slate-300">
                                  →
                                </span>{" "}
                                {
                                  viagem.destino
                                }
                              </p>

                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${corStatus(
                                viagem.status
                              )}`}
                            >
                              {viagem.status ||
                                "Reservada"}
                            </span>

                          </div>

                          {/* DATAS */}

                          <div className="mt-4 grid grid-cols-2 gap-2">

                            <div className="rounded-xl bg-slate-50 p-2.5">

                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Saída
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-700">
                                {formatarData(
                                  viagem.data_saida
                                )}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {
                                  formatarHora(
                                    viagem.data_saida
                                  )
                                }
                              </p>

                            </div>

                            <div className="rounded-xl bg-slate-50 p-2.5">

                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Retorno
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-700">
                                {formatarData(
                                  viagem.data_retorno
                                )}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {
                                  formatarHora(
                                    viagem.data_retorno
                                  )
                                }
                              </p>

                            </div>

                          </div>

                          {/* ÔNIBUS */}

                          {viagem.tipo_onibus && (
                            <div className="mt-3">

                              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                Veículo
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-600">
                                {
                                  viagem.tipo_onibus
                                }
                              </p>

                            </div>
                          )}

                          {/* FINANCEIRO */}

                          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">

                            <div className="min-w-0">

                              <p className="text-[10px] text-slate-400">
                                Total
                              </p>

                              <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                                {formatarMoeda(
                                  viagem.valor_total
                                )}
                              </p>

                            </div>

                            <div className="min-w-0">

                              <p className="text-[10px] text-slate-400">
                                Pago
                              </p>

                              <p className="mt-1 truncate text-xs font-semibold text-green-700">
                                {formatarMoeda(
                                  viagem.valor_pago
                                )}
                              </p>

                            </div>

                            <div className="min-w-0">

                              <p className="text-[10px] text-slate-400">
                                Restante
                              </p>

                              <p className="mt-1 truncate text-xs font-semibold text-red-600">
                                {formatarMoeda(
                                  viagem.valor_restante
                                )}
                              </p>

                            </div>

                          </div>

                        </article>
                      )
                    )
                  )}

                </div>

              </aside>

            </div>
          )}

        </div>

      </div>
    </>
  )
}