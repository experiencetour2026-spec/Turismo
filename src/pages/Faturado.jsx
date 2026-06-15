import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Faturado() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [faturados, setFaturados] = useState([])
  const [loading, setLoading] = useState(true)

  const [reservaSelecionada, setReservaSelecionada] = useState(null)
  const [valorRecebido, setValorRecebido] = useState("")
  const [observacao, setObservacao] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarFaturados()
  }, [])

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
    return new Date(data).toLocaleDateString("pt-BR")
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

  return (
    <>
      <Sidebar aberto={menuAberto} onClose={() => setMenuAberto(false)} />

      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {reservaSelecionada && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <form
            onSubmit={salvarRecebimento}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold text-slate-800">
              Lançar Recebimento
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {reservaSelecionada.clientes?.nome || "Cliente não informado"}
            </p>

            <div className="mt-5 space-y-4">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm">
                <p className="text-slate-500">
                  Valor final:{" "}
                  <span className="font-medium text-slate-800">
                    {formatarMoeda(reservaSelecionada.valor_total)}
                  </span>
                </p>

                <p className="text-slate-500 mt-1">
                  Já recebido:{" "}
                  <span className="font-medium text-green-700">
                    {formatarMoeda(reservaSelecionada.valor_pago)}
                  </span>
                </p>

                <p className="text-slate-500 mt-1">
                  Saldo pendente:{" "}
                  <span className="font-medium text-red-700">
                    {formatarMoeda(reservaSelecionada.valor_restante)}
                  </span>
                </p>
              </div>

              <input
                type="number"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="Valor recebido agora"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              />

              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observação"
                rows="3"
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={fecharLancamento}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600"
              >
                Cancelar
              </button>

              <button
                disabled={salvando}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="min-h-screen bg-slate-100 p-6">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setMenuAberto(true)}
            className="text-slate-700 text-2xl hover:text-indigo-700"
          >
            ☰
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Faturado
            </h1>

            <p className="text-sm text-slate-500">
              Viagens faturadas ou vencidas com saldo pendente
            </p>
          </div>
        </header>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Lista de faturados e pendências vencidas
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">
              Carregando faturados...
            </p>
          ) : faturados.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma viagem faturada ou pendência vencida encontrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-4">Cliente</th>
                    <th className="py-3 pr-4">Data</th>
                    <th className="py-3 pr-4">Origem</th>
                    <th className="py-3 pr-4">Destino</th>
                    <th className="py-3 pr-4">Valor Final</th>
                    <th className="py-3 pr-4">Valor Pago</th>
                    <th className="py-3 pr-4">Falta Pagar</th>
                    <th className="py-3 pr-4">Forma</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {faturados.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {item.clientes?.nome || "Cliente não informado"}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {formatarData(item.data_saida)}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {item.origem}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {item.destino}
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

                      <td className="py-3 pr-4 text-slate-600">
                        {item.forma_pagamento || "-"}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {item.status || "Reservada"}
                      </td>

                      <td className="py-3 pr-4">
                        {Number(item.valor_restante || 0) > 0 ? (
                          <button
                            onClick={() => abrirLancamento(item)}
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            Lançar Recebimento
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
      </div>
    </>
  )
}