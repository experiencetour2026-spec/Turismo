import { BrowserRouter, Routes, Route } from "react-router-dom"

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Agenda />} />
        <Route path="/agenda" element={<Agenda />} />

        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<ClienteDetalhes />} />

        <Route path="/reservas" element={<Reservas />} />

        <Route path="/viagens" element={<Viagens />} />
        <Route path="/viagens/:id" element={<ViagemDetalhes />} />
        <Route path="/historico-viagens" element={<HistoricoViagens />} />

        <Route path="/faturado" element={<Faturado />} />

        <Route path="/relatorios" element={<Relatorios />} />
      </Routes>
    </BrowserRouter>
  )
}