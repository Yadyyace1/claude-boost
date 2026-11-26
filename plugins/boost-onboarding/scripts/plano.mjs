// Transforma a seleção confirmada no assistente num plano de instalação passo a passo
// e num CLAUDE.md pessoal sugerido.
// Uso: node scripts/plano.mjs <pasta-da-sessao>   (lê selecao.json e ambiente.json; grava plano.md, plano.json e claude-md-sugerido.md)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = process.argv[2];
if (!pasta || !existsSync(join(pasta, "selecao.json"))) { console.error("uso: node scripts/plano.mjs <pasta com selecao.json>"); process.exit(1); }
const ler = (f) => JSON.parse(readFileSync(f, "utf8"));
const catalogo = ler(join(raiz, "dados", "catalogo.json"));
const perguntas = ler(join(raiz, "dados", "perguntas.json"));
const sel = ler(join(pasta, "selecao.json"));
const amb = existsSync(join(pasta, "ambiente.json")) ? ler(join(pasta, "ambiente.json")) : {};
const so = sel.sistema || amb.sistema || "win";
const porId = Object.fromEntries(catalogo.itens.map((i) => [i.id, i]));

// Ordem: requisitos → instaláveis por comando → itens com segredo/login → passos manuais/conectores.
const ORDEM = { requisito: 0, plugin: 1, mcp: 1, cli: 1, app: 1, conector: 3, nativo: 4 };
const peso = (it) => (ORDEM[it.tipo] ?? 2) + ((it.passos || []).some((p) => p.tipo === "segredo") ? 1.5 : 0);
const ids = [...new Set([...(sel.requisitos || []), ...sel.selecao])].filter((id) => porId[id]);
const itens = ids.map((id) => porId[id]).sort((a, b) => peso(a) - peso(b));
const desligados = new Set(sel.desligados || []);

const plano = itens.map((it, n) => ({
  ordem: n + 1, id: it.id, nome: it.nome, tipo: it.tipo, resumo: it.resumo,
  desligar_depois: desligados.has(it.id) && it.tipo === "plugin" ? `claude plugin disable ${it.detectar?.plugin || it.id}` : null,
  aviso: it.aviso || null, conferir: !!it.verificar,
  passos: (it.passos || []).map((p) => ({ tipo: p.tipo, comando: p[so] || p.win || null, texto: p.texto || null, variavel: p.var || null, nota: p.nota || null })),
}));

// Aparência escolhida no assistente: configura o tema e o painel logo depois de instalar.
const r = sel.respostas || {};
const ap = r.aparencia || {};
function configurar(plugin, valores) {
  const json = JSON.stringify(valores);
  const comando = so === "win"
    ? `'${json.replace(/'/g, "''")}' | claude plugin configure ${plugin} --values-stdin`
    : `printf '%s' '${json.replace(/'/g, "'\\''")}' | claude plugin configure ${plugin} --values-stdin`;
  return { tipo: "cmd", comando, texto: null, variavel: null, nota: "grava as escolhas da etapa Aparência" };
}
for (const p of plano) {
  if (p.id === "boost-temas" && ap.tema) p.passos.push(configurar("boost-temas@claude-boost", { tema: ap.tema, cenario: ap.cenario !== false }));
  if (p.id === "boost-painel") {
    p.passos.push(configurar("boost-painel@claude-boost", {
      nome: typeof r.nome === "string" ? r.nome : "",
      abrir: ap.abrirPainel !== false,
      atalhos: (ap.atalhos || []).join("|") || undefined,
    }));
  }
}
writeFileSync(join(pasta, "plano.json"), JSON.stringify({ sistema: so, itens: plano }, null, 2) + "\n");

const rotulos = (qid) => {
  for (const e of perguntas.etapas) for (const q of e.perguntas) if (q.id === qid && q.opcoes)
    return [].concat(r[qid] ?? []).map((v) => q.opcoes.find((o) => o.valor === v)?.rotulo).filter(Boolean);
  return [];
};

