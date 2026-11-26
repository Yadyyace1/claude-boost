// Visual do próprio assistente: modo claro/escuro, cor de destaque e padrão de fundo. Fica salvo no navegador.

export type Modo = "escuro" | "claro"
export type Padrao = "nenhum" | "pontos" | "grade" | "brilho"
export type Visual = { modo: Modo; cor: string; padrao: Padrao; seguirTema?: boolean }

/** As cores de um tema do Claude (de dados/temas.json) para a tela inteira imitar o app. */
export type PaletaTela = { fundo: string; lateral: string; cartao: string; elevado: string; texto: string; secundario: string; suave: string; destaque: string }

const VARS_TEMA = ["--background", "--card", "--popover", "--foreground", "--card-foreground", "--popover-foreground", "--muted", "--muted-foreground",
  "--secondary", "--secondary-foreground", "--accent", "--accent-foreground", "--border", "--input"]

export const CORES = [
  { nome: "Âmbar", cor: "#E0A33B" },
  { nome: "Coral", cor: "#F26D5B" },
  { nome: "Rosa", cor: "#E85D9C" },
  { nome: "Violeta", cor: "#8B6CF6" },
  { nome: "Azul", cor: "#3B82F6" },
  { nome: "Turquesa", cor: "#14B8A6" },
  { nome: "Verde", cor: "#4CAF50" },
]

export const PADROES: { id: Padrao; nome: string }[] = [
  { id: "nenhum", nome: "Liso" },
  { id: "pontos", nome: "Pontos" },
  { id: "grade", nome: "Grade" },
  { id: "brilho", nome: "Brilho" },
]

const CHAVE = "boost-visual-v1"

export function lerVisual(padrao: string): Visual {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) || "null")
    if (v?.modo && v?.cor) return v
  } catch {
    /* sem visual salvo */
  }
  return { modo: "escuro", cor: padrao, padrao: "brilho", seguirTema: true }
}

/** Texto escuro ou claro sobre a cor de destaque, pelo contraste. */
function textoSobre(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.35 ? "#1a1206" : "#ffffff"
}

export function aplicarVisual(v: Visual, paleta?: PaletaTela | null) {
  const html = document.documentElement
  html.classList.toggle("dark", v.modo === "escuro")
  const cor = paleta ? paleta.destaque : v.cor
  html.style.setProperty("--primary", cor)
  html.style.setProperty("--ring", cor)
  html.style.setProperty("--primary-foreground", textoSobre(cor))
  if (paleta) {
    const valores = [paleta.fundo, paleta.cartao, paleta.cartao, paleta.texto, paleta.texto, paleta.texto, paleta.elevado, paleta.suave,
      paleta.elevado, paleta.texto, paleta.elevado, paleta.texto, `${paleta.suave}33`, `${paleta.suave}40`]
    VARS_TEMA.forEach((n, i) => html.style.setProperty(n, valores[i]))
  } else VARS_TEMA.forEach((n) => html.style.removeProperty(n))
  document.body.classList.remove("padrao-pontos", "padrao-grade", "padrao-brilho")
  if (v.padrao !== "nenhum") document.body.classList.add(`padrao-${v.padrao}`)
  localStorage.setItem(CHAVE, JSON.stringify(v))
}
