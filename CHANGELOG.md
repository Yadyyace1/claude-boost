# Changelog

## 0.11.0 — 2026-11-27

- **Catálogo com 104 itens.** Entram 5 IAs com MCP oficial: Pollinations (grátis, sem conta), Picsart (140+ modelos), Recraft (imagem e vetor), Magnific (aumentar e refinar) e Civitai (modelos da comunidade). Elas se somam a Higgsfield, PixelLab, Tripo, ElevenLabs, Perplexity e Replicate.
- **boost-criacao (0.3.0), 29 skills.** As novas: `prompt-imagem-video`, `traducao`, `precificacao` e `rotina-semanal`.
- **boost-painel (0.4.0):** **guia de comandos** na barra lateral (conversa, ajustes e Spark; um clique escreve o comando), o comando `/guia` e um botão no painel da página de criar.
- **Docs:** `docs/SERVIDOR-VULTR.md` com a proposta de servidor em São Paulo (para que serve, menor custo e passo a passo). Não foi contratado.

## 0.10.0 — 2026-11-27

- **Catálogo de 84 para 99 itens:**
  - conectores do diretório do Claude: Adobe, Affinity, Ableton, Splice, SketchUp, Squarespace, Tines e Spotify;
  - MCPs oficiais da Meta: WhatsApp Business e Instagram/Facebook;
  - outras IAs e buscas: Perplexity, Replicate, Jina AI e Brave Search;
  - o roteiro "Atendente de IA no WhatsApp".
- **8 áreas novas** (24 no total): imobiliário, fitness, beleza, restaurante, arquitetura, contabilidade, RH, eventos e turismo.
- **boost-criacao (0.2.0), 25 skills.** As novas: `bot-whatsapp` (atendente pela API oficial da Meta + n8n + Claude, com passagem para humano e regras da Meta e da LGPD), `respostas-atendimento`, `proposta-comercial`, `briefing-cliente`, `analise-concorrencia`, `anuncio-imovel`, `cardapio-promocoes` e `planilha-inteligente`.
- **boost-temas (0.2.0):**
  - 3 temas com fundo animado: Aurora, Noite estrelada e Spark (faíscas);
  - **fundo próprio**: do tema, cor, degradê, **foto** (vira mosaico vetorial no navegador; o app não aceita imagens) ou nenhum;
  - **estilo das mensagens**: padrão, bolhas ou cartões.
- **Assistente:** a seção "Fundo e estilo" na Aparência tem prévia ao vivo e a opção de mostrar ou não o painel na página de criar. O servidor só grava o fundo com foto em `~/Spark/fundo.svg` se for um SVG feito de retângulos.

## 0.9.0 — 2026-11-27

- **boost-criacao (0.1.0, novo): Spark: criação**, 17 skills em português:
  - vídeo e roteiro: `roteiro-video`, `roteiro-youtube`, `roteiro-live`;
  - redes sociais: `ideias-conteudo`, `calendario-conteudo`, `legenda-redes`, `carrossel`, `post-linkedin`;
  - texto: `revisar-texto`, `email-profissional`, `copy-vendas`, `artigo-seo`, `resumo-reuniao`;
  - aprender e usar melhor o Claude: `estudo-ativo`, `plano-de-aula`, `melhorar-prompt`, `primeiros-passos`.
- **Assistente: etapa Skills** depois da Personalização. Os cartões vêm marcados conforme a área e as tarefas, com filtros por categoria e "só as recomendadas". As escolhidas são copiadas para `~/.claude/skills`; o plano só aceita ids do índice, nunca um caminho vindo da página.
- **boost-painel (0.3.0):**
  - o painel Hoje aparece na **página de criar**, acima da caixa de mensagem, numa conversa nova: pedido, atalhos, skills de um clique e uso do limite; some quando a conversa começa;
  - a barra lateral ficou mais enxuta e só abre sozinha se a pessoa pedir.
- **Corrigido:** o assistente buscava `ambiente.json` e `respostas.json` sem o código secreto (desde a 0.8.0) e perdia a detecção do que já estava instalado e as respostas pré-preenchidas.

## 0.8.1 — 2026-11-27

- **Erros da instalação corrigidos:**
  - "o termo 'claude' não é reconhecido": o servidor do assistente montava o PATH só pelo registro, e o Claude Code fica em `~\.local\bin`. Agora entram também o `~\.local\bin`, o npm global, o bun e o cargo; e o `Spark.exe` põe o `~\.local\bin` no PATH do usuário se faltar;
  - o núcleo falhava ao registrar o kit pelo GitHub quando o `settings.json` já tem o `claude-boost` em `extraKnownMarketplaces` (o plano pula esse passo com o kit já registrado);
  - num Claude novo, o plano registra antes o catálogo oficial de plugins da Anthropic;
  - o Claude Code tenta instalar de novo se a primeira tentativa falhar.
