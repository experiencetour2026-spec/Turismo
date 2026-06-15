export function formatarCpfCnpj(valor) {
  const numero = valor.replace(/\D/g, "").slice(0, 14)

  if (numero.length <= 11) {
    return numero
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  }

  return numero
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

export function formatarTelefone(valor) {
  const numero = valor.replace(/\D/g, "").slice(0, 11)

  if (numero.length <= 10) {
    return numero.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  }

  return numero.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4")
}