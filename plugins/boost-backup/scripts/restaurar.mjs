// Restaura um backup feito pelo backup.mjs. Uso: node restaurar.mjs <arquivo.json> [--aplicar]
// Sem --aplicar só mostra o que mudaria (nada é alterado). Com --aplicar:
//   1. guarda uma cópia do que vai ser sobrescrito em ~/Claude Boost/Backups/antes-de-restaurar-<data>/;
//   2. grava os arquivos (settings, CLAUDE.md, skills, memórias...);
//   3. adiciona os marketplaces que faltam e instala os plugins (desligando os que estavam desligados);
//   4. adiciona os MCPs que faltam (os de projeto só se a pasta do projeto existir neste computador);
//   5. lista as variáveis de segredo que a pessoa precisa preencher.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const arquivo = args.find((a) => !a.startsWith("--"));
const aplicar = args.includes("--aplicar");
if (!arquivo || !existsSync(arquivo)) { console.error("uso: node restaurar.mjs <claude-backup-....json> [--aplicar]"); process.exit(1); }

const b = JSON.parse(readFileSync(arquivo, "utf8"));
if (b.formato !== "claude-boost-backup") { console.error("Este arquivo não é um backup do Claude Boost."); process.exit(1); }

const casa = homedir();
const dirClaude = join(casa, ".claude");
const win = platform() === "win32";
const exe = win ? "claude.exe" : "claude";
function claude(a, opcoes = {}) {
  try { return { ok: true, saida: execFileSync(exe, a, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 180000, ...opcoes }) }; }
  catch (e) { return { ok: false, saida: String(e.stderr || e.stdout || e.message) }; }
}
const json = (t, padrao) => { try { return JSON.parse(t); } catch { return padrao; } };

const arquivos = Object.entries(b.arquivos ?? {});
const marketsJa = new Set(json(claude(["plugin", "marketplace", "list", "--json"]).saida, []).map((m) => m.name));
const pluginsJa = new Map(json(claude(["plugin", "list", "--json"]).saida, []).map((p) => [p.id, p]));
const mcpsJa = new Set();
for (const arq of [join(casa, ".claude.json"), join(dirClaude, ".claude.json")]) {
  const cfg = json(existsSync(arq) ? readFileSync(arq, "utf8") : "{}", {});
  for (const n of Object.keys(cfg.mcpServers ?? {})) mcpsJa.add(`usuario:${n}`);
  for (const [pasta, p] of Object.entries(cfg.projects ?? {})) for (const n of Object.keys(p.mcpServers ?? {})) mcpsJa.add(`${pasta}:${n}`);
}

const novos = arquivos.filter(([rel]) => !existsSync(join(dirClaude, rel)));
const mudados = arquivos.filter(([rel, txt]) => existsSync(join(dirClaude, rel)) && readFileSync(join(dirClaude, rel), "utf8") !== txt);
const marketsFaltam = (b.marketplaces ?? []).filter((m) => !marketsJa.has(m.nome));
const pluginsFaltam = (b.plugins ?? []).filter((p) => !pluginsJa.has(p.id));
const mcpsUsuario = Object.entries(b.mcps?.usuario ?? {}).filter(([n]) => !mcpsJa.has(`usuario:${n}`));
const mcpsProjeto = Object.entries(b.mcps?.projetos ?? {}).flatMap(([pasta, s]) => Object.entries(s).filter(([n]) => !mcpsJa.has(`${pasta}:${n}`)).map(([n, c]) => [pasta, n, c]));

console.log(`Backup de ${b.criado_em} (${b.computador}, Claude Code ${b.claude_code || "?"})`);
console.log(`Arquivos: ${novos.length} novos, ${mudados.length} diferentes, ${arquivos.length - novos.length - mudados.length} iguais`);
console.log(`Marketplaces a adicionar: ${marketsFaltam.map((m) => m.nome).join(", ") || "nenhum"}`);
console.log(`Plugins a instalar: ${pluginsFaltam.map((p) => p.id).join(", ") || "nenhum"}`);
console.log(`MCPs a adicionar: ${[...mcpsUsuario.map(([n]) => n), ...mcpsProjeto.map(([p, n]) => `${n} (${p})`)].join(", ") || "nenhum"}`);
if (!aplicar) { console.log("\nNada foi alterado. Para restaurar de verdade, rode de novo com --aplicar."); process.exit(0); }

// 1 e 2: arquivos, com cópia do que vai ser sobrescrito
const carimbo = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
const guarda = join(casa, "Claude Boost", "Backups", `antes-de-restaurar-${carimbo}`);
for (const [rel] of mudados) { const dest = join(guarda, rel); mkdirSync(dirname(dest), { recursive: true }); copyFileSync(join(dirClaude, rel), dest); }
for (const [rel, txt] of [...novos, ...mudados]) { const dest = join(dirClaude, rel); mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, txt); }
console.log(`\n✓ ${novos.length + mudados.length} arquivos gravados${mudados.length ? ` (cópia do que existia em ${guarda})` : ""}`);

// 3: marketplaces e plugins
for (const m of marketsFaltam) {
  const fonte = m.repo ?? (m.pasta && existsSync(m.pasta) ? m.pasta : m.url);
  if (!fonte) { console.log(`⚠ marketplace ${m.nome}: sem origem acessível, pulei`); continue; }
  const r = claude(["plugin", "marketplace", "add", fonte]);
  console.log(`${r.ok ? "✓" : "⚠"} marketplace ${m.nome}${r.ok ? "" : `: ${r.saida.trim().split("\n").pop()}`}`);
}
for (const p of b.plugins ?? []) {
  if (!pluginsJa.has(p.id)) {
    const r = claude(["plugin", "install", p.id]);
    console.log(`${r.ok ? "✓" : "⚠"} plugin ${p.id}${r.ok ? "" : `: ${r.saida.trim().split("\n").pop()}`}`);
  }
  if (!p.ligado) claude(["plugin", "disable", p.id]);
}

// 4: MCPs (o JSON vai pela entrada padrão, nunca na linha de comando)
for (const [n, cfg] of mcpsUsuario) {
  const r = claude(["mcp", "add-json", n, "-", "-s", "user"], { input: JSON.stringify(cfg) });
  console.log(`${r.ok ? "✓" : "⚠"} MCP ${n}${r.ok ? "" : `: ${r.saida.trim().split("\n").pop()}`}`);
}
for (const [pasta, n, cfg] of mcpsProjeto) {
  if (!existsSync(pasta)) { console.log(`· MCP ${n}: a pasta ${pasta} não existe aqui, pulei`); continue; }
  const r = claude(["mcp", "add-json", n, "-", "-s", "local"], { input: JSON.stringify(cfg), cwd: pasta });
  console.log(`${r.ok ? "✓" : "⚠"} MCP ${n} (${pasta})`);
}

// 5: segredos
const faltam = (b.segredos_para_preencher ?? []).filter((s) => !process.env[s.variavel]);
if (faltam.length) {
  console.log("\nPreencha estas variáveis (as chaves de cada serviço), cada uma no seu terminal, sem colar no chat:");
  for (const s of faltam) console.log(win
    ? `  [Environment]::SetEnvironmentVariable("${s.variavel}", "COLE_AQUI", "User")   # ${s.servidor} (${s.chave})`
    : `  echo 'export ${s.variavel}="COLE_AQUI"' >> ~/.zshrc   # ${s.servidor} (${s.chave})`);
}
console.log("\nPronto. Reinicie o Claude para valer tudo.");
