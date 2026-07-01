import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { supabase } from "../services/supabase"
import { formatarCpfCnpj, formatarTelefone } from "../utils/formatadores"

export default function ClienteDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [menuAberto, setMenuAberto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

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
    carregarCliente()
  }, [id])

  async function carregarCliente() {
    setLoading(true)

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single()

    setLoading(false)

    if (error) {
      alert("Cliente não encontrado.")
      navigate("/clientes")
      return
    }

    setForm({
      nome: data.nome || "",
      cpf_cnpj: data.cpf_cnpj || "",
      telefone: data.telefone || "",
      email: data.email || "",
      cep: data.cep || "",
      uf: data.uf || "",
      cidade: data.cidade || "",
      bairro: data.bairro || "",
      endereco: data.endereco || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      inscricao_estadual: data.inscricao_estadual || "",
      tipo_cliente: data.tipo_cliente || "Pessoa Física",
    })
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  async function salvarAlteracoes(e) {
    e.preventDefault()
    setSalvando(true)

    const { error } = await supabase.from("clientes").update(form).eq("id", id)

    setSalvando(false)

    if (error) {
      console.error(error)
      alert("Erro ao salvar alterações.")
      return
    }

    alert("Cliente atualizado com sucesso.")
    navigate("/clientes")
  }

  return (
    <>
      <Sidebar aberto={menuAberto} onClose={() => setMenuAberto(false)} />

      <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-4 md:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 sm:mb-8">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
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
                Detalhes do Cliente
              </h1>

              <p className="text-xs sm:text-sm text-slate-500">
                Visualize e edite os dados cadastrais
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:text-indigo-700 shadow-sm"
          >
            Voltar
          </button>
        </header>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <p className="text-sm text-slate-500">Carregando cliente...</p>
          </div>
        ) : (
          <form
            onSubmit={salvarAlteracoes}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 max-w-4xl space-y-4 shadow-sm"
          >
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Dados cadastrais
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Atualize as informações principais do cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Nome ou Razão Social
                </label>

                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
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
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Tipo de Cliente
                </label>

                <select
                  name="tipo_cliente"
                  value={form.tipo_cliente}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                >
                  <option>Pessoa Física</option>
                  <option>Pessoa Jurídica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
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
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  E-mail
                </label>

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  CEP
                </label>

                <input
                  name="cep"
                  value={form.cep}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  UF
                </label>

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

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Cidade
                </label>

                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Bairro
                </label>

                <input
                  name="bairro"
                  value={form.bairro}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Endereço / Rua
                </label>

                <input
                  name="endereco"
                  value={form.endereco}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Número
                </label>

                <input
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Complemento
                </label>

                <input
                  name="complemento"
                  value={form.complemento}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Inscrição Estadual
                </label>

                <input
                  name="inscricao_estadual"
                  value={form.inscricao_estadual}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/clientes")}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium"
              >
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}