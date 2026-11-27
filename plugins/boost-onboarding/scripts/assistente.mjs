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
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, appendFileSync, chmodSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
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

const SEGURANCA = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};
function servir(res, arquivo) {
  res.writeHead(200, { "Content-Type": TIPOS[extname(arquivo)] || "application/octet-stream", "Cache-Control": "no-store", ...SEGURANCA });
  res.end(readFileSync(arquivo));
}
function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": TIPOS[".json"], "Cache-Control": "no-store", ...SEGURANCA });
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

const NOME_VALIDO = /^[A-Z][A-Z0-9_]{1,63}$/;
// No Mac e no Linux as chaves ficam em ~/.config/spark/segredos.sh (permissão 600, só o usuário lê),
// carregado pelo ~/.zshrc e pelo ~/.bash_profile.
const ARQ_SEGREDOS = join(homedir(), ".config", "spark", "segredos.sh");
function segredoSalvo(nome) {
  if (!NOME_VALIDO.test(nome)) return false;
  if (process.env[nome]) return true;
  if (!win) {
    try { return readFileSync(ARQ_SEGREDOS, "utf8").includes(`export ${nome}=`); } catch { return false; }
  }
  try {
    const v = execFileSync("powershell.exe", ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${nome}','User')`], { encoding: "utf8" });
    return v.trim().length > 0;
  } catch { return false; }
}

// Pastas onde os programas do plano se instalam e que nem sempre estão no PATH do registro:
// o Claude Code (~\.local\bin), o npm global, o uv/uvx e o bun. Sem elas, o PowerShell responde
// "o termo 'claude' não é reconhecido" logo depois de uma instalação nova.
const EXTRAS_PATH = win
  ? [join(homedir(), ".local", "bin"), join(process.env.APPDATA ?? "", "npm"), join(homedir(), ".bun", "bin"), join(homedir(), ".cargo", "bin")]
  : ["/opt/homebrew/bin", "/usr/local/bin", join(homedir(), ".local", "bin"), join(homedir(), ".bun", "bin"), join(homedir(), ".cargo", "bin")];
const extrasPs = EXTRAS_PATH.map((p) => `'${p.replace(/'/g, "''")}'`).join(", ");

// Roda um comando do plano no PowerShell (Windows) ou no shell (mac/linux), com o PATH recarregado
// (programas que acabaram de ser instalados já aparecem). Devolve a saída e o código.
function rodar(comando) {
  return new Promise((ok) => {
    const prefixo = `$env:Path = (@([Environment]::GetEnvironmentVariable('Path','Machine'), [Environment]::GetEnvironmentVariable('Path','User'), $env:Path) + @(${extrasPs})) -join ';'; [Console]::OutputEncoding = [Text.Encoding]::UTF8; `;
    const [exe, a] = win
      ? ["powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", prefixo + comando]]
      : ["/bin/sh", ["-lc", `export PATH="$PATH:${EXTRAS_PATH.join(":")}"; ${comando}`]];
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
    try { appendFileSync(join(saida, "execucao.log"), `[${new Date().toISOString()}] ${id} · código ${r.codigo}\n$ ${p.comando}\n${r.saida}\n\n`); } catch { /* log é só ajuda */ }
    // "já instalado / já existe" não é erro para a pessoa
    if (r.codigo !== 0 && !/already|exists|já (está|existe)|já instalad|pacote existente|nenhuma atualiza|no (available|applicable) upgrade/i.test(r.saida)) return { ok: false, resultados };
  }
  if (item.desligar_depois) resultados.push({ comando: item.desligar_depois, ...(await rodar(item.desligar_depois)) });
  return { ok: true, resultados };
}

function salvarSegredo(nome, valor) {
  return new Promise((ok) => {
    if (!NOME_VALIDO.test(nome)) return ok({ ok: false });
    process.env[nome] = valor;
    if (!win) {
      try {
        mkdirSync(join(homedir(), ".config", "spark"), { recursive: true });
        const atual = existsSync(ARQ_SEGREDOS) ? readFileSync(ARQ_SEGREDOS, "utf8").split("\n").filter((l) => l && !l.startsWith(`export ${nome}=`)) : ["# Chaves salvas pelo Spark. Só você lê este arquivo (permissão 600)."];
        atual.push(`export ${nome}='${valor.replace(/'/g, "'\\''")}'`);
        writeFileSync(ARQ_SEGREDOS, atual.join("\n") + "\n", { mode: 0o600 });
        chmodSync(ARQ_SEGREDOS, 0o600);
        const linha = '[ -f "$HOME/.config/spark/segredos.sh" ] && . "$HOME/.config/spark/segredos.sh"';
        for (const rc of [".zshrc", ".bash_profile"]) {
          const arq = join(homedir(), rc);
          const txt = existsSync(arq) ? readFileSync(arq, "utf8") : "";
          if (!txt.includes(".config/spark/segredos.sh")) appendFileSync(arq, `${txt && !txt.endsWith("\n") ? "\n" : ""}\n# Spark: chaves dos conectores\n${linha}\n`);
        }
        return ok({ ok: true });
      } catch (e) {
        return ok({ ok: false, aviso: String(e.message) });
      }
    }
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

// ---------- chat de suporte ----------
// Usa o Claude Code da própria pessoa (já logado), sem nenhuma ferramenta, conector, plugin ou hook:
// ele só conversa. Uma pergunta por vez, resposta curta, em português.
let ajudando = false;
const SUPORTE = `Você é o suporte do Spark, um assistente que instala e configura o Claude Code no computador de pessoas leigas.
Responda em português do Brasil, curto (até 6 frases ou uma lista curta), simples e sem jargão; explique termos técnicos em meia frase.
Você NÃO roda comandos nem mexe no computador: explique o que a pessoa deve clicar ou fazer nesta página.
Regras:
- Nunca peça senha, chave, token ou código no chat. Chaves vão no campo protegido do cartão do item ("Cole a chave aqui" → Salvar); ficam só no computador da pessoa.
- Logins e conectores: o botão "Abrir" do cartão leva à página certa; depois a pessoa clica em "Já fiz".
- "Instalar os automáticos" instala de uma vez o que não precisa da pessoa. Item com erro: "Ver o que aconteceu" mostra a saída; "Tentar de novo" repete.
- Nada aqui apaga as configurações da pessoa: plugins e conectores são acrescentados, e o CLAUDE.md recebe um texto no fim, com cópia de segurança antes.
- Depois de terminar, a pessoa fecha e abre o app do Claude para os plugins, temas e o painel carregarem.
- Se não souber, diga que não sabe e sugira falar com o consultor. Não invente comandos.`;

function contextoDoPlano(extra) {
  const linhas = (plano?.itens ?? []).map((i) => {
    const passos = i.passos.map((p) => p.tipo === "cmd" ? `cmd: ${p.comando}` : `${p.tipo}: ${p.texto ?? p.variavel ?? ""}`).join(" | ");
    return `- ${i.nome} (${i.tipo}): ${i.resumo}${i.aviso ? ` Aviso: ${i.aviso}` : ""} Passos: ${passos}`;
  });
  return `${linhas.length ? `

Itens do plano desta pessoa:
${linhas.join("\n")}` : ""}${extra ? `

O que a página mostra agora:
${extra}` : ""}`;
}

function perguntarAoClaude(pergunta, historico, extra) {
  return new Promise((ok) => {
    const sistema = join(saida, "suporte-sistema.md");
    if (!existsSync(saida)) mkdirSync(saida, { recursive: true });
    writeFileSync(sistema, SUPORTE + contextoDoPlano(extra));
    const conversa = historico.map((m) => `${m.quem === "eu" ? "Pessoa" : "Suporte"}: ${m.texto}`).join("\n");
    const entrada = `${conversa ? `Conversa até aqui:
${conversa}

` : ""}Pergunta da pessoa: ${pergunta}`;
    const a = ["-p", "--model", "haiku", "--tools", "", "--strict-mcp-config", "--setting-sources", "project", "--no-session-persistence",
      "--output-format", "text", "--system-prompt-file", sistema];
    const p = spawn(win ? "claude.exe" : "claude", a, { cwd: saida, windowsHide: true, env: process.env });
    let texto = "", erro = "";
    const limite = setTimeout(() => { p.kill(); }, 120000);
    p.stdout.on("data", (d) => { texto += d; });
    p.stderr.on("data", (d) => { erro = (erro + d).slice(-500); });
    p.on("close", (c) => { clearTimeout(limite); ok(c === 0 && texto.trim() ? { ok: true, resposta: texto.trim() } : { ok: false, erro: erro.trim() || "o Claude não respondeu" }); });
    p.on("error", (e) => { clearTimeout(limite); ok({ ok: false, erro: String(e.message) }); });
    p.stdin.end(entrada);
  });
}

// Observações que a pessoa escreve nos cartões: ficam num arquivo da sessão (para o consultor ler depois).
function salvarObservacoes(obs) {
  if (!existsSync(saida)) mkdirSync(saida, { recursive: true });
  const nomes = Object.fromEntries((plano?.itens ?? []).map((i) => [i.id, i.nome]));
  const linhas = Object.entries(obs).filter(([, t]) => String(t).trim()).map(([id, t]) => `## ${nomes[id] ?? id}

${String(t).trim().slice(0, 4000)}
`);
  writeFileSync(join(saida, "observacoes.md"), `# Observações da instalação

${linhas.join("\n") || "(nenhuma)\n"}`);
  return { ok: true, arquivo: join(saida, "observacoes.md") };
}

function autorizado(req) {
  const t = Buffer.from(String(req.headers["x-boost-token"] ?? ""));
  const certo = Buffer.from(TOKEN);
  return t.length === certo.length && timingSafeEqual(t, certo);
}
// Só aceita pedidos endereçados a este computador: bloqueia sites que tentam se passar por "localhost" (DNS rebinding).
function hostValido(req) {
  const h = String(req.headers.host ?? "").toLowerCase();
  const p = servidor.address()?.port;
  return h === `127.0.0.1:${p}` || h === `localhost:${p}`;
}

const servidor = createServer(async (req, res) => {
  if (!hostValido(req)) { res.writeHead(421); return res.end(); }
  const url = new URL(req.url, "http://127.0.0.1");
  // Dados pessoais (respostas, ambiente, plano) só com o código secreto desta execução.
  const PROTEGIDOS = ["/ambiente.json", "/respostas.json", "/plano"];
  if (req.method === "GET" && PROTEGIDOS.includes(url.pathname) && !autorizado(req)) return json(res, 403, { erro: "código inválido" });

  if (req.method === "POST") {
    if (!autorizado(req) && (modoInstalar || url.pathname !== "/confirmar")) return json(res, 403, { erro: "código inválido" });
    // /ajuda e /observacoes também exigem o código, em qualquer modo (a regra acima já cobre: só /confirmar escapa fora do modo instalação).
    let corpo;
    try { corpo = await lerCorpo(req); } catch { return json(res, 400, { erro: "json inválido" }); }

    if (url.pathname === "/confirmar") {
      if (!existsSync(saida)) mkdirSync(saida, { recursive: true });
      // Fundo com foto: o navegador manda o mosaico; só aceita SVG feito de retângulos, e grava fora da seleção.
      const apr = corpo?.respostas?.aparencia;
      if (apr && typeof apr.fotoSvg === "string") {
        const svg = apr.fotoSvg;
        delete apr.fotoSvg;
        if (svg.length < 131000 && /^<svg [^>]*>(\s*<rect [^<>]*\/>)+\s*<\/svg>\s*$/.test(svg)) {
          const pastaSpark = join(homedir(), "Spark");
          if (!existsSync(pastaSpark)) mkdirSync(pastaSpark, { recursive: true });
          writeFileSync(join(pastaSpark, "fundo.svg"), svg);
          apr.fotoArquivo = join(pastaSpark, "fundo.svg");
        } else if (apr.fundo === "foto") apr.fundo = "tema";
      }
      const arq = join(saida, "selecao.json");
      writeFileSync(arq, JSON.stringify({ confirmado_em: new Date().toISOString(), ...corpo }, null, 2) + "\n");
      console.log(`CONFIRMADO ${arq}`);
      if (!modoInstalar) { json(res, 200, { ok: true }); setTimeout(() => process.exit(0), 600); return; }
      try { gerarPlano(); } catch (e) { return json(res, 500, { erro: `não consegui montar o plano: ${e.message}` }); }
      return json(res, 200, { ok: true, instalar: true });
    }
    if (url.pathname === "/ajuda") {
      const pergunta = String(corpo.pergunta ?? "").trim().slice(0, 2000);
      if (!pergunta) return json(res, 400, { erro: "pergunta vazia" });
      if (ajudando) return json(res, 409, { erro: "ainda respondendo a pergunta anterior" });
      const historico = (Array.isArray(corpo.historico) ? corpo.historico : []).slice(-6)
        .map((m) => ({ quem: m?.quem === "eu" ? "eu" : "suporte", texto: String(m?.texto ?? "").slice(0, 1500) }));
      ajudando = true;
      try { return json(res, 200, await perguntarAoClaude(pergunta, historico, String(corpo.contexto ?? "").slice(0, 3000))); } finally { ajudando = false; }
    }
    if (!modoInstalar || !plano) return json(res, 404, {});
    if (url.pathname === "/observacoes") return json(res, 200, salvarObservacoes(corpo.observacoes && typeof corpo.observacoes === "object" ? corpo.observacoes : {}));

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
    res.writeHead(200, { "Content-Type": TIPOS[".json"], "Cache-Control": "no-store", ...SEGURANCA });
    return res.end(ambienteArq && existsSync(ambienteArq) ? readFileSync(ambienteArq) : "{}");
  }
  if (url.pathname === "/respostas.json") {
    res.writeHead(200, { "Content-Type": TIPOS[".json"], "Cache-Control": "no-store", ...SEGURANCA });
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
