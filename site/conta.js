// Área do cliente: entrar, criar conta, login social, compra (Stripe) e comunidade. A API vem de config.js.
(() => {
  const API = (window.SPARK_API || "").replace(/\/$/, "")
  const $ = (id) => document.getElementById(id)
  const CHAVE = "spark-site-sessao"
  let modo = "entrar"
  const planoPedido = new URLSearchParams(location.search).get("plano")

  // Sessão vinda do login social (#sessao=...) ou erro (#erro=login)
  const hash = new URLSearchParams(location.hash.slice(1))
  if (hash.get("sessao")) { sessionStorage.setItem(CHAVE, hash.get("sessao")); history.replaceState(null, "", location.pathname + location.search) }
  if (hash.get("erro")) { $("erro-conta").textContent = "Não deu para entrar com essa conta. Tente de novo ou use e-mail e senha."; history.replaceState(null, "", location.pathname + location.search) }

  async function api(caminho, metodo = "GET", corpo) {
    const token = sessionStorage.getItem(CHAVE)
    let r
    try {
      r = await fetch(API + caminho, { method: metodo, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined })
    } catch { throw new Error("Não consegui falar com o servidor do Spark. Tente de novo em instantes.") }
    const dados = r.status === 204 ? {} : await r.json().catch(() => ({}))
    if (!r.ok) { const e = new Error(dados.erro || `erro ${r.status}`); e.status = r.status; throw e }
    return dados
  }

  if (!API) {
    $("aviso-api").textContent = "As contas abrem em breve. Enquanto isso, fale com a gente para comprar."
    $("enviar").disabled = true
    return
  }

  // abas entrar / criar
  document.querySelectorAll(".abas button").forEach((b) => b.addEventListener("click", () => {
    modo = b.dataset.modo
    document.querySelectorAll(".abas button").forEach((x) => x.classList.toggle("on", x === b))
    $("nome").classList.toggle("oculto", modo !== "criar")
    $("senha").autocomplete = modo === "criar" ? "new-password" : "current-password"
    $("enviar").textContent = modo === "criar" ? "Criar conta" : "Entrar"
    $("erro-conta").textContent = ""
  }))

  $("form-conta").addEventListener("submit", async (e) => {
    e.preventDefault()
    $("erro-conta").textContent = ""
    $("enviar").disabled = true
    try {
      const corpo = { email: $("email").value, senha: $("senha").value, ...(modo === "criar" ? { nome: $("nome").value } : {}) }
      const r = await api(modo === "criar" ? "/v1/contas" : "/v1/sessoes", "POST", corpo)
      sessionStorage.setItem(CHAVE, r.token)
      await mostrarConta()
    } catch (err) { $("erro-conta").textContent = err.message } finally { $("enviar").disabled = false }
  })

  // botões de login social: só os provedores configurados no servidor
  api("/v1/oauth").then(({ provedores }) => {
    const NOMES = { google: "Google", github: "GitHub", apple: "Apple" }
    if (!provedores.length) return
    $("bloco-social").classList.remove("oculto")
    for (const p of provedores) {
      const a = document.createElement("a")
      a.className = "bt contorno"
      a.textContent = `Continuar com ${NOMES[p]}`
      a.href = `${API}/v1/oauth/${p}/inicio?volta=${encodeURIComponent(location.origin + location.pathname + location.search)}`
      $("social").appendChild(a)
    }
  }).catch(() => {})

  async function mostrarConta() {
    let conta
    try { conta = (await api("/v1/eu")).conta } catch { sessionStorage.removeItem(CHAVE); return }
    $("tela-entrar").classList.add("oculto")
    $("tela-conta").classList.remove("oculto")
    $("sair").classList.remove("oculto")
    $("conta-nome").textContent = conta.nome || conta.email.split("@")[0]
    $("conta-email").textContent = conta.email
    const ate = conta.plano_ate ? new Date(conta.plano_ate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : ""
    $("plano-status").textContent = conta.plano_ativo
      ? (conta.plano === "vitalicio" ? "Vitalício ✦ acesso para sempre." : `Anual, ativo até ${ate}.`)
      : "Você ainda não tem um plano."
    $("comprar").classList.toggle("oculto", conta.plano === "vitalicio" && conta.plano_ativo)
    if (new URLSearchParams(location.search).get("pago")) $("plano-status").textContent += " Pagamento recebido: a liberação leva alguns segundos (atualize a página)."
    if (conta.plano_ativo) carregarComunidade()
    else if (planoPedido) comprar(planoPedido)
  }

  async function comprar(plano) {
    $("erro-compra").textContent = ""
    try { const { url } = await api("/v1/checkout", "POST", { plano }); location.href = url }
    catch (e) { $("erro-compra").textContent = e.message }
  }
  document.querySelectorAll("#comprar [data-plano]").forEach((b) => b.addEventListener("click", () => comprar(b.dataset.plano)))

  async function carregarComunidade() {
    const { link, posts } = await api("/v1/comunidade")
    $("comunidade").classList.remove("oculto")
    if (link) { $("grupo").href = link; $("grupo").classList.remove("oculto") }
    const lista = $("posts")
    lista.replaceChildren()
    for (const p of posts) {
      const d = document.createElement("div")
      d.className = "post"
      const b = document.createElement("b"); b.textContent = p.nome || "Membro"
      const s = document.createElement("small"); s.textContent = new Date(p.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })
      const t = document.createElement("p"); t.textContent = p.texto
      d.append(b, s, t)
      lista.appendChild(d)
    }
  }
  $("form-post").addEventListener("submit", async (e) => {
    e.preventDefault()
    const texto = $("texto-post").value.trim()
    if (!texto) return
    try { await api("/v1/comunidade", "POST", { texto }); $("texto-post").value = ""; carregarComunidade() } catch (err) { alert(err.message) }
  })

  $("sair").addEventListener("click", async () => {
    await api("/v1/sessoes", "DELETE").catch(() => {})
    sessionStorage.removeItem(CHAVE)
    location.href = "index.html"
  })

  if (sessionStorage.getItem(CHAVE)) mostrarConta()
})()
