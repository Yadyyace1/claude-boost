// Algoritmo do modo descoberta (swipe): escolhe a próxima carta e aprende com cada "quero" ou "pular".
//
// 1. Cada carta começa com a nota do algoritmo principal (recomendar.mjs).
// 2. Um "quero" soma afinidade nas etiquetas do item (×1,5 do peso dele); um "pular" subtrai (×1,0).
//    Assim, gostar do Postiz puxa para cima tudo o que é de redes sociais e vídeo, e pular o Stripe
//    empurra para baixo o resto de pagamentos.
// 3. A próxima carta é a de maior nota ajustada, com um desconto para a mesma categoria das duas
//    últimas cartas (para variar) e, a cada 4 cartas, uma carta de "exploração" de uma categoria ainda não vista.
// 4. O "match" é a nota ajustada em relação à melhor carta do baralho (de 5% a 99%).
import type { Avaliado } from "./tipos"

export type Escolha = { id: string; quer: boolean }

export function afinidades(cartas: Avaliado[], escolhas: Escolha[]) {
  const af: Record<string, number> = {}
  const porId = Object.fromEntries(cartas.map((c) => [c.item.id, c]))
  for (const e of escolhas) {
    const c = porId[e.id]
    if (!c) continue
    for (const [tag, w] of Object.entries(c.item.sinais ?? {})) af[tag] = (af[tag] ?? 0) + (e.quer ? 1.5 : -1) * w
  }
  return af
}

export function notaAjustada(c: Avaliado, af: Record<string, number>) {
  let extra = 0
  for (const [tag, w] of Object.entries(c.item.sinais ?? {})) extra += (af[tag] ?? 0) * w
  return c.nota + extra
}

export const match = (nota: number, melhor: number) => Math.round(Math.min(99, Math.max(5, (nota / Math.max(melhor, 1)) * 92)))

export function proxima(cartas: Avaliado[], escolhas: Escolha[]): { carta: Avaliado; nota: number; explorando: boolean } | null {
  const vistas = new Set(escolhas.map((e) => e.id))
  const restantes = cartas.filter((c) => !vistas.has(c.item.id))
  if (!restantes.length) return null
  const af = afinidades(cartas, escolhas)
  const porId = Object.fromEntries(cartas.map((c) => [c.item.id, c]))
  const ultimas = escolhas.slice(-2).map((e) => porId[e.id]?.item.categoria)
  const categoriasVistas = new Set(escolhas.map((e) => porId[e.id]?.item.categoria))

  const explorando = escolhas.length > 0 && escolhas.length % 4 === 3
  const pool = explorando ? restantes.filter((c) => !categoriasVistas.has(c.item.categoria)) : []
  const base = pool.length ? pool : restantes

  let melhor = base[0]
  let melhorNota = -Infinity
  for (const c of base) {
    const n = notaAjustada(c, af) - (ultimas.includes(c.item.categoria) ? 2 : 0)
    if (n > melhorNota) { melhor = c; melhorNota = n }
  }
  return { carta: melhor, nota: notaAjustada(melhor, af), explorando: pool.length > 0 }
}
