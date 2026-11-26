// Conversa com o servidor local. O código secreto vem na URL aberta (?t=...) e vai em todo pedido que muda algo.
const chave = "boost-token"
const daUrl = new URLSearchParams(location.search).get("t")
if (daUrl) {
  sessionStorage.setItem(chave, daUrl)
  history.replaceState(null, "", location.pathname) // tira o código da barra de endereço
}
const token = () => sessionStorage.getItem(chave) ?? ""

export async function postar<T = unknown>(caminho: string, corpo: unknown = {}): Promise<T> {
  const r = await fetch(caminho, { method: "POST", headers: { "Content-Type": "application/json", "X-Boost-Token": token() }, body: JSON.stringify(corpo) })
  const dados = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((dados as { erro?: string }).erro ?? `erro ${r.status}`)
  return dados as T
}

export async function pegar<T = unknown>(caminho: string): Promise<T | null> {
  const r = await fetch(caminho, { headers: { "X-Boost-Token": token() } }).catch(() => null)
  return r && r.ok ? ((await r.json()) as T) : null
}

export type PassoPlano = { tipo: "cmd" | "segredo" | "login" | "manual"; comando: string | null; texto: string | null; variavel: string | null; nota: string | null }
export type ItemPlano = { ordem: number; id: string; nome: string; tipo: string; resumo: string; aviso: string | null; conferir: boolean; desligar_depois: string | null; passos: PassoPlano[] }
export type Plano = { sistema: string; itens: ItemPlano[]; claudeMd: string; segredos: Record<string, boolean> }
export type ResultadoItem = { ok: boolean; erro?: string; resultados?: { comando: string; codigo: number; saida: string }[] }
