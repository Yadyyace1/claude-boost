# Servidor do Spark na Vultr (São Paulo, GMT-3)

**Situação:** pronto para criar, mas nada foi contratado. Falta o João salvar a chave da API da Vultr (`VULTR_API_KEY`) no próprio PowerShell e aprovar o valor.

## O que roda nele

- **API de contas** (`server/spark-api.mjs`): criar conta, entrar, sair, perfil (nome, avatar, idioma). Node 24 sem dependências, banco **SQLite** (`node:sqlite`).
  - **senhas:** scrypt (nunca guardadas em texto);
  - **sessões:** assinadas, de 30 dias, que dá para revogar;
  - **contra ataques:** limite contra força bruta e a mesma resposta para senha errada e e-mail inexistente;
  - **CORS:** só o assistente local (`http://127.0.0.1:<porta>`) e as origens configuradas.
- **Caddy** na frente, com HTTPS automático. Sem domínio próprio, usa `<ip>.sslip.io`.
- **Backup diário** do banco (guarda 14 dias) em `/opt/spark/backups`.
- **Fuso** `America/Sao_Paulo`. O banco guarda as datas em UTC.
- **Firewall:** só as portas 22, 80 e 443.

Depois: o perfil e a rede social, os webhooks do bot de WhatsApp (n8n) e as assinaturas.

## Preço oficial (API pública da Vultr, região `sao`, consultado em 2026-11-28)

| Plano | vCPU | Memória | Disco | Tráfego | US$/mês |
|---|---|---|---|---|---|
| **vc2-1c-1gb** (recomendado para começar) | 1 | 1 GB | 25 GB | 1 TB | **5** |
| vc2-1c-2gb (com n8n) | 1 | 2 GB | 55 GB | 2 TB | 10 |
| vc2-2c-2gb | 2 | 2 GB | 65 GB | 3 TB | 15 |

O backup automático da Vultr é opcional e custa +20%. O backup diário do banco já vem de graça no próprio servidor.

## Como criar

1. Criar a chave em my.vultr.com → Account → API e salvar (no seu PowerShell, nunca no chat):
   `[Environment]::SetEnvironmentVariable("VULTR_API_KEY", "SUA_CHAVE", "User")`
2. Ver o plano e o preço, sem criar nada: `powershell -ExecutionPolicy Bypass -File server\criar-servidor.ps1`
3. Criar (começa a cobrança): `... criar-servidor.ps1 -Confirmar`
4. Pôr o endereço que ele mostra em `plugins/boost-onboarding/dados/marca.json` (`"api": "https://<ip>.sslip.io"`) e remontar o instalador. A partir daí, o assistente pede login antes das configurações.

## Testar no PC, sem servidor

`server/spark-api.mjs` roda local com `SPARK_SEGREDO` (32+ caracteres) e `SPARK_PORTA`. O assistente usa a API definida em `SPARK_API`, por exemplo `http://127.0.0.1:8787`.
