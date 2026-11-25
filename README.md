# Claude Boost

Kit para turbinar o **Claude Code**: o que já foi testado e funciona, num pacote só. Ele traz práticas para gastar menos tokens, um setup no Windows sem dor de cabeça, os conectores que valem a pena e módulos prontos por perfil de uso.

É um *marketplace* de plugins do Claude Code: você adiciona uma vez e recebe as melhorias com um comando.

## O que vem no kit

| Plugin | Para quem | O que traz |
|---|---|---|
| **boost-base** | todo mundo | economia de tokens, setup no Windows, `/diagnostico` (onboarding + CLAUDE.md pessoal), `/boost-setup` (checagem + status line), guia de conectores, MCP context7 |
| **boost-design** | quem faz arte, posts, pixel art | Photopea (grátis) + PixelLab (chave própria), fluxo de design |
| **boost-video** | quem edita vídeo | receitas de FFmpeg, legendas, transcrição com Whisper local |
| **boost-web** | quem tem site | Playwright + Chrome DevTools, testar site, deploy na Vercel |
| **boost-dados** | planilhas, relatórios, mercado | planilhas e relatórios, TradingView (não é recomendação de investimento) |

Instale **só os módulos que você usa**: cada um ligado ocupa contexto (= tokens).

## Instalar

Pré-requisitos e passo a passo completo no [guia de instalação](docs/GUIA-INSTALACAO.md). Resumo, no PowerShell:

```powershell
claude plugin marketplace add <usuario-do-github>/claude-boost
```

```powershell
claude plugin install boost-base@claude-boost
```

Depois, dentro do Claude Code:

```
/boost-base:boost-setup
/boost-base:diagnostico
```

Módulos opcionais:

```powershell
claude plugin install boost-design@claude-boost
```

(troque por `boost-video`, `boost-web` ou `boost-dados`).

## Atualizar

```powershell
claude plugin marketplace update claude-boost
```

## Segurança

- **Nenhuma chave ou senha fica neste repositório.** Cada pessoa usa as próprias contas; chaves (como a do PixelLab) são pedidas pelo `claude plugin configure` e guardadas no armazenamento seguro da máquina.
- As skills mandam o Claude **perguntar antes** de instalar programas, enviar mensagens, gastar crédito ou alterar configurações.

## Estrutura

```
.claude-plugin/marketplace.json   catálogo dos plugins
plugins/<plugin>/                 cada plugin: .claude-plugin/plugin.json, skills/, .mcp.json
docs/                             guia de instalação, roteiro de consultoria, modelo de ficha
```
