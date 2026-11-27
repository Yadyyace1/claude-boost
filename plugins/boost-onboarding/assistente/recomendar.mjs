// Algoritmo de recomendação do Spark Onboarding.
// Roda igual no navegador (assistente, ao vivo) e no Node (testes e plano).
// Determinístico e explicável: cada item recebe uma nota com os motivos que a formaram.

export const TETO_TOKENS = { maxima: 1500, alta: 3000, media: 7000, baixa: 15000, extremo: 60000 };

const FRASES = {
  dev: "você programa", web: "você cria sites", design: "você trabalha com design",
  arte: "você cria arte", pixel: "você faz pixel art", "3d": "você trabalha com 3D",
  jogos: "você cria jogos", video: "você edita vídeos", audio: "você trabalha com áudio",
  conteudo: "você produz conteúdo", social: "você posta nas redes", marketing: "você trabalha com marketing",
  ads: "você roda anúncios", escrita: "você escreve muito", docs: "você lida com documentos",
  juridico: "você trabalha com direito", pesquisa: "você pesquisa bastante", estudos: "você estuda",
  dados: "você usa planilhas e relatórios", financas: "você acompanha finanças", cripto: "você acompanha cripto",
  automacao: "você quer automatizar tarefas", comunicacao: "você conversa muito por mensagem",
  produtividade: "você organiza agenda e tarefas", remoto: "você quer comandar o PC de longe",
  economia: "economiza o seu limite de uso", vendas: "você cobra clientes",
  stream: "você faz lives", vtuber: "você usa avatar virtual",
  ecommerce: "você vende online", atendimento: "você atende clientes", musica: "você trabalha com música",
  ia: "você gosta de IA e automação", gestao: "você gerencia projetos",
  fitness: "você trabalha com esporte e saúde", arquitetura: "você projeta espaços",
};

const PESO = { impulso: 6, essencial: 8 };
const CORTE = { recomendado: 6, opcional: 2.5 };
export const MAX_RECOMENDADOS = 10;

/** Junta as respostas num vetor de interesses (tag → peso) e em flags. */
export function lerPerfil(respostas, perguntas) {
  const sinais = {};
  const impulsos = new Map(); // id do item → rótulo da ferramenta
  const flags = {};
  for (const etapa of perguntas.etapas) {
    for (const q of etapa.perguntas) {
      const r = respostas[q.id];
      if (!q.opcoes || r == null) continue;
      const escolhidas = Array.isArray(r) ? r : [r];
      for (const op of q.opcoes) {
        if (!escolhidas.includes(op.valor)) continue;
        for (const [t, w] of Object.entries(op.sinais || {})) sinais[t] = (sinais[t] || 0) + w;
        for (const id of op.itens || []) impulsos.set(id, op.rotulo);
        Object.assign(flags, op.flags || {});
      }
    }
  }
  // Economia: o plano e as horas de uso podem exigir mais economia do que a pessoa escolheu.
  const ORDEM_ECO = ["extremo", "baixa", "media", "alta", "maxima"];
  let economia = respostas.economia || "media";
  // Muitas horas por dia pedem economia, menos nos planos Max e Team (que aguentam o uso intenso).
  const planoForte = ["max", "team"].includes(respostas.plano);
  const minimos = [flags.economia_min, Number(respostas.horas) >= 6 && !planoForte ? "media" : null].filter(Boolean);
  for (const m of minimos) if (ORDEM_ECO.indexOf(m) > ORDEM_ECO.indexOf(economia)) economia = m;

  return {
    sinais, impulsos, flags,
    nivel: Number(respostas.nivel || 2),
    preferencia: respostas.preferencia || "misto",
    orcamento: Number(respostas.orcamento ?? 50),
    economia,
    economiaAjustada: economia !== (respostas.economia || "media"),
    sensivel: !!flags.sensivel,
  };
}

/** Nota de um item para um perfil, com os motivos e os avisos. */
export function pontuar(item, p) {
  const contrib = [];
  let base = 0;
  for (const [t, w] of Object.entries(item.sinais || {})) {
    const v = (p.sinais[t] || 0) * w;
    if (v > 0) { base += v; contrib.push([t, v]); }
  }
  contrib.sort((a, b) => b[1] - a[1]);
  const motivos = contrib.slice(0, 2).map(([t]) => FRASES[t] || t);
  if (p.impulsos.has(item.id)) { base += PESO.impulso; motivos.unshift(`você já usa ${p.impulsos.get(item.id)}`); }
  if (item.essencial) { base += PESO.essencial; motivos.unshift("base para todo mundo"); }

  const avisos = [];
  let mult = 1;
  if (p.preferencia === "local" && !item.local) mult *= 0.75;
  if (p.preferencia === "nuvem" && item.local && item.dificuldade >= 2) mult *= 0.9;
  const salto = (item.dificuldade || 1) - p.nivel;
  if (salto >= 2) { mult *= 0.45; avisos.push("pede ajuda técnica: faça junto com o consultor"); }
  else if (salto === 1) { mult *= 0.75; avisos.push("um pouco técnico"); }
  if (p.sensivel && !item.oficial && !item.kit) { mult *= 0.6; avisos.push("não é oficial: avalie antes de usar com dados sigilosos"); }
  const mensal = item.custo?.mensal_brl || 0;
  if (mensal > 0 && p.orcamento === 0) mult *= 0.3;
  if (item.aviso) avisos.push(item.aviso);
  if (item.verificar) avisos.push("passos a conferir na hora da instalação");

  return { nota: Math.round(base * mult * 10) / 10, motivos: [...new Set(motivos)].slice(0, 3), avisos, tecnicoDemais: salto >= 2, jaUsa: p.impulsos.has(item.id) };
}

