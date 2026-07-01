import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"
import { formatarCpfCnpj, formatarTelefone } from "../utils/formatadores"

export default function Clientes() {
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
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
        <header className="flex items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
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
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total de clientes</p>

            <h2 className="text-2xl font-semibold text-slate-800 mt-2">
              {resumo.total}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pessoa Física</p>

            <h2 className="text-2xl font-semibold text-green-700 mt-2">
              {resumo.pessoaFisica}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-sm text-slate-500">Pessoa Jurídica</p>

            <h2 className="text-2xl font-semibold text-indigo-700 mt-2">
              {resumo.pessoaJuridica}
            </h2>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
          <form
            onSubmit={salvarCliente}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 h-fit shadow-sm"
          >
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              Cadastrar cliente
            </h2>

            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome ou Razão Social"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />

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
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
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
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              />

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="E-mail"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
              <input
                name="cep"
                value={form.cep}
                onChange={handleChange}
                placeholder="CEP"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              />

              <select
                name="uf"
                value={form.uf}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
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

            <input
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              placeholder="Cidade"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />

            <input
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              placeholder="Bairro"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-4">
              <input
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                placeholder="Endereço / Rua"
                required
                className="md:col-span-2 xl:col-span-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              />

              <input
                name="numero"
                value={form.numero}
                onChange={handleChange}
                placeholder="Número"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              />
            </div>

            <input
              name="complemento"
              value={form.complemento}
              onChange={handleChange}
              placeholder="Complemento"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />

            <input
              name="inscricao_estadual"
              value={form.inscricao_estadual}
              onChange={handleChange}
              placeholder="Inscrição Estadual"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />

            <select
              name="tipo_cliente"
              value={form.tipo_cliente}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            >
              <option>Pessoa Física</option>
              <option>Pessoa Jurídica</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {loading ? "Salvando..." : "Salvar cliente"}
            </button>
          </form>

          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0">
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Clientes cadastrados
                </h2>

                <p className="text-xs text-slate-500">
                  {clientesFiltrados.length} cliente(s) encontrado(s)
                </p>
              </div>

              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="🔍 Pesquisar cliente..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>

            {clientesFiltrados.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum cliente encontrado.
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="border border-slate-200 rounded-xl px-3 py-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">
                            {cliente.tipo_cliente === "Pessoa Jurídica"
                              ? "🏢"
                              : "👤"}
                          </span>

                          <p className="font-medium text-sm text-slate-800 truncate">
                            {cliente.nome}
                          </p>
                        </div>

                        <p className="text-xs text-slate-500 break-words mt-0.5">
                          {cliente.cpf_cnpj || "CPF/CNPJ não informado"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-wrap md:items-center gap-2">
                        <span
                          className={`text-center px-2 py-1 text-[11px] rounded-full font-medium ${
                            cliente.tipo_cliente === "Pessoa Jurídica"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {cliente.tipo_cliente || "Cliente"}
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate(`/clientes/${cliente.id}`)}
                          className="px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-xs hover:bg-indigo-100"
                        >
                          Detalhes
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirCliente(cliente.id)}
                          className="px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 text-xs hover:bg-red-100"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}