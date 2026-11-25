---
name: diagnostico
description: Entrevista de onboarding do Claude Boost — entende quem é a pessoa e como ela trabalha, recomenda os módulos do kit e gera o CLAUDE.md pessoal dela (~/.claude/CLAUDE.md). Use quando o usuário digitar /diagnostico ou pedir para "configurar o Claude para mim", "fazer o onboarding" ou "montar meu CLAUDE.md".
argument-hint: "[observações iniciais, opcional]"
disable-model-invocation: true
---

# Diagnóstico de onboarding

Objetivo: em uns 10 minutos de conversa, sair com (1) os módulos do kit que valem para a pessoa e (2) um `~/.claude/CLAUDE.md` pessoal curto, que faz o Claude já começar toda sessão sabendo quem ela é.

Observações iniciais passadas pelo usuário: $ARGUMENTS

## 1. Entrevista

Pergunte em blocos curtos (no máximo 3 perguntas por mensagem), em linguagem simples, e adapte ao que a pessoa responder:

1. **Quem é:** nome como quer ser chamada, profissão/área, nível com tecnologia (nunca programou / usa planilha / programa).
2. **O que faz no dia a dia:** as 3 tarefas que mais tomam tempo e que gostaria de delegar.
3. **Ferramentas:** e-mail (Gmail/Outlook), agenda, onde guarda documentos (Drive, Notion, Obsidian), redes sociais, programas de design/vídeo, planilhas.
4. **Como gosta de receber respostas:** idioma, curtas ou detalhadas, tom (formal/informal).
5. **Limites:** o que o Claude nunca deve fazer sem perguntar (enviar e-mail, apagar arquivo, gastar dinheiro, instalar programa).
6. **Plano:** usa o Claude Pro, Max ou API? (muda o quanto vale economizar tokens).

## 2. Recomendação de módulos

Com base nas respostas, recomende só o que ela vai usar (cada módulo ligado ocupa contexto):

| Módulo | Para quem |
|---|---|
| `boost-design` | edita imagem, faz arte, posts, pixel art |
| `boost-video` | corta, legenda ou monta vídeo |
| `boost-web` | tem site, testa páginas, faz deploy |
| `boost-dados` | planilhas, relatórios, acompanha mercado |

Mostre o comando de cada um: `claude plugin install <modulo>@claude-boost`. Sugira também os conectores do app que fazem sentido (ver a skill `conectores`).

## 3. CLAUDE.md pessoal

Monte um rascunho com **no máximo umas 40 linhas**, neste formato:

```markdown
# Sobre mim
- <nome>, <área>. <nível com tecnologia>.
- Ferramentas: <lista curta>.

# Como responder
- Idioma: <...>. Tom: <...>. Tamanho: <...>.

# Minhas tarefas frequentes
- <tarefa 1>: <como prefere que seja feita>
- ...

# Limites
- Sempre perguntar antes de: <...>.
```

**Mostre o rascunho completo e espere a confirmação** antes de gravar. Se já existir um `~/.claude/CLAUDE.md`, mostre o que existe, proponha juntar e faça um backup (`CLAUDE.md.bak-<data>`) antes de alterar. Nunca apague o conteúdo antigo sem o OK.

## 4. Fechamento

Termine com: o que foi instalado/configurado, o que ficou pendente (conectores para autorizar, programas para instalar) e **uma tarefa real** da lista dela para fazer agora, juntos, como primeiro teste.