let md = `# Plano de instalação${r.nome ? ` de ${r.nome}` : ""}\n\nSistema: **${so === "win" ? "Windows" : so === "mac" ? "macOS" : "Linux"}** · ${plano.length} itens · custo extra estimado **R$ ${sel.totais?.mensal_brl ?? 0}/mês** · peso **${sel.totais?.tokens_fixos ?? 0}** tokens por sessão (limite escolhido: ${sel.teto_tokens}).\n\n`;
md += `Regras: confirmar com a pessoa antes de cada item; **segredo nunca passa pelo chat** (a pessoa cola a chave no próprio terminal); no Windows, comandos \`claude mcp add\` sempre pelo PowerShell.\n\n`;
for (const p of plano) {
  md += `## ${p.ordem}. ${p.nome}\n${p.resumo}\n\n`;
  for (const s of p.passos) {
    if (s.tipo === "cmd") md += `- Rodar: \`${s.comando}\`${s.nota ? ` (${s.nota})` : ""}\n`;
    else if (s.tipo === "segredo") md += `- **Segredo \`${s.variavel}\`:** ${s.texto} A pessoa salva com: \`[Environment]::SetEnvironmentVariable("${s.variavel}", "COLE_AQUI", "User")\` (Windows) ou no \`~/.zshrc\` (mac).\n`;
    else if (s.tipo === "login") md += `- Login: ${s.texto}\n`;
    else md += `- ${s.texto}\n`;
  }
  if (p.desligar_depois) md += `- Depois de instalar, deixar desligado até precisar: \`${p.desligar_depois}\`\n`;
  if (p.aviso) md += `- ⚠ ${p.aviso}\n`;
  if (p.conferir) md += `- ⚠ Conferir os comandos na documentação atual antes de rodar.\n`;
  md += `\n`;
}
writeFileSync(join(pasta, "plano.md"), md);

const areas = rotulos("area"), tarefas = rotulos("tarefas"), ferramentas = rotulos("ferramentas");
const instalados = plano.filter((p) => p.tipo !== "requisito").map((p) => p.nome);
let cm = `# Sobre mim\n\n`;
const IDIOMA = { pt: "português do Brasil", en: "inglês", es: "espanhol" };
if (r.nome) cm += `- Me chame de **${r.nome}**.\n`;
cm += `- Responda em ${IDIOMA[r.idioma] || IDIOMA.pt}.\n`;
if (r.objetivo) cm += `- Meu objetivo para os próximos 30 dias: ${r.objetivo}. Quando fizer sentido, sugira passos que me aproximem dele.\n`;
const juntar = (l) => (l.length > 1 ? `${l.slice(0, -1).join("; ")}; e ${l.at(-1)}` : l[0]);
if (areas.length) cm += `- Trabalho com: ${juntar(areas).toLowerCase()}.\n`;
if (tarefas.length) cm += `- O que mais peço: ${tarefas.join(", ").toLowerCase()}.\n`;
if (ferramentas.length) cm += `- Ferramentas que uso: ${ferramentas.join(", ")}.\n`;
cm += r.estilo === "curtas" ? `- Prefiro respostas curtas e diretas, sem rodeio.\n` : `- Prefiro respostas explicadas passo a passo, sem jargão.\n`;
if (r.nivel === "1" || r.experiencia === "nunca") cm += `- Sou novo no Claude Code: antes de rodar algo no meu computador, diga em uma frase o que aquilo faz.\n`;
const AUTONOMIA = {
  cauteloso: "Peça confirmação antes de qualquer ação que mude arquivos ou rode comandos.",
  equilibrado: "Pode ler e investigar à vontade; peça confirmação para o que for arriscado ou difícil de desfazer.",
  solto: "Pode agir sem me perguntar em tarefas rotineiras e me avise do que fez; pergunte só antes de apagar, publicar ou gastar dinheiro.",
};
if (AUTONOMIA[r.autonomia]) cm += `- Autonomia: ${AUTONOMIA[r.autonomia]}\n`;
if (r.equipe === "pequena" || r.equipe === "empresa") cm += `- Trabalho em equipe: escreva mensagens, documentos e commits de um jeito que outras pessoas entendam sem contexto.\n`;
if (r.sensivel === "sim" || [].concat(r.area || []).includes("juridico")) cm += `- Lido com dados sigilosos: nunca envie dados de clientes para serviços de terceiros sem me perguntar, e não cole dados pessoais em buscas na web.\n`;
if ([].concat(r.area || []).includes("juridico")) cm += `- Em textos jurídicos, cite a fonte (lei, artigo, súmula) e avise quando algo precisar de conferência humana. Em publicidade de advocacia, siga o Provimento 205/2021 da OAB.\n`;
const economiaAlta = r.economia === "alta" || r.plano === "free";
cm += `- Economia de uso: ${economiaAlta ? "meu limite acaba rápido; prefira o modelo mais barato que resolva e respostas enxutas" : "equilibre qualidade e consumo"}.\n`;
cm += `\n# Ferramentas instaladas no onboarding\n\n${instalados.map((n) => `- ${n}`).join("\n")}\n`;
writeFileSync(join(pasta, "claude-md-sugerido.md"), cm);

console.log(md);
console.log("---- CLAUDE.md sugerido ----\n" + cm);
