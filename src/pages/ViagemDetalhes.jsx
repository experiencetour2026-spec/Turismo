import { useEffect, useState } from "react"
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"

const VALOR_DIARIA_PARADO = 750

const TIPOS_ONIBUS = [
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

function criarFormularioInicial() {
  return {
    cliente_id: "",
    tipo_viagem: "Citytour",
    periodo_citytour: "Integral",

    numero_carros: 1,
    numero_carro: "",

    tipo_onibus: "",
    valor_km: "",

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
  }
}

export default function ViagemDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()

  const voltar =
    searchParams.get("voltar")

  const [menuAberto, setMenuAberto] =
    useState(false)

  const [
    detalhesFinanceiroAberto,
    setDetalhesFinanceiroAberto,
  ] = useState(false)

  const [clientes, setClientes] =
    useState([])

  const [
    recebimentos,
    setRecebimentos,
  ] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [salvando, setSalvando] =
    useState(false)

  const [
    salvandoRecebimento,
    setSalvandoRecebimento,
  ] = useState(false)

  const [
    novoRecebimento,
    setNovoRecebimento,
  ] = useState("")

  const [
    observacaoRecebimento,
    setObservacaoRecebimento,
  ] = useState("")

  // Valor manual do Citytour POR CARRO
  const [
    valorCitytourManual,
    setValorCitytourManual,
  ] = useState("")

  const [form, setForm] = useState(
    criarFormularioInicial
  )

  // =========================================================
  // CARREGAMENTO
  // =========================================================

  useEffect(() => {
    carregarClientes()
    carregarViagem()
    carregarRecebimentos()
  }, [id])

  async function carregarClientes() {
    try {
      const { data, error } =
        await supabase
          .from("clientes")
          .select(
            "id, nome, cpf_cnpj"
          )
          .order("nome")

      if (error) {
        throw error
      }

      setClientes(data || [])
    } catch (error) {
      console.error(
        "Erro ao carregar clientes:",
        error
      )
    }
  }

  async function carregarViagem() {
    setLoading(true)

    try {
      const { data, error } =
        await supabase
          .from("reservas")
          .select("*")
          .eq("id", id)
          .single()

      if (error) {
        throw error
      }

      const quantidade =
        Number(
          data.numero_carros || 1
        )

      const despesa =
        data.despesa_motorista ===
        "Empresa"
          ? Number(
              data.valor_despesa_motorista ||
                0
            )
          : 0

      // Citytour não possui coluna própria de preço.
      // Portanto recuperamos o valor manual através
      // do total salvo, descontando a despesa.
      if (
        data.tipo_viagem ===
        "Citytour"
      ) {
        const valorTotalSalvo =
          Number(
            data.valor_total || 0
          )

        const valorBase =
          Math.max(
            valorTotalSalvo -
              despesa,
            0
          ) / quantidade

        setValorCitytourManual(
          String(valorBase)
        )
      } else {
        setValorCitytourManual("")
      }

      // Fallback para registros antigos
      const onibusEncontrado =
        TIPOS_ONIBUS.find(
          (item) =>
            item.nome ===
            data.tipo_onibus
        )

      const valorKmInicial =
        data.valor_km !== null &&
        data.valor_km !== undefined
          ? data.valor_km
          : onibusEncontrado?.valorKm ??
            ""

      setForm({
        cliente_id:
          data.cliente_id || "",

        tipo_viagem:
          data.tipo_viagem ||
          "Citytour",

        periodo_citytour:
          data.periodo_citytour ||
          "Integral",

        numero_carros:
          data.numero_carros || 1,

        numero_carro:
          data.numero_carro || "",

        tipo_onibus:
          data.tipo_onibus || "",

        valor_km:
          valorKmInicial,

        origem:
          data.origem || "",

        destino:
          data.destino || "",

        km_total:
          data.km_total ?? "",

        data_saida:
          paraDatetimeLocal(
            data.data_saida
          ),

        data_retorno:
          paraDatetimeLocal(
            data.data_retorno
          ),

        dias_parados:
          data.dias_parados ?? "",

        quantidade_motoristas:
          data.quantidade_motoristas ||
          1,

        matricula_motorista_1:
          data.matricula_motorista_1 ||
          "",

        matricula_motorista_2:
          data.matricula_motorista_2 ||
          "",

        despesa_motorista:
          data.despesa_motorista ||
          "Cliente",

        valor_despesa_motorista:
          data.valor_despesa_motorista ??
          "",

        forma_pagamento:
          data.forma_pagamento ||
          "Pix",

        valor_pago:
          data.valor_pago ?? "",

        status_viagem:
          data.status_viagem ||
          "Confirmada",
      })
    } catch (error) {
      console.error(
        "Erro ao carregar viagem:",
        error
      )

      alert(
        "Viagem não encontrada."
      )

      navigate("/viagens")
    } finally {
      setLoading(false)
    }
  }

  async function carregarRecebimentos() {
    try {
      const { data, error } =
        await supabase
          .from("recebimentos")
          .select("*")
          .eq("reserva_id", id)
          .order("created_at", {
            ascending: false,
          })

      if (error) {
        throw error
      }

      setRecebimentos(
        data || []
      )
    } catch (error) {
      console.error(
        "Erro ao carregar recebimentos:",
        error
      )
    }
  }

  // =========================================================
  // ALTERAÇÃO
  // =========================================================

  function handleChange(e) {
    const { name, value } =
      e.target

    setForm((formAtual) => ({
      ...formAtual,
      [name]: value,
    }))
  }

  function alterarTipoOnibus(e) {
    const tipo = e.target.value

    const encontrado =
      TIPOS_ONIBUS.find(
        (item) =>
          item.nome === tipo
      )

    setForm((formAtual) => ({
      ...formAtual,

      tipo_onibus: tipo,

      valor_km:
        formAtual.tipo_viagem ===
        "Turismo"
          ? encontrado?.valorKm ??
            ""
          : formAtual.valor_km,
    }))
  }

  // =========================================================
  // VOLTAR
  // =========================================================

  function voltarParaOrigem() {
    if (voltar === "relatorios") {
      navigate("/relatorios")
      return
    }

    navigate("/viagens")
  }

  // =========================================================
  // DATA
  // =========================================================

  function paraDatetimeLocal(valor) {
    if (!valor) return ""

    const data = new Date(valor)

    const ano =
      data.getFullYear()

    const mes = String(
      data.getMonth() + 1
    ).padStart(2, "0")

    const dia = String(
      data.getDate()
    ).padStart(2, "0")

    const hora = String(
      data.getHours()
    ).padStart(2, "0")

    const minuto = String(
      data.getMinutes()
    ).padStart(2, "0")

    return `${ano}-${mes}-${dia}T${hora}:${minuto}`
  }

  // =========================================================
  // FORMATAÇÃO
  // =========================================================

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    )
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )
  }

  // =========================================================
  // STATUS
  // =========================================================

  function statusPagamentoClasse(
    status
  ) {
    if (status === "Quitado") {
      return "border border-green-100 bg-green-50 text-green-700"
    }

    if (
      status === "Sinal pago" ||
      status ===
        "Pagamento Parcial"
    ) {
      return "border border-indigo-100 bg-indigo-50 text-indigo-700"
    }

    return "border border-slate-200 bg-slate-50 text-slate-600"
  }

  function statusViagemClasse(
    status
  ) {
    if (status === "Cancelada") {
      return "border border-red-100 bg-red-50 text-red-700"
    }

    return "border border-green-100 bg-green-50 text-green-700"
  }

  // =========================================================
  // CÁLCULOS
  // =========================================================

  const quantidadeCarros =
    Number(
      form.numero_carros || 1
    )

  const valorKmUnitario =
    Number(
      form.valor_km || 0
    )

  const valorKmTotal =
    Number(
      form.km_total || 0
    ) *
    valorKmUnitario *
    quantidadeCarros

  const valorDiasParados =
    Number(
      form.dias_parados || 0
    ) *
    VALOR_DIARIA_PARADO *
    quantidadeCarros

  const valorDespesaMotorista =
    form.despesa_motorista ===
    "Empresa"
      ? Number(
          form.valor_despesa_motorista ||
            0
        )
      : 0

  const valorCitytour =
    Number(
      valorCitytourManual || 0
    )

  const valorCitytourTotal =
    valorCitytour *
    quantidadeCarros

  const valorTotal =
    form.tipo_viagem ===
    "Citytour"
      ? valorCitytourTotal +
        valorDespesaMotorista
      : valorKmTotal +
        valorDiasParados +
        valorDespesaMotorista

  const valorPago =
    Number(
      form.valor_pago || 0
    )

  const valorRestante =
    Math.max(
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
  // SALVAR ALTERAÇÕES
  // =========================================================

  async function salvarAlteracoes(
    e
  ) {
    e.preventDefault()

    if (salvando) return

    if (
      form.tipo_viagem ===
        "Citytour" &&
      valorCitytour <= 0
    ) {
      alert(
        "Informe o valor do Citytour."
      )
      return
    }

    if (
      form.tipo_viagem ===
        "Turismo" &&
      valorKmUnitario <= 0
    ) {
      alert(
        "Informe o valor por KM da viagem."
      )
      return
    }

    setSalvando(true)

    try {
      const payload = {
        ...form,

        numero_carros:
          quantidadeCarros,

        km_total:
          Number(
            form.km_total || 0
          ),

        valor_km:
          form.valor_km === "" ||
          form.valor_km === null
            ? null
            : Number(
                form.valor_km
              ),

        periodo_citytour:
          form.tipo_viagem ===
          "Citytour"
            ? form.periodo_citytour
            : null,

        dias_parados:
          Number(
            form.dias_parados ||
              0
          ),

        quantidade_motoristas:
          Number(
            form.quantidade_motoristas
          ),

        valor_despesa_motorista:
          valorDespesaMotorista,

        valor_total:
          valorTotal,

        valor_pago:
          valorPago,

        valor_restante:
          valorRestante,

        status:
          statusPagamento,

        matricula_motorista_2:
          Number(
            form.quantidade_motoristas
          ) === 2
            ? form.matricula_motorista_2
            : "",
      }

      const { error } =
        await supabase
          .from("reservas")
          .update(payload)
          .eq("id", id)

      if (error) {
        throw error
      }

      alert(
        "Viagem atualizada com sucesso."
      )

      await carregarViagem()
    } catch (error) {
      console.error(
        "Erro ao salvar alterações:",
        error
      )

      alert(
        "Erro ao salvar alterações."
      )
    } finally {
      setSalvando(false)
    }
  }

  // =========================================================
  // RECEBIMENTO
  // =========================================================

  async function lancarRecebimento(
    e
  ) {
    e.preventDefault()

    if (salvandoRecebimento) {
      return
    }

    const valor =
      Number(
        novoRecebimento || 0
      )

    if (valor <= 0) {
      alert(
        "Informe um valor válido."
      )
      return
    }

    const novoValorPago =
      valorPago + valor

    const novoValorRestante =
      Math.max(
        valorTotal -
          novoValorPago,
        0
      )

    const novoStatus =
      novoValorRestante === 0
        ? "Quitado"
        : "Sinal pago"

    setSalvandoRecebimento(true)

    try {
      const {
        error:
          erroRecebimento,
      } = await supabase
        .from("recebimentos")
        .insert([
          {
            reserva_id: id,
            valor,
            observacao:
              observacaoRecebimento,
          },
        ])

      if (erroRecebimento) {
        throw erroRecebimento
      }

      const {
        error: erroReserva,
      } = await supabase
        .from("reservas")
        .update({
          valor_pago:
            novoValorPago,

          valor_restante:
            novoValorRestante,

          status:
            novoStatus,
        })
        .eq("id", id)

      if (erroReserva) {
        console.error(
          erroReserva
        )

        alert(
          "Recebimento salvo, mas ocorreu um erro ao atualizar a viagem."
        )

        return
      }

      setNovoRecebimento("")
      setObservacaoRecebimento(
        ""
      )

      if (
        voltar ===
        "relatorios"
      ) {
        navigate(
          "/relatorios"
        )
        return
      }

      await carregarViagem()
      await carregarRecebimentos()
    } catch (error) {
      console.error(
        "Erro ao lançar recebimento:",
        error
      )

      alert(
        "Erro ao lançar recebimento."
      )
    } finally {
      setSalvandoRecebimento(
        false
      )
    }
  }

  // =========================================================
  // CLASSES
  // =========================================================

  const inputClass =
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  const labelClass =
    "mb-1.5 block text-xs font-medium text-slate-500"

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm"

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

      {menuAberto && (
        <div
          onClick={() =>
            setMenuAberto(false)
          }
          className="fixed inset-0 z-40 bg-black/40"
        />
      )}

      <div className="min-h-screen bg-slate-100 px-3 pb-28 pt-4 sm:px-4 md:p-6 xl:pb-6">

        <div className="mx-auto max-w-[1500px]">

          {/* ================================================= */}
          {/* CABEÇALHO */}
          {/* ================================================= */}

          <header className="mb-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex items-start gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setMenuAberto(
                      true
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                  aria-label="Abrir menu"
                >
                  ☰
                </button>

                <div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                    Viagens
                  </p>

                  <h1 className="mt-0.5 text-xl font-semibold text-slate-800 sm:text-2xl">
                    Detalhes da Viagem
                  </h1>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Visualize, edite e
                    acompanhe os recebimentos
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  voltarParaOrigem
                }
                className="hidden h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:flex"
              >
                ← Voltar
              </button>

            </div>

          </header>

          {/* ================================================= */}
          {/* LOADING */}
          {/* ================================================= */}

          {loading ? (

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">

              <div
                className={`${cardClass} animate-pulse p-5`}
              >

                <div className="h-5 w-40 rounded bg-slate-200" />

                <div className="mt-6 grid grid-cols-2 gap-3">

                  {Array.from({
                    length: 12,
                  }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="h-10 rounded-xl bg-slate-100"
                      />
                    )
                  )}

                </div>

              </div>

              <div
                className={`${cardClass} hidden h-80 animate-pulse p-5 xl:block`}
              >
                <div className="h-5 w-40 rounded bg-slate-200" />
                <div className="mt-5 h-10 w-2/3 rounded bg-slate-100" />
              </div>

            </div>

          ) : (

            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">

              {/* ============================================= */}
              {/* FORMULÁRIO PRINCIPAL */}
              {/* ============================================= */}

              <form
                id="form-viagem"
                onSubmit={
                  salvarAlteracoes
                }
                className="min-w-0 space-y-4"
              >

                {/* =========================================== */}
                {/* CLIENTE E VIAGEM */}
                {/* =========================================== */}

                <section
                  className={`${cardClass} p-4 sm:p-5`}
                >

                  <div className="mb-4 flex items-start justify-between gap-3">

                    <div>

                      <h2 className="text-base font-semibold text-slate-800">
                        Cliente e viagem
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Informações principais
                        da reserva.
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusViagemClasse(
                        form.status_viagem
                      )}`}
                    >
                      {
                        form.status_viagem
                      }
                    </span>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">

                    {/* CLIENTE */}

                    <div className="sm:col-span-2 xl:col-span-6">

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
                          Selecione o cliente
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

                    {/* STATUS */}

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Status da viagem
                      </label>

                      <select
                        name="status_viagem"
                        value={
                          form.status_viagem
                        }
                        onChange={
                          handleChange
                        }
                        className={
                          inputClass
                        }
                      >
                        <option value="Confirmada">
                          Confirmada
                        </option>

                        <option value="Cancelada">
                          Cancelada
                        </option>
                      </select>

                    </div>

                    {/* TIPO */}

                    <div className="xl:col-span-3">

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
                      <div className="xl:col-span-3">

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

                    {/* CITYTOUR MANUAL */}

                    {form.tipo_viagem ===
                      "Citytour" && (
                      <div className="xl:col-span-3">

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
                              e.target
                                .value
                            )
                          }
                          className={
                            inputClass
                          }
                        />

                      </div>
                    )}

                    {/* PAGAMENTO */}

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Forma de pagamento
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

                    {/* ÔNIBUS */}

                    <div className="sm:col-span-2 xl:col-span-6">

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
                          alterarTipoOnibus
                        }
                        className={
                          inputClass
                        }
                      >

                        <option value="">
                          Selecione o tipo de ônibus
                        </option>

                        {TIPOS_ONIBUS.map(
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
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {/* VALOR KM */}

                    {form.tipo_viagem ===
                      "Turismo" && (
                      <div className="xl:col-span-3">

                        <label
                          className={
                            labelClass
                          }
                        >
                          Valor por KM
                        </label>

                        <input
                          name="valor_km"
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            form.valor_km
                          }
                          onChange={
                            handleChange
                          }
                          className={
                            inputClass
                          }
                        />

                      </div>
                    )}

                  </div>

                </section>

                {/* =========================================== */}
                {/* ROTEIRO */}
                {/* =========================================== */}

                <section
                  className={`${cardClass} p-4 sm:p-5`}
                >

                  <div className="mb-4">

                    <h2 className="text-base font-semibold text-slate-800">
                      Roteiro e datas
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Origem, destino,
                      quilometragem e período.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">

                    <div className="xl:col-span-6">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Origem
                      </label>

                      <input
                        name="origem"
                        value={
                          form.origem
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

                    <div className="xl:col-span-6">

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
                        className={
                          inputClass
                        }
                      />

                    </div>

                    <div className="xl:col-span-3">

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
                        value={
                          form.km_total
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

                    <div className="xl:col-span-3">

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
                        value={
                          form.dias_parados
                        }
                        onChange={
                          handleChange
                        }
                        className={
                          inputClass
                        }
                      />

                    </div>

                    <div className="xl:col-span-3">

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

                    <div className="xl:col-span-3">

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

                {/* =========================================== */}
                {/* VEÍCULO E MOTORISTA */}
                {/* =========================================== */}

                <section
                  className={`${cardClass} p-4 sm:p-5`}
                >

                  <div className="mb-4">

                    <h2 className="text-base font-semibold text-slate-800">
                      Veículo e motorista
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Carro, motoristas e
                      despesas operacionais.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">

                    <div className="xl:col-span-3">

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
                        value={
                          form.numero_carros
                        }
                        onChange={
                          handleChange
                        }
                        className={
                          inputClass
                        }
                      />

                    </div>

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Nº do carro
                      </label>

                      <input
                        name="numero_carro"
                        value={
                          form.numero_carro
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Nº do carro"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    <div className="xl:col-span-3">

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

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Despesa motorista
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

                    <div className="xl:col-span-6">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Matrícula + Motorista 1
                      </label>

                      <input
                        name="matricula_motorista_1"
                        value={
                          form.matricula_motorista_1
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Matrícula + Motorista 1"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {Number(
                      form.quantidade_motoristas
                    ) === 2 && (
                      <div className="xl:col-span-6">

                        <label
                          className={
                            labelClass
                          }
                        >
                          Matrícula + Motorista 2
                        </label>

                        <input
                          name="matricula_motorista_2"
                          value={
                            form.matricula_motorista_2
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Matrícula + Motorista 2"
                          className={
                            inputClass
                          }
                        />

                      </div>
                    )}

                    {form.despesa_motorista ===
                      "Empresa" && (
                      <div className="xl:col-span-4">

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
                          value={
                            form.valor_despesa_motorista
                          }
                          onChange={
                            handleChange
                          }
                          className={
                            inputClass
                          }
                        />

                      </div>
                    )}

                  </div>

                  {/* BOTÕES DESKTOP */}

                  <div className="mt-5 hidden justify-end gap-2 border-t border-slate-100 pt-5 xl:flex">

                    <button
                      type="button"
                      onClick={
                        voltarParaOrigem
                      }
                      className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={
                        salvando
                      }
                      className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {salvando
                        ? "Salvando..."
                        : "Salvar alterações"}
                    </button>

                  </div>

                </section>

              </form>

              {/* ============================================= */}
              {/* COLUNA FINANCEIRA */}
              {/* ============================================= */}

              <aside className="min-w-0 space-y-4">

                {/* RESUMO */}

                <section
                  className={`${cardClass} p-4 sm:p-5`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h2 className="text-base font-semibold text-slate-800">
                        Resumo financeiro
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Valor atual da viagem
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${statusPagamentoClasse(
                        statusPagamento
                      )}`}
                    >
                      {
                        statusPagamento
                      }
                    </span>

                  </div>

                  <p className="mt-5 break-words text-3xl font-bold tracking-tight text-indigo-700">
                    {formatarMoeda(
                      valorTotal
                    )}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">

                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Recebido
                      </p>

                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {formatarMoeda(
                          valorPago
                        )}
                      </p>

                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">

                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        Restante
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatarMoeda(
                          valorRestante
                        )}
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDetalhesFinanceiroAberto(
                        (
                          estadoAtual
                        ) =>
                          !estadoAtual
                      )
                    }
                    className="mt-4 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    {detalhesFinanceiroAberto
                      ? "Ocultar composição"
                      : "+ Ver composição"}
                  </button>

                  {detalhesFinanceiroAberto && (
                    <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs">

                      {form.tipo_viagem ===
                      "Citytour" ? (
                        <>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">
                              Citytour por carro
                            </span>

                            <b className="text-slate-700">
                              {formatarMoeda(
                                valorCitytour
                              )}
                            </b>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">
                              Total Citytour
                            </span>

                            <b className="text-slate-700">
                              {formatarMoeda(
                                valorCitytourTotal
                              )}
                            </b>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">
                              Valor por KM
                            </span>

                            <b className="text-slate-700">
                              {formatarMoeda(
                                valorKmUnitario
                              )}
                            </b>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">
                              KM da viagem
                            </span>

                            <b className="text-slate-700">
                              {formatarMoeda(
                                valorKmTotal
                              )}
                            </b>
                          </div>

                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">
                              Diárias extras
                            </span>

                            <b className="text-slate-700">
                              {formatarMoeda(
                                valorDiasParados
                              )}
                            </b>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between gap-3">

                        <span className="text-slate-400">
                          Despesa motorista
                        </span>

                        <b className="text-slate-700">
                          {formatarMoeda(
                            valorDespesaMotorista
                          )}
                        </b>

                      </div>

                    </div>
                  )}

                </section>

                {/* =========================================== */}
                {/* NOVO RECEBIMENTO */}
                {/* =========================================== */}

                <form
                  onSubmit={
                    lancarRecebimento
                  }
                  className={`${cardClass} p-4 sm:p-5`}
                >

                  <div>

                    <h2 className="text-base font-semibold text-slate-800">
                      Lançar recebimento
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Registre um novo pagamento
                      recebido.
                    </p>

                  </div>

                  <div className="mt-4">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Valor recebido
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={
                        novoRecebimento
                      }
                      onChange={(e) =>
                        setNovoRecebimento(
                          e.target.value
                        )
                      }
                      placeholder="0,00"
                      className={
                        inputClass
                      }
                    />

                  </div>

                  <div className="mt-3">

                    <label
                      className={
                        labelClass
                      }
                    >
                      Observação
                    </label>

                    <textarea
                      value={
                        observacaoRecebimento
                      }
                      onChange={(e) =>
                        setObservacaoRecebimento(
                          e.target.value
                        )
                      }
                      placeholder="Observação sobre o pagamento"
                      rows="3"
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                  </div>

                  <button
                    type="submit"
                    disabled={
                      salvandoRecebimento
                    }
                    className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvandoRecebimento
                      ? "Registrando..."
                      : "Registrar recebimento"}
                  </button>

                </form>

                {/* =========================================== */}
                {/* HISTÓRICO */}
                {/* =========================================== */}

                <section
                  className={`${cardClass} p-4 sm:p-5`}
                >

                  <div>

                    <h2 className="text-base font-semibold text-slate-800">
                      Histórico de recebimentos
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Pagamentos registrados
                      nesta viagem.
                    </p>

                  </div>

                  {recebimentos.length ===
                  0 ? (

                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center">

                      <p className="text-xs font-medium text-slate-500">
                        Nenhum recebimento lançado.
                      </p>

                    </div>

                  ) : (

                    <div className="mt-4 space-y-2.5">

                      {recebimentos.map(
                        (item) => (
                          <article
                            key={
                              item.id
                            }
                            className="rounded-xl border border-slate-200 p-3"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div>

                                <p className="text-sm font-semibold text-emerald-700">
                                  {formatarMoeda(
                                    item.valor
                                  )}
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  {formatarData(
                                    item.created_at
                                  )}
                                </p>

                              </div>

                            </div>

                            {item.observacao && (
                              <p className="mt-3 break-words border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">
                                {
                                  item.observacao
                                }
                              </p>
                            )}

                          </article>
                        )
                      )}

                    </div>
                  )}

                </section>

              </aside>

              {/* ============================================= */}
              {/* BARRA MOBILE */}
              {/* ============================================= */}

              <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-5px_20px_rgba(15,23,42,0.10)] xl:hidden">

                <div className="mx-auto grid max-w-lg grid-cols-[110px_1fr] gap-2">

                  <button
                    type="button"
                    onClick={
                      voltarParaOrigem
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    form="form-viagem"
                    disabled={
                      salvando
                    }
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvando
                      ? "Salvando..."
                      : "Salvar alterações"}
                  </button>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </>
  )
}