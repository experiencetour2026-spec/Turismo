import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function ViagemDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const voltar = searchParams.get("voltar")

  const [menuAberto, setMenuAberto] = useState(false)
  const [clientes, setClientes] = useState([])
  const [recebimentos, setRecebimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false)

  const [novoRecebimento, setNovoRecebimento] = useState("")
  const [observacaoRecebimento, setObservacaoRecebimento] = useState("")

  const VALOR_KM = 10
  const VALOR_DIARIA_PARADO = 750

  const [form, setForm] = useState({
    cliente_id: "",
    tipo_viagem: "Citytour",
    numero_carros: 1,
    numero_carro: "",
    origem: "",
    destino: "",
    km_total: "",
    data_saida: "",
    data_retorno: "",
    dias_parados: "",
    quantidade_motoristas: 1,
    matricula_motorista_1: "",
    matricula_motorista_2: "",
    despesa_motorista: "Cliente",
    valor_despesa_motorista: "",
    forma_pagamento: "Pix",
    valor_pago: "",
    status_viagem: "Confirmada",
  })

  useEffect(() => {
    carregarClientes()
    carregarViagem()
    carregarRecebimentos()
  }, [id])

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, cpf_cnpj")
      .order("nome")

    if (!error) setClientes(data || [])
  }

  async function carregarViagem() {
    setLoading(true)

    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("id", id)
      .single()

    setLoading(false)

    if (error) {
      console.error(error)
      alert("Viagem não encontrada.")
      navigate("/viagens")
      return
    }

    setForm({
      cliente_id: data.cliente_id || "",
      tipo_viagem: data.tipo_viagem || "Citytour",
      numero_carros: data.numero_carros || 1,
      numero_carro: data.numero_carro || "",
      origem: data.origem || "",
      destino: data.destino || "",
      km_total: data.km_total || "",
      data_saida: data.data_saida ? data.data_saida.slice(0, 16) : "",
      data_retorno: data.data_retorno ? data.data_retorno.slice(0, 16) : "",
      dias_parados: data.dias_parados || "",
      quantidade_motoristas: data.quantidade_motoristas || 1,
      matricula_motorista_1: data.matricula_motorista_1 || "",
      matricula_motorista_2: data.matricula_motorista_2 || "",
      despesa_motorista: data.despesa_motorista || "Cliente",
      valor_despesa_motorista: data.valor_despesa_motorista || "",
      forma_pagamento: data.forma_pagamento || "Pix",
      valor_pago: data.valor_pago || "",
      status_viagem: data.status_viagem || "Confirmada",
    })
  }

  async function carregarRecebimentos() {
    const { data, error } = await supabase
      .from("recebimentos")
      .select("*")
      .eq("reserva_id", id)
      .order("created_at", { ascending: false })

    if (!error) setRecebimentos(data || [])
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
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

  const quantidadeCarros = Number(form.numero_carros || 1)

  const valorKm =
    Number(form.km_total || 0) * VALOR_KM * quantidadeCarros

  const valorDiasParados =
    Number(form.dias_parados || 0) * VALOR_DIARIA_PARADO * quantidadeCarros

  const valorDespesaMotorista =
    form.despesa_motorista === "Empresa"
      ? Number(form.valor_despesa_motorista || 0)
      : 0

  const valorTotal = valorKm + valorDiasParados + valorDespesaMotorista
  const valorPago = Number(form.valor_pago || 0)
  const valorRestante = Math.max(valorTotal - valorPago, 0)

  const statusPagamento =
    valorPago > 0
      ? valorRestante === 0
        ? "Quitado"
        : "Pagamento Parcial"
      : "Reservada"

  async function salvarAlteracoes(e) {
    e.preventDefault()
    setSalvando(true)

    const payload = {
      ...form,
      numero_carros: Number(form.numero_carros),
      km_total: Number(form.km_total),
      dias_parados: Number(form.dias_parados || 0),
      quantidade_motoristas: Number(form.quantidade_motoristas),
      valor_despesa_motorista: valorDespesaMotorista,
      valor_total: valorTotal,
      valor_pago: valorPago,
      valor_restante: valorRestante,
      status: statusPagamento,
      matricula_motorista_2:
        Number(form.quantidade_motoristas) === 2
          ? form.matricula_motorista_2
          : "",
    }

    const { error } = await supabase
      .from("reservas")
      .update(payload)
      .eq("id", id)

    setSalvando(false)

    if (error) {
      console.error(error)
      alert("Erro ao salvar alterações.")
      return
    }

    alert("Viagem atualizada com sucesso.")
    carregarViagem()
  }

  async function lancarRecebimento(e) {
    e.preventDefault()

    const valor = Number(novoRecebimento || 0)

    if (valor <= 0) {
      alert("Informe um valor válido.")
      return
    }

    const novoValorPago = valorPago + valor
    const novoValorRestante = Math.max(valorTotal - novoValorPago, 0)
    const novoStatus = novoValorRestante === 0 ? "Quitado" : "Pagamento Parcial"

    setSalvandoRecebimento(true)

    const { error: erroRecebimento } = await supabase
      .from("recebimentos")
      .insert([
        {
          reserva_id: id,
          valor,
          observacao: observacaoRecebimento,
        },
      ])

    if (erroRecebimento) {
      setSalvandoRecebimento(false)
      console.error(erroRecebimento)
      alert("Erro ao lançar recebimento.")
      return
    }

    const { error: erroReserva } = await supabase
      .from("reservas")
      .update({
        valor_pago: novoValorPago,
        valor_restante: novoValorRestante,
        status: novoStatus,
      })
      .eq("id", id)

    setSalvandoRecebimento(false)

    if (erroReserva) {
      console.error(erroReserva)
      alert("Recebimento salvo, mas erro ao atualizar a viagem.")
      return
    }

    setNovoRecebimento("")
    setObservacaoRecebimento("")

    if (voltar === "relatorios") {
      navigate("/relatorios")
      return
    }

    carregarViagem()
    carregarRecebimentos()
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
                Detalhes da Viagem
              </h1>

              <p className="text-sm text-slate-500">
                Visualize, edite e acompanhe os recebimentos
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/viagens")}
            className="text-sm text-slate-600 hover:text-indigo-700"
          >
            Voltar
          </button>
        </header>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">Carregando viagem...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <form
              onSubmit={salvarAlteracoes}
              className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
            >
              <h2 className="text-lg font-semibold text-slate-800">
                Dados da viagem
              </h2>

              <select
                name="cliente_id"
                value={form.cliente_id}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              >
                <option value="">Selecione o cliente</option>

                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome} - {cliente.cpf_cnpj}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="status_viagem"
                  value={form.status_viagem}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  <option value="Confirmada">Confirmada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>

                <select
                  name="tipo_viagem"
                  value={form.tipo_viagem}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  <option>Citytour</option>
                  <option>Turismo</option>
                </select>

                <input
                  name="numero_carros"
                  type="number"
                  min="1"
                  value={form.numero_carros}
                  onChange={handleChange}
                  placeholder="Nº de Carros"
                  required
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <input
                  name="numero_carro"
                  value={form.numero_carro}
                  onChange={handleChange}
                  placeholder="Nº do carro"
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <input
                  name="matricula_motorista_1"
                  value={form.matricula_motorista_1}
                  onChange={handleChange}
                  placeholder="Matrícula + Motorista 1"
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                {Number(form.quantidade_motoristas) === 2 && (
                  <input
                    name="matricula_motorista_2"
                    value={form.matricula_motorista_2}
                    onChange={handleChange}
                    placeholder="Matrícula + Motorista 2"
                    className="rounded-lg border border-slate-300 px-4 py-2"
                  />
                )}

                <input
                  name="origem"
                  value={form.origem}
                  onChange={handleChange}
                  placeholder="Origem"
                  required
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <input
                  name="destino"
                  value={form.destino}
                  onChange={handleChange}
                  placeholder="Destino"
                  required
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <input
                  name="km_total"
                  type="number"
                  value={form.km_total}
                  onChange={handleChange}
                  placeholder="KM total"
                  required
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <input
                  name="dias_parados"
                  type="number"
                  value={form.dias_parados}
                  onChange={handleChange}
                  placeholder="Quantidade de dias parados"
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <input
                  name="data_saida"
                  type="datetime-local"
                  value={form.data_saida}
                  onChange={handleChange}
                  required
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <input
                  name="data_retorno"
                  type="datetime-local"
                  value={form.data_retorno}
                  onChange={handleChange}
                  required
                  className="rounded-lg border border-slate-300 px-4 py-2"
                />

                <select
                  name="quantidade_motoristas"
                  value={form.quantidade_motoristas}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  <option value="1">1 Motorista</option>
                  <option value="2">2 Motoristas</option>
                </select>

                <select
                  name="despesa_motorista"
                  value={form.despesa_motorista}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  <option value="Cliente">Despesa motorista: Cliente</option>
                  <option value="Empresa">Despesa motorista: Empresa</option>
                </select>

                {form.despesa_motorista === "Empresa" && (
                  <input
                    name="valor_despesa_motorista"
                    type="number"
                    value={form.valor_despesa_motorista}
                    onChange={handleChange}
                    placeholder="Valor da despesa do motorista"
                    className="rounded-lg border border-slate-300 px-4 py-2"
                  />
                )}

                <select
                  name="forma_pagamento"
                  value={form.forma_pagamento}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  <option>Pix</option>
                  <option>Dinheiro</option>
                  <option>Faturado</option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-500">Valor total</p>

                <p className="text-3xl font-semibold text-indigo-700 mt-1">
                  {formatarMoeda(valorTotal)}
                </p>

                <div className="mt-4 text-xs text-slate-500 space-y-1">
                  <p>Valor KM: <b>{formatarMoeda(valorKm)}</b></p>
                  <p>Dias parados: <b>{formatarMoeda(valorDiasParados)}</b></p>
                  <p>Despesa motorista: <b>{formatarMoeda(valorDespesaMotorista)}</b></p>
                  <p>Valor recebido: <b>{formatarMoeda(valorPago)}</b></p>
                  <p>Valor restante: <b>{formatarMoeda(valorRestante)}</b></p>
                  <p>Status pagamento: <b>{statusPagamento}</b></p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/viagens")}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600"
                >
                  Cancelar
                </button>

                <button
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>

            <aside className="space-y-6">
              <form
                onSubmit={lancarRecebimento}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
              >
                <h2 className="text-lg font-semibold text-slate-800">
                  Lançar recebimento
                </h2>

                <input
                  type="number"
                  value={novoRecebimento}
                  onChange={(e) => setNovoRecebimento(e.target.value)}
                  placeholder="Valor recebido"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
                />

                <textarea
                  value={observacaoRecebimento}
                  onChange={(e) => setObservacaoRecebimento(e.target.value)}
                  placeholder="Observação"
                  rows="3"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
                />

                <button
                  disabled={salvandoRecebimento}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg"
                >
                  {salvandoRecebimento
                    ? "Salvando..."
                    : "Registrar recebimento"}
                </button>
              </form>

              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Histórico de recebimentos
                </h2>

                {recebimentos.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhum recebimento lançado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recebimentos.map((item) => (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-xl p-4"
                      >
                        <p className="font-medium text-green-700">
                          {formatarMoeda(item.valor)}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {formatarData(item.created_at)}
                        </p>

                        {item.observacao && (
                          <p className="text-sm text-slate-600 mt-2">
                            {item.observacao}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </>
  )
}