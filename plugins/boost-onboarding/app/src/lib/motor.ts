// Ponte tipada para o algoritmo compartilhado (assistente/recomendar.mjs), que também roda no Node.
// @ts-expect-error: módulo JS puro, sem tipos
import * as m from "@motor/recomendar.mjs"
import type { Ambiente, Avaliado, Catalogo, Marca, Perguntas, Recomendacao, Respostas, Skill } from "./tipos"
import { pegar as pegarComCodigo } from "./api"
import { carregarTraducao, idiomaAtual, ligarTradutor, traduzirDados } from "./i18n"
import type { TemaPreview } from "@/components/Aparencia"

export const recomendar = m.recomendar as (r: Respostas, c: Catalogo, p: Perguntas, a: Ambiente) => Recomendacao
export const calcular = m.calcular as (
  selecao: string[],
  c: Catalogo,
  a: Ambiente,
  ctx?: { avaliados?: Avaliado[] },
) => { totais: { mensal_brl: number; tokens_fixos: number }; requisitos: string[] }

export async function carregar() {
  // Vai com o código secreto: ambiente.json e respostas.json só respondem com ele.
  const pegar = async (u: string) => (await pegarComCodigo<object>(u)) ?? {}
  const [catalogo, perguntas, marca, ambiente, preenchidas, temas, skills] = await Promise.all([
    pegar("dados/catalogo.json"),
    pegar("dados/perguntas.json"),
    pegar("dados/marca.json"),
    pegar("ambiente.json"),
    pegar("respostas.json"),
    pegar("dados/temas.json"),
    pegar("dados/skills.json"),
  ])
  // Idioma: troca os textos dos dados e liga o tradutor da tela (português não precisa de nada).
  const traducao = await carregarTraducao(idiomaAtual())
  ligarTradutor(traducao)
  const t = traduzirDados(traducao, {
    temas: ((temas as { temas?: TemaPreview[] }).temas ?? []) as TemaPreview[],
    skills: ((skills as { skills?: Skill[] }).skills ?? []) as Skill[],
    catalogo: catalogo as Catalogo,
    perguntas: perguntas as Perguntas,
    marca: { nome: "Spark", subtitulo: "Vamos montar o seu Claude", ...(marca as Partial<Marca>) } as Marca,
  })
  return {
    ...t,
    ambiente: ambiente as Ambiente,
    preenchidas: preenchidas as Respostas,
  }
}

export const brl = (v: number) => (v ? `R$ ${v.toLocaleString("pt-BR")}` : "R$ 0")
export const num = (v: number) => v.toLocaleString("pt-BR")
