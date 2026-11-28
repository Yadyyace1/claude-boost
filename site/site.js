// Spark: faíscas no fundo, aparecer ao rolar e a vitrine de temas.
(() => {
  const ceu = document.querySelector(".ceu")
  if (ceu && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 22; i++) {
      const f = document.createElement("i")
      f.style.left = `${Math.random() * 100}%`
      f.style.animationDuration = `${14 + Math.random() * 18}s`
      f.style.animationDelay = `${-Math.random() * 30}s`
      const t = 6 + Math.random() * 12
      f.style.width = f.style.height = `${t}px`
      ceu.appendChild(f)
    }
  }
  const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visivel"); obs.unobserve(e.target) } }), { threshold: 0.12 })
  document.querySelectorAll(".revela").forEach((el) => obs.observe(el))

  const TEMAS = [
    ["Âmbar", "#17130e", "#f3e9da", "#d98a1c"], ["Synthwave", "#120b1f", "#f6ecff", "#ff4fd8"], ["Floresta", "#0f1712", "#e6f1e9", "#3f8f5a"],
    ["Oceano", "#0b1520", "#e4f0fa", "#2b8fd6"], ["Caderno", "#efe6d3", "#2a241d", "#2f5d8c"], ["Grafite", "#141414", "#ededed", "#6e8efb"],
    ["Azul Royal", "#0e1230", "#eef1ff", "#2b4bc7"], ["Aurora", "#071419", "#e3f4f1", "#2bbf8f"], ["Noite estrelada", "#080b1d", "#eceeff", "#7c8cff"], ["Spark", "#141210", "#f5ecdf", "#e0a33b"],
  ]
  const caixa = document.getElementById("temas")
  if (caixa) {
    for (const [nome, fundo, texto, destaque] of TEMAS) {
      const d = document.createElement("div")
      d.className = "tema"
      d.style.background = `linear-gradient(160deg, ${fundo}, ${fundo}ee)`
      d.style.color = texto
      d.innerHTML = `<div class="barras"><i style="background:${destaque}"></i><i style="background:${texto};opacity:.35"></i><i style="background:${texto};opacity:.2"></i></div><b></b><span>tema do Claude</span>`
      d.querySelector("b").textContent = nome
      caixa.appendChild(d)
    }
  }
})()
