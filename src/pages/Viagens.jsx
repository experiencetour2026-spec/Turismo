import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Viagens() {
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
  const [viagens, setViagens] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarViagens()
  }, [])

  async function carregarViagens() {
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
      .gte("data_retorno", agora)
      .order("data_saida", { ascending: true })

    setLoading(false)

    if (error) {
      console.error(error)
      alert("Erro ao carregar viagens.")
      return
    }

    setViagens(data || [])
  }

  async function excluirViagem(id) {
    const confirmar = window.confirm("Deseja realmente excluir esta viagem?")

    if (!confirmar) return

    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)
      alert("Erro ao excluir viagem.")
      return
    }

    carregarViagens()
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

  function statusClasse(status) {
    if (status === "Cancelada") {
      return "bg-red-100 text-red-700"
    }

    return "bg-green-100 text-green-700"
  }

  function mostrarMotorista(viagem) {
    if (viagem.quantidade_motoristas === 2 && viagem.matricula_motorista_2) {
      return `${viagem.matricula_motorista_1 || "-"} / ${viagem.matricula_motorista_2}`
    }

    return viagem.matricula_motorista_1 || "-"
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
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setMenuAberto(true)}
            className="text-slate-700 text-2xl hover:text-indigo-700"
          >
            ☰
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Viagens
            </h1>

            <p className="text-sm text-slate-500">
              Viagens atuais e futuras
            </p>
          </div>
        </header>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Lista de viagens
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">
              Carregando viagens...
            </p>
          ) : viagens.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma viagem atual ou futura cadastrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-4">Cliente</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Tipo</th>
                    <th className="py-3 pr-4">Origem</th>
                    <th className="py-3 pr-4">Destino</th>
                    <th className="py-3 pr-4">Saída</th>
                    <th className="py-3 pr-4">Retorno</th>
                    <th className="py-3 pr-4">KM</th>
                    <th className="py-3 pr-4">Carro</th>
                    <th className="py-3 pr-4">Motorista</th>
                    <th className="py-3 pr-4">Valor</th>
                    <th className="py-3 pr-4">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {viagens.map((viagem) => (
                    <tr
                      key={viagem.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {viagem.clientes?.nome || "Cliente não informado"}
                      </td>

                      <td className="py-3 pr-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasse(
                            viagem.status_viagem
                          )}`}
                        >
                          {viagem.status_viagem || "Confirmada"}
                        </span>
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {viagem.tipo_viagem}
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
                        {viagem.numero_carro || "-"}
                      </td>

                      <td className="py-3 pr-4 text-slate-600">
                        {mostrarMotorista(viagem)}
                      </td>

                      <td className="py-3 pr-4 font-medium text-indigo-700">
                        {formatarMoeda(viagem.valor_total)}
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => navigate(`/viagens/${viagem.id}`)}
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            Detalhes
                          </button>

                          <button
                            onClick={() => excluirViagem(viagem.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Excluir
                          </button>
                        </div>
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