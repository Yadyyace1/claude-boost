# Cria o servidor do Spark na Vultr (São Paulo, GMT-3) com a API de contas.
# Sem -Confirmar, só mostra o plano e o preço real: nada é criado nem cobrado.
# A chave da API da Vultr vem da variável VULTR_API_KEY (salve no seu PowerShell; nunca cole no chat):
#   [Environment]::SetEnvironmentVariable("VULTR_API_KEY", "SUA_CHAVE", "User")
# Uso: powershell -ExecutionPolicy Bypass -File server\criar-servidor.ps1 [-Plano vc2-1c-1gb] [-Dominio auto] [-Confirmar]
param([string]$Plano = "vc2-1c-1gb", [string]$Dominio = "auto", [switch]$Confirmar)
$ErrorActionPreference = "Stop"
$chave = [Environment]::GetEnvironmentVariable("VULTR_API_KEY", "User")
if (-not $chave) { throw "Falta a VULTR_API_KEY. Crie em my.vultr.com → Account → API e salve com o comando do topo deste arquivo." }
$cab = @{ Authorization = "Bearer $chave"; "Content-Type" = "application/json" }
$api = "https://api.vultr.com/v2"

# Plano e preço oficiais, na região São Paulo
$plano = (Invoke-RestMethod "$api/plans?type=vc2&per_page=500").plans | Where-Object { $_.id -eq $Plano -and $_.locations -contains "sao" }
if (-not $plano) { throw "O plano $Plano não está disponível em São Paulo." }
$ubuntu = (Invoke-RestMethod "$api/os?per_page=500" -Headers $cab).os | Where-Object { $_.name -match "^Ubuntu 24\.04" -and $_.arch -eq "x64" } | Select-Object -First 1
Write-Host ("Plano {0}: {1} vCPU, {2} MB, {3} GB de disco, {4} GB de tráfego — US$ {5}/mês, região São Paulo (sao), {6}" -f $plano.id, $plano.vcpu_count, $plano.ram, $plano.disk, $plano.bandwidth, $plano.monthly_cost, $ubuntu.name)
if (-not $Confirmar) { Write-Host "Nada foi criado. Rode de novo com -Confirmar para criar e começar a cobrança."; exit 0 }

# O segredo das sessões é gerado no próprio servidor (cloud-init).
$init = (Get-Content (Join-Path $PSScriptRoot "cloud-init.yaml") -Raw).Replace("<<DOMINIO>>", $Dominio)
$corpo = @{
  region = "sao"; plan = $Plano; os_id = $ubuntu.id; label = "spark-api"; hostname = "spark-api"
  enable_ipv6 = $true; backups = "disabled"; tags = @("spark")
  user_data = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($init))
} | ConvertTo-Json
$inst = (Invoke-RestMethod "$api/instances" -Method Post -Headers $cab -Body $corpo).instance
Write-Host "Criado: $($inst.id). Esperando o IP…"
for ($i = 0; $i -lt 60 -and (-not $inst.main_ip -or $inst.main_ip -eq "0.0.0.0"); $i++) { Start-Sleep 10; $inst = (Invoke-RestMethod "$api/instances/$($inst.id)" -Headers $cab).instance }
$host_ = if ($Dominio -eq "auto") { ($inst.main_ip -replace "\.", "-") + ".sslip.io" } else { $Dominio }
Write-Host "IP: $($inst.main_ip)"
Write-Host "API (em uns 5 minutos, depois da instalação): https://$host_/v1/saude"
Write-Host "Ponha em plugins/boost-onboarding/dados/marca.json:  ""api"": ""https://$host_"""
