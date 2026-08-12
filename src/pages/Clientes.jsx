import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"
import {
  formatarCpfCnpj,
  formatarTelefone,
} from "../utils/formatadores"

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

function criarFormularioInicial() {
  return {
    nome: "",
    cpf_cnpj: "",
    telefone: "",
    email: "",
    cep: "",
    uf: "",
    cidade: "",
    bairro: "",
    endereco: "",
    numero: "",
    complemento: "",
    inscricao_estadual: "",
    tipo_cliente: "Pessoa Física",
  }
}

export default function Clientes() {
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
  const [formAberto, setFormAberto] = useState(false)

  const [clientes, setClientes] = useState([])
  const [carregandoClientes, setCarregandoClientes] =
    useState(true)

  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState(null)

  const [busca, setBusca] = useState("")

  const [form, setForm] = useState(
    criarFormularioInicial
  )

  // =========================================================
  // CARREGAR CLIENTES
  // ORDEM ALFABÉTICA A-Z
  // =========================================================

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    setCarregandoClientes(true)

    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", {
          ascending: true,
        })

      if (error) {
        throw error
      }

      setClientes(data || [])
    } catch (error) {
      console.error(
        "Erro ao carregar clientes:",
        error
      )

      alert("Erro ao carregar clientes.")
    } finally {
      setCarregandoClientes(false)
    }
  }

  // =========================================================
  // FORMULÁRIO
  // =========================================================

  function limparFormulario() {
    setForm(criarFormularioInicial())
  }

  function handleChange(e) {
    const { name, value } = e.target

    setForm((formAtual) => ({
      ...formAtual,
      [name]: value,
    }))
  }

  function alternarFormulario() {
    if (formAberto) {
      limparFormulario()
      setFormAberto(false)
      return
    }

    limparFormulario()
    setFormAberto(true)
  }

  function cancelarCadastro() {
    limparFormulario()
    setFormAberto(false)
  }

  // =========================================================
  // FILTRO
  // =========================================================

  const clientesFiltrados = useMemo(() => {
    const texto = busca
      .toLowerCase()
      .trim()

    if (!texto) {
      return clientes
    }

    return clientes.filter((cliente) =>
      `
        ${cliente.nome || ""}
        ${cliente.cpf_cnpj || ""}
        ${cliente.telefone || ""}
        ${cliente.email || ""}
        ${cliente.cidade || ""}
        ${cliente.uf || ""}
        ${cliente.tipo_cliente || ""}
      `
        .toLowerCase()
        .includes(texto)
    )
  }, [clientes, busca])

  // =========================================================
  // RESUMO
  // =========================================================

  const resumo = useMemo(() => {
    const total = clientes.length

    const pessoaFisica = clientes.filter(
      (cliente) =>
        cliente.tipo_cliente ===
        "Pessoa Física"
    ).length

    const pessoaJuridica = clientes.filter(
      (cliente) =>
        cliente.tipo_cliente ===
        "Pessoa Jurídica"
    ).length

    return {
      total,
      pessoaFisica,
      pessoaJuridica,
    }
  }, [clientes])

  // =========================================================
  // SALVAR
  // =========================================================

  async function salvarCliente(e) {
    e.preventDefault()

    if (salvando) return

    setSalvando(true)

    try {
      const { error } = await supabase
        .from("clientes")
        .insert([form])

      if (error) {
        throw error
      }

      limparFormulario()
      setFormAberto(false)

      await carregarClientes()
    } catch (error) {
      console.error(
        "Erro ao salvar cliente:",
        error
      )

      alert("Erro ao salvar cliente.")
    } finally {
      setSalvando(false)
    }
  }

  // =========================================================
  // EXCLUIR
  // =========================================================

  async function excluirCliente(id) {
    const confirmar = window.confirm(
      "Deseja realmente excluir este cliente?"
    )

    if (!confirmar) return

    setExcluindoId(id)

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      await carregarClientes()
    } catch (error) {
      console.error(
        "Erro ao excluir cliente:",
        error
      )

      alert(
        "Não foi possível excluir o cliente."
      )
    } finally {
      setExcluindoId(null)
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

      <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 md:p-6">
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
                    setMenuAberto(true)
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                  aria-label="Abrir menu"
                >
                  ☰
                </button>

                <div className="min-w-0">

                  <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                    Clientes
                  </h1>

                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Cadastro e gestão dos clientes
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  alternarFormulario
                }
                className={`flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition sm:w-auto ${
                  formAberto
                    ? "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {formAberto
                  ? "Fechar cadastro"
                  : "+ Novo cliente"}
              </button>

            </div>
          </header>

          {/* ================================================= */}
          {/* INDICADORES */}
          {/* ================================================= */}

          <section className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">

            {/* TOTAL */}

            <div
              className={`${cardClass} p-3 sm:p-5`}
            >
              <div className="flex items-start justify-between">

                <div>

                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-slate-800 sm:mt-2 sm:text-3xl">
                    {resumo.total}
                  </p>

                </div>

                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 sm:flex">
                  CL
                </div>

              </div>
            </div>

            {/* PF */}

            <div
              className={`${cardClass} p-3 sm:p-5`}
            >
              <div className="flex items-start justify-between">

                <div>

                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                    Pessoa Física
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-emerald-700 sm:mt-2 sm:text-3xl">
                    {
                      resumo.pessoaFisica
                    }
                  </p>

                </div>

                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 sm:flex">
                  PF
                </div>

              </div>
            </div>

            {/* PJ */}

            <div
              className={`${cardClass} p-3 sm:p-5`}
            >
              <div className="flex items-start justify-between">

                <div>

                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                    Pessoa Jurídica
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-indigo-700 sm:mt-2 sm:text-3xl">
                    {
                      resumo.pessoaJuridica
                    }
                  </p>

                </div>

                <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700 sm:flex">
                  PJ
                </div>

              </div>
            </div>

          </section>

          {/* ================================================= */}
          {/* PESQUISA */}
          {/* ================================================= */}

          <section
            className={`${cardClass} mb-4 p-4 sm:p-5`}
          >

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
                  Clientes cadastrados
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {
                    clientesFiltrados.length
                  }{" "}
                  {clientesFiltrados.length ===
                  1
                    ? "cliente encontrado"
                    : "clientes encontrados"}
                </p>

              </div>

              <div className="flex w-full items-center gap-2 lg:w-auto">

                <div className="relative min-w-0 flex-1 lg:w-80 lg:flex-none">

                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ⌕
                  </span>

                  <input
                    value={busca}
                    onChange={(e) =>
                      setBusca(
                        e.target.value
                      )
                    }
                    placeholder="Pesquisar cliente..."
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  {busca && (
                    <button
                      type="button"
                      onClick={() =>
                        setBusca("")
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-700"
                      aria-label="Limpar pesquisa"
                    >
                      ✕
                    </button>
                  )}

                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* NOVO CLIENTE */}
          {/* ================================================= */}

          {formAberto && (
            <form
              onSubmit={
                salvarCliente
              }
              className={`${cardClass} mb-4 overflow-hidden`}
            >

              {/* CABEÇALHO FORM */}

              <div className="border-b border-slate-100 p-4 sm:p-5">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                      Novo cadastro
                    </span>

                    <h2 className="mt-1 text-lg font-semibold text-slate-800">
                      Cadastrar cliente
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Preencha as informações
                      cadastrais do cliente.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      cancelarCadastro
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-500 transition hover:bg-slate-200"
                    aria-label="Fechar cadastro"
                  >
                    ✕
                  </button>

                </div>

              </div>

              <div className="space-y-7 p-4 sm:p-5">

                {/* =========================================== */}
                {/* DADOS PRINCIPAIS */}
                {/* =========================================== */}

                <section>

                  <div className="mb-4">

                    <h3 className="text-sm font-semibold text-slate-700">
                      Dados principais
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Identificação e
                      classificação do cliente.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">

                    {/* NOME */}

                    <div className="sm:col-span-2 xl:col-span-6">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Nome ou Razão Social
                      </label>

                      <input
                        name="nome"
                        value={
                          form.nome
                        }
                        onChange={
                          handleChange
                        }
                        required
                        placeholder="Nome ou Razão Social"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* TIPO */}

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Tipo de cliente
                      </label>

                      <select
                        name="tipo_cliente"
                        value={
                          form.tipo_cliente
                        }
                        onChange={
                          handleChange
                        }
                        className={
                          inputClass
                        }
                      >
                        <option>
                          Pessoa Física
                        </option>

                        <option>
                          Pessoa Jurídica
                        </option>
                      </select>

                    </div>

                    {/* CPF/CNPJ */}

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        CPF ou CNPJ
                      </label>

                      <input
                        name="cpf_cnpj"
                        value={
                          form.cpf_cnpj
                        }
                        onChange={(e) =>
                          setForm(
                            (
                              formAtual
                            ) => ({
                              ...formAtual,
                              cpf_cnpj:
                                formatarCpfCnpj(
                                  e.target
                                    .value
                                ),
                            })
                          )
                        }
                        required
                        placeholder="CPF ou CNPJ"
                        inputMode="numeric"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* INSCRIÇÃO */}

                    <div className="sm:col-span-2 xl:col-span-4">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Inscrição Estadual
                      </label>

                      <input
                        name="inscricao_estadual"
                        value={
                          form.inscricao_estadual
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Inscrição Estadual"
                        className={
                          inputClass
                        }
                      />

                    </div>

                  </div>

                </section>

                <div className="border-t border-slate-100" />

                {/* =========================================== */}
                {/* CONTATO */}
                {/* =========================================== */}

                <section>

                  <div className="mb-4">

                    <h3 className="text-sm font-semibold text-slate-700">
                      Contato
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Dados para comunicação
                      com o cliente.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    {/* TELEFONE */}

                    <div>

                      <label
                        className={
                          labelClass
                        }
                      >
                        Telefone
                      </label>

                      <input
                        name="telefone"
                        value={
                          form.telefone
                        }
                        onChange={(e) =>
                          setForm(
                            (
                              formAtual
                            ) => ({
                              ...formAtual,
                              telefone:
                                formatarTelefone(
                                  e.target
                                    .value
                                ),
                            })
                          )
                        }
                        required
                        inputMode="tel"
                        placeholder="Telefone"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* EMAIL */}

                    <div>

                      <label
                        className={
                          labelClass
                        }
                      >
                        E-mail
                      </label>

                      <input
                        name="email"
                        type="email"
                        value={
                          form.email
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="E-mail"
                        className={
                          inputClass
                        }
                      />

                    </div>

                  </div>

                </section>

                <div className="border-t border-slate-100" />

                {/* =========================================== */}
                {/* ENDEREÇO */}
                {/* =========================================== */}

                <section>

                  <div className="mb-4">

                    <h3 className="text-sm font-semibold text-slate-700">
                      Endereço
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Localização e endereço
                      cadastral.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">

                    {/* CEP */}

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        CEP
                      </label>

                      <input
                        name="cep"
                        value={
                          form.cep
                        }
                        onChange={
                          handleChange
                        }
                        inputMode="numeric"
                        placeholder="CEP"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* UF */}

                    <div className="xl:col-span-2">

                      <label
                        className={
                          labelClass
                        }
                      >
                        UF
                      </label>

                      <select
                        name="uf"
                        value={form.uf}
                        onChange={
                          handleChange
                        }
                        className={
                          inputClass
                        }
                      >

                        <option value="">
                          Selecione
                        </option>

                        {UFS.map(
                          (uf) => (
                            <option
                              key={uf}
                              value={uf}
                            >
                              {uf}
                            </option>
                          )
                        )}

                      </select>

                    </div>

                    {/* CIDADE */}

                    <div className="xl:col-span-4">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Cidade
                      </label>

                      <input
                        name="cidade"
                        value={
                          form.cidade
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Cidade"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* BAIRRO */}

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Bairro
                      </label>

                      <input
                        name="bairro"
                        value={
                          form.bairro
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Bairro"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* ENDEREÇO */}

                    <div className="sm:col-span-2 xl:col-span-7">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Endereço / Rua
                      </label>

                      <input
                        name="endereco"
                        value={
                          form.endereco
                        }
                        onChange={
                          handleChange
                        }
                        required
                        placeholder="Endereço / Rua"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* NUMERO */}

                    <div className="xl:col-span-2">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Número
                      </label>

                      <input
                        name="numero"
                        value={
                          form.numero
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Número"
                        className={
                          inputClass
                        }
                      />

                    </div>

                    {/* COMPLEMENTO */}

                    <div className="xl:col-span-3">

                      <label
                        className={
                          labelClass
                        }
                      >
                        Complemento
                      </label>

                      <input
                        name="complemento"
                        value={
                          form.complemento
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Complemento"
                        className={
                          inputClass
                        }
                      />

                    </div>

                  </div>

                </section>

              </div>

              {/* RODAPÉ FORM */}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:justify-end sm:p-5">

                <button
                  type="button"
                  onClick={
                    cancelarCadastro
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="h-10 w-full rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar cliente"}
                </button>

              </div>

            </form>
          )}

          {/* ================================================= */}
          {/* LISTA */}
          {/* ================================================= */}

          <section
            className={`${cardClass} min-w-0 p-4 sm:p-5`}
          >

            {carregandoClientes ? (

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

                {Array.from({
                  length: 6,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="h-4 w-2/3 rounded bg-slate-200" />

                    <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />

                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <div className="h-8 rounded bg-slate-100" />
                      <div className="h-8 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}

              </div>

            ) : clientesFiltrados.length === 0 ? (

              <div className="py-12 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                  CL
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  Nenhum cliente encontrado
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  {busca
                    ? "Tente pesquisar por outro nome, documento, telefone ou cidade."
                    : "Cadastre o primeiro cliente para começar a utilizar o sistema."}
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

                {clientesFiltrados.map(
                  (cliente) => {
                    const pessoaJuridica =
                      cliente.tipo_cliente ===
                      "Pessoa Jurídica"

                    return (
                      <article
                        key={
                          cliente.id
                        }
                        className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
                      >

                        {/* CABEÇALHO */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-start gap-3">

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                pessoaJuridica
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {pessoaJuridica
                                ? "PJ"
                                : "PF"}
                            </div>

                            <div className="min-w-0">

                              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                                {
                                  cliente.nome
                                }
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                {cliente.cpf_cnpj ||
                                  "Documento não informado"}
                              </p>

                            </div>

                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${
                              pessoaJuridica
                                ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                                : "border-emerald-100 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {pessoaJuridica
                              ? "Jurídica"
                              : "Física"}
                          </span>

                        </div>

                        {/* DADOS */}

                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">

                          <div className="flex items-start justify-between gap-3 text-xs">

                            <span className="shrink-0 text-slate-400">
                              Telefone
                            </span>

                            <span className="truncate text-right font-medium text-slate-600">
                              {cliente.telefone ||
                                "Não informado"}
                            </span>

                          </div>

                          <div className="flex items-start justify-between gap-3 text-xs">

                            <span className="shrink-0 text-slate-400">
                              Cidade
                            </span>

                            <span className="truncate text-right font-medium text-slate-600">
                              {cliente.cidade
                                ? `${cliente.cidade}${
                                    cliente.uf
                                      ? `/${cliente.uf}`
                                      : ""
                                  }`
                                : "Não informada"}
                            </span>

                          </div>

                          <div className="flex items-start justify-between gap-3 text-xs">

                            <span className="shrink-0 text-slate-400">
                              E-mail
                            </span>

                            <span className="truncate text-right font-medium text-slate-600">
                              {cliente.email ||
                                "Não informado"}
                            </span>

                          </div>

                        </div>

                        {/* AÇÕES */}

                        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/clientes/${cliente.id}`
                              )
                            }
                            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            Ver detalhes
                          </button>

                          <button
                            type="button"
                            disabled={
                              excluindoId ===
                              cliente.id
                            }
                            onClick={() =>
                              excluirCliente(
                                cliente.id
                              )
                            }
                            className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Excluir cliente"
                          >
                            {excluindoId ===
                            cliente.id
                              ? "..."
                              : "Excluir"}
                          </button>

                        </div>

                      </article>
                    )
                  }
                )}

              </div>
            )}

          </section>

        </div>
      </div>
    </>
  )
}