import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function HistoricoViagens() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [viagens, setViagens] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [limiteExibicao, setLimiteExibicao] = useState(5)
  const [detalhesAbertos, setDetalhesAbertos] = useState({})

  useEffect(() => {
    carregarHistorico()
  }, [])

  useEffect(() => {
    setLimiteExibicao(5)
  }, [busca])

  async function carregarHistorico() {
    setLoading(true)

    const hoje = new Date()
    const sessentaDiasAtras = new Date()
    sessentaDiasAtras.setDate(hoje.getDate() - 60)

    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        clientes (
          nome,
          cpf_cnpj
        )
      `)
      .lt("data_retorno", hoje.toISOString())
      .gte("data_retorno", sessentaDiasAtras.toISOString())
      .order("data_retorno", { ascending: false })

    setLoading(false)

    if (error) {
      console.error(error)
      alert("Erro ao carregar histórico.")
      return
    }

    setViagens(data || [])
  }

  function alternarDetalhes(id) {
    setDetalhesAbertos((atual) => ({
      ...atual,
      [id]: !atual[id],
    }))
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function statusClasse(status) {
    if (status === "Cancelada") {
      return "bg-red-50 text-red-700 border border-red-100"
    }

    return "bg-green-50 text-green-700 border border-green-100"
  }

  function mostrarMotorista(viagem) {
    if (viagem.quantidade_motoristas === 2 && viagem.matricula_motorista_2) {
      return `${viagem.matricula_motorista_1 || "-"} / ${
        viagem.matricula_motorista_2
      }`
    }

    return viagem.matricula_motorista_1 || "-"
  }

  const viagensFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim()

    if (!termo) return viagens

    return viagens.filter((viagem) =>
      `
        ${viagem.clientes?.nome || ""}
        ${viagem.clientes?.cpf_cnpj || ""}
        ${viagem.origem || ""}
        ${viagem.destino || ""}
        ${viagem.status_viagem || ""}
        ${viagem.tipo_viagem || ""}
        ${viagem.numero_carro || ""}
        ${mostrarMotorista(viagem)}
      `
        .toLowerCase()
        .includes(termo)
    )
  }, [busca, viagens])

  const viagensExibidas = viagensFiltradas.slice(0, limiteExibicao)

  const resumo = useMemo(() => {
    const total = viagens.length

    const valorTotal = viagens.reduce(
      (soma, viagem) => soma + Number(viagem.valor_total || 0),
      0
    )

    const valorRecebido = viagens.reduce(
      (soma, viagem) => soma + Number(viagem.valor_pago || 0),
      0
    )

    const valorRestante = viagens.reduce(
      (soma, viagem) => soma + Number(viagem.valor_restante || 0),
      0
    )

    return {
      total,
      valorTotal,
      valorRecebido,
      valorRestante,
    }
  }, [viagens])

  return (
    <>
      <Sidebar aberto={menuAberto} onClose={() => setMenuAberto(false)} />

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
                  Histórico de Viagens
                </h1>

                <p className="text-xs sm:text-sm text-slate-500">
                  Viagens finalizadas nos últimos 60 dias
                </p>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Total
              </p>

              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 sm:mt-2">
                {resumo.total}
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Valor total
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
                {formatarMoeda(resumo.valorRecebido)}
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Restante
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
                  Viagens no histórico
                </h2>

                <p className="text-xs sm:text-sm text-slate-500">
                  {viagensFiltradas.length} viagem(ns) encontrada(s)
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
                  Carregando histórico...
                </p>
              </div>
            ) : viagensFiltradas.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Nenhuma viagem encontrada no histórico.
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Tente pesquisar por outro cliente, rota ou status.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {viagensExibidas.map((viagem) => {
                    const detalhesAberto = detalhesAbertos[viagem.id]

                    return (
                      <article
                        key={viagem.id}
                        className="rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-indigo-200 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-800 leading-snug break-words">
                              {viagem.clientes?.nome ||
                                "Cliente não informado"}
                            </h3>

                            <p className="text-xs text-slate-500 mt-1 break-words">
                              {viagem.clientes?.cpf_cnpj ||
                                "Documento não informado"}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusClasse(
                              viagem.status_viagem || "Confirmada"
                            )}`}
                          >
                            {viagem.status_viagem || "Confirmada"}
                          </span>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <p className="text-[11px] text-slate-500">Rota</p>

                          <p className="text-sm font-medium text-slate-800 mt-1 break-words">
                            {viagem.origem || "-"} → {viagem.destino || "-"}
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="rounded-lg border border-slate-100 p-2">
                            <p className="text-slate-500">Retorno</p>

                            <p className="text-slate-800 font-medium mt-1">
                              {formatarData(viagem.data_retorno)}
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-100 p-2">
                            <p className="text-slate-500">Valor</p>

                            <p className="text-indigo-700 font-semibold mt-1">
                              {formatarMoeda(viagem.valor_total)}
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-100 p-2">
                            <p className="text-slate-500">Recebido</p>

                            <p className="text-green-700 font-semibold mt-1">
                              {formatarMoeda(viagem.valor_pago)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => alternarDetalhes(viagem.id)}
                          className="mt-3 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          {detalhesAberto
                            ? "Ocultar dados da viagem"
                            : "+ Ver dados da viagem"}
                        </button>

                        {detalhesAberto && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Saída</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {formatarData(viagem.data_saida)}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Tipo</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {viagem.tipo_viagem || "-"}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">KM</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {viagem.km_total || 0} km
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Carros</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {viagem.numero_carros || 1}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Carro</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {viagem.numero_carro || "-"}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Motorista</p>

                              <p className="text-slate-800 font-medium mt-1 break-words">
                                {mostrarMotorista(viagem)}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Forma pagamento</p>

                              <p className="text-slate-800 font-medium mt-1">
                                {viagem.forma_pagamento || "-"}
                              </p>
                            </div>

                            <div className="rounded-lg border border-slate-100 p-2">
                              <p className="text-slate-500">Restante</p>

                              <p className="text-red-600 font-semibold mt-1">
                                {formatarMoeda(viagem.valor_restante)}
                              </p>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500 text-center mb-3">
                    Mostrando {viagensExibidas.length} de{" "}
                    {viagensFiltradas.length} viagem(ns)
                  </p>

                  {limiteExibicao < viagensFiltradas.length && (
                    <button
                      type="button"
                      onClick={() => setLimiteExibicao((atual) => atual + 5)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Carregar mais histórico
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