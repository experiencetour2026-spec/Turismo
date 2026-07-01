import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Reservas() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [clientes, setClientes] = useState([])
  const [salvando, setSalvando] = useState(false)

  const VALOR_DIARIA_PARADO = 750
  const VALOR_CITYTOUR_INTEGRAL = 2000
  const VALOR_CITYTOUR_MEIO_PERIODO = 1800

  const tiposOnibus = [
    { nome: "Ônibus Executivo 46 lugares", valorKm: 10 },
    { nome: "Ônibus Urbano 46 lugares", valorKm: null },
    { nome: "Ônibus DD 62 lugares", valorKm: 15 },
    { nome: "Micro Ônibus 30 lugares", valorKm: 5 },
    { nome: "Micro Ônibus 20 lugares", valorKm: null },
  ]

  const [form, setForm] = useState({
    cliente_id: "",
    tipo_viagem: "Citytour",
    periodo_citytour: "Integral",
    numero_carros: 1,
    origem: "",
    destino: "",
    km_total: "",
    tipo_onibus: "",
    data_saida: "",
    data_retorno: "",
    dias_parados: "",
    quantidade_motoristas: 1,
    despesa_motorista: "Cliente",
    valor_despesa_motorista: "",
    forma_pagamento: "Pix",
    valor_pago: "",
    status_viagem: "Confirmada",
  })

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, cpf_cnpj")
      .order("nome")

    if (!error) setClientes(data || [])
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  function limparFormulario() {
    setForm({
      cliente_id: "",
      tipo_viagem: "Citytour",
      periodo_citytour: "Integral",
      numero_carros: 1,
      origem: "",
      destino: "",
      km_total: "",
      tipo_onibus: "",
      data_saida: "",
      data_retorno: "",
      dias_parados: "",
      quantidade_motoristas: 1,
      despesa_motorista: "Cliente",
      valor_despesa_motorista: "",
      forma_pagamento: "Pix",
      valor_pago: "",
      status_viagem: "Confirmada",
    })
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const onibusSelecionado = tiposOnibus.find(
    (item) => item.nome === form.tipo_onibus
  )

  const valorKm = onibusSelecionado?.valorKm
  const numeroCarros = Number(form.numero_carros || 1)

  const valorCitytour =
    form.periodo_citytour === "Meio Período"
      ? VALOR_CITYTOUR_MEIO_PERIODO
      : VALOR_CITYTOUR_INTEGRAL

  const valorCitytourTotal = valorCitytour * numeroCarros

  const valorKmTotal =
    valorKm !== null && valorKm !== undefined
      ? Number(form.km_total || 0) * valorKm * numeroCarros
      : 0

  const valorDiasParadosTotal =
    Number(form.dias_parados || 0) * VALOR_DIARIA_PARADO * numeroCarros

  const valorDespesaMotoristaTotal =
    form.despesa_motorista === "Empresa"
      ? Number(form.valor_despesa_motorista || 0)
      : 0

  const valorTotal =
    form.tipo_viagem === "Citytour"
      ? valorCitytourTotal + valorDespesaMotoristaTotal
      : valorKm !== null && valorKm !== undefined
      ? valorKmTotal + valorDiasParadosTotal + valorDespesaMotoristaTotal
      : 0

  const valorPago = Number(form.valor_pago || 0)
  const valorRestante = Math.max(valorTotal - valorPago, 0)

  const statusPagamento =
    valorPago > 0 ? (valorRestante === 0 ? "Quitado" : "Sinal pago") : "Reservada"

  async function salvarReserva(e) {
    e.preventDefault()

    if (
      form.tipo_viagem === "Turismo" &&
      (valorKm === null || valorKm === undefined)
    ) {
      alert(
        "Este tipo de ônibus está com valor em aberto. Defina o valor antes de salvar."
      )
      return
    }

    setSalvando(true)

    const valorTotalPorCarro = valorTotal / numeroCarros
    const valorPagoPorCarro = valorPago / numeroCarros
    const valorRestantePorCarro = valorRestante / numeroCarros
    const valorDespesaMotoristaPorCarro =
      valorDespesaMotoristaTotal / numeroCarros

    const reservasParaInserir = Array.from({ length: numeroCarros }).map(
      (_, index) => ({
        ...form,
        numero_carros: 1,
        numero_carro: "",
        km_total: Number(form.km_total || 0),
        tipo_onibus: form.tipo_onibus,
        periodo_citytour:
          form.tipo_viagem === "Citytour" ? form.periodo_citytour : null,
        valor_km: valorKm || null,
        dias_parados: Number(form.dias_parados || 0),
        quantidade_motoristas: Number(form.quantidade_motoristas),
        valor_despesa_motorista: valorDespesaMotoristaPorCarro,
        valor_total: valorTotalPorCarro,
        valor_pago: valorPagoPorCarro,
        valor_restante: valorRestantePorCarro,
        desconto: 0,
        status: statusPagamento,
        observacao: `Carro ${index + 1} de ${numeroCarros}`,
      })
    )

    const { data, error } = await supabase
      .from("reservas")
      .insert(reservasParaInserir)
      .select()

    if (error) {
      setSalvando(false)
      console.error(error)
      alert("Erro ao salvar reserva.")
      return
    }

    if (valorPago > 0 && data?.length > 0) {
      const recebimentosParaInserir = data.map((reserva) => ({
        reserva_id: reserva.id,
        valor: valorPagoPorCarro,
        observacao: "Valor de entrada / sinal",
      }))

      const { error: erroRecebimento } = await supabase
        .from("recebimentos")
        .insert(recebimentosParaInserir)

      if (erroRecebimento) {
        console.error(erroRecebimento)
      }
    }

    setSalvando(false)

    alert(
      numeroCarros > 1
        ? `${numeroCarros} reservas cadastradas com sucesso.`
        : "Reserva cadastrada com sucesso."
    )

    limparFormulario()
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
                  Reservas de Viagens
                </h1>

                <p className="text-xs sm:text-sm text-slate-500">
                  Cadastro, orçamento e reserva vinculada ao cliente
                </p>
              </div>
            </div>
          </header>

          <form
            onSubmit={salvarReserva}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <aside className="order-1 lg:order-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 h-fit shadow-sm min-w-0 lg:sticky lg:top-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                    Resultado
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Valor estimado da reserva
                  </p>
                </div>

                <span
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    statusPagamento === "Quitado"
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : statusPagamento === "Sinal pago"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      : "bg-slate-50 text-slate-600 border border-slate-200"
                  }`}
                >
                  {statusPagamento}
                </span>
              </div>

              <div className="mt-5 text-3xl sm:text-4xl font-bold text-indigo-700 break-words">
                {form.tipo_viagem === "Citytour"
                  ? formatarMoeda(valorTotal)
                  : valorKm !== null && valorKm !== undefined
                  ? formatarMoeda(valorTotal)
                  : "Em aberto"}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[11px] text-slate-500">Pago</p>
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

              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-2">
                <p>
                  Tipo de viagem: <b>{form.tipo_viagem}</b>
                </p>

                {form.tipo_viagem === "Citytour" && (
                  <p>
                    Período:{" "}
                    <b>
                      {form.periodo_citytour} - {formatarMoeda(valorCitytour)}
                    </b>
                  </p>
                )}

                <p>
                  KM total: <b>{form.km_total || 0} km</b>
                </p>

                <p>
                  Tipo de ônibus:{" "}
                  <b>{form.tipo_onibus || "Não selecionado"}</b>
                </p>

                <p>
                  Valor por KM:{" "}
                  <b>
                    {valorKm !== null && valorKm !== undefined
                      ? formatarMoeda(valorKm)
                      : "Em aberto"}
                  </b>
                </p>

                <p>
                  Diárias extras: <b>{form.dias_parados || 0}</b>
                </p>

                <p>
                  Nº de carros: <b>{numeroCarros}</b>
                </p>

                <p>
                  Despesa motorista: <b>{form.despesa_motorista}</b>
                </p>
              </div>
            </aside>

            <section className="order-2 lg:order-1 lg:col-span-2 space-y-4 sm:space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                    Cliente e tipo da viagem
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Selecione o cliente e defina o modelo da reserva.
                  </p>
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

                  {form.tipo_viagem === "Citytour" && (
                    <div>
                      <label className={labelClass}>Período do Citytour</label>

                      <select
                        name="periodo_citytour"
                        value={form.periodo_citytour}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="Integral">
                          Integral - R$ 2.000,00
                        </option>
                        <option value="Meio Período">
                          Meio Período - R$ 1.800,00
                        </option>
                      </select>
                    </div>
                  )}

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
                    <label className={labelClass}>Tipo de ônibus</label>

                    <select
                      name="tipo_onibus"
                      value={form.tipo_onibus}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Selecione o tipo de ônibus</option>

                      {tiposOnibus.map((item) => (
                        <option key={item.nome} value={item.nome}>
                          {item.nome}
                          {item.valorKm
                            ? ` - ${formatarMoeda(item.valorKm)} por KM`
                            : " - Valor em aberto"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                    Roteiro e datas
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Informe origem, destino, quilometragem e período da viagem.
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
                      placeholder="Km Total"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Diárias extras</label>

                    <input
                      name="dias_parados"
                      type="number"
                      value={form.dias_parados}
                      onChange={handleChange}
                      placeholder="Diárias extras"
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
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                    Motorista e pagamento
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Configure despesas, forma de pagamento e valor de entrada.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Quantidade de motoristas</label>

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
                    <label className={labelClass}>Despesa do motorista</label>

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

                  <div>
                    <label className={labelClass}>Valor de entrada / sinal</label>

                    <input
                      name="valor_pago"
                      type="number"
                      value={form.valor_pago}
                      onChange={handleChange}
                      placeholder="Valor de entrada / sinal"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5">
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50"
                  >
                    Limpar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                  >
                    {salvando ? "Salvando..." : "Salvar reserva"}
                  </button>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>
    </>
  )
}