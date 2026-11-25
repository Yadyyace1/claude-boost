# Guia de instalação (Windows)

Tempo: uns 15 minutos. Tudo no **PowerShell** (não use o Git Bash para os comandos `claude mcp`/`claude plugin`: ele estraga alguns argumentos em silêncio).

## 1. Pré-requisitos

| Programa | Para quê | Como instalar |
|---|---|---|
| Claude Code | o próprio | app desktop do Claude (aba Code) ou `irm https://claude.ai/install.ps1 \| iex` |
| Git for Windows | obrigatório para o Claude Code no Windows | `winget install Git.Git` |
| Node.js LTS | MCPs dos módulos design e web | `winget install OpenJS.NodeJS.LTS` |
| uv | MCP do módulo dados, scripts Python | `winget install astral-sh.uv` |
| FFmpeg | só para o boost-video | `winget install Gyan.FFmpeg` |

Depois de instalar pelo winget, **feche e abra o terminal** (e o app do Claude): o PATH só atualiza em janelas novas.

Conferir:

```powershell
git --version; node --version; uv --version; claude --version
```

## 2. Adicionar o kit

```powershell
claude plugin marketplace add Yadyyace1/claude-boost
```

Se o repositório for **privado**, a pessoa precisa ter acesso a ele no GitHub e estar logada no git da máquina (o Git Credential Manager pede o login na primeira vez).

## 3. Instalar o núcleo

```powershell
claude plugin install boost-base@claude-boost
```

Abra o Claude Code e rode:

1. `/boost-base:boost-setup` — confere os programas, instala a status line e lista os MCPs.
2. `/boost-base:diagnostico` — entrevista curta que recomenda os módulos e monta o seu `CLAUDE.md` pessoal.

## 4. Módulos (só os que você usa)

```powershell
claude plugin install boost-design@claude-boost
```

```powershell
claude plugin install boost-video@claude-boost
```

```powershell
claude plugin install boost-web@claude-boost
```

```powershell
claude plugin install boost-dados@claude-boost
```

Os MCPs via `npx` demoram na primeira vez. Se algum aparecer como falho no `/mcp`, rode uma vez o pacote para popular o cache e reabra o Claude:

```powershell
npx -y photopea-mcp-server --help
```

## 5. Chaves próprias

Só o PixelLab (boost-design) usa chave, e é opcional:

```powershell
claude plugin configure boost-design@claude-boost
```

A chave fica no armazenamento seguro da máquina, **nunca** em arquivo do repositório. Quem não usa PixelLab pode desligar o servidor `pixellab` no `/mcp`.

## 6. Conectores da sua conta

No app do Claude: **Configurações → Conectores**. Ligue os que você usa (Gmail, Google Calendar, Google Drive, Notion, Canva, Vercel) com o seu login. Isso não vem no kit porque cada conta autoriza a sua.

## 7. Economia de tokens: ferramentas extras (opcional)

Não vêm no kit; cada pessoa instala as suas. Detalhes na skill `economia-tokens` do boost-base.

Medir o consumo (faça antes de mudar qualquer coisa, para ter o "antes"):

```powershell
npm.cmd i -g ccusage
```

```powershell
ccusage daily
```

**rtk** (enxuga a saída dos comandos; depois de instalar, **reinicie o app do Claude**, porque o `rtk.exe` fica fora do PATH do app que já estava aberto):

```powershell
winget install rtk-ai.rtk
```

```powershell
rtk init -g --auto-patch
```

**Graphify** (grafo do projeto; use `/graphify .` em projetos grandes):

```powershell
uv tool install graphifyy --python 3.12
```

```powershell
graphify install --platform claude
```

## 8. Atualizar e remover

```powershell
claude plugin marketplace update claude-boost
```

```powershell
claude plugin uninstall boost-video@claude-boost
```

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npm` dá erro de política de execução | PowerShell 5.1 bloqueia `npm.ps1` | usar `npm.cmd` / `npx.cmd` |
| `&&` dá erro no PowerShell | não existe no 5.1 | usar `;` |
| `python` abre a Microsoft Store | alias falso do Windows | instalar pelo `uv python install 3.12` |
| MCP "Failed to connect" | cache do npx vazio ou registrado pelo Git Bash | rodar `npx -y <pacote> --help`; registrar pelo PowerShell |
| comando "não reconhecido" logo após instalar | PATH antigo | abrir terminal novo |
| rtk instalado mas sem efeito | o app aberto não vê o PATH novo | reiniciar o app do Claude |
