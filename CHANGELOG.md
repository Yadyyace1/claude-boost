# Changelog

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
