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
  const [detalhesFinanceiroAberto, setDetalhesFinanceiroAberto] =
    useState(false)

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

  function voltarParaOrigem() {
    if (voltar === "relatorios") {
      navigate("/relatorios")
      return
    }

    navigate("/viagens")
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

  function statusPagamentoClasse(status) {
    if (status === "Quitado") {
      return "bg-green-50 text-green-700 border border-green-100"
    }

    if (status === "Pagamento Parcial") {
      return "bg-indigo-50 text-indigo-700 border border-indigo-100"
    }

    return "bg-slate-50 text-slate-600 border border-slate-200"
  }

  function statusViagemClasse(status) {
    if (status === "Cancelada") {
      return "bg-red-50 text-red-700 border border-red-100"
    }

    return "bg-green-50 text-green-700 border border-green-100"
  }

  const quantidadeCarros = Number(form.numero_carros || 1)

  const valorKm = Number(form.km_total || 0) * VALOR_KM * quantidadeCarros

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
    const novoStatus =
      novoValorRestante === 0 ? "Quitado" : "Pagamento Parcial"

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

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  const labelClass = "block text-xs font-medium text-slate-500 mb-1"

  return (
    <>
      <Sidebar aberto={menuAberto} onClose={() => setMenuAberto(false)} />

      <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                    Detalhes da Viagem
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500">
                    Visualize, edite e acompanhe os recebimentos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={voltarParaOrigem}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:text-indigo-700 shadow-sm"
              >
                Voltar
              </button>
            </div>
          </header>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <p className="text-sm text-slate-500">Carregando viagem...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              <form
                onSubmit={salvarAlteracoes}
                className="xl:col-span-2 space-y-4 sm:space-y-5"
              >
                <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                        Cliente e status
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Dados principais da viagem.
                      </p>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusViagemClasse(
                        form.status_viagem
                      )}`}
                    >
                      {form.status_viagem}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Cliente</label>

                      <select
                        name="cliente_id"
                        value={form.cliente_id}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Selecione o cliente</option>

                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome} - {cliente.cpf_cnpj}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Status da viagem</label>

                      <select
                        name="status_viagem"
                        value={form.status_viagem}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="Confirmada">Confirmada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Tipo de viagem</label>

                      <select
                        name="tipo_viagem"
                        value={form.tipo_viagem}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option>Citytour</option>
                        <option>Turismo</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Forma de pagamento</label>

                      <select
                        name="forma_pagamento"
                        value={form.forma_pagamento}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option>Pix</option>
                        <option>Dinheiro</option>
                        <option>Faturado</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                      Veículo e motorista
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Informe carro, quantidade de motoristas e despesas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nº de carros</label>

                      <input
                        name="numero_carros"
                        type="number"
                        min="1"
                        value={form.numero_carros}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Nº do carro</label>

                      <input
                        name="numero_carro"
                        value={form.numero_carro}
                        onChange={handleChange}
                        placeholder="Nº do carro"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Quantidade de motoristas
                      </label>

                      <select
                        name="quantidade_motoristas"
                        value={form.quantidade_motoristas}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="1">1 Motorista</option>
                        <option value="2">2 Motoristas</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Matrícula + Motorista 1
                      </label>

                      <input
                        name="matricula_motorista_1"
                        value={form.matricula_motorista_1}
                        onChange={handleChange}
                        placeholder="Matrícula + Motorista 1"
                        className={inputClass}
                      />
                    </div>

                    {Number(form.quantidade_motoristas) === 2 && (
                      <div>
                        <label className={labelClass}>
                          Matrícula + Motorista 2
                        </label>

                        <input
                          name="matricula_motorista_2"
                          value={form.matricula_motorista_2}
                          onChange={handleChange}
                          placeholder="Matrícula + Motorista 2"
                          className={inputClass}
                        />
                      </div>
                    )}

                    <div>
                      <label className={labelClass}>Despesa motorista</label>

                      <select
                        name="despesa_motorista"
                        value={form.despesa_motorista}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="Cliente">Cliente</option>
                        <option value="Empresa">Empresa</option>
                      </select>
                    </div>

                    {form.despesa_motorista === "Empresa" && (
                      <div>
                        <label className={labelClass}>
                          Valor da despesa do motorista
                        </label>

                        <input
                          name="valor_despesa_motorista"
                          type="number"
                          value={form.valor_despesa_motorista}
                          onChange={handleChange}
                          placeholder="Valor da despesa"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                      Roteiro e datas
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Origem, destino, KM e período da viagem.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Origem</label>

                      <input
                        name="origem"
                        value={form.origem}
                        onChange={handleChange}
                        required
                        placeholder="Origem"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Destino</label>

                      <input
                        name="destino"
                        value={form.destino}
                        onChange={handleChange}
                        required
                        placeholder="Destino"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>KM total</label>

                      <input
                        name="km_total"
                        type="number"
                        value={form.km_total}
                        onChange={handleChange}
                        required
                        placeholder="KM total"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Quantidade de dias parados
                      </label>

                      <input
                        name="dias_parados"
                        type="number"
                        value={form.dias_parados}
                        onChange={handleChange}
                        placeholder="Dias parados"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Data de saída</label>

                      <input
                        name="data_saida"
                        type="datetime-local"
                        value={form.data_saida}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Data de retorno</label>

                      <input
                        name="data_retorno"
                        type="datetime-local"
                        value={form.data_retorno}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5">
                    <button
                      type="button"
                      onClick={voltarParaOrigem}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={salvando}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                    >
                      {salvando ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                </section>
              </form>

              <aside className="space-y-4 sm:space-y-5">
                <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                        Resumo financeiro
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Valor total da viagem
                      </p>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusPagamentoClasse(
                        statusPagamento
                      )}`}
                    >
                      {statusPagamento}
                    </span>
                  </div>

                  <p className="text-3xl sm:text-4xl font-bold text-indigo-700 mt-5 break-words">
                    {formatarMoeda(valorTotal)}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[11px] text-slate-500">Recebido</p>

                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {formatarMoeda(valorPago)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[11px] text-slate-500">Restante</p>

                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {formatarMoeda(valorRestante)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDetalhesFinanceiroAberto(!detalhesFinanceiroAberto)
                    }
                    className="mt-4 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    {detalhesFinanceiroAberto
                      ? "Ocultar detalhes"
                      : "+ Detalhes"}
                  </button>

                  {detalhesFinanceiroAberto && (
                    <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-2">
                      <p>
                        Valor KM: <b>{formatarMoeda(valorKm)}</b>
                      </p>

                      <p>
                        Dias parados:{" "}
                        <b>{formatarMoeda(valorDiasParados)}</b>
                      </p>

                      <p>
                        Despesa motorista:{" "}
                        <b>{formatarMoeda(valorDespesaMotorista)}</b>
                      </p>

                      <p>
                        Valor recebido: <b>{formatarMoeda(valorPago)}</b>
                      </p>

                      <p>
                        Valor restante:{" "}
                        <b>{formatarMoeda(valorRestante)}</b>
                      </p>

                      <p>
                        Status pagamento: <b>{statusPagamento}</b>
                      </p>
                    </div>
                  )}
                </section>

                <form
                  onSubmit={lancarRecebimento}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm"
                >
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                      Lançar recebimento
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Registre um novo pagamento recebido.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Valor recebido</label>

                    <input
                      type="number"
                      value={novoRecebimento}
                      onChange={(e) => setNovoRecebimento(e.target.value)}
                      placeholder="Valor recebido"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Observação</label>

                    <textarea
                      value={observacaoRecebimento}
                      onChange={(e) =>
                        setObservacaoRecebimento(e.target.value)
                      }
                      placeholder="Observação"
                      rows="3"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={salvandoRecebimento}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium shadow-sm"
                  >
                    {salvandoRecebimento
                      ? "Salvando..."
                      : "Registrar recebimento"}
                  </button>
                </form>

                <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                    Histórico de recebimentos
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4">
                    Pagamentos já registrados nesta viagem.
                  </p>

                  {recebimentos.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-slate-500">
                        Nenhum recebimento lançado.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recebimentos.map((item) => (
                        <article
                          key={item.id}
                          className="border border-slate-200 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-green-700">
                                {formatarMoeda(item.valor)}
                              </p>

                              <p className="text-xs text-slate-500 mt-1">
                                {formatarData(item.created_at)}
                              </p>
                            </div>
                          </div>

                          {item.observacao && (
                            <p className="text-sm text-slate-600 mt-3 break-words">
                              {item.observacao}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  )
}