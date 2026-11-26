# Monta a pasta para entregar: "Boost.exe" (com o ícone do raio, de gerar_icone.py) + a pasta kit (este repositório, sem .git e sem node_modules).
# Uso (PowerShell, na raiz do repositório): powershell -ExecutionPolicy Bypass -File instalador\montar.ps1 [-Saida "D:\HD\Claude Boost - Instalador"]
param([string]$Saida = (Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) "Claude Boost - Instalador"))

$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
$csc = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { throw "Não achei o compilador C# do Windows em $csc" }

New-Item -ItemType Directory -Force -Path $Saida | Out-Null
$exe = Join-Path $Saida "Boost.exe"
$antigo = Join-Path $Saida "Instalar Claude Boost.exe"  # nome antigo, até a v0.7
if (Test-Path $antigo) { Remove-Item $antigo }
$icone = Join-Path $PSScriptRoot "icone.ico"
$png = Join-Path $PSScriptRoot "icone.png"
$argsCsc = @("/nologo", "/target:winexe", "/optimize+", "/out:$exe", "/r:System.Windows.Forms.dll", "/r:System.Drawing.dll")
if (Test-Path $icone) { $argsCsc += "/win32icon:$icone", "/resource:$icone,Boost.icone.ico" }
if (Test-Path $png) { $argsCsc += "/resource:$png,Boost.icone.png" }
$argsCsc += (Join-Path $PSScriptRoot "Instalador.cs")
& $csc @argsCsc
if ($LASTEXITCODE -ne 0) { throw "A compilação falhou." }

# Copia o kit sem o histórico do git e sem dependências de desenvolvimento (o app já vai compilado em app\dist).
$kit = Join-Path $Saida "kit"
robocopy $repo $kit /MIR /XD .git node_modules instalador /XF *.log /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "A cópia do kit falhou (robocopy $LASTEXITCODE)." }
Copy-Item (Join-Path $PSScriptRoot "LEIA-ME.txt") $Saida -Force

Write-Host "Pronto: $Saida"
Get-ChildItem $Saida | Select-Object Name, Length