/** Está instalado? Usa o ambiente detectado (scripts/detectar.mjs). */
export function instalado(item, amb = {}) {
  const d = item.detectar || {};
  if (d.plugin && (amb.plugins || []).includes(d.plugin)) return true;
  if (d.mcp && (amb.mcps || []).includes(d.mcp)) return true;
  if (d.cmd && amb.comandos?.[d.cmd]) return true;
  return false;
}

/**
 * Recomendação completa.
 * Retorna grupos (essenciais, recomendados, opcionais, fora_orcamento), requisitos que faltam,
 * a seleção padrão e os totais (R$/mês e tokens fixos por sessão).
 */
export function recomendar(respostas, catalogo, perguntas, ambiente = {}) {
  const p = lerPerfil(respostas, perguntas);
  const teto = TETO_TOKENS[p.economia] ?? TETO_TOKENS.media;
  const porId = Object.fromEntries(catalogo.itens.map((i) => [i.id, i]));
  const avaliados = catalogo.itens
    .filter((i) => i.tipo !== "requisito")
    .map((i) => ({ item: i, ...pontuar(i, p), instalado: instalado(i, ambiente) }))
    .sort((a, b) => b.nota - a.nota);

  // Vagas de "recomendado": o que a pessoa já usa entra primeiro; o resto disputa as vagas que sobram
  // (no mínimo 5, para sempre sobrar espaço para descobertas novas).
  const candidatos = avaliados.filter((a) => !a.item.essencial && a.nota >= CORTE.recomendado && !a.tecnicoDemais);
  const jaUsados = candidatos.filter((a) => a.jaUsa).length;
  // No modo extremo cabem o dobro de recomendações.
  const vagasNovas = Math.max((p.economia === "extremo" ? MAX_RECOMENDADOS * 2 : MAX_RECOMENDADOS) - jaUsados, 5);

  const grupos = { essenciais: [], recomendados: [], opcionais: [], fora_orcamento: [] };
  let gasto = 0;
  let novos = 0;
  for (const a of avaliados) {
    const mensal = a.item.custo?.mensal_brl || 0;
    let grupo = a.item.essencial ? "essenciais" : a.nota >= CORTE.recomendado ? "recomendados" : a.nota >= CORTE.opcional ? "opcionais" : null;
    if (!grupo) continue;
    // Técnico demais para o nível da pessoa, ou sem vaga: vira opcional.
    if (grupo === "recomendados" && !a.jaUsa && (a.tecnicoDemais || novos >= vagasNovas)) grupo = "opcionais";
    // Pago: só fica se couber no orçamento (do item de maior nota para o de menor).
    if (mensal > 0 && grupo !== "opcionais") {
      if (gasto + mensal <= p.orcamento) gasto += mensal;
      else grupo = "fora_orcamento";
    }
    // A vaga só é ocupada por quem de fato ficou nos recomendados.
    if (grupo === "recomendados" && !a.jaUsa) novos++;
    grupos[grupo].push(a);
  }

  // Limite de tokens: os itens de menor nota que estouram o teto entram "desligados até precisar".
  let tokens = 0;
  for (const a of [...grupos.essenciais, ...grupos.recomendados]) {
    const t = a.item.tokens_fixos || 0;
    if (tokens + t <= teto || a.item.essencial) tokens += t;
    else a.desligado = true;
  }

  const selecao = [...grupos.essenciais, ...grupos.recomendados].map((a) => a.item.id);
  return { perfil: { ...p, impulsos: [...p.impulsos.keys()] }, teto, grupos, selecao, ...calcular(selecao, catalogo, ambiente, { teto, porId, avaliados }) };
}

/** Totais e requisitos para uma seleção qualquer (o usuário pode marcar e desmarcar). */
export function calcular(selecao, catalogo, ambiente = {}, ctx = {}) {
  const porId = ctx.porId || Object.fromEntries(catalogo.itens.map((i) => [i.id, i]));
  const desligados = new Set((ctx.avaliados || []).filter((a) => a.desligado).map((a) => a.item.id));
  let mensal = 0, tokens = 0;
  const reqs = new Set();
  for (const id of selecao) {
    const it = porId[id];
    if (!it) continue;
    mensal += it.custo?.mensal_brl || 0;
    if (!desligados.has(id)) tokens += it.tokens_fixos || 0;
    for (const r of it.requisitos || []) reqs.add(r);
  }
  const requisitos = [...reqs].map((r) => porId[r]).filter((r) => r && !instalado(r, ambiente));
  return { totais: { mensal_brl: mensal, tokens_fixos: tokens }, requisitos: requisitos.map((r) => r.id) };
}
