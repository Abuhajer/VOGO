# One-time setup for a named Cloudflare Tunnel with your own domain.
# Requires: cloudflared installed + domain on Cloudflare.

$ErrorActionPreference = "Stop"
$tunnelName = "vogo-by-fame"
$configDir = Join-Path $env:USERPROFILE ".cloudflared"
$configPath = Join-Path $configDir "config.yml"

Write-Host "=== Cloudflare Tunnel setup: $tunnelName ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Error "cloudflared not found. Install from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
}

Write-Host "Step 1/4: Log in to Cloudflare (browser will open)..." -ForegroundColor Yellow
cloudflared tunnel login

Write-Host ""
Write-Host "Step 2/4: Create tunnel '$tunnelName'..." -ForegroundColor Yellow
cloudflared tunnel create $tunnelName

Write-Host ""
Write-Host "Step 3/4: Route DNS (replace with your hostname)..." -ForegroundColor Yellow
Write-Host "  Example: cloudflared tunnel route dns $tunnelName vogo.yourdomain.com"
$hostname = Read-Host "Enter hostname to route (e.g. vogo.yourdomain.com)"
if ($hostname) {
  cloudflared tunnel route dns $tunnelName $hostname
}

Write-Host ""
Write-Host "Step 4/4: Write config..." -ForegroundColor Yellow
$tunnelInfo = cloudflared tunnel list --output json 2>$null | ConvertFrom-Json
$tunnel = $tunnelInfo | Where-Object { $_.name -eq $tunnelName } | Select-Object -First 1

if (-not $tunnel) {
  Write-Error "Could not find tunnel '$tunnelName'. Run: cloudflared tunnel list"
}

$uuid = $tunnel.id
$credFile = Join-Path $configDir "$uuid.json"

if (-not (Test-Path $configDir)) {
  New-Item -ItemType Directory -Path $configDir | Out-Null
}

$yaml = @"
tunnel: $uuid
credentials-file: $credFile

ingress:
  - hostname: $hostname
    service: http://localhost:3000
    originRequest:
      httpHostHeader: localhost:3000
  - service: http_status:404
"@

Set-Content -Path $configPath -Value $yaml -Encoding UTF8
Write-Host ""
Write-Host "Saved: $configPath" -ForegroundColor Green
Write-Host ""
Write-Host "Start the app:  npm run dev" -ForegroundColor Cyan
Write-Host "Start tunnel:   npm run tunnel:run" -ForegroundColor Cyan
Write-Host "Public URL:     https://$hostname" -ForegroundColor Green
