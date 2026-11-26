// Abre o assistente de onboarding no navegador e espera a confirmação.
// Uso: node scripts/assistente.mjs --saida <pasta> [--ambiente <ambiente.json>] [--respostas <perfil.json>] [--porta 0] [--sem-abrir] [--instalar]
//
// Sem --instalar: grava <pasta>/selecao.json quando a pessoa confirma e encerra (o Claude instala depois, pela skill).
// Com --instalar: depois da confirmação, gera o plano e a própria página instala tudo, item por item,
// com a pessoa confirmando. Só roda os comandos do plano gerado aqui, nunca um comando vindo da página.
//
// Escuta só em 127.0.0.1. Todo pedido que muda algo precisa do código secreto desta execução
// (vai na URL aberta, ?t=...), para outra página aberta no navegador não conseguir disparar nada.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, appendFileSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { dirname, join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, platform } from "node:os";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const saida = opt("--saida");
if (!saida) { console.error("uso: node scripts/assistente.mjs --saida <pasta>"); process.exit(1); }
const ambienteArq = opt("--ambiente");
const respostasArq = opt("--respostas"); // respostas pré-preenchidas pelo consultor (perfil pronto)
const porta = Number(opt("--porta", 0));
const modoInstalar = args.includes("--instalar");
const LIMITE_MIN = modoInstalar ? 180 : 45;
const TOKEN = randomBytes(18).toString("base64url");
const win = platform() === "win32";

const TIPOS = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png" };
const PERMITIDOS = ["assistente", "dados"];
// Interface nova (React + shadcn, compilada em app/dist). Se não existir, usa a página simples de assistente/.
const DIST = join(raiz, "app", "dist");
const temApp = existsSync(join(DIST, "index.html"));

function servir(res, arquivo) {
  res.writeHead(200, { "Content-Type": TIPOS[extname(arquivo)] || "application/octet-stream", "Cache-Control": "no-store" });
  res.end(readFileSync(arquivo));
}
function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": TIPOS[".json"], "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function lerCorpo(req) {
  return new Promise((ok, falha) => {
    let corpo = "";
    req.on("data", (c) => { corpo += c; if (corpo.length > 1e6) req.destroy(); });
    req.on("end", () => { try { ok(JSON.parse(corpo || "{}")); } catch (e) { falha(e); } });
  });
}

// ---------- modo instalação ----------
let plano = null; // { sistema, itens: [...] } gerado por plano.mjs a partir da seleção confirmada
let claudeMd = "";
const ocupado = new Set();

function gerarPlano() {
  execFileSync(process.execPath, [join(raiz, "scripts", "plano.mjs"), saida], { stdio: "ignore" });
  plano = JSON.parse(readFileSync(join(saida, "plano.json"), "utf8"));
  claudeMd = readFileSync(join(saida, "claude-md-sugerido.md"), "utf8");
}

const variaveisDoPlano = () => new Set((plano?.itens ?? []).flatMap((i) => i.passos.filter((p) => p.tipo === "segredo").map((p) => p.variavel)));