- **Registro das execuções:** cada comando vai para `execucao.log` na pasta da sessão (`~/.claude/boost-onboarding/<data>`), para diagnosticar sem print.
- **Instaladores no pacote:** `instalador/baixar-pacotes.ps1` baixa o Git, o Node.js LTS e o uv das fontes oficiais (confere o SHA-256) para `pacotes\`; o `Spark.exe` usa esses antes do winget. O uv passou a ser instalado junto com o Git e o Node.
- **Personalização em carrossel:** três cartões, o do meio em destaque e os dos lados menores, com blur e luz baixa; gira pelas setas, pelo teclado, arrastando ou clicando no cartão do lado, e avança sozinho depois de um Spark.

## 0.8.0 — 2026-11-26

- **Nova marca: Spark.** O kit passa a se chamar Spark, com ícone novo (uma faísca âmbar). Os nomes técnicos (`boost-*`, `claude-boost`) continuam iguais, para não quebrar o que já está instalado. As pastas viram `~/Spark/Backups` e `~/Spark/Caixa de entrada`.
- **Instalador `Spark.exe`** redesenhado: cabeçalho com degradê, etapas em cartões com animação de carregamento, botão arredondado, registro em "Ver detalhes" (abre sozinho se der erro). Sai em `Spark - Instalador`.
- **boost-onboarding (0.6.0):**
  - **Aba Personalização** (no lugar do Descobrir): o catálogo inteiro em cartões lado a lado, sem rolar a página; filtros de busca, ordem, origem, tipo, custo, dificuldade e categoria; **vibed** (o quanto combina com você, aprendendo com cada escolha) e **Spark score** (a nota geral); **inventário** à direita com os extras escolhidos, peso no limite e custo.
  - **Catálogo de 52 para 84 itens:** conectores oficiais (Asana, Linear, Atlassian, monday, ClickUp, Box, Fireflies, HubSpot, Intercom, PayPal, Square, Cloudflare, Sentry, Netlify, Webflow, Hugging Face, Zapier) e MCPs (Shopify, Chrome DevTools, Memória, Fetch, Git, Hora, Pensamento em etapas, Desktop Commander, Exa, transcrição do YouTube, ElevenLabs, Apify, Pipedream, WhatsApp não oficial). Os que pedem conferência na hora vêm marcados.
  - **6 áreas novas:** e-commerce, atendimento e vendas, saúde, educação, música e áudio, IA e automação. A área aceita quantas opções a pessoa quiser.
  - **5 níveis de gasto de tokens**, de "economia máxima" ao **modo extremo** (uso total do Claude: teto de 60 mil tokens, o dobro de recomendações e regras no CLAUDE.md para usar o modelo mais capaz e subagentes). No plano grátis, o CLAUDE.md volta para "economizar".
  - **Aparência:** os temas simulam o app do Claude de verdade (barra lateral, conversa, caixa de mensagem e o cenário animado), com prévia grande no claro e no escuro; a tela do assistente assume as cores do tema escolhido.
  - **Instalação:** chat de **suporte** flutuante (dúvidas comuns na hora; perguntas livres vão para o Claude da própria pessoa, sem ferramentas nem conectores); **observações** por item (caixinha que abre o campo; vão para `observacoes.md` da sessão); botões **?** com explicações; tela final **"We got you."**
  - **Tutorial** de boas-vindas (abre na primeira visita e volta pelo ? do topo), **ícones de usuário** e animações com `motion`.
  - **Erros corrigidos:** o "Spark (núcleo)" falhava porque tentava registrar o kit pelo GitHub com o kit local já registrado (agora o plano pula esse passo); `winget` sem os aceites automáticos travava escondido; "já instalado" em português contava como erro; a regra de horas de uso passava por cima do modo extremo no plano Max; JSON com BOM (Bloco de Notas) quebrava o plano.
  - **Segurança:** o servidor local confere o `Host` (contra DNS rebinding), exige o código secreto também nas leituras de dados pessoais, manda cabeçalhos de segurança (CSP, nosniff, sem iframe), compara o código em tempo constante e valida nomes de variável; nomes com aspas curvas não quebram mais o comando do PowerShell.

## 0.7.1 — 2026-11-26

- **Instalador:** agora se chama **Boost.exe**, com ícone próprio (um raio âmbar num quadrado escuro, gerado por `instalador/gerar_icone.py`) no arquivo, na janela e no título. O `montar.ps1` tira da pasta o .exe com o nome antigo.
- **boost-onboarding:** a pergunta "Com o que você trabalha?" aceita quantas áreas a pessoa quiser.

## 0.7.0 — 2026-11-26

- **Instalador para Windows** (`instalador/`): `Instalar Claude Boost.exe`, compilado com o compilador C# que já vem no Windows (`montar.ps1` monta a pasta com o .exe e o kit). Ele:
  - confere e instala o Git, o Node.js e o Claude Code, pedindo confirmação;
  - abre o login (`claude auth login`) se precisar;
  - registra o kit da própria pasta (troca um kit antigo, com confirmação);
  - abre o assistente.
- **boost-onboarding (0.5.0):**
  - **modo instalação** (`scripts/instalar.mjs`, `assistente.mjs --instalar`): depois da confirmação, a página instala tudo com a pessoa:
    - "instalar os automáticos";
    - chaves salvas no computador por um campo protegido (nunca no chat);
    - logins com botão para a página certa;
    - aplicação do CLAUDE.md, com backup;
  - **segurança:** o servidor local só aceita pedidos com o código secreto da execução e só roda comandos do plano gerado por ele.
- **boost-painel (0.2.0):** virou o menu inicial:
  - campo "O que vamos criar hoje?", que envia o pedido;
  - métricas (conversas do dia, projetos, lembretes e uso);
  - projetos recentes;
  - **caixa de arquivos** (`~/Claude Boost/Caixa de entrada`, com "Analisar os arquivos");
  - **Personalizar o Claude** (tema com um clique, modelo, compactar, nova conversa, configurações, conectores, backup e restaurar).
- **boost-backup (0.1.0, novo):** `/backup` e `/restaurar`:
  - guarda settings, CLAUDE.md, memórias, skills, agentes, comandos, mods, marketplaces, plugins e MCPs num arquivo;
  - as chaves viram `${VARIAVEL}`, então o arquivo não expõe segredos;
  - a restauração simula antes, guarda o que sobrescrever e reinstala plugins e MCPs.

## 0.6.0 — 2026-11-25

- **boost-temas (0.1.0, novo):** 7 temas para o app do Claude, feitos como mod (`$.theme.set`):
  - Âmbar, Synthwave, Floresta, Oceano, Caderno, Grafite e Azul Royal, todos claro e escuro (o Synthwave só escuro);
  - Synthwave e Oceano com cenário animado lento (SVG);
  - todas as paletas passam no verificador de contraste do app;
  - `/tema <nome>` troca o tema e salva a escolha; o tema e o cenário também mudam em `/config`.
- **boost-painel (0.1.0, novo):** painel **Hoje** ao lado do chat, para a tela inicial virar um dashboard:
  - saudação com o nome da pessoa;
  - barras do contexto e dos limites de 5 horas e da semana;
  - atalhos de um clique;
  - lembretes salvos entre sessões (`/lembrete`) e dica do dia;
  - `/painel` abre o painel.
- **boost-onboarding (0.4.0):**
  - **Modo claro e escuro** no assistente, com 7 cores de destaque e 4 fundos.
  - **Etapa Aparência:** escolha do tema do Claude com miniaturas reais, do painel Hoje com prévia e atalhos sugeridos pela área, e do visual do assistente.
  - **Etapa Descobrir:** os opcionais em cartas para deslizar, com um algoritmo que aprende com cada escolha.
  - **Plano:** já configura o tema e o painel (`claude plugin configure --values-stdin`).

## 0.5.0 — 2026-11-25

- **boost-onboarding (0.3.0):**
  - **Interface nova** em React + shadcn/ui (Vite, Tailwind v4, ícones lucide), servida já compilada pelo servidor Node.
  - **6 etapas**, com ícone grande e o "por que perguntamos" em cada uma.
  - **Ícones** em todas as opções e chips.
  - **Recomendação:** retrato do perfil, grade "o que o seu Claude vai ganhar", abas, busca, painel de detalhes com os passos de instalação e resumo fixo com barras de orçamento e de tokens.
  - **Revisão** em linha do tempo.
  - **Respostas salvas** no navegador.
  - **Etapa nova "Seu Claude hoje"** (onde usa, plano, experiência com o Claude Code, horas por dia, equipe, idioma, autonomia e objetivo para os próximos 30 dias): o plano e as horas ajustam a economia de tokens, e idioma, autonomia, equipe e objetivo entram no CLAUDE.md pessoal.
  - **Área "Streaming e lives":** OBS, Twitch CLI, cortes da live, overlays, VTuber e Blender.
  - **Perfis prontos** (`--respostas`).

## 0.4.0 — 2026-11-25

- **boost-onboarding (0.1.0, novo):** onboarding guiado para vender como serviço. A skill `/onboarding` detecta o PC e abre um assistente local no navegador (tema escuro, 3 etapas de perguntas). Um algoritmo explicável recomenda, entre 43 itens do catálogo, os conectores, plugins, MCPs e instaladores certos para a pessoa, com custo por mês, peso em tokens e o "por quê" de cada um. A pessoa ajusta a seleção, e o Claude gera o plano de instalação e o CLAUDE.md pessoal e instala item por item, com OK e sem segredos no chat. A marca é trocável em `dados/marca.json`.

## 0.3.0 — 2026-11-25

Material novo, escrito com as nossas palavras a partir de referências que o João juntou.

- **boost-ads (0.1.0, novo):** módulo de tráfego pago na Meta com 7 skills: `diagnostico-campanha` (acha o primeiro gargalo do funil e decide escalar, manter, ajustar ou pausar), `metas-trafego` (CPA máximo, ROAS de equilíbrio, CPL, custo por conversa e 3 cenários), `estrutura-campanha` (modelos, protocolo de teste, checklist pré-lançamento, padrão de nomes), `criativos-ads` (matriz de 5 dimensões, 8 a 12 conceitos), `copy-anuncio` (5 variações por ângulo), `auditor-politicas` (semáforo de risco pela Meta e pelo Provimento 205/2021 da OAB) e `relatorio-cliente` (com versão para WhatsApp). O README do módulo ensina a ligar o MCP oficial da Meta.
- **boost-base (0.3.0):** skill `checagem-lancamento`, com 20 verificações de segurança antes de publicar um app, e indicação do plugin oficial `claude-security` e do `/security-review`. O `/diagnostico` e a skill `conectores` passam a citar o boost-ads e o conector da Meta.
- **boost-web (0.2.0):** skill `referencias-ui` (Bencho, MicroKit, Godly, regras de microinteração) e o pstack como opcional de terceiros.
- **boost-design (0.3.0):** skill `game-juice` (as 8 etapas de um golpe com impacto) usando o `vfx_workbench` do PixelLab.
- **Docs:** guia de instalação com o boost-ads.

## 0.2.0 — 2026-11-25

Ferramentas testadas na máquina do João. Cada pessoa instala as suas: elas não vêm embutidas no kit.

- **boost-base (0.2.0):** a skill `economia-tokens` e o guia passam a recomendar o **ccusage** (medir antes e depois), o **rtk** (saída de comandos 52% menor no `git log`/`git diff`; reiniciar o app depois de instalar) e o **Graphify** (`/graphify .` em projetos grandes). Nova seção sobre mods (a skill `plugin-authoring`; nome de plugin não pode começar com `claude-`).
- **boost-video (0.2.0):** auto-editor (cortar silêncio, conferir o SHA-256), plugin oficial **HyperFrames** (cerca de 2,7 mil tokens fixos por sessão, como desligar, telemetria, fontes que passam no lint), o kit grátis auto-editor + Whisper + HyperFrames + pasta de marca, e voz clonada local (Chatterbox Multilingual).
- **boost-design (0.2.0):** fluxo 3D opcional com Tripo + Three.js + HyperFrames (a API é paga; no plano grátis os modelos são públicos e sem uso comercial).
- **Docs:** o roteiro e a ficha de cliente registram o consumo pelo `ccusage daily`, antes e depois.

## 0.1.0 — 2026-11-25

Primeira versão.

- **boost-base:** skills `economia-tokens`, `setup-windows`, `conectores`; comandos `/diagnostico` (onboarding + CLAUDE.md pessoal) e `/boost-setup` (checagem + status line); status line sem dependências (`scripts/statusline.sh`); MCP context7.
- **boost-design:** Photopea e PixelLab (chave opcional via `claude plugin configure`), skill `fluxo-design`.
- **boost-video:** skill `receitas-video` (FFmpeg + Whisper local).
- **boost-web:** Playwright e Chrome DevTools, skills `testar-site` e `deploy-vercel`.
- **boost-dados:** TradingView, skills `planilhas-relatorios` e `analise-mercado`.
- Docs: guia de instalação, roteiro de consultoria, modelo de ficha de cliente.
