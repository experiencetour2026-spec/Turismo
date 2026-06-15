import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function HistoricoViagens() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [viagens, setViagens] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")

  useEffect(() => {
    carregarHistorico()
  }, [])

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

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  function formatarData(data) {
    if (!data) return "-"
    return new Date(data).toLocaleString("pt-BR")
  }

  const viagensFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim()

    if (!termo) return viagens

    return viagens.filter((viagem) => {
      return (
        viagem.clientes?.nome?.toLowerCase().includes(termo) ||
        viagem.origem?.toLowerCase().includes(termo) ||
        viagem.destino?.toLowerCase().includes(termo) ||
        viagem.status_viagem?.toLowerCase().includes(termo)
      )
    })
  }, [busca, viagens])

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
                Histórico de Viagens
              </h1>

              <p className="text-sm text-slate-500">
                Viagens finalizadas nos últimos 60 dias
              </p>
            </div>
          </div>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar histórico..."
            className="w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
        </header>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Viagens no histórico
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">
              Carregando histórico...
            </p>
          ) : viagensFiltradas.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma viagem encontrada no histórico.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-4">Cliente</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Origem</th>
                    <th className="py-3 pr-4">Destino</th>
                    <th className="py-3 pr-4">Saída</th>
                    <th className="py-3 pr-4">Retorno</th>
                    <th className="py-3 pr-4">KM</th>
                    <th className="py-3 pr-4">Carros</th>
                    <th className="py-3 pr-4">Motorista</th>
                    <th className="py-3 pr-4">Valor</th>
                    <th className="py-3 pr-4">Recebido</th>
                    <th className="py-3 pr-4">Restante</th>
                  </tr>
                </thead>

                <tbody>
                  {viagensFiltradas.map((viagem) => (
                    <tr
                      key={viagem.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {viagem.clientes?.nome || "Cliente não informado"}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {viagem.status_viagem || "Confirmada"}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {viagem.origem}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {viagem.destino}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {formatarData(viagem.data_saida)}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {formatarData(viagem.data_retorno)}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {viagem.km_total}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {viagem.numero_carros}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {viagem.despesa_motorista || "Cliente"}
                      </td>

                      <td className="py-3 pr-4 font-medium text-indigo-700">
                        {formatarMoeda(viagem.valor_total)}
                      </td>

                      <td className="py-3 pr-4 font-medium text-green-700">
                        {formatarMoeda(viagem.valor_pago)}
                      </td>

                      <td className="py-3 pr-4 font-medium text-red-700">
                        {formatarMoeda(viagem.valor_restante)}
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