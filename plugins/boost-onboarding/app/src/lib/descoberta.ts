// Algoritmos da aba Personalização: o "vibed" (o quanto o item combina com você, aprendendo com as escolhas)
// e o Spark score (a qualidade geral do item, igual para todo mundo).
//
// Vibed:
// 1. Cada item começa com a nota do algoritmo principal (recomendar.mjs).
// 2. Adicionar um item soma afinidade nas etiquetas dele (×1,5 do peso); "não curti" subtrai (×1,0).
//    Assim, adicionar o Postiz puxa para cima tudo o que é de redes sociais e vídeo.
// 3. O vibed é a nota ajustada em relação ao melhor item da lista (de 5% a 99%).
//
// Spark score (0 a 100): oficial +20, do kit +10, grátis +10 (freemium +5), fácil de instalar,
// leve no uso (tokens fixos por sessão) e sem aviso de risco.
import type { Avaliado, Item } from "./tipos"

export type Escolha = { id: string; quer: boolean }

export function afinidades(itens: Avaliado[], escolhas: Escolha[]) {
  const af: Record<string, number> = {}
  const porId = Object.fromEntries(itens.map((c) => [c.item.id, c]))
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

export const vibed = (nota: number, melhor: number) => Math.round(Math.min(99, Math.max(5, (nota / Math.max(melhor, 1)) * 92)))

export function sparkScore(it: Item) {
  let s = 50
  if (it.oficial) s += 20
  if (it.kit) s += 10
  if (it.custo?.tipo === "gratis") s += 10
  else if (it.custo?.tipo === "freemium") s += 5
  s -= ((it.dificuldade ?? 1) - 1) * 8
  s -= Math.min(20, (it.tokens_fixos ?? 0) / 150)
  if (it.aviso) s -= 6
  if (it.verificar) s -= 4
  return Math.round(Math.max(0, Math.min(100, s)))
}
