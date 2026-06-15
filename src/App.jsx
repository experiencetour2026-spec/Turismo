import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { supabase } from "./services/supabase"

import Login from "./pages/Login"
import Agenda from "./pages/Agenda"

import Clientes from "./pages/Clientes"
import ClienteDetalhes from "./pages/ClienteDetalhes"

import Reservas from "./pages/Reservas"

import Viagens from "./pages/Viagens"
import ViagemDetalhes from "./pages/ViagemDetalhes"
import HistoricoViagens from "./pages/HistoricoViagens"

import Faturado from "./pages/Faturado"
import Relatorios from "./pages/Relatorios"

function RotaProtegida({ children }) {
  const [carregando, setCarregando] = useState(true)
  const [logado, setLogado] = useState(false)

  useEffect(() => {
    verificarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLogado(!!session)
      setCarregando(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function verificarSessao() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    setLogado(!!session)
    setCarregando(false)
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Verificando acesso...</p>
      </div>
    )
  }

  if (!logado) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <RotaProtegida>
              <Agenda />
            </RotaProtegida>
          }
        />

        <Route
          path="/agenda"
          element={
            <RotaProtegida>
              <Agenda />
            </RotaProtegida>
          }
        />

        <Route
          path="/clientes"
          element={
            <RotaProtegida>
              <Clientes />
            </RotaProtegida>
          }
        />

        <Route
          path="/clientes/:id"
          element={
            <RotaProtegida>
              <ClienteDetalhes />
            </RotaProtegida>
          }
        />

        <Route
          path="/reservas"
          element={
            <RotaProtegida>
              <Reservas />
            </RotaProtegida>
          }
        />

        <Route
          path="/viagens"
          element={
            <RotaProtegida>
              <Viagens />
            </RotaProtegida>
          }
        />

        <Route
          path="/viagens/:id"
          element={
            <RotaProtegida>
              <ViagemDetalhes />
            </RotaProtegida>
          }
        />

        <Route
          path="/historico-viagens"
          element={
            <RotaProtegida>
              <HistoricoViagens />
            </RotaProtegida>
          }
        />

        <Route
          path="/faturado"
          element={
            <RotaProtegida>
              <Faturado />
            </RotaProtegida>
          }
        />

        <Route
          path="/relatorios"
          element={
            <RotaProtegida>
              <Relatorios />
            </RotaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}