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

  const hoje = new Date()

  const [mesSelecionado, setMesSelecionado] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  )

  const [tipoViagemFiltro, setTipoViagemFiltro] = useState("Todos")
  const [pagamentoFiltro, setPagamentoFiltro] = useState("Todos")

  useEffect(() => {
    carregarRelatorio()
  }, [])

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
    return new Date(data).toLocaleDateString("pt-BR")
  }

  function dentroDoMes(data) {
    if (!data) return false

    const d = new Date(data)

    const anoMes = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`

    return anoMes === mesSelecionado
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

  const resumo = useMemo(() => {
    const receitaMensal = viagensDoMes.reduce(
      (total, item) => total + Number(item.valor_total || 0),
      0
    )

    const totalRecebido = viagensDoMes.reduce(
      (total, item) => total + Number(item.valor_pago || 0),
      0
    )

    const totalPendente = viagensDoMes.reduce(
      (total, item) => total + Number(item.valor_restante || 0),
      0
    )

    const totalFaturado = viagensDoMes
      .filter((item) => item.forma_pagamento === "Faturado")
      .reduce((total, item) => total + Number(item.valor_total || 0), 0)

    const viagensCanceladas = viagensDoMes.filter(
      (item) => item.status_viagem === "Cancelada"
    ).length

    return {
      receitaMensal,
      totalRecebido,
      totalPendente,
      totalFaturado,
      quantidadeViagens: viagensDoMes.length,
      viagensCanceladas,
    }
  }, [viagensDoMes])

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

  doc.text(
    `Viagens do mês: ${resumo.quantidadeViagens}`,
    direita,
    54
  )

  doc.text(
    `Canceladas: ${resumo.viagensCanceladas}`,
    esquerda,
    62
  )

  autoTable(doc, {
    startY: 72,

    head: [[
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
      "Pendente"
    ]],

    body: viagensDoMes.map((item) => [
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
      0: { cellWidth: 18 }, // Data
      1: { cellWidth: 55 }, // Cliente
      2: { cellWidth: 18 }, // Tipo
      3: { cellWidth: 30 }, // Origem
      4: { cellWidth: 30 }, // Destino
      5: { cellWidth: 24 }, // Pagamento
      6: { cellWidth: 18 }, // Faturado
      7: { cellWidth: 25 }, // Status
      8: { cellWidth: 26 }, // Valor Final
      9: { cellWidth: 24 }, // Recebido
      10: { cellWidth: 26 }, // Pendente
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

      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      <div className="min-h-screen bg-slate-100 p-6">
        <header className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuAberto(true)}
              className="text-slate-700 text-2xl hover:text-indigo-700"
            >
              ☰
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                Relatórios
              </h1>

              <p className="text-sm text-slate-500">
                Resumo financeiro e operacional das viagens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <input
              type="month"
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />

            <select
              value={tipoViagemFiltro}
              onChange={(e) => setTipoViagemFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="Todos">Todos os tipos</option>
              <option value="Citytour">Citytour</option>
              <option value="Turismo">Turismo</option>
            </select>

            <select
              value={pagamentoFiltro}
              onChange={(e) => setPagamentoFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              <option value="Todos">Todos os pagamentos</option>
              <option value="Faturado">Somente faturados</option>
              <option value="NaoFaturado">Não faturados</option>
            </select>

            <button
              onClick={baixarPDF}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Baixar PDF
            </button>
          </div>
        </header>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">
              Carregando relatórios...
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Receita mensal</p>
                <h2 className="text-2xl font-semibold text-slate-800 mt-2">
                  {formatarMoeda(resumo.receitaMensal)}
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Total recebido</p>
                <h2 className="text-2xl font-semibold text-green-700 mt-2">
                  {formatarMoeda(resumo.totalRecebido)}
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Total pendente</p>
                <h2 className="text-2xl font-semibold text-red-700 mt-2">
                  {formatarMoeda(resumo.totalPendente)}
                </h2>
              </div>

              <div
                onClick={() => setPagamentoFiltro("Faturado")}
                className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition"
              >
                <p className="text-sm text-slate-500">Total faturado</p>

                <h2 className="text-2xl font-semibold text-indigo-700 mt-2">
                  {formatarMoeda(resumo.totalFaturado)}
                </h2>

                <p className="text-xs text-indigo-600 mt-2">
                  Filtrar faturados →
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Viagens do mês</p>
                <h2 className="text-2xl font-semibold text-slate-800 mt-2">
                  {resumo.quantidadeViagens}
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-sm text-slate-500">Canceladas</p>
                <h2 className="text-2xl font-semibold text-slate-800 mt-2">
                  {resumo.viagensCanceladas}
                </h2>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Relatório discriminado
                </h2>

                <p className="text-sm text-slate-500">
                  Tipo: <b>{tipoViagemFiltro}</b> | Pagamento:{" "}
                  <b>{pagamentoFiltro}</b>
                </p>
              </div>

              {viagensDoMes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma viagem encontrada para este filtro.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="py-3 pr-4">Data</th>
                        <th className="py-3 pr-4">Cliente</th>
                        <th className="py-3 pr-4">Tipo de Viagem</th>
                        <th className="py-3 pr-4">Origem</th>
                        <th className="py-3 pr-4">Destino</th>
                        <th className="py-3 pr-4">Pagamento</th>
                        <th className="py-3 pr-4">Faturado</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 pr-4">Valor Final</th>
                        <th className="py-3 pr-4">Recebido</th>
                        <th className="py-3 pr-4">Pendente</th>
                        <th className="py-3 pr-4">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {viagensDoMes.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-3 pr-4 text-slate-600">
                            {formatarData(item.data_saida)}
                          </td>

                          <td className="py-3 pr-4 font-medium text-slate-800">
                            {item.clientes?.nome || "Cliente não informado"}
                          </td>

                          <td className="py-3 pr-4 text-slate-600">
                            {item.tipo_viagem || "-"}
                          </td>

                          <td className="py-3 pr-4 text-slate-600">
                            {item.origem}
                          </td>

                          <td className="py-3 pr-4 text-slate-600">
                            {item.destino}
                          </td>

                          <td className="py-3 pr-4 text-slate-600">
                            {item.forma_pagamento || "-"}
                          </td>

                          <td className="py-3 pr-4">
                            {item.forma_pagamento === "Faturado" ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                                Sim
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-500">
                                Não
                              </span>
                            )}
                          </td>

                          <td className="py-3 pr-4 text-slate-600">
                            {item.status || item.status_viagem || "Reservada"}
                          </td>

                          <td className="py-3 pr-4 font-medium text-slate-800">
                            {formatarMoeda(item.valor_total)}
                          </td>

                          <td className="py-3 pr-4 font-medium text-green-700">
                            {formatarMoeda(item.valor_pago)}
                          </td>

                          <td className="py-3 pr-4 font-medium text-red-700">
                            {formatarMoeda(item.valor_restante)}
                          </td>

                          <td className="py-3 pr-4">
                            {Number(item.valor_restante || 0) > 0 ? (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/viagens/${item.id}?voltar=relatorios`
                                  )
                                }
                                className="text-sm text-indigo-600 hover:underline"
                              >
                                Receber
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Quitado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  )
}