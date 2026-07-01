import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Relatorios() {
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
  const [viagens, setViagens] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [limiteExibicao, setLimiteExibicao] = useState(5)
  const [detalhesAbertos, setDetalhesAbertos] = useState({})

  const hoje = new Date()

  const [mesSelecionado, setMesSelecionado] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  )

  const [tipoViagemFiltro, setTipoViagemFiltro] = useState("Todos")
  const [pagamentoFiltro, setPagamentoFiltro] = useState("Todos")

  useEffect(() => {
    carregarRelatorio()
  }, [])

  useEffect(() => {
    setLimiteExibicao(5)
  }, [busca, mesSelecionado, tipoViagemFiltro, pagamentoFiltro])

  async function carregarRelatorio() {
    setLoading(true)

    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        clientes (
          nome,
          cpf_cnpj
        )
      `)
      .order("data_saida", { ascending: false })

    setLoading(false)

    if (error) {
      console.error(error)
      alert("Erro ao carregar relatórios.")
      return
    }

    setViagens(data || [])
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

  function dentroDoMes(data) {
    if (!data) return false

    const d = new Date(data)

    const anoMes = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`

    return anoMes === mesSelecionado
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

  const viagensDoMes = useMemo(() => {
    return viagens.filter((viagem) => {
      const estaNoMes = dentroDoMes(viagem.data_saida)

      const bateTipo =
        tipoViagemFiltro === "Todos" ||
        viagem.tipo_viagem === tipoViagemFiltro

      const batePagamento =
        pagamentoFiltro === "Todos" ||
        (pagamentoFiltro === "Faturado" &&
          viagem.forma_pagamento === "Faturado") ||
        (pagamentoFiltro === "NaoFaturado" &&
          viagem.forma_pagamento !== "Faturado")

      return estaNoMes && bateTipo && batePagamento
    })
  }, [viagens, mesSelecionado, tipoViagemFiltro, pagamentoFiltro])

  const viagensRelatorio = useMemo(() => {
    const texto = busca.toLowerCase().trim()

    if (!texto) return viagensDoMes

    return viagensDoMes.filter((item) =>
      `
        ${item.clientes?.nome || ""}
        ${item.clientes?.cpf_cnpj || ""}
        ${item.tipo_viagem || ""}
        ${item.origem || ""}
        ${item.destino || ""}
        ${item.forma_pagamento || ""}
        ${item.status || ""}
        ${item.status_viagem || ""}
      `
        .toLowerCase()
        .includes(texto)
    )
  }, [viagensDoMes, busca])

  const viagensExibidas = viagensRelatorio.slice(0, limiteExibicao)

  const resumo = useMemo(() => {
    const receitaMensal = viagensRelatorio.reduce(
      (total, item) => total + Number(item.valor_total || 0),
      0
    )

    const totalRecebido = viagensRelatorio.reduce(
      (total, item) => total + Number(item.valor_pago || 0),
      0
    )

    const totalPendente = viagensRelatorio.reduce(
      (total, item) => total + Number(item.valor_restante || 0),
      0
    )

    const totalFaturado = viagensRelatorio
      .filter((item) => item.forma_pagamento === "Faturado")
      .reduce((total, item) => total + Number(item.valor_total || 0), 0)

    const viagensCanceladas = viagensRelatorio.filter(
      (item) => item.status_viagem === "Cancelada"
    ).length

    return {
      receitaMensal,
      totalRecebido,
      totalPendente,
      totalFaturado,
      quantidadeViagens: viagensRelatorio.length,
      viagensCanceladas,
    }
  }, [viagensRelatorio])

  function baixarPDF() {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    doc.setFontSize(18)
    doc.text("Relatório Mensal - Turismo", 14, 18)

    doc.setFontSize(10)

    const esquerda = 14
    const direita = 150

    doc.text(`Mês: ${mesSelecionado}`, esquerda, 30)
    doc.text(`Tipo de viagem: ${tipoViagemFiltro}`, direita, 30)

    doc.text(`Pagamento: ${pagamentoFiltro}`, esquerda, 38)
    doc.text(
      `Receita mensal: ${formatarMoeda(resumo.receitaMensal)}`,
      direita,
      38
    )

    doc.text(
      `Total recebido: ${formatarMoeda(resumo.totalRecebido)}`,
      esquerda,
      46
    )

    doc.text(
      `Total pendente: ${formatarMoeda(resumo.totalPendente)}`,
      direita,
      46
    )

    doc.text(
      `Total faturado: ${formatarMoeda(resumo.totalFaturado)}`,
      esquerda,
      54
    )

    doc.text(`Viagens do mês: ${resumo.quantidadeViagens}`, direita, 54)

    doc.text(`Canceladas: ${resumo.viagensCanceladas}`, esquerda, 62)

    autoTable(doc, {
      startY: 72,

      head: [
        [
          "Data",
          "Cliente",
          "Tipo",
          "Origem",
          "Destino",
          "Pagamento",
          "Faturado",
          "Status",
          "Valor Final",
          "Recebido",
          "Pendente",
        ],
      ],

      body: viagensRelatorio.map((item) => [
        formatarData(item.data_saida),
        item.clientes?.nome || "Cliente não informado",
        item.tipo_viagem || "-",
        item.origem || "-",
        item.destino || "-",
        item.forma_pagamento || "-",
        item.forma_pagamento === "Faturado" ? "Sim" : "Não",
        item.status || item.status_viagem || "Reservada",
        formatarMoeda(item.valor_total),
        formatarMoeda(item.valor_pago),
        formatarMoeda(item.valor_restante),
      ]),

      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },

      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },

      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 55 },
        2: { cellWidth: 18 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 24 },
        6: { cellWidth: 18 },
        7: { cellWidth: 25 },
        8: { cellWidth: 26 },
        9: { cellWidth: 24 },
        10: { cellWidth: 26 },
      },

      margin: {
        left: 8,
        right: 8,
      },
    })

    doc.save(
      `relatorio-${mesSelecionado}-${tipoViagemFiltro}-${pagamentoFiltro}.pdf`
    )
  }

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
                  Relatórios
                </h1>

                <p className="text-xs sm:text-sm text-slate-500">
                  Resumo financeiro e operacional das viagens
                </p>
              </div>
            </div>
          </header>

          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                  Filtros do relatório
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Selecione o período, tipo de viagem e forma de pagamento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
                <input
                  type="month"
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <select
                  value={tipoViagemFiltro}
                  onChange={(e) => setTipoViagemFiltro(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Todos">Todos os tipos</option>
                  <option value="Citytour">Citytour</option>
                  <option value="Turismo">Turismo</option>
                </select>

                <select
                  value={pagamentoFiltro}
                  onChange={(e) => setPagamentoFiltro(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Todos">Todos os pagamentos</option>
                  <option value="Faturado">Somente faturados</option>
                  <option value="NaoFaturado">Não faturados</option>
                </select>

                <button
                  type="button"
                  onClick={baixarPDF}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                >
                  Baixar PDF
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Carregando relatórios...
              </p>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
                  <p className="text-[11px] sm:text-sm text-slate-500">
                    Receita
                  </p>

                  <h2 className="text-sm sm:text-xl font-semibold text-slate-800 mt-1 sm:mt-2 break-words">
                    {formatarMoeda(resumo.receitaMensal)}
                  </h2>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
                  <p className="text-[11px] sm:text-sm text-slate-500">
                    Recebido
                  </p>

                  <h2 className="text-sm sm:text-xl font-semibold text-green-700 mt-1 sm:mt-2 break-words">
                    {formatarMoeda(resumo.totalRecebido)}
                  </h2>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
                  <p className="text-[11px] sm:text-sm text-slate-500">
                    Pendente
                  </p>

                  <h2 className="text-sm sm:text-xl font-semibold text-red-700 mt-1 sm:mt-2 break-words">
                    {formatarMoeda(resumo.totalPendente)}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setPagamentoFiltro("Faturado")}
                  className="text-left bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                  <p className="text-[11px] sm:text-sm text-slate-500">
                    Faturado
                  </p>

                  <h2 className="text-sm sm:text-xl font-semibold text-indigo-700 mt-1 sm:mt-2 break-words">
                    {formatarMoeda(resumo.totalFaturado)}
                  </h2>
                </button>

                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
                  <p className="text-[11px] sm:text-sm text-slate-500">
                    Viagens
                  </p>

                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 sm:mt-2">
                    {resumo.quantidadeViagens}
                  </h2>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
                  <p className="text-[11px] sm:text-sm text-slate-500">
                    Canceladas
                  </p>

                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 sm:mt-2">
                    {resumo.viagensCanceladas}
                  </h2>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm mb-4 sm:mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                      Relatório discriminado
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500">
                      Tipo: <b>{tipoViagemFiltro}</b> | Pagamento:{" "}
                      <b>{pagamentoFiltro}</b>
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
                {viagensRelatorio.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Nenhuma viagem encontrada para este filtro.
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Altere o mês, o tipo de viagem ou a forma de pagamento.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {viagensExibidas.map((item) => {
                        const detalhesAberto = detalhesAbertos[item.id]
                        const statusAtual =
                          item.status || item.status_viagem || "Reservada"

                        return (
                          <article
                            key={item.id}
                            className="rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-indigo-200 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-slate-800 leading-snug break-words">
                                  {item.clientes?.nome ||
                                    "Cliente não informado"}
                                </h3>

                                <p className="text-xs text-slate-500 mt-1 break-words">
                                  {formatarData(item.data_saida)}
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
                              <p className="text-[11px] text-slate-500">
                                Rota
                              </p>

                              <p className="text-sm font-medium text-slate-800 mt-1 break-words">
                                {item.origem || "-"} → {item.destino || "-"}
                              </p>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="rounded-lg border border-slate-100 p-2">
                                <p className="text-slate-500">Valor final</p>

                                <p className="text-indigo-700 font-semibold mt-1">
                                  {formatarMoeda(item.valor_total)}
                                </p>
                              </div>

                              <div className="rounded-lg border border-slate-100 p-2">
                                <p className="text-slate-500">Recebido</p>

                                <p className="text-green-700 font-semibold mt-1">
                                  {formatarMoeda(item.valor_pago)}
                                </p>
                              </div>

                              <div className="rounded-lg border border-slate-100 p-2">
                                <p className="text-slate-500">Pendente</p>

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
                                : "+ Ver dados do relatório"}
                            </button>

                            {detalhesAberto && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="rounded-lg border border-slate-100 p-2">
                                  <p className="text-slate-500">Tipo</p>

                                  <p className="text-slate-800 font-medium mt-1">
                                    {item.tipo_viagem || "-"}
                                  </p>
                                </div>

                                <div className="rounded-lg border border-slate-100 p-2">
                                  <p className="text-slate-500">Pagamento</p>

                                  <p className="text-slate-800 font-medium mt-1">
                                    {item.forma_pagamento || "-"}
                                  </p>
                                </div>

                                <div className="rounded-lg border border-slate-100 p-2">
                                  <p className="text-slate-500">Faturado</p>

                                  <p
                                    className={`font-medium mt-1 ${
                                      item.forma_pagamento === "Faturado"
                                        ? "text-indigo-700"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {item.forma_pagamento === "Faturado"
                                      ? "Sim"
                                      : "Não"}
                                  </p>
                                </div>

                                <div className="rounded-lg border border-slate-100 p-2">
                                  <p className="text-slate-500">Documento</p>

                                  <p className="text-slate-800 font-medium mt-1 break-words">
                                    {item.clientes?.cpf_cnpj ||
                                      "Não informado"}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="mt-4">
                              {Number(item.valor_restante || 0) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/viagens/${item.id}?voltar=relatorios`
                                    )
                                  }
                                  className="w-full px-3 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
                                >
                                  Receber
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
                        Mostrando {viagensExibidas.length} de{" "}
                        {viagensRelatorio.length} registro(s)
                      </p>

                      {limiteExibicao < viagensRelatorio.length && (
                        <button
                          type="button"
                          onClick={() =>
                            setLimiteExibicao((atual) => atual + 5)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Carregar mais registros
                        </button>
                      )}
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  )
}