function segredoSalvo(nome) {
  if (process.env[nome]) return true;
  if (!win) return false;
  try {
    const v = execFileSync("powershell.exe", ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${nome}','User')`], { encoding: "utf8" });
    return v.trim().length > 0;
  } catch { return false; }
}

// Roda um comando do plano no PowerShell (Windows) ou no shell (mac/linux), com o PATH recarregado
// (programas que acabaram de ser instalados já aparecem). Devolve a saída e o código.
function rodar(comando) {
  return new Promise((ok) => {
    const [exe, a] = win
      ? ["powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User'); ${comando}`]]
      : ["/bin/sh", ["-lc", comando]];
    const p = spawn(exe, a, { env: process.env, windowsHide: true });
    let texto = "";
    const juntar = (d) => { texto = (texto + d.toString()).slice(-6000); };
    p.stdout.on("data", juntar);
    p.stderr.on("data", juntar);
    p.on("close", (codigo) => ok({ codigo, saida: texto.trim() }));
    p.on("error", (e) => ok({ codigo: -1, saida: String(e) }));
  });
}

async function executarItem(id) {
  const item = plano?.itens.find((i) => i.id === id);
  if (!item) return { ok: false, erro: "item fora do plano" };
  const faltando = item.passos.filter((p) => p.tipo === "segredo" && !segredoSalvo(p.variavel)).map((p) => p.variavel);
  if (faltando.length) return { ok: false, erro: `falta salvar: ${faltando.join(", ")}` };
  const resultados = [];
  for (const p of item.passos) {
    if (p.tipo !== "cmd" || !p.comando) continue;
    const r = await rodar(p.comando);
    resultados.push({ comando: p.comando, ...r });
    // "já instalado / já existe" não é erro para a pessoa
    if (r.codigo !== 0 && !/already|já (está|existe)|exists/i.test(r.saida)) return { ok: false, resultados };
  }
  if (item.desligar_depois) resultados.push({ comando: item.desligar_depois, ...(await rodar(item.desligar_depois)) });
  return { ok: true, resultados };
}

function salvarSegredo(nome, valor) {
  return new Promise((ok) => {
    process.env[nome] = valor;
    if (!win) return ok({ ok: true, aviso: "No mac/linux, acrescente a variável ao ~/.zshrc para valer nos próximos terminais." });
    // O valor vai por variável de ambiente do processo filho: nunca aparece na linha de comando nem em log.
    const p = spawn("powershell.exe", ["-NoProfile", "-Command", "[Environment]::SetEnvironmentVariable($env:BOOST_NOME, $env:BOOST_VALOR, 'User')"], {
      env: { ...process.env, BOOST_NOME: nome, BOOST_VALOR: valor }, windowsHide: true,
    });
    p.on("close", (c) => ok({ ok: c === 0 }));
  });
}

function aplicarClaudeMd() {
  const dir = join(homedir(), ".claude");
  const arq = join(dir, "CLAUDE.md");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const atual = existsSync(arq) ? readFileSync(arq, "utf8") : "";
  if (atual.includes("<!-- claude-boost:onboarding -->")) return { ok: true, jaTinha: true };
  if (atual) copyFileSync(arq, `${arq}.bak-boost-${new Date().toISOString().slice(0, 10)}`);
  appendFileSync(arq, `${atual && !atual.endsWith("\n") ? "\n" : ""}\n<!-- claude-boost:onboarding -->\n${claudeMd}`);
  return { ok: true, arquivo: arq };
}

const autorizado = (req) => req.headers["x-boost-token"] === TOKEN;

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");

  if (req.method === "POST") {
    if (!autorizado(req) && (modoInstalar || url.pathname !== "/confirmar")) return json(res, 403, { erro: "código inválido" });
    let corpo;
    try { corpo = await lerCorpo(req); } catch { return json(res, 400, { erro: "json inválido" }); }

    if (url.pathname === "/confirmar") {
      if (!existsSync(saida)) mkdirSync(saida, { recursive: true });
      const arq = join(saida, "selecao.json");
      writeFileSync(arq, JSON.stringify({ confirmado_em: new Date().toISOString(), ...corpo }, null, 2) + "\n");
      console.log(`CONFIRMADO ${arq}`);
      if (!modoInstalar) { json(res, 200, { ok: true }); setTimeout(() => process.exit(0), 600); return; }
      try { gerarPlano(); } catch (e) { return json(res, 500, { erro: `não consegui montar o plano: ${e.message}` }); }
      return json(res, 200, { ok: true, instalar: true });
    }
    if (!modoInstalar || !plano) return json(res, 404, {});

    if (url.pathname === "/executar") {
      const id = String(corpo.id ?? "");
      if (ocupado.has(id)) return json(res, 409, { erro: "já está rodando" });
      ocupado.add(id);
      try { return json(res, 200, await executarItem(id)); } finally { ocupado.delete(id); }
    }
    if (url.pathname === "/segredo") {
      const nome = String(corpo.nome ?? ""), valor = String(corpo.valor ?? "");
      if (!variaveisDoPlano().has(nome)) return json(res, 400, { erro: "variável fora do plano" });
      if (!valor.trim() || valor.length > 4096) return json(res, 400, { erro: "valor vazio" });
      return json(res, 200, await salvarSegredo(nome, valor.trim()));
    }
    if (url.pathname === "/claude-md") return json(res, 200, aplicarClaudeMd());
    if (url.pathname === "/fim") {
      json(res, 200, { ok: true });
      console.log("INSTALACAO CONCLUIDA");
      setTimeout(() => process.exit(0), 500);
      return;
    }
    return json(res, 404, {});
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
  if (url.pathname === "/modo") return json(res, 200, { instalar: modoInstalar });
  if (url.pathname === "/plano") {
    if (!plano) return json(res, 404, {});
    const segredos = Object.fromEntries([...variaveisDoPlano()].map((v) => [v, segredoSalvo(v)]));
    return json(res, 200, { ...plano, claudeMd, segredos });
  }
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[\\/]+/, "");
  const pasta = rel.split(/[\\/]/)[0];
  const arq = join(raiz, rel);
  if (!PERMITIDOS.includes(pasta) || !arq.startsWith(raiz) || !existsSync(arq)) { res.writeHead(404); return res.end(); }
  servir(res, arq);
});

servidor.listen(porta, "127.0.0.1", () => {
  const endereco = `http://127.0.0.1:${servidor.address().port}/?t=${TOKEN}`;
  console.log(`ASSISTENTE ${endereco}`);
  if (!args.includes("--sem-abrir")) {
    const [cmd, a] = win ? ["cmd", ["/c", "start", "", endereco]] : platform() === "darwin" ? ["open", [endereco]] : ["xdg-open", [endereco]];
    spawn(cmd, a, { stdio: "ignore", detached: true }).unref();
  }
});

setTimeout(() => { console.log(`TEMPO ESGOTADO: nada foi concluído em ${LIMITE_MIN} minutos`); process.exit(2); }, LIMITE_MIN * 60 * 1000);
