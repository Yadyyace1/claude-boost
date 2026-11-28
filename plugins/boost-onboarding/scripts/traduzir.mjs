// Gera as traduções do assistente do Spark para 9 idiomas (o português é a base).
// 1. Junta os textos da interface (app/src) e dos dados (perguntas, catálogo, skills, temas, marca).
// 2. Traduz em lotes com o Claude Code local (`claude -p --model haiku`, sem ferramentas).
// 3. Grava dados/i18n/<idioma>.json: { ui: { "texto pt": "tradução" }, dados: { "chave": "tradução" } }.
// Uso: node scripts/traduzir.mjs [idiomas, ex.: en,es]   (retoma de onde parou: lotes já feitos ficam em cache)
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { platform } from "node:os"
import { createHash } from "node:crypto"

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..")
const IDIOMAS = { en: "English", es: "Spanish (Latin America)", fr: "French", de: "German", it: "Italian", ja: "Japanese", zh: "Simplified Chinese", ko: "Korean", ru: "Russian" }
const pedidos = (process.argv[2] ?? Object.keys(IDIOMAS).join(",")).split(",").filter((l) => IDIOMAS[l])
const ler = (f) => JSON.parse(readFileSync(join(raiz, f), "utf8").replace(/^﻿/, ""))

// ---------- textos da interface ----------
function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return n === "ui" ? [] : arquivos(p)
    return /\.(tsx|ts)$/.test(n) ? [p] : []
  })
}
const pareceClasse = (s) => { const t = s.split(/\s+/); return t.filter((x) => /[-:/[\]]/.test(x)).length / t.length > 0.3 }
const ui = new Set()
for (const arq of arquivos(join(raiz, "app", "src"))) {
  const src = readFileSync(arq, "utf8")
  for (const m of src.matchAll(/>([^<>{}]*[A-Za-zÀ-ú][^<>{}]*)</g)) { const t = m[1].trim(); if (t.length > 1 && !/^[\w.]+$/.test(t)) ui.add(t) }
  for (const m of src.matchAll(/(["`])((?:(?!\1)[^\\$\n])*?[A-Za-zÀ-ú][^"`\n$\\]*?)\1/g)) {
    const t = m[2].trim()
    // palavras soltas com inicial maiúscula ("Entrar", "Senha") também são texto de tela
    const palavra = /^[A-ZÀ-Ú][a-zà-ú]{2,}$/.test(t)
    if (t.length < 3 || (!palavra && !/\s|[À-ú]/.test(t)) || pareceClasse(t) || /^(https?:|@\/|\.\/|[a-z-]+\/)/.test(t) || /[{};=]/.test(t)) continue
    ui.add(t)
  }
}

// ---------- textos dos dados (chave estável -> texto) ----------
const dados = {}
const por = (k, v) => { if (typeof v === "string" && v.trim() && /[A-Za-zÀ-ú]/.test(v)) dados[k] = v }
const perg = ler("dados/perguntas.json")
perg.etapas.forEach((e, i) => {
  por(`etapa.${i}.titulo`, e.titulo); por(`etapa.${i}.dica`, e.dica)
  for (const q of e.perguntas) {
    por(`q.${q.id}.titulo`, q.titulo); por(`q.${q.id}.placeholder`, q.placeholder); por(`q.${q.id}.sufixo`, q.sufixo)
    for (const o of q.opcoes ?? []) { por(`q.${q.id}.${o.valor}.rotulo`, o.rotulo); por(`q.${q.id}.${o.valor}.descricao`, o.descricao) }
  }
})
for (const it of ler("dados/catalogo.json").itens) {
  por(`item.${it.id}.resumo`, it.resumo); por(`item.${it.id}.aviso`, it.aviso); por(`item.${it.id}.categoria`, it.categoria)
  por(`item.${it.id}.custo`, it.custo?.nota)
  ;(it.passos ?? []).forEach((p, i) => por(`item.${it.id}.passo.${i}`, p.texto))
}
for (const s of ler("dados/skills.json").skills) { por(`skill.${s.id}.nome`, s.nome); por(`skill.${s.id}.resumo`, s.resumo); por(`skill.${s.id}.categoria`, s.categoria) }
for (const t of ler("dados/temas.json").temas) { por(`tema.${t.id}.nome`, t.nome); por(`tema.${t.id}.descricao`, t.descricao) }
const marca = ler("dados/marca.json"); por("marca.subtitulo", marca.subtitulo); por("marca.rodape", marca.rodape)

console.log(`textos: interface ${ui.size}, dados ${Object.keys(dados).length}`)

// ---------- tradução em lotes ----------
const claude = platform() === "win32" ? "claude.exe" : "claude"
function traduzirLote(idioma, lote) {
  const pedido = `Translate the JSON values from Brazilian Portuguese to ${IDIOMAS[idioma]}.
Context: the setup wizard of "Spark", a product that installs and customizes Claude Code (an AI assistant) for non-technical people.
Rules: return ONLY a JSON object with exactly the same keys; translate only the values; keep product, brand and command names
as they are (Spark, Claude, Claude Code, CLAUDE.md, MCP, /tema, /painel, Gmail, Notion, WhatsApp...); keep {placeholders},
emoji, symbols, numbers, R$ and markdown; friendly, short UI tone; if a value is not natural language (code, a path), copy it.
JSON:
${JSON.stringify(lote)}`
  return new Promise((ok, falha) => {
    const p = spawn(claude, ["-p", "--model", "haiku", "--tools", "", "--strict-mcp-config", "--no-session-persistence", "--output-format", "text"], { windowsHide: true })
    let saida = "", erro = ""
    p.stdout.on("data", (d) => (saida += d)); p.stderr.on("data", (d) => (erro += d))
    p.on("close", (c) => {
      const m = saida.match(/\{[\s\S]*\}/)
      if (c !== 0 || !m) return falha(new Error(erro.trim() || `saída sem JSON (código ${c})`))
      try { ok(JSON.parse(m[0])) } catch (e) { falha(e) }
    })
    p.stdin.end(pedido)
  })
}

const pastaSaida = join(raiz, "dados", "i18n")
mkdirSync(pastaSaida, { recursive: true })
const cache = join(raiz, "..", "..", ".cache-traducao")
mkdirSync(cache, { recursive: true })
const TAM = 120
const listaUiTodos = [...ui].sort()
const chavesDadosTodas = Object.keys(dados).sort()

// Traduz só o que ainda não está no arquivo do idioma (aproveita o que já foi feito).
async function idioma(l) {
  const arqSaida = join(pastaSaida, `${l}.json`)
  const antes = existsSync(arqSaida) ? JSON.parse(readFileSync(arqSaida, "utf8")) : { ui: {}, dados: {} }
  const listaUi = listaUiTodos.filter((t) => !(t in antes.ui))
  const chavesDados = chavesDadosTodas.filter((k) => !(k in antes.dados))
  const lotes = []
  for (let i = 0; i < listaUi.length; i += TAM) lotes.push(["ui", Object.fromEntries(listaUi.slice(i, i + TAM).map((t, j) => [`u${i + j}`, t]))])
  for (let i = 0; i < chavesDados.length; i += TAM) lotes.push(["dados", Object.fromEntries(chavesDados.slice(i, i + TAM).map((k) => [k, dados[k]]))])
  const out = { idioma: l, ui: { ...antes.ui }, dados: { ...antes.dados } }
  for (let n = 0; n < lotes.length; n++) {
    const [tipo, lote] = lotes[n]
    // cache pelo conteúdo do lote: mudar a lista de textos nunca reaproveita a tradução errada
    const arqCache = join(cache, `${l}-${createHash("sha1").update(JSON.stringify(lote)).digest("hex").slice(0, 16)}.json`)
    let feito = existsSync(arqCache) ? JSON.parse(readFileSync(arqCache, "utf8")) : null
    for (let tentativa = 0; !feito && tentativa < 3; tentativa++) {
      try { feito = await traduzirLote(l, lote); writeFileSync(arqCache, JSON.stringify(feito)) }
      catch (e) { console.log(`  ${l} lote ${n + 1}: ${e.message.slice(0, 120)} (tentando de novo)`) }
    }
    if (!feito) throw new Error(`${l}: lote ${n + 1} falhou 3 vezes`)
    for (const [k, v] of Object.entries(lote)) {
      const t = typeof feito[k] === "string" && feito[k].trim() ? feito[k] : v
      if (tipo === "ui") out.ui[v] = t
      else out.dados[k] = t
    }
    console.log(`  ${l}: lote ${n + 1}/${lotes.length}`)
  }
  writeFileSync(arqSaida, JSON.stringify(out, null, 1) + "\n")
  console.log(`✓ ${l}`)
}

// 3 idiomas de cada vez
const fila = [...pedidos]
await Promise.all([0, 1, 2].map(async () => { while (fila.length) await idioma(fila.shift()) }))
console.log("traduções prontas:", pedidos.join(", "))
