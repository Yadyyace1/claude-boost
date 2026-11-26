// Abre o assistente de onboarding no navegador e espera a confirmação.
// Uso: node scripts/assistente.mjs --saida <pasta> [--ambiente <ambiente.json>] [--respostas <perfil.json>] [--porta 0] [--sem-abrir]
// Grava <pasta>/selecao.json quando a pessoa confirma e então encerra.
// Escuta só em 127.0.0.1 e só serve os arquivos do próprio plugin.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const saida = opt("--saida");
if (!saida) { console.error("uso: node scripts/assistente.mjs --saida <pasta>"); process.exit(1); }
const ambienteArq = opt("--ambiente");
const respostasArq = opt("--respostas"); // respostas pré-preenchidas pelo consultor (perfil pronto)
const porta = Number(opt("--porta", 0));
const LIMITE_MIN = 45;

const TIPOS = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png" };
const PERMITIDOS = ["assistente", "dados"];
// Interface nova (React + shadcn, compilada em app/dist). Se não existir, usa a página simples de assistente/.
const DIST = join(raiz, "app", "dist");
const temApp = existsSync(join(DIST, "index.html"));

function servir(res, arquivo) {
  res.writeHead(200, { "Content-Type": TIPOS[extname(arquivo)] || "application/octet-stream", "Cache-Control": "no-store" });
  res.end(readFileSync(arquivo));
}

const servidor = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (req.method === "POST" && url.pathname === "/confirmar") {
    let corpo = "";
    req.on("data", (c) => { corpo += c; if (corpo.length > 1e6) req.destroy(); });
    req.on("end", () => {
      try {
        const dados = JSON.parse(corpo);
        if (!existsSync(saida)) mkdirSync(saida, { recursive: true });
        const arq = join(saida, "selecao.json");
        writeFileSync(arq, JSON.stringify({ confirmado_em: new Date().toISOString(), ...dados }, null, 2) + "\n");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        console.log(`CONFIRMADO ${arq}`);
        setTimeout(() => process.exit(0), 600);
      } catch (e) {
        res.writeHead(400); res.end("json inválido");
      }
    });
    return;
  }
  if (req.method !== "GET") { res.writeHead(405); return res.end(); }
  if (url.pathname === "/" || url.pathname === "/index.html") return servir(res, temApp ? join(DIST, "index.html") : join(raiz, "assistente", "index.html"));
  if (temApp && (url.pathname.startsWith("/assets/") || url.pathname === "/favicon.svg")) {
    const arq = join(DIST, normalize(decodeURIComponent(url.pathname)).replace(/^[\\/]+/, ""));
    if (arq.startsWith(DIST) && existsSync(arq)) return servir(res, arq);
    res.writeHead(404); return res.end();
  }
  if (url.pathname === "/ambiente.json") {
    res.writeHead(200, { "Content-Type": TIPOS[".json"] });
    return res.end(ambienteArq && existsSync(ambienteArq) ? readFileSync(ambienteArq) : "{}");
  }
  if (url.pathname === "/respostas.json") {
    res.writeHead(200, { "Content-Type": TIPOS[".json"] });
    return res.end(respostasArq && existsSync(respostasArq) ? readFileSync(respostasArq) : "{}");
  }
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[\\/]+/, "");
  const pasta = rel.split(/[\\/]/)[0];
  const arq = join(raiz, rel);
  if (!PERMITIDOS.includes(pasta) || !arq.startsWith(raiz) || !existsSync(arq)) { res.writeHead(404); return res.end(); }
  servir(res, arq);
});

servidor.listen(porta, "127.0.0.1", () => {
  const endereco = `http://127.0.0.1:${servidor.address().port}/`;
  console.log(`ASSISTENTE ${endereco}`);
  if (!args.includes("--sem-abrir")) {
    const [cmd, a] = platform() === "win32" ? ["cmd", ["/c", "start", "", endereco]] : platform() === "darwin" ? ["open", [endereco]] : ["xdg-open", [endereco]];
    spawn(cmd, a, { stdio: "ignore", detached: true }).unref();
  }
});

setTimeout(() => { console.log("TEMPO ESGOTADO: ninguém confirmou em 45 minutos"); process.exit(2); }, LIMITE_MIN * 60 * 1000);
