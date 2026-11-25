// Simula a recomendação para perfis de exemplo, sem abrir o navegador.
// Uso: node scripts/simular.mjs [arquivo-de-respostas.json] [ambiente.json]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { recomendar } from "../assistente/recomendar.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (f) => JSON.parse(readFileSync(f, "utf8"));
const catalogo = ler(join(raiz, "dados", "catalogo.json"));
const perguntas = ler(join(raiz, "dados", "perguntas.json"));

const EXEMPLOS = {
  "João (jogos + dev, avançado)": {
    nome: "João", area: ["jogos", "dev"], tarefas: ["imagens", "programar", "redes", "automatizar"],
    ferramentas: ["github", "supabase", "vercel", "notion", "obsidian", "figma", "telegram"],
    nivel: "3", preferencia: "misto", orcamento: 275, economia: "alta", sensivel: "nao", remoto: "sim", estilo: "curtas",
  },
  "Bia (tráfego para advocacia, intermediária)": {
    nome: "Bia", area: ["marketing", "juridico"], tarefas: ["anuncios", "escrever", "planilhas", "redes"],
    ferramentas: ["metaads", "gdrive", "gmail", "canva"],
    nivel: "2", preferencia: "misto", orcamento: 50, economia: "media", sensivel: "sim", remoto: "nao", estilo: "explicadas",
  },
  "Iniciante genérico (gestão)": {
    nome: "Ana", area: ["gestao"], tarefas: ["agenda", "escrever", "planilhas"], ferramentas: ["gmail", "gcal"],
    nivel: "1", preferencia: "nuvem", orcamento: 0, economia: "media", sensivel: "nao", remoto: "nao", estilo: "explicadas",
  },
};

const casos = process.argv[2] ? { [process.argv[2]]: ler(process.argv[2]) } : EXEMPLOS;
const ambiente = process.argv[3] ? ler(process.argv[3]) : {};
for (const [nome, resp] of Object.entries(casos)) {
  const r = recomendar(resp, catalogo, perguntas, ambiente);
  console.log(`\n=== ${nome}  (teto ${r.teto} tokens)`);
  for (const g of ["essenciais", "recomendados", "opcionais", "fora_orcamento"]) {
    if (!r.grupos[g].length) continue;
    console.log(`  [${g}]`);
    for (const a of r.grupos[g]) {
      const extra = [a.desligado ? "DESLIGADO ATÉ PRECISAR" : "", a.instalado ? "JÁ INSTALADO" : ""].filter(Boolean).join(" ");
      console.log(`    ${String(a.nota).padStart(5)}  ${a.item.nome}${extra ? "  <" + extra + ">" : ""}  — ${a.motivos.join("; ")}${a.avisos.length ? "  ⚠ " + a.avisos[0] : ""}`);
    }
  }
  console.log(`  requisitos: ${r.requisitos.join(", ") || "nenhum"}  |  R$ ${r.totais.mensal_brl}/mês  |  ${r.totais.tokens_fixos} tokens fixos`);
}
