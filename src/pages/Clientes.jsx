import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"
import { formatarCpfCnpj, formatarTelefone } from "../utils/formatadores"

export default function Clientes() {
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
  const [formAberto, setFormAberto] = useState(false)
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [busca, setBusca] = useState("")

  const [form, setForm] = useState({
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
  })

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) {
      setClientes(data || [])
    }
  }

  function limparFormulario() {
    setForm({
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
    })
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const clientesFiltrados = useMemo(() => {
    const texto = busca.toLowerCase().trim()

    if (!texto) return clientes

    return clientes.filter((cliente) =>
      `
        ${cliente.nome || ""}
        ${cliente.cpf_cnpj || ""}
        ${cliente.telefone || ""}
        ${cliente.email || ""}
        ${cliente.cidade || ""}
        ${cliente.uf || ""}
      `
        .toLowerCase()
        .includes(texto)
    )
  }, [clientes, busca])

  const resumo = useMemo(() => {
    const total = clientes.length

    const pessoaFisica = clientes.filter(
      (cliente) => cliente.tipo_cliente === "Pessoa Física"
    ).length

    const pessoaJuridica = clientes.filter(
      (cliente) => cliente.tipo_cliente === "Pessoa Jurídica"
    ).length

    return {
      total,
      pessoaFisica,
      pessoaJuridica,
    }
  }, [clientes])

  async function salvarCliente(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from("clientes").insert([form])

    setLoading(false)

    if (error) {
      alert("Erro ao salvar cliente.")
      console.error(error)
      return
    }

    limparFormulario()
    setFormAberto(false)
    carregarClientes()
  }

  async function excluirCliente(id) {
    const confirmar = window.confirm("Deseja realmente excluir este cliente?")

    if (!confirmar) return

    const { error } = await supabase.from("clientes").delete().eq("id", id)

    if (error) {
      console.error(error)
      alert("Erro ao excluir cliente.")
      return
    }

    carregarClientes()
  }

  return (
    <>
      <Sidebar aberto={menuAberto} onClose={() => setMenuAberto(false)} />

      <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-3">
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
                    Clientes
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500">
                    Cadastro e gestão dos clientes
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Total
              </p>

              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1 sm:mt-2">
                {resumo.total}
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Física
              </p>

              <h2 className="text-xl sm:text-2xl font-semibold text-green-700 mt-1 sm:mt-2">
                {resumo.pessoaFisica}
              </h2>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <p className="text-[11px] sm:text-sm text-slate-500">
                Jurídica
              </p>

              <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 mt-1 sm:mt-2">
                {resumo.pessoaJuridica}
              </h2>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                  Clientes cadastrados
                </h2>

                <p className="text-xs sm:text-sm text-slate-500">
                  {clientesFiltrados.length} cliente(s) encontrado(s)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="🔍 Pesquisar cliente..."
                  className="w-full sm:w-72 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <button
                  type="button"
                  onClick={() => setFormAberto(!formAberto)}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                >
                  {formAberto ? "Fechar cadastro" : "+ Novo cliente"}
                </button>
              </div>
            </div>
          </section>

          {formAberto && (
            <form
              onSubmit={salvarCliente}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 shadow-sm mb-4 sm:mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                    Cadastrar cliente
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500">
                    Preencha os dados principais para criar um novo cadastro.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    limparFormulario()
                    setFormAberto(false)
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="md:col-span-2 xl:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Nome ou Razão Social
                  </label>

                  <input
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Nome ou Razão Social"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Tipo de Cliente
                  </label>

                  <select
                    name="tipo_cliente"
                    value={form.tipo_cliente}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option>Pessoa Física</option>
                    <option>Pessoa Jurídica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    CPF ou CNPJ
                  </label>

                  <input
                    name="cpf_cnpj"
                    value={form.cpf_cnpj}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cpf_cnpj: formatarCpfCnpj(e.target.value),
                      })
                    }
                    placeholder="CPF ou CNPJ"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Telefone
                  </label>

                  <input
                    name="telefone"
                    value={form.telefone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        telefone: formatarTelefone(e.target.value),
                      })
                    }
                    placeholder="Telefone"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    E-mail
                  </label>

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="E-mail"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    CEP
                  </label>

                  <input
                    name="cep"
                    value={form.cep}
                    onChange={handleChange}
                    placeholder="CEP"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    UF
                  </label>

                  <select
                    name="uf"
                    value={form.uf}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">UF</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Cidade
                  </label>

                  <input
                    name="cidade"
                    value={form.cidade}
                    onChange={handleChange}
                    placeholder="Cidade"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Bairro
                  </label>

                  <input
                    name="bairro"
                    value={form.bairro}
                    onChange={handleChange}
                    placeholder="Bairro"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Endereço / Rua
                  </label>

                  <input
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    placeholder="Endereço / Rua"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Número
                  </label>

                  <input
                    name="numero"
                    value={form.numero}
                    onChange={handleChange}
                    placeholder="Número"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Complemento
                  </label>

                  <input
                    name="complemento"
                    value={form.complemento}
                    onChange={handleChange}
                    placeholder="Complemento"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Inscrição Estadual
                  </label>

                  <input
                    name="inscricao_estadual"
                    value={form.inscricao_estadual}
                    onChange={handleChange}
                    placeholder="Inscrição Estadual"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    limparFormulario()
                    setFormAberto(false)
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                >
                  {loading ? "Salvando..." : "Salvar cliente"}
                </button>
              </div>
            </form>
          )}

          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0">
            {clientesFiltrados.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Nenhum cliente encontrado.
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Tente pesquisar por outro nome, documento ou cidade.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {clientesFiltrados.map((cliente) => (
                  <article
                    key={cliente.id}
                    className="rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-indigo-200 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-base">
                          {cliente.tipo_cliente === "Pessoa Jurídica"
                            ? "🏢"
                            : "👤"}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800 leading-snug break-words">
                            {cliente.nome}
                          </h3>

                          <p className="text-xs text-slate-500 mt-1 break-words">
                            {cliente.cpf_cnpj || "CPF/CNPJ não informado"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2 py-1 text-[10px] rounded-full font-medium ${
                          cliente.tipo_cliente === "Pessoa Jurídica"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : "bg-green-50 text-green-700 border border-green-100"
                        }`}
                      >
                        {cliente.tipo_cliente === "Pessoa Jurídica" ? "PJ" : "PF"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                      <p className="truncate">
                        Tel:{" "}
                        <span className="text-slate-700">
                          {cliente.telefone || "Não informado"}
                        </span>
                      </p>

                      <p className="truncate">
                        Cidade:{" "}
                        <span className="text-slate-700">
                          {cliente.cidade
                            ? `${cliente.cidade}${cliente.uf ? `/${cliente.uf}` : ""}`
                            : "Não informada"}
                        </span>
                      </p>
                    </div>

                    {cliente.email && (
                      <p className="mt-2 text-xs text-slate-500 truncate">
                        E-mail:{" "}
                        <span className="text-slate-700">{cliente.email}</span>
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                        className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100"
                      >
                        Detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirCliente(cliente.id)}
                        className="flex-1 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100"
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}