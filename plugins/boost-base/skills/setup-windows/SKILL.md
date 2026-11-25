---
name: setup-windows
description: Use ao instalar ou configurar ferramentas no Windows para o Claude Code — registrar servidor MCP (`claude mcp add`), MCP que não conecta ou "Failed to connect", npx/npm/node/python/uv que não funciona, erro de PowerShell (&&, npm.ps1 bloqueado), PATH que não atualizou depois do winget. Traz as pegadinhas do Windows já resolvidas no Claude Boost.
---

# Setup no Windows: pegadinhas já resolvidas

Use estas regras antes de tentar outra coisa. Cada uma veio de um problema real.

## Registrar MCP

- **Sempre pelo PowerShell, nunca pelo Git Bash.** No Git Bash o MSYS converte o argumento `/c` em `C:/` e grava uma configuração quebrada, e o `claude mcp add` ainda responde "sucesso". O servidor só falha depois, em silêncio.
- **Use `npx -y <pacote>` direto.** O wrapper `cmd /c npx ...` não funciona, mesmo escrito certo: o servidor fica "Failed to connect". Exemplo que funciona:

  ```powershell
  claude mcp add --scope user photopea -- npx -y photopea-mcp-server
  ```

- **Popule o cache antes.** O primeiro start de um pacote novo pelo npx demora mais que o health check e o servidor aparece como falho. Rode antes uma vez:

  ```powershell
  npx -y <pacote> --help
  ```

- Para conferir: `claude mcp list` (no terminal) ou `/mcp` dentro do Claude Code.

## PowerShell 5.1 (o padrão do Windows)

- **Não existe `&&`.** Use `;` para rodar em sequência, ou `A; if ($?) { B }` para rodar B só se A deu certo.
- **`npm` pode ser bloqueado** pela política de execução (o `npm.ps1`). Use `npm.cmd` (e `npx.cmd`) no lugar.

## Python, uv e Node

- **O "python" que abre a Microsoft Store é um alias falso.** Instale o Python de verdade pelo winget ou pelo `uv`:

  ```powershell
  winget install astral-sh.uv
  ```

  ```powershell
  uv python install 3.12
  ```

- **Node** (necessário para MCPs via `npx`): `winget install OpenJS.NodeJS.LTS`.
- **Depois de instalar pelo winget, o PATH só atualiza em terminais novos.** Feche e abra o terminal (e o app do Claude, se o MCP depende do programa novo). Numa sessão já aberta dá para recarregar:

  ```powershell
  $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
  ```

## Antes de instalar qualquer programa

Peça autorização ao usuário, diga o que vai instalar e de onde (winget, npm, uv). Não instale nada por conta própria.
