import { createClient } from "npm:@supabase/supabase-js@2"
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!
const EMAIL_DESTINO = Deno.env.get("EMAIL_DESTINO")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function dataBR(data: string) {
  return new Date(data).toLocaleDateString("pt-BR")
}

function ultimoDiaDoMes() {
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(hoje.getDate() + 1)

  return amanha.getDate() === 1
}

function periodoMesAtual() {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  return {
    inicio,
    fim,
    inicioISO: inicio.toISOString().split("T")[0],
    fimISO: fim.toISOString().split("T")[0],
  }
}

Deno.serve(async () => {
  if (!ultimoDiaDoMes()) {
    return new Response(
      JSON.stringify({ ignorado: true, motivo: "Hoje não é o último dia do mês." }),
      { status: 200 }
    )
  }

  const { inicio, fim, inicioISO, fimISO } = periodoMesAtual()

  const { data: reservas, error } = await supabase
    .from("reservas")
    .select(`
      *,
      clientes (
        nome,
        cpf_cnpj
      )
    `)
    .gte("data_saida", inicioISO)
    .lte("data_saida", `${fimISO}T23:59:59`)
    .order("data_saida", { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ erro: error.message }), { status: 500 })
  }

  const viagens = reservas || []

  const receitaMensal = viagens.reduce((t, v) => t + Number(v.valor_total || 0), 0)
  const totalRecebido = viagens.reduce((t, v) => t + Number(v.valor_pago || 0), 0)
  const totalPendente = viagens.reduce((t, v) => t + Number(v.valor_restante || 0), 0)
  const totalFaturado = viagens
    .filter((v) => v.forma_pagamento === "Faturado")
    .reduce((t, v) => t + Number(v.valor_total || 0), 0)

  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([842, 595])

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = 555

  page.drawText("Relatório Mensal - Turismo", {
    x: 40,
    y,
    size: 18,
    font: bold,
    color: rgb(0.12, 0.16, 0.28),
  })

  y -= 35

  const esquerda = 40
  const direita = 430

  page.drawText(`Período: ${dataBR(inicioISO)} até ${dataBR(fimISO)}`, {
    x: esquerda,
    y,
    size: 10,
    font,
  })

  page.drawText(`Viagens do mês: ${viagens.length}`, {
    x: direita,
    y,
    size: 10,
    font,
  })

  y -= 18

  page.drawText(`Receita mensal: ${moeda(receitaMensal)}`, {
    x: esquerda,
    y,
    size: 10,
    font,
  })

  page.drawText(`Total recebido: ${moeda(totalRecebido)}`, {
    x: direita,
    y,
    size: 10,
    font,
  })

  y -= 18

  page.drawText(`Total pendente: ${moeda(totalPendente)}`, {
    x: esquerda,
    y,
    size: 10,
    font,
  })

  page.drawText(`Total faturado: ${moeda(totalFaturado)}`, {
    x: direita,
    y,
    size: 10,
    font,
  })

  y -= 35

  const colunas = [
    { titulo: "Data", x: 40 },
    { titulo: "Cliente", x: 100 },
    { titulo: "Tipo", x: 285 },
    { titulo: "Origem", x: 345 },
    { titulo: "Destino", x: 430 },
    { titulo: "Pagamento", x: 515 },
    { titulo: "Valor", x: 610 },
    { titulo: "Pago", x: 690 },
    { titulo: "Pendente", x: 755 },
  ]

  colunas.forEach((c) => {
    page.drawText(c.titulo, {
      x: c.x,
      y,
      size: 8,
      font: bold,
      color: rgb(0.2, 0.2, 0.2),
    })
  })

  y -= 15

  viagens.forEach((v) => {
    if (y < 45) {
      page = pdfDoc.addPage([842, 595])
      y = 555
    }

    const linha = [
      dataBR(v.data_saida),
      String(v.clientes?.nome || "Cliente não informado").slice(0, 32),
      String(v.tipo_viagem || "-").slice(0, 10),
      String(v.origem || "-").slice(0, 16),
      String(v.destino || "-").slice(0, 16),
      String(v.forma_pagamento || "-").slice(0, 14),
      moeda(v.valor_total),
      moeda(v.valor_pago),
      moeda(v.valor_restante),
    ]

    linha.forEach((texto, i) => {
      page.drawText(texto, {
        x: colunas[i].x,
        y,
        size: 7,
        font,
      })
    })

    y -= 13
  })

  const pdfBytes = await pdfDoc.save()
  const base64 = btoa(String.fromCharCode(...pdfBytes))

  const respostaEmail = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Sistema Turismo <onboarding@resend.dev>",
      to: EMAIL_DESTINO,
      subject: `Relatório mensal - ${inicio.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })}`,
      html: `
        <h2>Relatório mensal enviado automaticamente</h2>
        <p>Segue em anexo o relatório mensal de viagens.</p>
        <p><strong>Período:</strong> ${dataBR(inicioISO)} até ${dataBR(fimISO)}</p>
        <ul>
          <li>Receita mensal: <strong>${moeda(receitaMensal)}</strong></li>
          <li>Total recebido: <strong>${moeda(totalRecebido)}</strong></li>
          <li>Total pendente: <strong>${moeda(totalPendente)}</strong></li>
          <li>Total faturado: <strong>${moeda(totalFaturado)}</strong></li>
          <li>Viagens do mês: <strong>${viagens.length}</strong></li>
        </ul>
      `,
      attachments: [
        {
          filename: `relatorio-mensal-${inicioISO.slice(0, 7)}.pdf`,
          content: base64,
        },
      ],
    }),
  })

  if (!respostaEmail.ok) {
    const erro = await respostaEmail.text()
    return new Response(JSON.stringify({ erro }), { status: 500 })
  }

  return new Response(
    JSON.stringify({
      sucesso: true,
      mensagem: "Relatório mensal enviado com PDF.",
    }),
    { status: 200 }
  )
})