import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

export default function Reservas() {
  const [menuAberto, setMenuAberto] = useState(false)

  const [detalhesResultadoAberto, setDetalhesResultadoAberto] =
    useState(false)

  const [clientes, setClientes] = useState([])
  const [salvando, setSalvando] = useState(false)

  // Valor manual do Citytour por carro
  const [valorCitytourManual, setValorCitytourManual] =
    useState("")

  const VALOR_DIARIA_PARADO = 750

  const tiposOnibus = [
    {
      nome: "Ônibus Executivo 46 lugares",
      valorKm: 10,
    },
    {
      nome: "Ônibus Urbano 46 lugares",
      valorKm: null,
    },
    {
      nome: "Ônibus DD 62 lugares",
      valorKm: 15,
    },
    {
      nome: "Micro Ônibus 30 lugares",
      valorKm: 5,
    },
    {
      nome: "Micro Ônibus 20 lugares",
      valorKm: null,
    },
  ]

  const formularioInicial = {
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
  }

  const [form, setForm] = useState(formularioInicial)

  // =========================================================
  // CARREGAR CLIENTES
  // =========================================================

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, cpf_cnpj")
      .order("nome")

    if (error) {
      console.error("Erro ao carregar clientes:", error)
      return
    }

    setClientes(data || [])
  }

  // =========================================================
  // ALTERAÇÃO DOS CAMPOS
  // =========================================================

  function handleChange(e) {
    const { name, value } = e.target

    setForm((formAtual) => ({
      ...formAtual,
      [name]: value,
    }))
  }

  // =========================================================
  // LIMPAR FORMULÁRIO
  // =========================================================

  function limparFormulario() {
    setForm(formularioInicial)
    setValorCitytourManual("")
    setDetalhesResultadoAberto(false)
  }

  // =========================================================
  // FORMATAÇÃO
  // =========================================================

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  // =========================================================
  // CÁLCULOS
  // =========================================================

  const onibusSelecionado = tiposOnibus.find(
    (item) => item.nome === form.tipo_onibus
  )

  const valorKm = onibusSelecionado?.valorKm

  const numeroCarros = Number(
    form.numero_carros || 1
  )

  // ---------------------------------------------------------
  // CITYTOUR
  // Valor informado manualmente POR CARRO
  // ---------------------------------------------------------

  const valorCitytour = Number(
    valorCitytourManual || 0
  )

  const valorCitytourTotal =
    valorCitytour * numeroCarros

  // ---------------------------------------------------------
  // TURISMO
  // ---------------------------------------------------------

  const valorKmTotal =
    valorKm !== null && valorKm !== undefined
      ? Number(form.km_total || 0) *
        valorKm *
        numeroCarros
      : 0

  const valorDiasParadosTotal =
    Number(form.dias_parados || 0) *
    VALOR_DIARIA_PARADO *
    numeroCarros

  // ---------------------------------------------------------
  // DESPESA DO MOTORISTA
  // ---------------------------------------------------------

  const valorDespesaMotoristaTotal =
    form.despesa_motorista === "Empresa"
      ? Number(
          form.valor_despesa_motorista || 0
        )
      : 0

  // ---------------------------------------------------------
  // VALOR TOTAL
  // ---------------------------------------------------------

  const valorTotal =
    form.tipo_viagem === "Citytour"
      ? valorCitytourTotal +
        valorDespesaMotoristaTotal
      : valorKm !== null &&
          valorKm !== undefined
        ? valorKmTotal +
          valorDiasParadosTotal +
          valorDespesaMotoristaTotal
        : 0

  // ---------------------------------------------------------
  // PAGAMENTO
  // ---------------------------------------------------------

  const valorPago = Number(
    form.valor_pago || 0
  )

  const valorRestante = Math.max(
    valorTotal - valorPago,
    0
  )

  const statusPagamento =
    valorPago > 0
      ? valorRestante === 0
        ? "Quitado"
        : "Sinal pago"
      : "Reservada"

  // =========================================================
  // TEXTO DO TOTAL
  // =========================================================

  function textoValorTotal() {
    if (form.tipo_viagem === "Citytour") {
      return valorCitytour > 0
        ? formatarMoeda(valorTotal)
        : "Informe o valor"
    }

    if (
      valorKm !== null &&
      valorKm !== undefined
    ) {
      return formatarMoeda(valorTotal)
    }

    return "Em aberto"
  }

  // =========================================================
  // SALVAR RESERVA
  // =========================================================

  async function salvarReserva(e) {
    e.preventDefault()

    // -------------------------------------------------------
    // VALIDAÇÃO CITYTOUR
    // -------------------------------------------------------

    if (
      form.tipo_viagem === "Citytour" &&
      Number(valorCitytourManual) <= 0
    ) {
      alert("Informe o valor do Citytour.")
      return
    }

    // -------------------------------------------------------
    // VALIDAÇÃO TURISMO
    // -------------------------------------------------------

    if (
      form.tipo_viagem === "Turismo" &&
      (valorKm === null ||
        valorKm === undefined)
    ) {
      alert(
        "Este tipo de ônibus está com valor em aberto. Defina o valor antes de salvar."
      )

      return
    }

    // -------------------------------------------------------
    // QUANTIDADE DE CARROS
    // -------------------------------------------------------

    if (numeroCarros < 1) {
      alert(
        "A quantidade de carros deve ser de pelo menos 1."
      )

      return
    }

    setSalvando(true)

    try {
      // -----------------------------------------------------
      // DIVISÃO ENTRE OS CARROS
      // -----------------------------------------------------

      const valorTotalPorCarro =
        valorTotal / numeroCarros

      const valorPagoPorCarro =
        valorPago / numeroCarros

      const valorRestantePorCarro =
        valorRestante / numeroCarros

      const valorDespesaMotoristaPorCarro =
        valorDespesaMotoristaTotal /
        numeroCarros

      // -----------------------------------------------------
      // UMA RESERVA PARA CADA CARRO
      // -----------------------------------------------------

      const reservasParaInserir =
        Array.from({
          length: numeroCarros,
        }).map((_, index) => ({
          ...form,

          numero_carros: 1,

          numero_carro: "",

          km_total: Number(
            form.km_total || 0
          ),

          tipo_onibus: form.tipo_onibus,

          periodo_citytour:
            form.tipo_viagem === "Citytour"
              ? form.periodo_citytour
              : null,

          valor_km:
            valorKm !== null &&
            valorKm !== undefined
              ? valorKm
              : null,

          dias_parados: Number(
            form.dias_parados || 0
          ),

          quantidade_motoristas: Number(
            form.quantidade_motoristas
          ),

          valor_despesa_motorista:
            valorDespesaMotoristaPorCarro,

          valor_total:
            valorTotalPorCarro,

          valor_pago:
            valorPagoPorCarro,

          valor_restante:
            valorRestantePorCarro,

          desconto: 0,

          status: statusPagamento,

          observacao: `Carro ${
            index + 1
          } de ${numeroCarros}`,
        }))

      // -----------------------------------------------------
      // SALVAR RESERVAS
      // -----------------------------------------------------

      const { data, error } =
        await supabase
          .from("reservas")
          .insert(reservasParaInserir)
          .select()

      if (error) {
        throw error
      }

      // -----------------------------------------------------
      // REGISTRAR ENTRADA / SINAL
      // -----------------------------------------------------

      if (
        valorPago > 0 &&
        data?.length > 0
      ) {
        const recebimentosParaInserir =
          data.map((reserva) => ({
            reserva_id: reserva.id,

            valor:
              valorPagoPorCarro,

            observacao:
              "Valor de entrada / sinal",
          }))

        const {
          error: erroRecebimento,
        } = await supabase
          .from("recebimentos")
          .insert(
            recebimentosParaInserir
          )

        if (erroRecebimento) {
          console.error(
            "Erro ao registrar recebimentos:",
            erroRecebimento
          )
        }
      }

      // -----------------------------------------------------
      // SUCESSO
      // -----------------------------------------------------

      alert(
        numeroCarros > 1
          ? `${numeroCarros} reservas cadastradas com sucesso.`
          : "Reserva cadastrada com sucesso."
      )

      limparFormulario()
    } catch (error) {
      console.error(
        "Erro ao salvar reserva:",
        error
      )

      alert("Erro ao salvar reserva.")
    } finally {
      setSalvando(false)
    }
  }

  // =========================================================
  // CLASSES
  // =========================================================

  const inputClass =
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  const labelClass =
    "mb-1.5 block text-xs font-medium text-slate-500"

  const cardClass =
    "min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5"

  // =========================================================
  // TELA
  // =========================================================

  return (
    <>
      <Sidebar
        aberto={menuAberto}
        onClose={() =>
          setMenuAberto(false)
        }
      />

      <div className="min-h-screen bg-slate-100 px-3 pb-36 pt-4 sm:px-4 md:p-6 xl:pb-6">
        <div className="mx-auto max-w-[1500px]">

          {/* ================================================= */}
          {/* CABEÇALHO */}
          {/* ================================================= */}

          <header className="mb-4">
            <div className="flex items-start gap-3">

              <button
                type="button"
                onClick={() =>
                  setMenuAberto(true)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                aria-label="Abrir menu"
              >
                ☰
              </button>

              <div className="min-w-0">

                <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                  Reservas de Viagens
                </h1>

                <p className="text-xs text-slate-500 sm:text-sm">
                  Cadastro, orçamento e
                  reserva vinculada ao
                  cliente
                </p>

              </div>

            </div>
          </header>

          {/* ================================================= */}
          {/* FORMULÁRIO */}
          {/* ================================================= */}

          <form
            onSubmit={salvarReserva}
            className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"
          >

            {/* =============================================== */}
            {/* COLUNA PRINCIPAL */}
            {/* =============================================== */}

            <div className="min-w-0 space-y-4">

              {/* ============================================= */}
              {/* CLIENTE E VIAGEM */}
              {/* ============================================= */}

              <section className={cardClass}>

                <div className="mb-4">

                  <h2 className="text-base font-semibold text-slate-800">
                    Cliente e viagem
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Identificação do
                    cliente e configuração
                    da viagem.
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-12">

                  {/* CLIENTE */}

                  <div className="col-span-2 xl:col-span-6">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Cliente
                    </label>

                    <select
                      name="cliente_id"
                      value={
                        form.cliente_id
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Selecione o
                        cliente
                      </option>

                      {clientes.map(
                        (cliente) => (
                          <option
                            key={
                              cliente.id
                            }
                            value={
                              cliente.id
                            }
                          >
                            {
                              cliente.nome
                            }{" "}
                            -{" "}
                            {
                              cliente.cpf_cnpj
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* TIPO DE VIAGEM */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Tipo de viagem
                    </label>

                    <select
                      name="tipo_viagem"
                      value={
                        form.tipo_viagem
                      }
                      onChange={
                        handleChange
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="Citytour">
                        Citytour
                      </option>

                      <option value="Turismo">
                        Turismo
                      </option>

                    </select>

                  </div>

                  {/* PERÍODO CITYTOUR */}

                  {form.tipo_viagem ===
                    "Citytour" && (
                    <div className="col-span-1 xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Período
                      </label>

                      <select
                        name="periodo_citytour"
                        value={
                          form.periodo_citytour
                        }
                        onChange={
                          handleChange
                        }
                        className={
                          inputClass
                        }
                      >

                        <option value="Integral">
                          Integral
                        </option>

                        <option value="Meio Período">
                          Meio Período
                        </option>

                      </select>

                    </div>
                  )}

                  {/* VALOR CITYTOUR */}

                  {form.tipo_viagem ===
                    "Citytour" && (
                    <div className="col-span-1 xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Valor Citytour
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={
                          valorCitytourManual
                        }
                        onChange={(e) =>
                          setValorCitytourManual(
                            e.target.value
                          )
                        }
                        required
                        placeholder="0,00"
                        className={
                          inputClass
                        }
                      />

                    </div>
                  )}

                  {/* NÚMERO DE CARROS */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Nº de carros
                    </label>

                    <input
                      name="numero_carros"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={
                        form.numero_carros
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    />

                  </div>

                  {/* TIPO DE ÔNIBUS */}

                  <div
                    className={
                      form.tipo_viagem ===
                      "Citytour"
                        ? "col-span-2 xl:col-span-6"
                        : "col-span-2 xl:col-span-6"
                    }
                  >

                    <label
                      className={
                        labelClass
                      }
                    >
                      Tipo de ônibus
                    </label>

                    <select
                      name="tipo_onibus"
                      value={
                        form.tipo_onibus
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Selecione o tipo
                        de ônibus
                      </option>

                      {tiposOnibus.map(
                        (item) => (
                          <option
                            key={
                              item.nome
                            }
                            value={
                              item.nome
                            }
                          >
                            {item.nome}

                            {item.valorKm !==
                              null &&
                            item.valorKm !==
                              undefined
                              ? ` - ${formatarMoeda(
                                  item.valorKm
                                )} por KM`
                              : " - Valor em aberto"}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>
              </section>

              {/* ============================================= */}
              {/* ROTEIRO E DATAS */}
              {/* ============================================= */}

              <section className={cardClass}>

                <div className="mb-4">

                  <h2 className="text-base font-semibold text-slate-800">
                    Roteiro e datas
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Origem, destino,
                    quilometragem e
                    período da viagem.
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-12">

                  {/* ORIGEM */}

                  <div className="col-span-2 xl:col-span-6">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Origem
                    </label>

                    <input
                      name="origem"
                      value={form.origem}
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="Origem"
                      className={
                        inputClass
                      }
                    />

                  </div>

                  {/* DESTINO */}

                  <div className="col-span-2 xl:col-span-6">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Destino
                    </label>

                    <input
                      name="destino"
                      value={
                        form.destino
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="Destino"
                      className={
                        inputClass
                      }
                    />

                  </div>

                  {/* KM TOTAL */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      KM total
                    </label>

                    <input
                      name="km_total"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={
                        form.km_total
                      }
                      onChange={
                        handleChange
                      }
                      required
                      placeholder="KM"
                      className={
                        inputClass
                      }
                    />

                  </div>

                  {/* DIÁRIAS EXTRAS */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Diárias extras
                    </label>

                    <input
                      name="dias_parados"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={
                        form.dias_parados
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0"
                      className={
                        inputClass
                      }
                    />

                  </div>

                  {/* DATA DE SAÍDA */}

                  <div className="col-span-2 md:col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Data de saída
                    </label>

                    <input
                      name="data_saida"
                      type="datetime-local"
                      value={
                        form.data_saida
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    />

                  </div>

                  {/* DATA DE RETORNO */}

                  <div className="col-span-2 md:col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Data de retorno
                    </label>

                    <input
                      name="data_retorno"
                      type="datetime-local"
                      value={
                        form.data_retorno
                      }
                      onChange={
                        handleChange
                      }
                      required
                      className={
                        inputClass
                      }
                    />

                  </div>

                </div>
              </section>

              {/* ============================================= */}
              {/* MOTORISTA E PAGAMENTO */}
              {/* ============================================= */}

              <section className={cardClass}>

                <div className="mb-4">

                  <h2 className="text-base font-semibold text-slate-800">
                    Motorista e pagamento
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Despesas, pagamento
                    e valor de entrada.
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-12">

                  {/* QUANTIDADE MOTORISTAS */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Motoristas
                    </label>

                    <select
                      name="quantidade_motoristas"
                      value={
                        form.quantidade_motoristas
                      }
                      onChange={
                        handleChange
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="1">
                        1 Motorista
                      </option>

                      <option value="2">
                        2 Motoristas
                      </option>

                    </select>

                  </div>

                  {/* DESPESA MOTORISTA */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Despesa
                    </label>

                    <select
                      name="despesa_motorista"
                      value={
                        form.despesa_motorista
                      }
                      onChange={
                        handleChange
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="Cliente">
                        Cliente
                      </option>

                      <option value="Empresa">
                        Empresa
                      </option>

                    </select>

                  </div>

                  {/* VALOR DESPESA */}

                  {form.despesa_motorista ===
                    "Empresa" && (
                    <div className="col-span-2 md:col-span-1 xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Valor da despesa
                      </label>

                      <input
                        name="valor_despesa_motorista"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={
                          form.valor_despesa_motorista
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="0,00"
                        className={
                          inputClass
                        }
                      />

                    </div>
                  )}

                  {/* FORMA DE PAGAMENTO */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Pagamento
                    </label>

                    <select
                      name="forma_pagamento"
                      value={
                        form.forma_pagamento
                      }
                      onChange={
                        handleChange
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="Pix">
                        Pix
                      </option>

                      <option value="Dinheiro">
                        Dinheiro
                      </option>

                      <option value="Faturado">
                        Faturado
                      </option>

                    </select>

                  </div>

                  {/* VALOR DA ENTRADA */}

                  <div className="col-span-1 xl:col-span-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Entrada / sinal
                    </label>

                    <input
                      name="valor_pago"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={
                        form.valor_pago
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0,00"
                      className={
                        inputClass
                      }
                    />

                  </div>

                </div>
              </section>

            </div>

            {/* =============================================== */}
            {/* RESULTADO - DESKTOP */}
            {/* =============================================== */}

            <aside
              className={`${cardClass} hidden self-start xl:sticky xl:top-4 xl:block`}
            >

              <div className="flex items-start justify-between gap-3">

                <div>

                  <h2 className="text-base font-semibold text-slate-800">
                    Resultado
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Valor estimado da
                    reserva
                  </p>

                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    statusPagamento ===
                    "Quitado"
                      ? "border border-green-100 bg-green-50 text-green-700"
                      : statusPagamento ===
                          "Sinal pago"
                        ? "border border-indigo-100 bg-indigo-50 text-indigo-700"
                        : "border border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {statusPagamento}
                </span>

              </div>

              {/* TOTAL */}

              <div className="mt-5">

                <p className="text-xs font-medium text-slate-500">
                  Valor total
                </p>

                <div className="mt-1 break-words text-3xl font-bold tracking-tight text-indigo-700">
                  {textoValorTotal()}
                </div>

              </div>

              {/* PAGO E RESTANTE */}

              <div className="mt-5 grid grid-cols-2 gap-2">

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">

                  <p className="text-[11px] text-slate-500">
                    Pago
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatarMoeda(
                      valorPago
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">

                  <p className="text-[11px] text-slate-500">
                    Restante
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatarMoeda(
                      valorRestante
                    )}
                  </p>

                </div>

              </div>

              {/* DETALHES */}

              <button
                type="button"
                onClick={() =>
                  setDetalhesResultadoAberto(
                    (estadoAtual) =>
                      !estadoAtual
                  )
                }
                className="mt-4 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
              >
                {detalhesResultadoAberto
                  ? "Ocultar detalhes"
                  : "+ Detalhes"}
              </button>

              {detalhesResultadoAberto && (
                <div className="mt-4 border-t border-slate-100 pt-4">

                  <div className="space-y-2.5 text-xs text-slate-500">

                    <p>
                      Tipo de viagem:{" "}
                      <b className="text-slate-700">
                        {form.tipo_viagem}
                      </b>
                    </p>

                    {form.tipo_viagem ===
                      "Citytour" && (
                      <>
                        <p>
                          Período:{" "}
                          <b className="text-slate-700">
                            {
                              form.periodo_citytour
                            }
                          </b>
                        </p>

                        <p>
                          Valor por carro:{" "}
                          <b className="text-slate-700">
                            {formatarMoeda(
                              valorCitytour
                            )}
                          </b>
                        </p>
                      </>
                    )}

                    <p>
                      KM total:{" "}
                      <b className="text-slate-700">
                        {form.km_total ||
                          0}{" "}
                        km
                      </b>
                    </p>

                    <p>
                      Tipo de ônibus:{" "}
                      <b className="text-slate-700">
                        {form.tipo_onibus ||
                          "Não selecionado"}
                      </b>
                    </p>

                    {form.tipo_viagem ===
                      "Turismo" && (
                      <p>
                        Valor por KM:{" "}
                        <b className="text-slate-700">
                          {valorKm !==
                            null &&
                          valorKm !==
                            undefined
                            ? formatarMoeda(
                                valorKm
                              )
                            : "Em aberto"}
                        </b>
                      </p>
                    )}

                    <p>
                      Diárias extras:{" "}
                      <b className="text-slate-700">
                        {form.dias_parados ||
                          0}
                      </b>
                    </p>

                    <p>
                      Nº de carros:{" "}
                      <b className="text-slate-700">
                        {numeroCarros}
                      </b>
                    </p>

                    {form.tipo_viagem ===
                      "Citytour" &&
                      numeroCarros > 1 && (
                        <p>
                          Total dos
                          Citytours:{" "}
                          <b className="text-slate-700">
                            {formatarMoeda(
                              valorCitytourTotal
                            )}
                          </b>
                        </p>
                      )}

                    <p>
                      Despesa motorista:{" "}
                      <b className="text-slate-700">
                        {
                          form.despesa_motorista
                        }
                      </b>
                    </p>

                    {form.despesa_motorista ===
                      "Empresa" && (
                      <p>
                        Valor da despesa:{" "}
                        <b className="text-slate-700">
                          {formatarMoeda(
                            valorDespesaMotoristaTotal
                          )}
                        </b>
                      </p>
                    )}

                  </div>

                </div>
              )}

              {/* BOTÕES DESKTOP */}

              <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar reserva"}
                </button>

                <button
                  type="button"
                  onClick={
                    limparFormulario
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Limpar
                </button>

              </div>

            </aside>

            {/* =============================================== */}
            {/* PAINEL DE RESUMO - MOBILE */}
            {/* =============================================== */}

            {detalhesResultadoAberto && (
              <div className="fixed inset-x-3 bottom-24 z-40 mx-auto max-h-[60vh] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl xl:hidden">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <p className="text-xs font-medium text-slate-500">
                      Resumo da reserva
                    </p>

                    <h3 className="text-base font-semibold text-slate-800">
                      Detalhes
                    </h3>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDetalhesResultadoAberto(
                        false
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500"
                    aria-label="Fechar resumo"
                  >
                    ✕
                  </button>

                </div>

                {/* PAGO / RESTANTE */}

                <div className="mt-4 grid grid-cols-2 gap-2">

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[11px] text-slate-500">
                      Pago
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatarMoeda(
                        valorPago
                      )}
                    </p>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">

                    <p className="text-[11px] text-slate-500">
                      Restante
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatarMoeda(
                        valorRestante
                      )}
                    </p>

                  </div>

                </div>

                {/* INFORMAÇÕES */}

                <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-500">

                  <div className="flex items-center justify-between gap-3">

                    <span>
                      Tipo de viagem
                    </span>

                    <b className="text-right text-slate-700">
                      {form.tipo_viagem}
                    </b>

                  </div>

                  {form.tipo_viagem ===
                    "Citytour" && (
                    <>
                      <div className="flex items-center justify-between gap-3">

                        <span>
                          Período
                        </span>

                        <b className="text-right text-slate-700">
                          {
                            form.periodo_citytour
                          }
                        </b>

                      </div>

                      <div className="flex items-center justify-between gap-3">

                        <span>
                          Valor por carro
                        </span>

                        <b className="text-right text-slate-700">
                          {formatarMoeda(
                            valorCitytour
                          )}
                        </b>

                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between gap-3">

                    <span>
                      Nº de carros
                    </span>

                    <b className="text-right text-slate-700">
                      {numeroCarros}
                    </b>

                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <span>
                      KM total
                    </span>

                    <b className="text-right text-slate-700">
                      {form.km_total ||
                        0}{" "}
                      km
                    </b>

                  </div>

                  <div className="flex items-start justify-between gap-4">

                    <span className="shrink-0">
                      Ônibus
                    </span>

                    <b className="text-right text-slate-700">
                      {form.tipo_onibus ||
                        "Não selecionado"}
                    </b>

                  </div>

                  {form.tipo_viagem ===
                    "Turismo" && (
                    <div className="flex items-center justify-between gap-3">

                      <span>
                        Valor por KM
                      </span>

                      <b className="text-right text-slate-700">
                        {valorKm !== null &&
                        valorKm !==
                          undefined
                          ? formatarMoeda(
                              valorKm
                            )
                          : "Em aberto"}
                      </b>

                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">

                    <span>
                      Diárias extras
                    </span>

                    <b className="text-right text-slate-700">
                      {form.dias_parados ||
                        0}
                    </b>

                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <span>
                      Motoristas
                    </span>

                    <b className="text-right text-slate-700">
                      {
                        form.quantidade_motoristas
                      }
                    </b>

                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <span>
                      Despesa motorista
                    </span>

                    <b className="text-right text-slate-700">
                      {
                        form.despesa_motorista
                      }
                    </b>

                  </div>

                  {form.despesa_motorista ===
                    "Empresa" && (
                    <div className="flex items-center justify-between gap-3">

                      <span>
                        Valor despesa
                      </span>

                      <b className="text-right text-slate-700">
                        {formatarMoeda(
                          valorDespesaMotoristaTotal
                        )}
                      </b>

                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">

                    <span>
                      Pagamento
                    </span>

                    <b className="text-right text-slate-700">
                      {
                        form.forma_pagamento
                      }
                    </b>

                  </div>

                </div>

                {/* TOTAL NO RESUMO */}

                <div className="mt-4 flex items-end justify-between gap-3 rounded-xl bg-indigo-50 p-3">

                  <div>

                    <p className="text-[11px] font-medium text-indigo-500">
                      Valor total
                    </p>

                    <p className="mt-0.5 text-xl font-bold text-indigo-700">
                      {textoValorTotal()}
                    </p>

                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      statusPagamento ===
                      "Quitado"
                        ? "border border-green-100 bg-green-50 text-green-700"
                        : statusPagamento ===
                            "Sinal pago"
                          ? "border border-indigo-200 bg-white text-indigo-700"
                          : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {statusPagamento}
                  </span>

                </div>

                {/* LIMPAR */}

                <button
                  type="button"
                  onClick={
                    limparFormulario
                  }
                  className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
                >
                  Limpar formulário
                </button>

              </div>
            )}

            {/* =============================================== */}
            {/* BARRA FIXA - MOBILE */}
            {/* =============================================== */}

            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-5px_20px_rgba(15,23,42,0.10)] xl:hidden">

              <div className="mx-auto max-w-lg">

                {/* TOTAL */}

                <div className="mb-2 flex items-center justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Valor total
                    </p>

                    <p className="truncate text-xl font-bold leading-tight text-indigo-700">
                      {textoValorTotal()}
                    </p>

                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      statusPagamento ===
                      "Quitado"
                        ? "border border-green-100 bg-green-50 text-green-700"
                        : statusPagamento ===
                            "Sinal pago"
                          ? "border border-indigo-100 bg-indigo-50 text-indigo-700"
                          : "border border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {statusPagamento}
                  </span>

                </div>

                {/* BOTÕES */}

                <div className="grid grid-cols-[105px_1fr] gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      setDetalhesResultadoAberto(
                        (estadoAtual) =>
                          !estadoAtual
                      )
                    }
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-700 transition active:scale-[0.98]"
                  >
                    {detalhesResultadoAberto
                      ? "Fechar"
                      : "Resumo"}
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvando
                      ? "Salvando..."
                      : "Salvar reserva"}
                  </button>

                </div>

              </div>

            </div>

          </form>

        </div>
      </div>
    </>
  )
}