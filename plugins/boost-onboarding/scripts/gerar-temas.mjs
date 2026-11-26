// Gera dados/temas.json (as amostras de cor que o assistente mostra) a partir das paletas reais do boost-temas.
// Uso: node scripts/gerar-temas.mjs   (rodar de novo quando uma paleta mudar)
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..")
const { PALETAS } = await import(pathToFileURL(join(raiz, "..", "boost-temas", "hooks", "paletas.ts")).href)

const temas = PALETAS.map((p) => ({
  id: p.id,
  nome: p.nome,
  descricao: p.descricao,
  cena: p.cena ?? null,
  soEscuro: !p.light,
  escuro: { fundo: p.dark["surface-0"], cartao: p.dark["surface-2"], texto: p.dark["text-primary"], suave: p.dark["text-muted"] },
  claro: p.light ? { fundo: p.light["surface-0"], cartao: p.light["surface-2"], texto: p.light["text-primary"], suave: p.light["text-muted"] } : null,
  destaque: p.roles.accent,
  extras: [p.roles.success, p.roles.warning, p.roles.pro],
}))
writeFileSync(join(raiz, "dados", "temas.json"), JSON.stringify({ temas }, null, 2) + "\n")
console.log(`${temas.length} temas: ${temas.map((t) => t.id).join(", ")}`)
