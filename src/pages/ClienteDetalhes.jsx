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
    endereco: "",
    telefone: "",
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
      endereco: data.endereco || "",
      telefone: data.telefone || "",
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

    const { error } = await supabase
      .from("clientes")
      .update(form)
      .eq("id", id)

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
                Detalhes do Cliente
              </h1>

              <p className="text-sm text-slate-500">
                Visualize e edite os dados cadastrais
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/clientes")}
            className="text-sm text-slate-600 hover:text-indigo-700"
          >
            Voltar
          </button>
        </header>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">Carregando cliente...</p>
          </div>
        ) : (
          <form
            onSubmit={salvarAlteracoes}
            className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Nome
                </label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
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
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  name="inscricao_estadual"
                  value={form.inscricao_estadual}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">
                  Endereço
                </label>
                <input
                  name="endereco"
                  value={form.endereco}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/clientes")}
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
        )}
      </div>
    </>
  )
}