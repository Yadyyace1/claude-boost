# Changelog

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
