// Backup das configurações do Claude Code num arquivo só, para restaurar em qualquer conta (troca de plano,
// perda de acesso, computador novo). Uso: node backup.mjs [--saida <pasta>] [--com-segredos]
//
// Entra: settings.json, CLAUDE.md, RTK.md, keybindings, skills, agentes, comandos, estilos, hooks e mods
// próprios, as memórias de cada projeto, os marketplaces e plugins instalados (com as opções deles) e os
// servidores MCP. Não entra: login (.credentials.json), conversas, cache, telemetria e arquivos .env.
// Segredos dos MCPs (cabeçalhos e variáveis) viram ${VARIAVEL} e ficam listados para preencher de novo;
// com --com-segredos eles vão inteiros (aí o arquivo é sensível: guarde como uma senha).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir, hostname, platform } from "node:os";
import { join, relative, sep } from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const comSegredos = args.includes("--com-segredos");
const casa = homedir();
const dirClaude = join(casa, ".claude");
const saidaDir = opt("--saida", join(casa, "Spark", "Backups"));
const win = platform() === "win32";

const TEXTO = /\.(md|json|txt|ts|tsx|js|mjs|cjs|sh|ps1|ya?ml|toml|css|svg)$/i;
const PROIBIDO = /(^|[\\/])(\.credentials\.json|\.env|.*token.*|.*secret.*|.*credential.*)$/i;
const MAX = 1024 * 1024;

// O que copiar de ~/.claude: arquivos soltos e pastas inteiras (só texto).
const SOLTOS = ["settings.json", "CLAUDE.md", "RTK.md", "keybindings.json", "statusline.sh", "statusline.ps1"];
const PASTAS = ["skills", "agents", "commands", "output-styles", "hooks", "dev-mods"];

function varrer(base, rel, saida) {
  const abs = join(base, rel);
  if (!existsSync(abs)) return;
  const st = statSync(abs);
  if (st.isDirectory()) {
    for (const nome of readdirSync(abs)) {
      if (nome === "node_modules" || nome === ".git" || nome === "types") continue;
      varrer(base, join(rel, nome), saida);
    }
  } else if (TEXTO.test(rel) && !PROIBIDO.test(rel) && st.size <= MAX) {
    saida[rel.split(sep).join("/")] = readFileSync(abs, "utf8");
  }
}

const arquivos = {};
for (const f of SOLTOS) varrer(dirClaude, f, arquivos);
for (const p of PASTAS) varrer(dirClaude, p, arquivos);
// Memórias de cada projeto (projects/<projeto>/memory/*), sem as conversas (.jsonl).
const dirProjetos = join(dirClaude, "projects");
if (existsSync(dirProjetos)) for (const p of readdirSync(dirProjetos)) varrer(dirClaude, join("projects", p, "memory"), arquivos);

function claude(...a) {
  try { return execFileSync(win ? "claude.exe" : "claude", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 60000 }); } catch { return ""; }
}
const json = (t, padrao) => { try { return JSON.parse(t); } catch { return padrao; } };

const marketplaces = json(claude("plugin", "marketplace", "list", "--json"), [])
  .filter((m) => m.name !== "claude-plugins-official")
  .map((m) => ({ nome: m.name, origem: m.source, repo: m.repo ?? null, pasta: m.path ?? m.installLocation ?? null, url: m.url ?? null }));
const plugins = json(claude("plugin", "list", "--json"), [])
  .filter((p) => !String(p.id).endsWith("@builtin") && !String(p.id).endsWith("@synced"))
  .map((p) => ({ id: p.id, ligado: p.enabled !== false, escopo: p.scope }));

// MCPs: ~/.claude.json (e ~/.claude/.claude.json, onde algumas versões guardam).
const segredos = [];
const limpar = (nome, cfg) => {
  if (comSegredos) return cfg;
  const c = structuredClone(cfg);
  for (const campo of ["headers", "env"]) {
    for (const [k, v] of Object.entries(c[campo] ?? {})) {
      if (typeof v !== "string" || /^\$\{[A-Z0-9_]+\}$/.test(v.trim()) || v.length < 8) continue;
      const variavel = `BOOST_${nome}_${k}`.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
      c[campo][k] = campo === "headers" && /^Bearer\s/i.test(v) ? `Bearer \${${variavel}}` : `\${${variavel}}`;
      if (!segredos.some((s) => s.variavel === variavel)) segredos.push({ servidor: nome, campo, chave: k, variavel });
    }
  }
  return c;
};
const mcps = { usuario: {}, projetos: {} };
for (const arq of [join(casa, ".claude.json"), join(dirClaude, ".claude.json")]) {
  const cfg = json(existsSync(arq) ? readFileSync(arq, "utf8") : "{}", {});
  for (const [n, c] of Object.entries(cfg.mcpServers ?? {})) mcps.usuario[n] ??= limpar(n, c);
  for (const [pasta, p] of Object.entries(cfg.projects ?? {})) {
    for (const [n, c] of Object.entries(p.mcpServers ?? {})) (mcps.projetos[pasta] ??= {})[n] ??= limpar(n, c);
  }
}

const versao = (claude("--version").match(/[\d.]+/) ?? [""])[0];
const pacote = {
  formato: "claude-boost-backup",
  versao: 1,
  criado_em: new Date().toISOString(),
  computador: hostname(),
  sistema: platform(),
  claude_code: versao,
  com_segredos: comSegredos,
  arquivos,
  marketplaces,
  plugins,
  mcps,
  segredos_para_preencher: segredos,
};

mkdirSync(saidaDir, { recursive: true });
const carimbo = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
const destino = join(saidaDir, `claude-backup-${carimbo}${comSegredos ? "-COM-SEGREDOS" : ""}.json`);
writeFileSync(destino, JSON.stringify(pacote, null, 2) + "\n");

const total = Object.keys(arquivos).length;
const memorias = Object.keys(arquivos).filter((f) => f.includes("/memory/")).length;
console.log(`BACKUP ${destino}`);
console.log(`${total} arquivos (${memorias} de memória), ${marketplaces.length} marketplaces, ${plugins.length} plugins, ${Object.keys(mcps.usuario).length} MCPs do usuário, ${Object.keys(mcps.projetos).length} projetos com MCP.`);
if (segredos.length) console.log(`Segredos guardados como \${VARIAVEL} (preencher na restauração): ${segredos.map((s) => s.variavel).join(", ")}`);
console.log(`Pasta: ${relative(casa, saidaDir) ? saidaDir : casa}`);
