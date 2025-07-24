export function getUsuarioLogado() {
  const dados = localStorage.getItem("zapgastos_usuario");
  return dados ? JSON.parse(dados) : null;
}
