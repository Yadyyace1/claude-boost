---
name: conectores
description: Guia de conectores e servidores MCP testados no Claude Boost — quais ligar (Gmail, Google Calendar, Google Drive, Notion, Canva, Vercel), onde autorizar no app e como adicionar MCPs avulsos pelo PowerShell. Use quando o usuário perguntar como ligar o Claude ao e-mail, agenda, Drive, Notion, Canva ou a outro serviço, ou "quais conectores vale a pena".
---

# Conectores e MCPs

Há dois jeitos de ligar o Claude a outros serviços. Explique a diferença ao usuário em uma frase e recomende só o que ele vai usar.

## 1. Conectores do app (o jeito fácil)

Ficam na conta da pessoa no claude.ai e valem no app desktop, no navegador e no Claude Code. **Cada pessoa autoriza com a própria conta** — não dá para empacotar nem compartilhar.

Onde: no app do Claude, **Configurações → Conectores** (Settings → Connectors), escolher o serviço e fazer o login dele.

| Conector | Para que serve | Testado |
|---|---|---|
| Gmail | ler, buscar e rascunhar e-mails | ✅ |
| Google Calendar | ver agenda, achar horário, criar evento | ✅ |
| Google Drive | ler e buscar documentos e planilhas | ✅ |
| Notion | ler e escrever páginas e bancos | ✅ |
| Canva | criar e editar designs | ✅ |
| Vercel | deploy e logs de sites (boost-web) | ✅ |
| Meta Ads (oficial, beta) | ler e gerenciar contas de anúncio (boost-ads); se não estiver na lista, adicionar como conector personalizado com a URL `https://mcp.facebook.com/ads` | ainda não |

Regras para passar ao usuário:

- O Claude **pede confirmação antes de enviar** e-mail, criar evento ou publicar algo. Deixe isso claro e mantenha assim.
- Se um conector "precisa de autenticação" dentro do Claude Code, a pessoa autoriza pelo `/mcp`.

## 2. Servidores MCP avulsos (Claude Code)

Para ferramentas que não estão na lista de conectores. Os módulos do kit já trazem os seus (instalar o módulo instala o MCP). Para adicionar outro à mão, **sempre pelo PowerShell** (ver a skill `setup-windows`):

```powershell
claude mcp add --scope user <nome> -- npx -y <pacote>
```

```powershell
claude mcp add --scope user --transport http <nome> <url>
```

- `--scope user` vale em todos os projetos; `--scope project` grava no `.mcp.json` do projeto (vai junto no git); `--scope local` fica só neste projeto, nesta máquina.
- **Chaves e tokens nunca vão para o git** nem para arquivo compartilhado. Cada pessoa usa a própria conta.
- Cada MCP ligado ocupa contexto: ligue só o que usa (ver a skill `economia-tokens`).

## MCPs que já vêm nos módulos

| Módulo | MCP | Precisa de |
|---|---|---|
| boost-base | context7 (documentação atualizada de bibliotecas) | nada |
| boost-design | photopea (edição de imagem) | Node |
| boost-design | pixellab (pixel art por IA) | conta e chave PixelLab |
| boost-web | playwright, chrome-devtools (navegador) | Node |
| boost-dados | tradingview (dados de mercado) | uv |
