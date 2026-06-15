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
    valorPago > 0
      ? valorRestante === 0
        ? "Quitado"
        : "Sinal pago"
      : "Reservada"

  async function salvarReserva(e) {
    e.preventDefault()

    if (form.tipo_viagem === "Turismo" && (valorKm === null || valorKm === undefined)) {
      alert("Este tipo de ônibus está com valor em aberto. Defina o valor antes de salvar.")
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
              Reservas de Viagens
            </h1>

            <p className="text-sm text-slate-500">
              Cadastro, orçamento e reserva vinculada ao cliente
            </p>
          </div>
        </header>

        <form
          onSubmit={salvarReserva}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Dados da reserva
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
                name="tipo_viagem"
                value={form.tipo_viagem}
                onChange={handleChange}
                className="rounded-lg border border-slate-300 px-4 py-2"
              >
                <option>Citytour</option>
                <option>Turismo</option>
              </select>

              {form.tipo_viagem === "Citytour" && (
                <select
                  name="periodo_citytour"
                  value={form.periodo_citytour}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  <option value="Integral">
                    Período Integral - R$ 2.000,00
                  </option>
                  <option value="Meio Período">
                    Meio Período - R$ 1.800,00
                  </option>
                </select>
              )}

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
                placeholder="Km Total"
                required
                className="rounded-lg border border-slate-300 px-4 py-2"
              />

              <select
                name="tipo_onibus"
                value={form.tipo_onibus}
                onChange={handleChange}
                required
                className="rounded-lg border border-slate-300 px-4 py-2"
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

              <input
                name="dias_parados"
                type="number"
                value={form.dias_parados}
                onChange={handleChange}
                placeholder="Diárias extras"
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

              <input
                name="valor_pago"
                type="number"
                value={form.valor_pago}
                onChange={handleChange}
                placeholder="Valor de entrada / sinal"
                className="rounded-lg border border-slate-300 px-4 py-2"
              />
            </div>

            <button
              disabled={salvando}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
            >
              {salvando ? "Salvando..." : "Salvar reserva"}
            </button>
          </section>

          <aside className="bg-white rounded-2xl border border-slate-200 p-6 h-fit">
            <h2 className="text-lg font-semibold text-slate-800">
              Resultado
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Valor estimado da reserva
            </p>

            <div className="mt-6 text-4xl font-bold text-indigo-700">
              {form.tipo_viagem === "Citytour"
                ? formatarMoeda(valorTotal)
                : valorKm !== null && valorKm !== undefined
                ? formatarMoeda(valorTotal)
                : "Em aberto"}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1">
              <p>Tipo de viagem: <b>{form.tipo_viagem}</b></p>

              {form.tipo_viagem === "Citytour" && (
                <p>
                  Período:{" "}
                  <b>
                    {form.periodo_citytour} - {formatarMoeda(valorCitytour)}
                  </b>
                </p>
              )}

              <p>KM total: <b>{form.km_total || 0} km</b></p>
              <p>Tipo de ônibus: <b>{form.tipo_onibus || "Não selecionado"}</b></p>

              <p>
                Valor por KM:{" "}
                <b>
                  {valorKm !== null && valorKm !== undefined
                    ? formatarMoeda(valorKm)
                    : "Em aberto"}
                </b>
              </p>

              <p>Diárias extras: <b>{form.dias_parados || 0}</b></p>
              <p>Nº de carros: <b>{numeroCarros}</b></p>
              <p>Despesa motorista: <b>{form.despesa_motorista}</b></p>
              <p>Valor pago / sinal: <b>{formatarMoeda(valorPago)}</b></p>
              <p>Valor restante: <b>{formatarMoeda(valorRestante)}</b></p>
              <p>Status pagamento: <b>{statusPagamento}</b></p>
            </div>
          </aside>
        </form>
      </div>
    </>
  )
}