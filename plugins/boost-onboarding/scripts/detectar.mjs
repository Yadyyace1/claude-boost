// Detecta o que já existe no computador: sistema, programas, plugins e MCPs do Claude Code.
// Uso: node scripts/detectar.mjs <arquivo-de-saida.json>
// Só LÊ: não instala nada e não imprime segredos (dos MCPs, só os nomes).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir, platform, release } from "node:os";
import { dirname, join } from "node:path";

const win = platform() === "win32";
const COMANDOS = ["node", "npm", "uv", "git", "bun", "ffmpeg", "winget", "brew", "rtk", "ccusage", "graphify", "rustdesk", "claude"];

function existe(cmd) {
  try {
    execFileSync(win ? "where" : "which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function claude(args) {
  try {
    return execFileSync(win ? "claude.exe" : "claude", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 60000 });
  } catch {
    return "";
  }
}

const comandos = Object.fromEntries(COMANDOS.map((c) => [c, existe(c)]));

let plugins = [];
const lista = claude(["plugin", "list", "--json"]);
try {
  plugins = JSON.parse(lista).filter((p) => p.enabled !== false).map((p) => p.id);
} catch {}

// Nomes dos MCPs do usuário (sem ler valores: tokens e cabeçalhos ficam de fora).
let mcps = [];
try {
  const cfg = JSON.parse(readFileSync(join(homedir(), ".claude.json"), "utf8"));
  mcps = Object.keys(cfg.mcpServers || {});
  for (const proj of Object.values(cfg.projects || {})) mcps.push(...Object.keys(proj.mcpServers || {}));
  mcps = [...new Set(mcps)];
} catch {}

const versao = (claude(["--version"]).match(/[\d.]+/) || [""])[0];
const ambiente = {
  detectado_em: new Date().toISOString(),
  sistema: win ? "win" : platform() === "darwin" ? "mac" : "linux",
  versao_sistema: release(),
  claude_code: versao,
  comandos,
  plugins,
  mcps,
};

const saida = process.argv[2];
if (saida) {
  if (!existsSync(dirname(saida))) mkdirSync(dirname(saida), { recursive: true });
  writeFileSync(saida, JSON.stringify(ambiente, null, 2) + "\n");
}
console.log(JSON.stringify(ambiente, null, 2));
