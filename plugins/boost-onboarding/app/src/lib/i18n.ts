// Idiomas do assistente do Spark. O português é a base; os outros 9 vêm de dados/i18n/<idioma>.json
// (gerados por scripts/traduzir.mjs). Os dados (perguntas, catálogo, skills, temas) são trocados ao carregar,
// e os textos da tela são trocados por um tradutor leve que observa a página.
import type { Catalogo, Marca, Perguntas, Skill } from "./tipos"
import type { TemaPreview } from "@/components/SimulacaoClaude"

export const IDIOMAS = [
  { id: "pt", nome: "Português", bandeira: "🇧🇷" },
  { id: "en", nome: "English", bandeira: "🇺🇸" },
  { id: "es", nome: "Español", bandeira: "🇪🇸" },
  { id: "fr", nome: "Français", bandeira: "🇫🇷" },
  { id: "de", nome: "Deutsch", bandeira: "🇩🇪" },
  { id: "it", nome: "Italiano", bandeira: "🇮🇹" },
  { id: "ja", nome: "日本語", bandeira: "🇯🇵" },
  { id: "zh", nome: "中文", bandeira: "🇨🇳" },
  { id: "ko", nome: "한국어", bandeira: "🇰🇷" },
  { id: "ru", nome: "Русский", bandeira: "🇷🇺" },
] as const
export type Idioma = (typeof IDIOMAS)[number]["id"]
const CHAVE = "spark-idioma"

export function idiomaAtual(): Idioma {
  const salvo = localStorage.getItem(CHAVE)
  if (salvo && IDIOMAS.some((i) => i.id === salvo)) return salvo as Idioma
  const nav = (navigator.language || "pt").slice(0, 2).toLowerCase()
  return (IDIOMAS.some((i) => i.id === nav) ? nav : "pt") as Idioma
}

export function trocarIdioma(id: Idioma) {
  localStorage.setItem(CHAVE, id)
  location.reload()
}

export type Traducao = { idioma: string; ui: Record<string, string>; dados: Record<string, string> }

export async function carregarTraducao(id: Idioma): Promise<Traducao | null> {
  if (id === "pt") return null
  try {
    const r = await fetch(`dados/i18n/${id}.json`)
    return r.ok ? ((await r.json()) as Traducao) : null
  } catch {
    return null
  }
}

/** Troca os textos dos dados pela tradução (mantém o original quando falta uma chave). */
export function traduzirDados(t: Traducao | null, d: { perguntas: Perguntas; catalogo: Catalogo; skills: Skill[]; temas: TemaPreview[]; marca: Marca }) {
  if (!t) return d
  const x = (k: string, v?: string) => t.dados[k] ?? v
  const perguntas: Perguntas = {
    ...d.perguntas,
    etapas: d.perguntas.etapas.map((e, i) => ({
      ...e, titulo: x(`etapa.${i}.titulo`, e.titulo)!, dica: x(`etapa.${i}.dica`, e.dica),
      perguntas: e.perguntas.map((q) => ({
        ...q, titulo: x(`q.${q.id}.titulo`, q.titulo)!, placeholder: x(`q.${q.id}.placeholder`, q.placeholder), sufixo: x(`q.${q.id}.sufixo`, q.sufixo),
        opcoes: q.opcoes?.map((o) => ({ ...o, rotulo: x(`q.${q.id}.${o.valor}.rotulo`, o.rotulo)!, descricao: x(`q.${q.id}.${o.valor}.descricao`, o.descricao) })),
      })),
    })),
  }
  const catalogo: Catalogo = {
    ...d.catalogo,
    itens: d.catalogo.itens.map((it) => ({
      ...it, resumo: x(`item.${it.id}.resumo`, it.resumo)!, aviso: x(`item.${it.id}.aviso`, it.aviso), categoria: x(`item.${it.id}.categoria`, it.categoria)!,
      custo: it.custo ? { ...it.custo, nota: x(`item.${it.id}.custo`, it.custo.nota) } : it.custo,
      passos: it.passos?.map((p, i) => ({ ...p, texto: x(`item.${it.id}.passo.${i}`, p.texto) })),
    })),
  }
  const skills = d.skills.map((s) => ({ ...s, nome: x(`skill.${s.id}.nome`, s.nome)!, resumo: x(`skill.${s.id}.resumo`, s.resumo)!, categoria: x(`skill.${s.id}.categoria`, s.categoria)! }))
  const temas = d.temas.map((tm) => ({ ...tm, nome: x(`tema.${tm.id}.nome`, tm.nome)!, descricao: x(`tema.${tm.id}.descricao`, tm.descricao)! }))
  const marca = { ...d.marca, subtitulo: x("marca.subtitulo", d.marca.subtitulo)!, rodape: x("marca.rodape", d.marca.rodape) }
  return { perguntas, catalogo, skills, temas, marca }
}

/**
 * Tradutor da tela: troca textos e atributos (placeholder, aria-label, title) que estão no dicionário,
 * inclusive os que aparecem depois (observa a página). Só o texto exato é trocado: nomes, números e o que a
 * pessoa digita ficam como estão.
 */
export function ligarTradutor(t: Traducao | null) {
  if (!t) return
  document.documentElement.lang = t.idioma
  const dic = t.ui
  const ATRIBUTOS = ["placeholder", "aria-label", "title"]
  const trocarTexto = (n: Text) => {
    const bruto = n.data
    const limpo = bruto.trim()
    const novo = limpo && dic[limpo]
    if (novo && novo !== limpo) n.data = bruto.replace(limpo, novo)
  }
  const trocarAtributos = (el: Element) => {
    for (const a of ATRIBUTOS) {
      const v = el.getAttribute(a)
      const novo = v && dic[v.trim()]
      if (novo && novo !== v) el.setAttribute(a, novo)
    }
  }
  const varrer = (raizNo: Node) => {
    if (raizNo.nodeType === Node.TEXT_NODE) return trocarTexto(raizNo as Text)
    if (raizNo.nodeType !== Node.ELEMENT_NODE) return
    const el = raizNo as Element
    if (el.closest("input, textarea, code, pre, [data-sem-traducao]")) return
    trocarAtributos(el)
    const andar = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
    for (let n = andar.nextNode(); n; n = andar.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) { if (!n.parentElement?.closest("code, pre, textarea, [data-sem-traducao]")) trocarTexto(n as Text) }
      else trocarAtributos(n as Element)
    }
  }
  varrer(document.body)
  new MutationObserver((mudancas) => {
    for (const m of mudancas) {
      if (m.type === "characterData") trocarTexto(m.target as Text)
      else if (m.type === "attributes") trocarAtributos(m.target as Element)
      else m.addedNodes.forEach(varrer)
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS })
}
