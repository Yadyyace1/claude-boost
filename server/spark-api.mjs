// API de contas do Spark: criar conta, entrar e perfil. Sem dependências: Node 24 (node:sqlite e node:crypto).
// Roda atrás do Caddy (HTTPS) no servidor da Vultr em São Paulo. Uso: node server/spark-api.mjs
//
// Variáveis de ambiente:
//   SPARK_SEGREDO   (obrigatória) chave para assinar as sessões; 32+ caracteres aleatórios
//   SPARK_BANCO     arquivo do banco (padrão: ./spark.db)
//   SPARK_PORTA     porta local (padrão: 8787; o Caddy publica em HTTPS)
//   SPARK_ORIGENS   origens extras permitidas no CORS, separadas por vírgula (o assistente local já é aceito)
//   TZ              fuso das datas mostradas (o servidor usa America/Sao_Paulo); o banco guarda tudo em UTC
//   SPARK_URL       endereço público desta API (https://...), usado nos retornos do login social
//   SPARK_SITE      endereço do site de vendas (https://...), para onde o pagamento e o login voltam
//   SPARK_MOEDA     moeda dos planos (padrão brl); SPARK_PRECO_ANUAL e SPARK_PRECO_VITALICIO em centavos (9999 e 49900)
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET                      pagamento (sem elas, a venda fica desligada)
//   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET                          entrar com GitHub
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET                          entrar com Google
//   APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY entrar com Apple (precisa da conta de desenvolvedor da Apple)
//   SPARK_COMUNIDADE_LINK  link do grupo da comunidade (Telegram, WhatsApp ou Discord), mostrado só para quem tem plano
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { createHmac, createPrivateKey, createSign, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const SEGREDO = process.env.SPARK_SEGREDO ?? "";
if (SEGREDO.length < 32) { console.error("Defina SPARK_SEGREDO com 32+ caracteres aleatórios."); process.exit(1); }
const PORTA = Number(process.env.SPARK_PORTA ?? 8787);
const ORIGENS_EXTRAS = (process.env.SPARK_ORIGENS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const DIAS_SESSAO = 30;
const IDIOMAS = ["pt", "en", "es", "fr", "de", "it", "ja", "zh", "ko", "ru"];
const AVATARES = ["faisca", "gato", "raposa", "panda", "robo", "fantasma", "astronauta", "alien", "sapo", "coruja", "dragao", "unicornio"];

// ---------- banco ----------
const db = new DatabaseSync(process.env.SPARK_BANCO ?? "spark.db");
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS contas (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    senha TEXT NOT NULL,              -- scrypt: sal:hash (hex)
    nome TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    idioma TEXT NOT NULL DEFAULT 'pt',
    criado_em TEXT NOT NULL,          -- ISO 8601 em UTC
    ultimo_acesso TEXT
  );
  CREATE TABLE IF NOT EXISTS sessoes_revogadas (jti TEXT PRIMARY KEY, ate TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY, conta_id TEXT NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
    texto TEXT NOT NULL, criado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS eventos_stripe (id TEXT PRIMARY KEY, em TEXT NOT NULL);
`);
// Colunas novas em bancos antigos (sem apagar nada).
for (const col of ["plano TEXT NOT NULL DEFAULT ''", "plano_ate TEXT", "stripe_cliente TEXT", "provedor TEXT NOT NULL DEFAULT 'senha'"]) {
  try { db.exec(`ALTER TABLE contas ADD COLUMN ${col}`); } catch { /* já existe */ }
}
const q = {
  criar: db.prepare("INSERT INTO contas (id, email, senha, nome, avatar, idioma, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  porEmail: db.prepare("SELECT * FROM contas WHERE email = ?"),
  porId: db.prepare("SELECT id, email, nome, avatar, idioma, criado_em, ultimo_acesso, plano, plano_ate, provedor FROM contas WHERE id = ?"),
  criarSocial: db.prepare("INSERT INTO contas (id, email, senha, nome, avatar, idioma, criado_em, provedor) VALUES (?, ?, '!', ?, '', ?, ?, ?)"),
  plano: db.prepare("UPDATE contas SET plano = ?, plano_ate = ?, stripe_cliente = COALESCE(?, stripe_cliente) WHERE id = ?"),
  porCliente: db.prepare("SELECT id FROM contas WHERE stripe_cliente = ?"),
  evento: db.prepare("INSERT OR IGNORE INTO eventos_stripe (id, em) VALUES (?, ?)"),
  postar: db.prepare("INSERT INTO posts (id, conta_id, texto, criado_em) VALUES (?, ?, ?, ?)"),
  posts: db.prepare("SELECT p.id, p.texto, p.criado_em, c.nome, c.avatar FROM posts p JOIN contas c ON c.id = p.conta_id ORDER BY p.criado_em DESC LIMIT 50"),
  acesso: db.prepare("UPDATE contas SET ultimo_acesso = ? WHERE id = ?"),
  perfil: db.prepare("UPDATE contas SET nome = ?, avatar = ?, idioma = ? WHERE id = ?"),
  revogar: db.prepare("INSERT OR IGNORE INTO sessoes_revogadas (jti, ate) VALUES (?, ?)"),
  revogada: db.prepare("SELECT 1 FROM sessoes_revogadas WHERE jti = ?"),
  limpar: db.prepare("DELETE FROM sessoes_revogadas WHERE ate < ?"),
};

// ---------- senhas e sessões ----------
async function hashSenha(senha) {
  const sal = randomBytes(16);
  const hash = await scryptAsync(senha.normalize("NFKC"), sal, 64, { N: 16384, r: 8, p: 1 });
  return `${sal.toString("hex")}:${hash.toString("hex")}`;
}
async function confere(senha, guardado) {
  const [salHex, hashHex] = String(guardado).split(":");
  if (!salHex || !hashHex) return false; // contas do login social não têm senha
  const hash = await scryptAsync(senha.normalize("NFKC"), Buffer.from(salHex, "hex"), 64, { N: 16384, r: 8, p: 1 });
  const certo = Buffer.from(hashHex, "hex");
  return certo.length === hash.length && timingSafeEqual(certo, hash);
}
// Hash de uma senha qualquer: quem tenta um e-mail que não existe gasta o mesmo tempo (não dá para descobrir contas).
const HASH_FALSO = await hashSenha(randomBytes(12).toString("hex"));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const assinar = (dados) => createHmac("sha256", SEGREDO).update(dados).digest("base64url");
function emitir(conta) {
  const agora = Math.floor(Date.now() / 1000);
  const corpo = b64({ sub: conta.id, jti: randomUUID(), iat: agora, exp: agora + DIAS_SESSAO * 86400 });
  return `${corpo}.${assinar(corpo)}`;
}
function lerSessao(req) {
  const m = String(req.headers.authorization ?? "").match(/^Bearer ([\w-]+)\.([\w-]+)$/);
  if (!m) return null;
  const esperado = Buffer.from(assinar(m[1])), veio = Buffer.from(m[2]);
  if (esperado.length !== veio.length || !timingSafeEqual(esperado, veio)) return null;
  try {
    const s = JSON.parse(Buffer.from(m[1], "base64url").toString());
    if (!s.sub || !s.jti || s.exp < Date.now() / 1000 || q.revogada.get(s.jti)) return null;
    return s;
  } catch { return null; }
}

// ---------- proteção contra força bruta ----------
const tentativas = new Map(); // ip|rota -> [horários]
function excedeu(chave, limite, janelaMs) {
  const agora = Date.now();
  const lista = (tentativas.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  lista.push(agora);
  tentativas.set(chave, lista);
  return lista.length > limite;
}
setInterval(() => {
  const agora = Date.now();
  for (const [k, v] of tentativas) if (v.every((t) => agora - t > 3600_000)) tentativas.delete(k);
  q.limpar.run(new Date().toISOString());
}, 600_000).unref();

// ---------- HTTP ----------
const ORIGEM_LOCAL = /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/;
function cabecalhos(req) {
  const origem = String(req.headers.origin ?? "");
  const ok = ORIGEM_LOCAL.test(origem) || ORIGENS_EXTRAS.includes(origem);
  return {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
    ...(ok ? { "Access-Control-Allow-Origin": origem, Vary: "Origin", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS", "Access-Control-Max-Age": "600" } : {}),
  };
}
function responder(req, res, status, obj) {
  res.writeHead(status, cabecalhos(req));
  res.end(obj === undefined ? "" : JSON.stringify(obj));
}
function lerCorpo(req) {
  return new Promise((ok, falha) => {
    let t = "";
    req.on("data", (c) => { t += c; if (t.length > 10_000) { falha(new Error("grande")); req.destroy(); } });
    req.on("end", () => { try { ok(JSON.parse(t || "{}")); } catch (e) { falha(e); } });
    req.on("error", falha);
  });
}
const ip = (req) => String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",")[0].trim();
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const planoAtivo = (c) => c.plano === "vitalicio" || (c.plano === "anual" && !!c.plano_ate && c.plano_ate > new Date().toISOString());
const publico = (c) => ({ id: c.id, email: c.email, nome: c.nome, avatar: c.avatar, idioma: c.idioma, criado_em: c.criado_em, plano: c.plano ?? "", plano_ate: c.plano_ate ?? null, plano_ativo: planoAtivo(c), provedor: c.provedor ?? "senha" });

// ---------- pagamento (Stripe) ----------
const MOEDA = (process.env.SPARK_MOEDA ?? "brl").toLowerCase();
const PRECOS = { anual: Number(process.env.SPARK_PRECO_ANUAL ?? 9999), vitalicio: Number(process.env.SPARK_PRECO_VITALICIO ?? 49900) };
const SITE = (process.env.SPARK_SITE ?? "").replace(/\/$/, "");
const URL_API = (process.env.SPARK_URL ?? "").replace(/\/$/, "");
async function stripe(caminho, campos) {
  const r = await fetch(`https://api.stripe.com/v1/${caminho}`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(campos),
  });
  const dados = await r.json();
  if (!r.ok) throw new Error(dados?.error?.message ?? "erro na Stripe");
  return dados;
}
// Confere a assinatura do webhook da Stripe (cabeçalho Stripe-Signature: t=...,v1=...).
function webhookValido(bruto, cabecalho) {
  const partes = Object.fromEntries(String(cabecalho ?? "").split(",").map((p) => p.split("=")));
  if (!partes.t || !partes.v1 || Math.abs(Date.now() / 1000 - Number(partes.t)) > 300) return false;
  const esperado = Buffer.from(createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET ?? "").update(`${partes.t}.${bruto}`).digest("hex"));
  const veio = Buffer.from(partes.v1);
  return esperado.length === veio.length && timingSafeEqual(esperado, veio);
}
const daquiUmAno = (de = new Date()) => new Date(de.getTime() + 366 * 86400_000).toISOString();

