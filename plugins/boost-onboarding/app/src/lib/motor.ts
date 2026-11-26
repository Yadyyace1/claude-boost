// Ponte tipada para o algoritmo compartilhado (assistente/recomendar.mjs), que também roda no Node.
// @ts-expect-error: módulo JS puro, sem tipos
import * as m from "@motor/recomendar.mjs"
import type { Ambiente, Avaliado, Catalogo, Marca, Perguntas, Recomendacao, Respostas } from "./tipos"
import type { TemaPreview } from "@/components/Aparencia"

export const recomendar = m.recomendar as (r: Respostas, c: Catalogo, p: Perguntas, a: Ambiente) => Recomendacao
export const calcular = m.calcular as (
  selecao: string[],
  c: Catalogo,
  a: Ambiente,
  ctx?: { avaliados?: Avaliado[] },
) => { totais: { mensal_brl: number; tokens_fixos: number }; requisitos: string[] }

export async function carregar() {
  const pegar = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
  const [catalogo, perguntas, marca, ambiente, preenchidas, temas] = await Promise.all([
    pegar("dados/catalogo.json"),
    pegar("dados/perguntas.json"),
    pegar("dados/marca.json"),
    pegar("ambiente.json"),
    pegar("respostas.json"),
    pegar("dados/temas.json"),
  ])
  return {
    temas: ((temas as { temas?: TemaPreview[] }).temas ?? []) as TemaPreview[],
    catalogo: catalogo as Catalogo,
    perguntas: perguntas as Perguntas,
    marca: { nome: "Claude Boost", subtitulo: "Vamos montar o seu Claude", ...(marca as Partial<Marca>) } as Marca,
    ambiente: ambiente as Ambiente,
    preenchidas: preenchidas as Respostas,
  }
}

export const brl = (v: number) => (v ? `R$ ${v.toLocaleString("pt-BR")}` : "R$ 0")
export const num = (v: number) => v.toLocaleString("pt-BR")
