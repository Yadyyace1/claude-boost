---
name: boost-setup
description: Checagem e configuração inicial do Spark na máquina — confere git, node e uv, instala a status line (contexto, limite de 5h e da semana) e lista os MCPs ligados. Use quando o usuário digitar /boost-setup ou pedir para "configurar o kit", "instalar a status line" ou "ver se está tudo certo".
argument-hint: "[statusline | checar]"
disable-model-invocation: true
---

# Setup do Spark

Argumento recebido: $ARGUMENTS (vazio = fazer tudo; `statusline` = só a status line; `checar` = só a checagem, sem alterar nada).

## 1. Checagem (só leitura)

Rode e mostre um quadro com ✅/❌:

- `git --version` — necessário (o Claude Code no Windows usa o Git Bash).
- `node --version` — necessário para MCPs via `npx` (boost-web, boost-design).
- `uv --version` — necessário para MCPs via `uvx` (boost-dados) e scripts Python.
- `ffmpeg -version` — só para quem usa o boost-video.
- `claude mcp list` — lista os MCPs e se estão conectados.

Para o que faltar, mostre o comando de instalação (winget) e **peça autorização antes de instalar**. Pegadinhas do Windows: ver a skill `setup-windows`.

## 2. Status line

Plugin não consegue ligar a status line sozinho: ela é configurada no `~/.claude/settings.json` do usuário. Faça assim:

1. Copie o script do plugin para um lugar fixo (o caminho do plugin muda a cada versão):

   ```bash
   cp "${CLAUDE_PLUGIN_ROOT}/scripts/statusline.sh" ~/.claude/boost-statusline.sh
   ```

2. Leia o `~/.claude/settings.json`. Se já existir uma chave `statusLine`, mostre qual é e pergunte se pode substituir.
3. Mostre exatamente o que vai mudar e **espere a confirmação**. Faça backup antes (`settings.json.bak-<data>`).
4. Grave, preservando todo o resto do arquivo:

   ```json
   "statusLine": {
     "type": "command",
     "command": "bash ~/.claude/boost-statusline.sh"
   }
   ```

5. Explique a linha: `modelo │ pasta │ ctx 42% │ 5h 23% │ sem 61%`.
   - **ctx**: quanto da janela de contexto a sessão ocupa (verde < 50%, amarelo < 80%, vermelho acima: hora de `/compact` ou `/clear`).
   - **5h / sem**: quanto do limite do plano (janela de 5 horas e da semana) já foi usado.
   - Em quem usa API (sem plano), aparece o custo da sessão em US$ no lugar dos limites.
   - A status line aparece no Claude Code do terminal; o app desktop tem o próprio indicador de uso.

## 3. Fechamento

Resuma o que está ok, o que foi alterado (com o caminho do backup) e o que falta. Sugira o `/boost-base:diagnostico` se a pessoa ainda não tem um CLAUDE.md pessoal.
