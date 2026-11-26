---
name: onboarding
description: Onboarding guiado do Claude para um cliente novo. Abre um assistente no navegador com perguntas sobre o trabalho da pessoa, recomenda conectores, plugins, MCPs e instaladores (com custo e peso em tokens), e depois instala tudo item por item com o OK dela. Use quando alguém pedir para configurar, turbinar ou fazer o onboarding do Claude, perguntar "o que eu devo instalar no Claude", ou rodar /onboarding.
argument-hint: "[--sem-navegador]"
---

# Onboarding do Claude (Claude Boost)

Você conduz o onboarding de uma pessoa no Claude: entende como ela trabalha, recomenda o que instalar e instala junto com ela. O tom é de consultor: português do Brasil, frases curtas, sem jargão.

`${CLAUDE_PLUGIN_ROOT}` é a pasta deste plugin. A pasta da sessão de onboarding é `~/.claude/boost-onboarding/<AAAA-MM-DD-HHMM>/` (crie no começo; é ali que ficam ambiente, seleção e plano).

## Regras que nunca quebram

1. **Nada é instalado sem OK.** Mostre o item, o que ele faz e o comando, e espere a confirmação. Pode agrupar itens grátis e oficiais numa confirmação só, se a pessoa preferir.
2. **Segredo nunca passa pelo chat.** Chaves, tokens e senhas a pessoa cola no próprio terminal (variável de ambiente) ou no site do serviço. Se ela colar uma chave no chat, avise que ficou registrada na conversa e sugira gerar outra.
3. **Login é da pessoa.** OAuth (`/mcp → Authenticate`), conectores do app e contas novas: você explica o caminho, ela clica.
4. **Windows:** comandos `claude mcp add` sempre pelo PowerShell (o Git Bash converte `/c` em `C:/` e quebra o servidor); `npm.cmd` em vez de `npm`; sem `&&` no PowerShell 5.1.
5. **Item com `conferir`:** antes de rodar, confira o comando na documentação atual do projeto (o catálogo pode ter mudado).

## Passo 1: detectar o ambiente

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/detectar.mjs" "<pasta-da-sessao>/ambiente.json"
```

Se o `node` não existir, instale primeiro (Windows: `winget install -e --id OpenJS.NodeJS.LTS`; mac: `brew install node`), com o OK da pessoa, e peça para reabrir o terminal.

## Passo 2: abrir o assistente

Rode em segundo plano (ele fica esperando a pessoa confirmar no navegador):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/assistente.mjs" --saida "<pasta-da-sessao>" --ambiente "<pasta-da-sessao>/ambiente.json"
```

- **Perfil pronto:** se o consultor já preencheu as respostas do cliente (um JSON no mesmo formato, ex.: `dados/perfis/streamer-dev.json`), acrescente `--respostas <arquivo>`. O assistente abre com tudo marcado e a pessoa só confere e ajusta.
- Ele imprime `ASSISTENTE http://127.0.0.1:<porta>/` e abre o navegador padrão. Passe o endereço para a pessoa, caso não abra.
- Quando ela confirma, imprime `CONFIRMADO <arquivo>` e encerra. Se passar de 45 minutos, encerra com `TEMPO ESGOTADO`.
- Enquanto espera, diga em uma frase o que ela vai ver: 3 etapas de perguntas e no fim as recomendações, que ela pode marcar e desmarcar.

**Sem navegador** (`--sem-navegador`, sessão remota ou a pessoa prefere o chat): faça as perguntas de `dados/perguntas.json` pelo chat (AskUserQuestion, no máximo 4 por vez), monte `respostas` no mesmo formato, rode `node "${CLAUDE_PLUGIN_ROOT}/scripts/simular.mjs" <respostas.json> <ambiente.json>` para ver a recomendação, confirme a seleção com ela e grave `selecao.json` com `{respostas, selecao, requisitos, desligados, totais, teto_tokens, sistema}`.

## Passo 3: montar o plano

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/plano.mjs" "<pasta-da-sessao>"
```

Gera `plano.md` (os passos em ordem: requisitos → plugins e comandos → itens com chave → conectores do app), `plano.json` e `claude-md-sugerido.md`. Mostre um resumo do plano: quantos itens, o custo por mês e o peso em tokens. Não despeje o arquivo inteiro.

## Passo 4: instalar, item por item

Siga o `plano.json` na ordem. Para cada item:
1. Diga o nome e o que ele faz em uma linha.
2. `cmd`: rode o comando (depois do OK). Se falhar, leia o erro, tente uma correção óbvia uma vez e, se não resolver, anote e siga para o próximo.
3. `segredo`: diga onde pegar a chave e o comando para salvar, com `COLE_AQUI` no lugar do valor. Espere ela dizer "pronto". Nunca peça para colar a chave no chat.
4. `login` e `manual`: explique o caminho e espere ela fazer.
5. `desligar_depois`: depois de instalar, rode o comando de desligar e diga que dá para ligar quando precisar (`claude plugin enable ...`).
6. Marque o progresso na lista de tarefas.

Depois de instalar requisitos (Node, uv, Bun, FFmpeg), avise que talvez seja preciso **reiniciar o app do Claude ou o terminal** para o PATH novo valer.

## Passo 5: personalizar

Mostre o `claude-md-sugerido.md` e pergunte se pode acrescentar ao `~/.claude/CLAUDE.md` (sem apagar o que já existe; faça backup antes). Ajuste o texto se ela pedir.

## Passo 6: conferir e fechar

- `claude plugin list` e `claude mcp list`: confira o que subiu e o que ficou pendente (login ou chave).
- Se o `ccusage` foi instalado, rode `ccusage daily` uma vez para registrar o "antes".
- Escreva `<pasta-da-sessao>/resumo.md`: o que foi instalado, o que ficou pendente e o próximo passo de cada pendência. Esse arquivo é a ficha do cliente para o consultor.
- Feche com 3 a 5 linhas: o que está pronto, o que falta ela fazer e uma primeira tarefa real para testar (ligada à área dela).
