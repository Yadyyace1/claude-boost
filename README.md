# Spark

Kit para turbinar o **Claude Code**: o que já foi testado e funciona, num pacote só. Ele traz práticas para gastar menos tokens, um setup no Windows sem dor de cabeça, os conectores que valem a pena e módulos prontos por perfil de uso.

É um *marketplace* de plugins do Claude Code: você adiciona uma vez e recebe as melhorias com um comando.

## O que vem no kit

| Plugin | Para quem | O que traz |
|---|---|---|
| **boost-base** | todo mundo | economia de tokens (ccusage, rtk, Graphify), setup no Windows, `/diagnostico` (onboarding + CLAUDE.md pessoal), `/boost-setup` (checagem + status line), guia de conectores, checagem de segurança pré-lançamento, MCP context7 |
| **boost-design** | quem faz arte, posts, pixel art, jogos | Photopea (grátis) + PixelLab (chave própria), fluxo de design, 3D opcional (Tripo), game juice |
| **boost-video** | quem edita vídeo | receitas de FFmpeg, legendas, transcrição com Whisper local, auto-editor, HyperFrames |
| **boost-web** | quem tem site | Playwright + Chrome DevTools, testar site, deploy na Vercel, referências de UI |
| **boost-dados** | planilhas, relatórios, mercado | planilhas e relatórios, TradingView (não é recomendação de investimento) |
| **boost-ads** | quem gerencia tráfego pago | Meta Ads: diagnóstico, metas, estrutura, criativos, copy, auditor de políticas (Meta + OAB) e relatório; [como ligar o conector da Meta](plugins/boost-ads/README.md) |
| **boost-onboarding** | quem está começando | `/onboarding`: assistente no navegador que pergunta como você trabalha, recomenda e instala tudo |
| **boost-temas** | todo mundo | 7 temas para o app do Claude (claro e escuro, dois com fundo animado): `/tema` |
| **boost-painel** | todo mundo | o menu inicial **Hoje** ao lado do chat: pedido, métricas, projetos, caixa de arquivos, personalização e lembretes |
| **boost-backup** | todo mundo | `/backup` e `/restaurar`: as suas configurações num arquivo, para trocar de plano ou de conta sem perder nada |
| **boost-criacao** | todo mundo | 17 skills em português: roteiro de vídeo e de live, ideias e calendário de conteúdo, legendas, carrossel, LinkedIn, revisão de texto, e-mails, texto de vendas, artigo SEO, ata de reunião, estudo ativo, plano de aula, melhorar o pedido e primeiros passos |

Instale **só os módulos que você usa**: cada um ligado ocupa contexto (= tokens).

## Instalar sem terminal (Windows)

Na pasta **Spark - Instalador** (montada por `instalador/montar.ps1`), dê dois cliques em **Spark.exe** (o ícone da faísca). Ele:

1. confere o Git e o Node.js e instala o que faltar;
2. instala o Claude Code;
3. abre o login;
4. registra o kit da própria pasta;
5. abre o assistente no navegador, que recomenda e instala tudo.

Você só confirma e entra nas suas contas. Um `perfil.json` ao lado do .exe deixa as respostas pré-preenchidas. O programa ainda não tem assinatura digital: na primeira vez o Windows pede **Mais informações → Executar assim mesmo**.

## Instalar no Mac

No zip **Spark - Instalador Mac**, clique com o botão direito em **Spark.command** → Abrir (na primeira vez; depois, dois cliques). Ele instala o Homebrew, o Git, o Node.js, o uv e o Claude Code se faltarem, abre o login, registra o kit e abre o assistente. O zip é montado por `uv run instalador/montar_mac.py`.

## Instalar pelo terminal

Pré-requisitos e passo a passo completo no [guia de instalação](docs/GUIA-INSTALACAO.md). Resumo, no PowerShell:

```powershell
claude plugin marketplace add Yadyyace1/spark
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

(troque por `boost-video`, `boost-web`, `boost-dados` ou `boost-ads`).

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
