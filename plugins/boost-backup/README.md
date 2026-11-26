# boost-backup

```
/plugin install boost-backup --marketplace Yadyyace1/claude-boost
```

Backup e restauração das configurações do Claude Code num arquivo só. Serve para quando você troca de plano, de conta ou de computador, ou perde o acesso: depois de entrar na conta nova, é só restaurar.

## Comandos

- `/backup` cria `~/Claude Boost/Backups/claude-backup-<data>.json`.
- `/restaurar` primeiro mostra o que vai mudar e só aplica depois do seu OK, guardando uma cópia do que for sobrescrito.

No painel Hoje (`boost-painel`) há os botões **Fazer backup agora** e **Restaurar um backup**.

## O que entra no backup

| Entra | Não entra |
|---|---|
| `settings.json` (hooks, permissões, opções dos plugins) | o login (`.credentials.json`) |
| `CLAUDE.md`, `RTK.md`, atalhos de teclado | as conversas e o histórico |
| skills, agentes, comandos, estilos, hooks e mods próprios | cache, telemetria e arquivos `.env` |
| as memórias de cada projeto | |
| os marketplaces e os plugins instalados (ligados e desligados) | |
| os servidores MCP do usuário e de cada projeto | |

**Segredos:** as chaves dos MCPs não vão em texto puro. Elas viram `${VARIAVEL}` e o arquivo lista o que preencher na restauração, então ele pode ir para um pendrive ou para a nuvem. Com `/backup --com-segredos` as chaves vão inteiras, e aí o arquivo precisa ser guardado como uma senha.

## Direto pelo terminal

```
node scripts/backup.mjs [--saida <pasta>] [--com-segredos]
node scripts/restaurar.mjs <arquivo.json> [--aplicar]
```
