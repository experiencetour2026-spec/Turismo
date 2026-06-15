import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Agenda() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [viagens, setViagens] = useState([])
  const [loading, setLoading] = useState(true)
  const [mesAtual, setMesAtual] = useState(new Date())
  const [diaSelecionado, setDiaSelecionado] = useState(new Date())

  useEffect(() => {
    carregarAgenda()
  }, [])

  async function carregarAgenda() {
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
      .order("data_saida", { ascending: true })

    setLoading(false)

    if (error) {
      console.error(error)
      alert("Erro ao carregar agenda.")
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

  function formatarHora(data) {
    if (!data) return "-"

    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function chaveData(data) {
    return new Date(data).toISOString().slice(0, 10)
  }

  function gerarDiasViagem(dataInicio, dataFim) {
    if (!dataInicio) return []

    const inicio = new Date(dataInicio)
    const fim = dataFim ? new Date(dataFim) : new Date(dataInicio)

    inicio.setHours(0, 0, 0, 0)
    fim.setHours(0, 0, 0, 0)

    const dias = []
    const atual = new Date(inicio)

    while (atual <= fim) {
      dias.push(chaveData(atual))
      atual.setDate(atual.getDate() + 1)
    }

    return dias
  }

  function dataLocalInput(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
  }

  function irMesAnterior() {
    setMesAtual(
      new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1)
    )
  }

  function irProximoMes() {
    setMesAtual(
      new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1)
    )
  }

  function buscarPorData(e) {
    const valor = e.target.value
    if (!valor) return

    const [ano, mes, dia] = valor.split("-").map(Number)
    const novaData = new Date(ano, mes - 1, dia)

    setMesAtual(new Date(ano, mes - 1, 1))
    setDiaSelecionado(novaData)
  }

  const viagensPorDia = useMemo(() => {
    const agrupado = {}

    viagens.forEach((viagem) => {
      const dias = gerarDiasViagem(
        viagem.data_saida,
        viagem.data_retorno
      )

      dias.forEach((dia) => {
        if (!agrupado[dia]) {
          agrupado[dia] = []
        }

        agrupado[dia].push(viagem)
      })
    })

    return agrupado
  }, [viagens])

  const diasDoCalendario = useMemo(() => {
    const ano = mesAtual.getFullYear()
    const mes = mesAtual.getMonth()

    const primeiroDiaMes = new Date(ano, mes, 1)
    const ultimoDiaMes = new Date(ano, mes + 1, 0)

    const inicioCalendario = new Date(primeiroDiaMes)
    inicioCalendario.setDate(
      primeiroDiaMes.getDate() - primeiroDiaMes.getDay()
    )

    const fimCalendario = new Date(ultimoDiaMes)
    fimCalendario.setDate(
      ultimoDiaMes.getDate() + (6 - ultimoDiaMes.getDay())
    )

    const dias = []
    const data = new Date(inicioCalendario)

    while (data <= fimCalendario) {
      dias.push(new Date(data))
      data.setDate(data.getDate() + 1)
    }

    return dias
  }, [mesAtual])

  const viagensDoDiaSelecionado = useMemo(() => {
    const chave = dataLocalInput(diaSelecionado)
    return viagensPorDia[chave] || []
  }, [diaSelecionado, viagensPorDia])

  function corStatus(status) {
    switch (status) {
      case "Reservada":
        return "bg-yellow-100 text-yellow-700"
      case "Sinal pago":
        return "bg-orange-100 text-orange-700"
      case "Confirmada":
        return "bg-indigo-100 text-indigo-700"
      case "Em andamento":
        return "bg-green-100 text-green-700"
      case "Finalizada":
        return "bg-slate-200 text-slate-700"
      case "Cancelada":
        return "bg-red-100 text-red-700"
      default:
        return "bg-slate-100 text-slate-600"
    }
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
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuAberto(true)}
              className="text-slate-700 text-2xl hover:text-indigo-700"
            >
              ☰
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                Agenda
              </h1>

              <p className="text-sm text-slate-500">
                Calendário mensal de viagens
              </p>
            </div>
          </div>

          <div>
            <input
              type="date"
              value={dataLocalInput(diaSelecionado)}
              onChange={buscarPorData}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            />
          </div>
        </header>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">Carregando agenda...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={irMesAnterior}
                  className="text-sm text-slate-600 hover:text-indigo-700"
                >
                  ← Mês anterior
                </button>

                <h2 className="text-lg font-semibold text-slate-800 capitalize">
                  {mesAtual.toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>

                <button
                  onClick={irProximoMes}
                  className="text-sm text-slate-600 hover:text-indigo-700"
                >
                  Próximo mês →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-slate-500">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {diasDoCalendario.map((dia) => {
                  const chave = dataLocalInput(dia)
                  const viagensDia = viagensPorDia[chave] || []
                  const foraDoMes =
                    dia.getMonth() !== mesAtual.getMonth()
                  const selecionado =
                    chave === dataLocalInput(diaSelecionado)

                  return (
                    <button
                      key={chave}
                      onClick={() => setDiaSelecionado(dia)}
                      className={`
                        min-h-24
                        rounded-xl
                        border
                        p-2
                        text-left
                        transition
                        ${
                          selecionado
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                        }
                        ${
                          foraDoMes
                            ? "opacity-40"
                            : "opacity-100"
                        }
                      `}
                    >
                      <p className="text-sm font-medium text-slate-700">
                        {dia.getDate()}
                      </p>

                      {viagensDia.length > 0 && (
                        <p className="mt-2 inline-block rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                          {viagensDia.length} viagem(ns)
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            <aside className="bg-white rounded-2xl border border-slate-200 p-6 h-fit">
              <h2 className="text-lg font-semibold text-slate-800">
                Viagens do dia {formatarData(diaSelecionado)}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {viagensDoDiaSelecionado.length} viagem(ns) encontrada(s)
              </p>

              <div className="mt-6 space-y-4">
                {viagensDoDiaSelecionado.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Nenhuma viagem cadastrada para este dia.
                  </p>
                ) : (
                  viagensDoDiaSelecionado.map((viagem) => (
                    <div
                      key={viagem.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-800">
                            {viagem.clientes?.nome ||
                              "Cliente não informado"}
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            {viagem.origem} → {viagem.destino}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            Saída: {formatarData(viagem.data_saida)} às{" "}
                            {formatarHora(viagem.data_saida)}
                          </p>

                          <p className="text-xs text-slate-500">
                            Retorno: {formatarData(viagem.data_retorno)} às{" "}
                            {formatarHora(viagem.data_retorno)}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${corStatus(
                            viagem.status
                          )}`}
                        >
                          {viagem.status || "Reservada"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                        <div>
                          <p className="text-slate-400">Final</p>
                          <p className="font-medium text-slate-700">
                            {formatarMoeda(viagem.valor_total)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400">Pago</p>
                          <p className="font-medium text-green-700">
                            {formatarMoeda(viagem.valor_pago)}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400">Restante</p>
                          <p className="font-medium text-red-700">
                            {formatarMoeda(viagem.valor_restante)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  )
}