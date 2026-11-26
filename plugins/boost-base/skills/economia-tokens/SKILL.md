---
name: economia-tokens
description: Use quando o usuário quiser gastar menos tokens, render mais o limite do plano, deixar o Claude mais rápido ou entender por que a sessão ficou cara ou lenta ("tá gastando muito", "acabou meu limite", "contexto cheio", "economizar tokens"). Traz as práticas do Spark para economizar contexto e uso.
---

# Economia de tokens

Cada mensagem reenvia todo o contexto da sessão: instruções, CLAUDE.md, lista de ferramentas dos MCPs e todo o histórico. Economizar é manter esse contexto pequeno e relevante. Quando o usuário pedir ajuda com isso, veja o que se aplica ao caso dele e recomende **as 2 ou 3 práticas que mais ajudam**, não a lista inteira.

## Sessão

- **`/clear` entre tarefas sem relação.** Um assunto novo numa sessão velha carrega todo o histórico antigo de graça. Uma sessão por tarefa.
- **`/compact` com foco** quando a tarefa é longa e precisa continuar: `/compact mantenha só as decisões e os arquivos alterados`.
- **Sessão parada por muito tempo:** o cache do prompt expira, e a primeira mensagem depois disso reprocessa o contexto inteiro a preço cheio. Se o assunto mudou, prefira `/clear`.
- **Olhar a status line** (o `/boost-base:boost-setup` instala): ela mostra quanto do contexto está ocupado e quanto do limite de 5 horas e da semana já foi usado.

## O que o Claude carrega sempre

- **CLAUDE.md enxuto:** até umas 200 linhas. Ele entra em toda mensagem. Aponte para arquivos ("o padrão de API está em docs/api.md") em vez de colar o conteúdo.
- **MCPs só os que usa:** cada servidor ligado acrescenta ferramentas ao contexto. Desligue os que não usa no projeto pelo `/mcp`.
- **Plugins:** `claude plugin details <plugin>` mostra o custo projetado em tokens de cada plugin. Desinstale o que não usa.

## Como pedir

- **`@arquivo` em vez de colar** o conteúdo na mensagem; e, para arquivo grande, peça a parte que importa ("só a função X").
- **Logs e saídas grandes:** peça `tail`/filtro (`... | tail -50`, `grep erro`) em vez de jogar o log inteiro na conversa.
- **Buscas amplas por um subagente** (por exemplo, o Explore): ele lê os arquivos todos e só a conclusão volta para a sessão principal.
- **Pedidos claros e completos** de uma vez. Cinco idas e voltas custam mais que uma mensagem bem escrita.

## Modelo e esforço

- **Sonnet na rotina** (edições, perguntas, tarefas mecânicas) e **Opus no difícil** (arquitetura, bug cabeludo, texto importante). Troque com `/model`.
- **Esforço (effort)** mais baixo em tarefas simples: responde mais rápido e gasta menos.

## Ferramentas externas (cada pessoa instala a sua)

Elas não vêm embutidas no kit: cada uma tem licença e instalação próprias, e cada pessoa instala a dela. **Peça autorização antes de instalar.**

| Ferramenta | O que faz | Instalar |
|---|---|---|
| **ccusage** | mede o consumo de tokens e o custo por dia, para comparar antes e depois | `npm.cmd i -g ccusage`, depois `ccusage daily` |
| **rtk** | hook PreToolUse no Bash que enxuga a saída dos comandos antes de ela entrar no contexto | `winget install rtk-ai.rtk`, depois `rtk init -g --auto-patch` |
| **Graphify** | monta um grafo de conhecimento do projeto, e o Claude consulta o grafo em vez de reler os arquivos | `uv tool install graphifyy --python 3.12`, depois `graphify install --platform claude` |

- **Meça primeiro:** rode `ccusage daily` antes de mudar qualquer coisa. Esse é o "antes" para comparar depois.
- **rtk:** medido num projeto real, `git log` e `git diff` saíram 52% menores. No Windows o `rtk.exe` fica em `WinGet\Packages`, fora do PATH do app que já estava aberto: **reinicie o app do Claude** depois de instalar. A licença é Apache + BUSL, com uso próprio livre; por isso cada pessoa instala a sua.
- **Graphify:** vale em projeto grande. Rode `/graphify .` na pasta. O ganho anunciado (até 71×) é o melhor caso. Indexar código não gasta tokens, mas montar o grafo de documentos e imagens gasta uma vez.

## Interface (mods)

A skill embutida `plugin-authoring` do Claude Code cria *mods*: painéis, faixas, status, temas e até um roteador que manda pedidos simples para o Haiku. Ao criar um, não comece o nome do plugin com `claude-`: o Claude Code rejeita esse prefixo.

## Diagnóstico rápido

Se o usuário disser que "está gastando muito", pergunte ou verifique:

1. A sessão está longa ou mistura assuntos? → `/clear` ou `/compact`.
2. Quantos MCPs e plugins estão ligados? → desligar o que não usa.
3. O CLAUDE.md está grande? → enxugar, apontando para arquivos.
4. Está usando Opus para tudo? → Sonnet na rotina.
5. Muita saída de terminal ou projeto grande? → rtk e Graphify, medindo com o ccusage antes e depois.
