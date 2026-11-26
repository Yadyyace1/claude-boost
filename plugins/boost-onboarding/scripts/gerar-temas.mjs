// Gera dados/temas.json (as cores e cenários que o assistente usa para simular o app do Claude)
// a partir das paletas reais do boost-temas.
// Uso: node scripts/gerar-temas.mjs   (rodar de novo quando uma paleta ou um cenário mudar)
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..")
const hooks = join(raiz, "..", "boost-temas", "hooks")
const { PALETAS } = await import(pathToFileURL(join(hooks, "paletas.ts")).href)
const CENAS = await import(pathToFileURL(join(hooks, "cenas.ts")).href)

const cores = (s) => s && {
  fundo: s["surface-0"], lateral: s["surface-1"], cartao: s["surface-2"], elevado: s["surface-3"] ?? s["surface-2"],
  texto: s["text-primary"], secundario: s["text-secondary"], suave: s["text-muted"],
}

const temas = PALETAS.map((p) => ({
  id: p.id,
  nome: p.nome,
  descricao: p.descricao,
  cena: p.cena ?? null,
  cenaSvg: p.cena ? CENAS[p.cena.toUpperCase()] ?? null : null,
  soEscuro: !p.light,
  escuro: cores(p.dark),
  claro: cores(p.light) ?? null,
  destaque: p.roles.accent,
  extras: [p.roles.success, p.roles.warning, p.roles.pro],
}))
writeFileSync(join(raiz, "dados", "temas.json"), JSON.stringify({ temas }, null, 2) + "\n")
console.log(`${temas.length} temas: ${temas.map((t) => `${t.id}${t.cenaSvg ? " (cenário)" : ""}`).join(", ")}`)
