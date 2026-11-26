---
name: backup
description: Faz um backup das configurações do Claude Code (settings, CLAUDE.md, memórias, skills, agentes, comandos, plugins, marketplaces e MCPs) num arquivo local. Use quando a pessoa pedir backup, quiser guardar as configurações, for trocar de plano, de conta ou de computador, ou rodar /backup.
argument-hint: "[--com-segredos] [--saida <pasta>]"
---

# Backup das configurações do Claude Code

Rode o script do plugin (só lê as configurações; grava um arquivo novo):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/backup.mjs" $ARGUMENTS
```

- Por padrão o arquivo vai para `~/Spark/Backups/claude-backup-<data>.json`.
- **Segredos:** chaves e tokens dos MCPs NÃO vão em texto puro: viram `${VARIAVEL}` e ficam listados no arquivo para preencher na restauração. Assim o backup pode ir para um pendrive, o Google Drive ou o OneDrive com tranquilidade.
- Só use `--com-segredos` se a pessoa pedir explicitamente, e avise: aí o arquivo contém as chaves e deve ser guardado como uma senha (nada de nuvem compartilhada).
- O login da conta (`.credentials.json`), as conversas, o cache e os arquivos `.env` nunca entram.

Depois de rodar, diga em 3 linhas: onde ficou o arquivo, o que entrou (os números que o script imprime) e a sugestão de guardar uma cópia fora deste computador (Drive, OneDrive ou pendrive). Para restaurar: `/restaurar`.
