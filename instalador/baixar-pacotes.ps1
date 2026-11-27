# Baixa os instaladores que vão dentro do pacote do Spark (pasta instalador\pacotes), das fontes oficiais,
# e confere o SHA-256 quando a fonte publica. O montar.ps1 copia a pasta para "Spark - Instalador\pacotes".
#   Git para Windows (64 bits)  github.com/git-for-windows/git (última versão)
#   Node.js LTS (MSI 64 bits)   nodejs.org/dist (última LTS, confere com SHASUMS256.txt)
#   uv (zip 64 bits)            github.com/astral-sh/uv (última versão, confere com o .sha256)
# O Claude Code NÃO vai no pacote: ele é instalado na hora pelo instalador oficial da Anthropic.
# Uso: powershell -ExecutionPolicy Bypass -File instalador\baixar-pacotes.ps1

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$pasta = Join-Path $PSScriptRoot "pacotes"
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$cab = @{ "User-Agent" = "spark-instalador" }

function Baixar($url, $nome) {
    $destino = Join-Path $pasta $nome
    if (Test-Path $destino) { Write-Host "ja tenho: $nome"; return $destino }
    Write-Host "baixando: $nome"
    Invoke-WebRequest -Uri $url -OutFile $destino -Headers $cab -UseBasicParsing
    return $destino
}
function Conferir($arquivo, $esperado) {
    $real = (Get-FileHash $arquivo -Algorithm SHA256).Hash.ToLower()
    if ($real -ne $esperado.ToLower()) { Remove-Item $arquivo; throw "SHA-256 nao confere: $(Split-Path $arquivo -Leaf)" }
    Write-Host "  SHA-256 ok"
}

# Git para Windows
$git = Invoke-RestMethod "https://api.github.com/repos/git-for-windows/git/releases/latest" -Headers $cab
$ativo = $git.assets | Where-Object { $_.name -match '^Git-[\d.]+-64-bit\.exe$' } | Select-Object -First 1
$arq = Baixar $ativo.browser_download_url $ativo.name
if ($ativo.digest -match '^sha256:(.+)$') { Conferir $arq $Matches[1] }

# Node.js LTS
$lts = (Invoke-RestMethod "https://nodejs.org/dist/index.json") | Where-Object { $_.lts } | Select-Object -First 1
$nomeNode = "node-$($lts.version)-x64.msi"
$arq = Baixar "https://nodejs.org/dist/$($lts.version)/$nomeNode" $nomeNode
$somas = (Invoke-WebRequest "https://nodejs.org/dist/$($lts.version)/SHASUMS256.txt" -UseBasicParsing -Headers $cab).Content
$linha = ($somas -split "`n") | Where-Object { $_ -match [regex]::Escape($nomeNode) } | Select-Object -First 1
Conferir $arq ($linha -split '\s+')[0]

# uv
$uv = Invoke-RestMethod "https://api.github.com/repos/astral-sh/uv/releases/latest" -Headers $cab
$zip = $uv.assets | Where-Object { $_.name -eq "uv-x86_64-pc-windows-msvc.zip" } | Select-Object -First 1
$arq = Baixar $zip.browser_download_url $zip.name
$sha = $uv.assets | Where-Object { $_.name -eq "uv-x86_64-pc-windows-msvc.zip.sha256" } | Select-Object -First 1
if ($sha) { Conferir $arq ((Invoke-WebRequest $sha.browser_download_url -UseBasicParsing -Headers $cab).Content -split '\s+')[0] }

Get-ChildItem $pasta | Select-Object Name, @{ n = "MB"; e = { [math]::Round($_.Length / 1MB, 1) } }
