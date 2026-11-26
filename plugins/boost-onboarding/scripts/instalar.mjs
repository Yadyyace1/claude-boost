// Onboarding completo, de ponta a ponta, sem terminal: detecta o PC, abre o assistente no navegador
// e, depois da confirmação, a própria página instala tudo (modo --instalar do assistente.mjs).
// Uso: node scripts/instalar.mjs [--respostas <perfil.json>]
// É o que o "Spark.exe" roda. A pasta da sessão fica em ~/.claude/boost-onboarding/<data-hora>.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const i = args.indexOf("--respostas");
const respostas = i >= 0 ? args[i + 1] : null;

const carimbo = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").replace(/^(\d{8})(\d{4})$/, "$1-$2");
const pasta = join(homedir(), ".claude", "boost-onboarding", carimbo);
mkdirSync(pasta, { recursive: true });
console.log(`PASTA ${pasta}`);

execFileSync(process.execPath, [join(aqui, "detectar.mjs"), join(pasta, "ambiente.json")], { stdio: "ignore", timeout: 120000 });
console.log("AMBIENTE detectado");

const extra = respostas ? ["--respostas", respostas] : [];
const p = spawn(process.execPath, [join(aqui, "assistente.mjs"), "--saida", pasta, "--ambiente", join(pasta, "ambiente.json"), "--instalar", ...extra], { stdio: "inherit" });
p.on("close", (codigo) => process.exit(codigo ?? 0));