// ---------- login social ----------
const PROVEDORES = {
  github: { ok: () => process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
    autorizar: "https://github.com/login/oauth/authorize", escopo: "read:user user:email" },
  google: { ok: () => process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    autorizar: "https://accounts.google.com/o/oauth2/v2/auth", escopo: "openid email profile" },
  apple: { ok: () => process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY,
    autorizar: "https://appleid.apple.com/auth/authorize", escopo: "name email" },
};
const idCliente = (p) => process.env[`${p.toUpperCase()}_CLIENT_ID`];
// Para onde o login social pode voltar: o assistente local ou o site de vendas.
const voltaPermitida = (u) => { try { const x = new URL(u); return ORIGEM_LOCAL.test(x.origin) || x.origin === SITE || ORIGENS_EXTRAS.includes(x.origin); } catch { return false; } };
const estado = (dados) => { const c = b64({ ...dados, exp: Math.floor(Date.now() / 1000) + 600 }); return `${c}.${assinar(c)}`; };
function lerEstado(e) {
  const [c, a] = String(e ?? "").split(".");
  if (!c || !a) return null;
  const esperado = Buffer.from(assinar(c)), veio = Buffer.from(a);
  if (esperado.length !== veio.length || !timingSafeEqual(esperado, veio)) return null;
  const d = JSON.parse(Buffer.from(c, "base64url").toString());
  return d.exp > Date.now() / 1000 ? d : null;
}
// A Apple pede um "client secret" que é um JWT assinado (ES256) com a chave privada da conta de desenvolvedor.
function segredoApple() {
  const cab = b64({ alg: "ES256", kid: process.env.APPLE_KEY_ID });
  const agora = Math.floor(Date.now() / 1000);
  const corpo = b64({ iss: process.env.APPLE_TEAM_ID, iat: agora, exp: agora + 600, aud: "https://appleid.apple.com", sub: process.env.APPLE_CLIENT_ID });
  const chave = createPrivateKey(process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"));
  const ass = createSign("SHA256").update(`${cab}.${corpo}`).sign({ key: chave, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${cab}.${corpo}.${ass}`;
}
// Troca o código pelo e-mail verificado da pessoa.
async function emailDoProvedor(p, code) {
  const retorno = `${URL_API}/v1/oauth/${p}/volta`;
  if (p === "github") {
    const t = await (await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: retorno }) })).json();
    const h = { Authorization: `Bearer ${t.access_token}`, "User-Agent": "spark", Accept: "application/vnd.github+json" };
    const emails = await (await fetch("https://api.github.com/user/emails", { headers: h })).json();
    const u = await (await fetch("https://api.github.com/user", { headers: h })).json();
    const e = Array.isArray(emails) ? emails.find((x) => x.primary && x.verified) : null;
    return e ? { email: e.email, nome: u.name || u.login || "" } : null;
  }
  const corpo = new URLSearchParams({ code, redirect_uri: retorno, grant_type: "authorization_code", client_id: idCliente(p),
    client_secret: p === "apple" ? segredoApple() : process.env.GOOGLE_CLIENT_SECRET });
  const url = p === "google" ? "https://oauth2.googleapis.com/token" : "https://appleid.apple.com/auth/token";
  const t = await (await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: corpo })).json();
  if (!t.id_token) return null;
  // O id_token veio direto do provedor, por HTTPS, em troca do código: dá para ler sem baixar as chaves.
  const d = JSON.parse(Buffer.from(t.id_token.split(".")[1], "base64url").toString());
  if (d.aud !== idCliente(p) || !d.email || !(d.email_verified === true || d.email_verified === "true")) return null;
  return { email: d.email, nome: d.name ?? "" };
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://spark");
  if (req.method === "OPTIONS") return responder(req, res, 204);
  try {
    if (req.method === "GET" && url.pathname === "/v1/saude") return responder(req, res, 200, { ok: true, fuso: Intl.DateTimeFormat().resolvedOptions().timeZone });

    if (req.method === "POST" && url.pathname === "/v1/contas") {
      if (excedeu(`${ip(req)}|criar`, 5, 3600_000)) return responder(req, res, 429, { erro: "muitas tentativas; tente mais tarde" });
      const c = await lerCorpo(req);
      const email = String(c.email ?? "").trim().toLowerCase(), senha = String(c.senha ?? "");
      const nome = String(c.nome ?? "").trim().slice(0, 60);
      if (!EMAIL.test(email)) return responder(req, res, 400, { erro: "e-mail inválido" });
      if (senha.length < 8 || senha.length > 200) return responder(req, res, 400, { erro: "a senha precisa ter de 8 a 200 caracteres" });
      if (q.porEmail.get(email)) return responder(req, res, 409, { erro: "já existe uma conta com este e-mail" });
      const avatar = AVATARES.includes(c.avatar) ? c.avatar : "";
      const idioma = IDIOMAS.includes(c.idioma) ? c.idioma : "pt";
      const conta = { id: randomUUID(), email, nome, avatar, idioma, criado_em: new Date().toISOString() };
      q.criar.run(conta.id, email, await hashSenha(senha), nome, avatar, idioma, conta.criado_em);
      return responder(req, res, 201, { token: emitir(conta), conta: publico(conta) });
    }

    if (req.method === "POST" && url.pathname === "/v1/sessoes") {
      const c = await lerCorpo(req);
      const email = String(c.email ?? "").trim().toLowerCase(), senha = String(c.senha ?? "");
      if (excedeu(`${ip(req)}|entrar`, 10, 900_000) || excedeu(`${email}|entrar`, 10, 900_000)) return responder(req, res, 429, { erro: "muitas tentativas; espere 15 minutos" });
      const conta = q.porEmail.get(email);
      const certa = await confere(senha, conta ? conta.senha : HASH_FALSO);
      if (!conta || !certa) return responder(req, res, 401, { erro: "e-mail ou senha incorretos" });
      q.acesso.run(new Date().toISOString(), conta.id);
      return responder(req, res, 200, { token: emitir(conta), conta: publico(conta) });
    }

    if (url.pathname === "/v1/eu") {
      const s = lerSessao(req);
      if (!s) return responder(req, res, 401, { erro: "entre de novo" });
      const conta = q.porId.get(s.sub);
      if (!conta) return responder(req, res, 401, { erro: "entre de novo" });
      if (req.method === "GET") return responder(req, res, 200, { conta: publico(conta) });
      if (req.method === "PATCH") {
        const c = await lerCorpo(req);
        const nome = c.nome === undefined ? conta.nome : String(c.nome).trim().slice(0, 60);
        const avatar = c.avatar === undefined ? conta.avatar : AVATARES.includes(c.avatar) ? c.avatar : conta.avatar;
        const idioma = c.idioma === undefined ? conta.idioma : IDIOMAS.includes(c.idioma) ? c.idioma : conta.idioma;
        q.perfil.run(nome, avatar, idioma, conta.id);
        return responder(req, res, 200, { conta: publico({ ...conta, nome, avatar, idioma }) });
      }
    }

    if (req.method === "DELETE" && url.pathname === "/v1/sessoes") {
      const s = lerSessao(req);
      if (s) q.revogar.run(s.jti, new Date(s.exp * 1000).toISOString());
      return responder(req, res, 204);
    }

    // ---- planos e pagamento ----
    if (req.method === "GET" && url.pathname === "/v1/planos") {
      return responder(req, res, 200, { moeda: MOEDA, venda: !!process.env.STRIPE_SECRET_KEY, planos: [
        { id: "anual", preco: PRECOS.anual, recorrente: "ano" }, { id: "vitalicio", preco: PRECOS.vitalicio, recorrente: null }] });
    }
    if (req.method === "POST" && url.pathname === "/v1/checkout") {
      const s = lerSessao(req);
      if (!s) return responder(req, res, 401, { erro: "entre para comprar" });
      if (!process.env.STRIPE_SECRET_KEY || !SITE) return responder(req, res, 503, { erro: "a venda ainda não foi ligada" });
      const { plano } = await lerCorpo(req);
      if (!(plano in PRECOS)) return responder(req, res, 400, { erro: "plano inválido" });
      const conta = q.porId.get(s.sub);
      const campos = {
        mode: plano === "anual" ? "subscription" : "payment", "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": MOEDA, "line_items[0][price_data][unit_amount]": String(PRECOS[plano]),
        "line_items[0][price_data][product_data][name]": plano === "anual" ? "Spark · plano anual" : "Spark · acesso vitalício",
        client_reference_id: conta.id, "metadata[conta]": conta.id, "metadata[plano]": plano, customer_email: conta.email,
        success_url: `${SITE}/conta.html?pago=1`, cancel_url: `${SITE}/#planos`, locale: "auto",
      };
      if (plano === "anual") { campos["line_items[0][price_data][recurring][interval]"] = "year"; campos["subscription_data[metadata][conta]"] = conta.id; }
      try { const c = await stripe("checkout/sessions", campos); return responder(req, res, 200, { url: c.url }); }
      catch (e) { return responder(req, res, 502, { erro: `pagamento indisponível: ${e.message}` }); }
    }
    if (req.method === "POST" && url.pathname === "/v1/webhooks/stripe") {
      const bruto = await new Promise((ok) => { let t = ""; req.on("data", (c) => (t += c)); req.on("end", () => ok(t)); });
      if (!webhookValido(bruto, req.headers["stripe-signature"])) return responder(req, res, 400, { erro: "assinatura inválida" });
      const ev = JSON.parse(bruto);
      if (q.evento.run(ev.id, new Date().toISOString()).changes === 0) return responder(req, res, 200, { ok: true }); // já processado
      const o = ev.data?.object ?? {};
      if (ev.type === "checkout.session.completed" && o.payment_status === "paid") {
        const plano = o.metadata?.plano, conta = o.metadata?.conta;
        if (conta && plano === "vitalicio") q.plano.run("vitalicio", null, o.customer ?? null, conta);
        if (conta && plano === "anual") q.plano.run("anual", daquiUmAno(), o.customer ?? null, conta);
      } else if (ev.type === "invoice.paid" && o.billing_reason === "subscription_cycle") {
        const c = q.porCliente.get(o.customer);
        if (c) q.plano.run("anual", daquiUmAno(), null, c.id);
      } else if (ev.type === "customer.subscription.deleted") {
        const c = q.porCliente.get(o.customer);
        const atual = c && q.porId.get(c.id);
        if (atual && atual.plano === "anual") q.plano.run("", null, null, c.id);
      }
      return responder(req, res, 200, { ok: true });
    }

    // ---- login social ----
    if (req.method === "GET" && url.pathname === "/v1/oauth") {
      return responder(req, res, 200, { provedores: Object.keys(PROVEDORES).filter((p) => PROVEDORES[p].ok()) });
    }
    const social = url.pathname.match(/^\/v1\/oauth\/(github|google|apple)\/(inicio|volta)$/);
    if (social) {
      const [, p, etapa] = social;
      if (!PROVEDORES[p].ok() || !URL_API) return responder(req, res, 404, { erro: "login social não configurado" });
      if (etapa === "inicio") {
        const volta = url.searchParams.get("volta") ?? "";
        if (!voltaPermitida(volta)) return responder(req, res, 400, { erro: "retorno não permitido" });
        const pr = new URLSearchParams({ client_id: idCliente(p), redirect_uri: `${URL_API}/v1/oauth/${p}/volta`, scope: PROVEDORES[p].escopo, state: estado({ p, volta }) });
        if (p !== "github") pr.set("response_type", "code");
        if (p === "apple") pr.set("response_mode", "form_post");
        res.writeHead(302, { Location: `${PROVEDORES[p].autorizar}?${pr}`, "Cache-Control": "no-store" });
        return res.end();
      }
      // a Apple volta por POST (form_post); Google e GitHub por GET
      const params = req.method === "POST" ? new URLSearchParams(await new Promise((ok) => { let t = ""; req.on("data", (c) => (t += c)); req.on("end", () => ok(t)); })) : url.searchParams;
      const st = lerEstado(params.get("state"));
      if (!st || st.p !== p || !voltaPermitida(st.volta)) return responder(req, res, 400, { erro: "login expirado; tente de novo" });
      const quem = await emailDoProvedor(p, params.get("code") ?? "").catch(() => null);
      if (!quem) { res.writeHead(302, { Location: `${st.volta}#erro=login` }); return res.end(); }
      const email = quem.email.toLowerCase();
      let conta = q.porEmail.get(email);
      if (!conta) {
        const id = randomUUID();
        q.criarSocial.run(id, email, String(quem.nome).slice(0, 60), "pt", new Date().toISOString(), p);
        conta = q.porEmail.get(email);
      }
      q.acesso.run(new Date().toISOString(), conta.id);
      // A sessão vai no fragmento (#): não aparece em log de servidor nem no Referer.
      res.writeHead(302, { Location: `${st.volta}#sessao=${emitir(conta)}`, "Cache-Control": "no-store" });
      return res.end();
    }

    // ---- comunidade (só com plano ativo) ----
    if (url.pathname === "/v1/comunidade") {
      const s = lerSessao(req);
      const conta = s && q.porId.get(s.sub);
      if (!conta) return responder(req, res, 401, { erro: "entre de novo" });
      if (!planoAtivo(conta)) return responder(req, res, 402, { erro: "a comunidade é para quem tem um plano" });
      if (req.method === "GET") return responder(req, res, 200, { link: process.env.SPARK_COMUNIDADE_LINK ?? "", posts: q.posts.all() });
      if (req.method === "POST") {
        if (excedeu(`${conta.id}|postar`, 10, 3600_000)) return responder(req, res, 429, { erro: "devagar: no máximo 10 posts por hora" });
        const texto = String((await lerCorpo(req)).texto ?? "").trim().slice(0, 1000);
        if (texto.length < 2) return responder(req, res, 400, { erro: "escreva algo" });
        q.postar.run(randomUUID(), conta.id, texto, new Date().toISOString());
        return responder(req, res, 201, { ok: true });
      }
    }

    return responder(req, res, 404, { erro: "não encontrado" });
  } catch {
    return responder(req, res, 400, { erro: "pedido inválido" });
  }
});
servidor.listen(PORTA, "127.0.0.1", () => console.log(`spark-api em http://127.0.0.1:${PORTA} (fuso ${Intl.DateTimeFormat().resolvedOptions().timeZone})`));
