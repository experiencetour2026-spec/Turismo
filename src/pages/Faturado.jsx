import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Faturado() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [faturados, setFaturados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [limiteExibicao, setLimiteExibicao] = useState(5)
  const [detalhesAbertos, setDetalhesAbertos] = useState({})

  const [reservaSelecionada, setReservaSelecionada] = useState(null)
  const [valorRecebido, setValorRecebido] = useState("")
  const [observacao, setObservacao] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarFaturados()
  }, [])

  useEffect(() => {
    setLimiteExibicao(5)
  }, [busca])

  async function carregarFaturados() {
    setLoading(true)

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
      .or(
        `forma_pagamento.eq.Faturado,and(data_saida.lte.${agora},valor_restante.gt.0)`
      )
      .order("data_saida", { ascending: false })

    setLoading(false)

    if (error) {
      console.error(error)
      alert("Erro ao carregar faturados.")
      return
    }

    setFaturados(data || [])
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  function abrirLancamento(item) {
    setReservaSelecionada(item)
    setValorRecebido("")
    setObservacao("")
  }

  function fecharLancamento() {
    setReservaSelecionada(null)
    setValorRecebido("")
    setObservacao("")
  }

  function alternarDetalhes(id) {
    setDetalhesAbertos((atual) => ({
      ...atual,
      [id]: !atual[id],
    }))
  }

  function statusClasse(status) {
    if (status === "Quitado") {
      return "bg-green-50 text-green-700 border border-green-100"
    }

    if (status === "Pagamento Parcial") {
      return "bg-indigo-50 text-indigo-700 border border-indigo-100"
    }

    if (status === "Cancelada") {
      return "bg-red-50 text-red-700 border border-red-100"
    }

    return "bg-slate-50 text-slate-600 border border-slate-200"
  }

  async function salvarRecebimento(e) {
    e.preventDefault()

    if (!reservaSelecionada) return

    const valor = Number(valorRecebido || 0)

    if (valor <= 0) {
      alert("Informe um valor recebido válido.")
      return
    }

    const valorPagoAtual = Number(reservaSelecionada.valor_pago || 0)
    const valorTotal = Number(reservaSelecionada.valor_total || 0)

    const novoValorPago = valorPagoAtual + valor
    const novoValorRestante = Math.max(valorTotal - novoValorPago, 0)

    const novoStatus =
      novoValorRestante <= 0 ? "Quitado" : "Pagamento Parcial"

    setSalvando(true)

    const { error: erroRecebimento } = await supabase
      .from("recebimentos")
      .insert([
        {
          reserva_id: reservaSelecionada.id,
          valor,
          observacao,
        },
      ])

    if (erroRecebimento) {
      setSalvando(false)
      console.error(erroRecebimento)
      alert("Erro ao registrar recebimento.")
      return
    }

    const { error: erroReserva } = await supabase
      .from("reservas")
      .update({
        valor_pago: novoValorPago,
        valor_restante: novoValorRestante,
        status: novoStatus,
      })
      .eq("id", reservaSelecionada.id)

    setSalvando(false)

    if (erroReserva) {
      console.error(erroReserva)
      alert("Recebimento salvo, mas erro ao atualizar a reserva.")
      return
    }

    fecharLancamento()
    carregarFaturados()
  }

  const faturadosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase().trim()

    if (!texto) return faturados

    return faturados.filter((item) =>
      `
        ${item.clientes?.nome || ""}
        ${item.clientes?.cpf_cnpj || ""}
        ${item.origem || ""}
        ${item.destino || ""}
        ${item.forma_pagamento || ""}
        ${item.status || ""}
        ${item.status_viagem || ""}
      `
        .toLowerCase()
        .includes(texto)
    )
  }, [busca, faturados])

  const faturadosExibidos = faturadosFiltrados.slice(0, limiteExibicao)

  const resumo = useMemo(() => {
    const total = faturados.length

    const valorTotal = faturados.reduce(
      (soma, item) => soma + Number(item.valor_total || 0),
      0
    )

    const valorPago = faturados.reduce(
      (soma, item) => soma + Number(item.valor_pago || 0),
      0
    )

    const valorRestante = faturados.reduce(
      (soma, item) => soma + Number(item.valor_restante || 0),
      0
    )

    return {
      total,
      valorTotal,
      valorPago,
      valorRestante,
    }
  }, [faturados])

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  const labelClass = "block text-xs font-medium text-slate-500 mb-1"

  return (
    <>
      <Sidebar aberto={menuAberto} onClose={() => setMenuAberto(false)} />

      {reservaSelecionada && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-3 py-4">
          <form
            onSubmit={salvarRecebimento}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xl"
          >
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                Lançar recebimento
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">
                {reservaSelecionada.clientes?.nome || "Cliente não informado"}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 text-sm">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] text-slate-500">Valor final</p>
                <p className="font-semibold text-slate-800 mt-1">
                  {formatarMoeda(reservaSelecionada.valor_total)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded-xl border border-green-100 p-3">
                  <p className="text-[11px] text-green-700">Já recebido</p>
                  <p className="font-semibold text-green-700 mt-1">
                    {formatarMoeda(reservaSelecionada.valor_pago)}
                  </p>
                </div>

                <div className="bg-red-50 rounded-xl border border-red-100 p-3">
                  <p className="text-[11px] text-red-700">Saldo pendente</p>
                  <p className="font-semibold text-red-700 mt-1">
                    {formatarMoeda(reservaSelecionada.valor_restante)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass}>Valor recebido agora</label>

                <input
                  type="number"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  placeholder="Valor recebido agora"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Observação</label>

                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observação"
                  rows="3"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={fecharLancamento}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm"
              >
                {salvando ? "Salvando..." : "Salvar recebimento"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-4 sm:mb-6">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setMenuAberto(true)}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 text-2xl shadow-sm hover:text-indigo-700"
                aria-label="Abrir menu"
              >
                ☰
              </button>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
                  Faturado
                </h1>

                <p className="text-xs sm:text-sm text-slate-500">
                  Viagens faturadas ou vencidas com saldo pendente
                </p>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Pendências
              </p>

              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 sm:mt-2">
                {resumo.total}
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Valor final
              </p>

              <h2 className="text-sm sm:text-xl font-semibold text-indigo-700 mt-1 sm:mt-2 break-words">
                {formatarMoeda(resumo.valorTotal)}
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Recebido
              </p>

              <h2 className="text-sm sm:text-xl font-semibold text-green-700 mt-1 sm:mt-2 break-words">
                {formatarMoeda(resumo.valorPago)}
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Falta pagar
              </p>

              <h2 className="text-sm sm:text-xl font-semibold text-red-600 mt-1 sm:mt-2 break-words">
                {formatarMoeda(resumo.valorRestante)}
              </h2>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                  Faturados e pendências
                </h2>

                <p className="text-xs sm:text-sm text-slate-500">
                  {faturadosFiltrados.length} registro(s) encontrado(s)
                </p>
              </div>

              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="🔍 Pesquisar por cliente, rota, status..."
                className="w-full lg:w-80 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  Carregando faturados...
                </p>
              </div>
            ) : faturadosFiltrados.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Nenhuma viagem faturada ou pendência vencida encontrada.
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Tente pesquisar por outro cliente, rota ou status.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {faturadosExibidos.map((item) => {
                    const detalhesAberto = detalhesAbertos[item.id]
                    const saldoPendente = Number(item.valor_restante || 0)
                    const statusAtual = item.status || "Reservada"

                    return (
                      <article
                        key={item.id}
                        className="rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-indigo-200 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-800 leading-snug break-words">
                              {item.clientes?.nome || "Cliente não informado"}
                            </h3>

                            <p className="text-xs text-slate-500 mt-1 break-words">
                              {item.clientes?.cpf_cnpj ||
                                "Documento não informado"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusClasse(
                              statusAtual
                            )}`}
                          >
                            {statusAtual}
                          </span>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <p className="text-[11px] text-slate-500">Rota</p>

                          <p className="text-sm font-medium text-slate-800 mt-1 break-words">
                            {item.origem || "-"} → {item.destino || "-"}
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="rounded-lg border border-slate-100 p-2">
                            <p className="text-slate-500">Data</p>

                            <p className="text-slate-800 font-medium mt-1">
                              {formatarData(item.data_saida)}
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-100 p-2">
                            <p className="text-slate-500">Valor final</p>

                            <p className="text-indigo-700 font-semibold mt-1">
                              {formatarMoeda(item.valor_total)}
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-100 p-2">
                            <p className="text-slate-500">Falta pagar</p>

                            <p className="text-red-600 font-semibold mt-1">
                              {formatarMoeda(item.valor_restante)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => alternarDetalhes(item.id)}
                          className="mt-3 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          {detalhesAberto
                            ? "Ocultar dados"
                            : "+ Ver dados do faturamento"}
                        </button>

                        {detalhesAberto && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Valor pago</p>

                              <p className="text-green-700 font-semibold mt-1">
                                {formatarMoeda(item.valor_pago)}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Forma</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {item.forma_pagamento || "-"}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Saída</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {formatarData(item.data_saida)}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Status viagem</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {item.status_viagem || "Confirmada"}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          {saldoPendente > 0 ? (
                            <button
                              type="button"
                              onClick={() => abrirLancamento(item)}
                              className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
                            >
                              Lançar recebimento
                            </button>
                          ) : (
                            <div className="w-full px-3 py-2.5 rounded-lg border border-green-100 bg-green-50 text-green-700 text-xs font-medium text-center">
                              Quitado
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500 text-center mb-3">
                    Mostrando {faturadosExibidos.length} de{" "}
                    {faturadosFiltrados.length} registro(s)
                  </p>

                  {limiteExibicao < faturadosFiltrados.length && (
                    <button
                      type="button"
                      onClick={() => setLimiteExibicao((atual) => atual + 5)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Carregar mais faturados
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