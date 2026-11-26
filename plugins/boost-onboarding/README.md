# boost-onboarding

Onboarding guiado do Claude, para vender como serviço: o cliente responde a um assistente no navegador, recebe uma recomendação personalizada de conectores, plugins e instaladores, e o Claude instala tudo junto com ele.

```
/onboarding
```

## Como funciona

1. **Detecta o PC** (`scripts/detectar.mjs`): sistema, programas (Node, uv, Git, Bun, FFmpeg...), plugins e MCPs já instalados. Só lê; não grava segredos.
2. **Assistente no navegador** (`scripts/assistente.mjs` + `app/`): servidor Node local em `127.0.0.1`, que serve o app React + shadcn/ui já compilado (`app/dist`) em tema escuro. São 6 etapas:
   - **Sobre você**, **Seu dia a dia**, **Seu Claude hoje** e **Preferências**: 19 perguntas (`dados/perguntas.json`), com cartões e chips com ícone, um ícone grande por etapa e o "por que perguntamos";
   - **Recomendação**: retrato do perfil, grade "o que o seu Claude vai ganhar" por categoria, abas (sugestão, opcionais, fora do orçamento, selecionados), busca, cartões com o porquê e um painel de detalhes com os passos exatos da instalação, mais o resumo fixo com barras de orçamento e de tokens;
   - **Revisão**: linha do tempo de quem faz o quê (o Claude instala, você faz login, você cola uma chave, já vem no Claude).

   As respostas ficam salvas no navegador. A confirmação grava `selecao.json`. Se `app/dist` não existir, o servidor usa a página simples `assistente/index.html`.
3. **Plano** (`scripts/plano.mjs`): passos em ordem, com os comandos do sistema da pessoa, mais o `CLAUDE.md` pessoal sugerido.
4. **Instalação** (skill `onboarding`): o Claude segue o plano item por item, com OK, sem pedir segredos no chat.

## O algoritmo de recomendação (`assistente/recomendar.mjs`)

O mesmo código roda no navegador e no Node. Ele é determinístico e explicável:

1. **Vetor de interesse.** Cada resposta soma pesos em etiquetas (`ads`, `docs`, `dev`, `video`...). Ex.: "Marketing e tráfego" → `marketing +3, ads +3, social +2, escrita +1`.
2. **Nota de cada item** = Σ (interesse da pessoa × peso da etiqueta no item)
   - **+6** se ela já usa a ferramenta ("você já usa Canva")
   - **+8** se o item é essencial (núcleo do kit)
3. **Multiplicadores de personalização:**
   - preferência local × nuvem (×0,75 para nuvem quando ela quer local);
   - nível técnico: item 1 nível acima ×0,75; item 2 níveis acima ×0,45, e nunca entra como "recomendado";
   - dados sigilosos: item não oficial ×0,6 (os itens do próprio kit não são penalizados);
   - orçamento zero: item pago ×0,3.
4. **Grupos:** essenciais; recomendados (nota ≥ 6, no máximo 10); opcionais (nota ≥ 2,5); fora do orçamento (pago e não cabe no R$/mês escolhido; o orçamento é gasto do item de maior nota para o de menor).
5. **Limite de tokens:** "economizar muito / equilibrado / pouco" vira um teto de 3.000 / 7.000 / 15.000 tokens fixos por sessão. Os recomendados que estouram o teto são instalados **desligados até precisar**.
6. **Requisitos:** Node, uv, Bun etc. entram sozinhos quando algum item escolhido precisa e o PC não tem.
7. **Motivos:** cada cartão mostra o "por quê" (as 2 etiquetas que mais pesaram + "você já usa X") e o principal aviso.

Para testar sem navegador:

```
node scripts/simular.mjs                         # 3 perfis de exemplo
node scripts/simular.mjs respostas.json ambiente.json
```

## Perfis prontos

`dados/perfis/*.json` traz respostas prontas por tipo de cliente (ex.: `streamer-dev.json`, para streamer que programa: Twitch, OBS, VTuber). O consultor copia, ajusta o nome e passa com `--respostas` para o assistente abrir já marcado. Os perfis de clientes reais ficam fora do repositório (ficha do cliente).

Área de **Streaming e lives** no catálogo: OBS (MCP de comunidade, via WebSocket), Twitch CLI (oficial), cortes da live (VOD → Shorts com auto-editor, Whisper e HyperFrames), overlays e alertas em HTML para o OBS, VTuber (modelo VRM + controle por VMC/OSC no VSeeFace ou no Warudo) e Blender.

## Mexer na interface (para quem mantém o kit)

O app fica em `app/` (Vite + React + TypeScript + Tailwind v4 + shadcn/ui, ícones lucide). O cliente **não** compila nada: o `app/dist` vai junto no repositório.

```
cd app
npm.cmd install          # no Windows, npm.cmd (o npm.ps1 é bloqueado no PowerShell 5.1)
npm.cmd run build        # gera app/dist; commitar o dist junto
```

Para desenvolver com recarga automática, suba o servidor de dados (`node scripts/assistente.mjs --saida <pasta> --porta 47330 --sem-abrir`) e, em outro terminal, `npm.cmd run dev` dentro de `app/` (o Vite repassa `/dados`, `/ambiente.json`, `/respostas.json` e `/confirmar` para a porta 47330). O algoritmo (`assistente/recomendar.mjs`) é o mesmo do Node: o app importa pelo alias `@motor`.

Componentes: `src/components/Pergunta.tsx` (cartões, chips, faixa), `Recomendacao.tsx`, `ItemCard.tsx`, `ItemDetalhes.tsx` (painel lateral), `Resumo.tsx`, `Revisao.tsx` (linha do tempo), `Visuais.tsx` (perfil e categorias). Ícones das opções e das categorias: `src/lib/icones.tsx`.

## Personalizar para vender (marca própria)

- `dados/marca.json`: nome, subtítulo, cor de destaque, nome do consultor e texto do rodapé. É a única coisa que muda para outra marca.
- `dados/catalogo.json`: os itens. Cada um tem `resumo` (uma frase, linguagem simples), `custo`, `tokens_fixos` (meça com `claude plugin details`), `sinais` (as etiquetas e os pesos), `requisitos`, `detectar` e `passos` (`cmd` com `win`/`mac`, `segredo`, `login`, `manual`). `verificar: true` marca os passos que o Claude confere antes de rodar.
- `dados/perguntas.json`: as perguntas e as etiquetas de cada resposta. Uma área nova (ex.: "Saúde") é só uma opção com os seus `sinais`.

## Manutenção do catálogo

- Revisar preços e comandos a cada mês: serviços mudam de plano e de URL.
- Plugins oficiais: `claude plugin details <plugin>@claude-plugins-official` dá o peso real em tokens.
- Repositório privado: o cliente precisa de convite no GitHub para `claude plugin marketplace add Yadyyace1/claude-boost`.
