Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Check Python 3.10
$pyCmd = Get-Command py -ErrorAction SilentlyContinue
if (-not $pyCmd) {
    Write-Error "Python launcher (py) no encontrado. Instala Python 3.10 y asegurate de tener el launcher."
    exit 1
}

$pyVersion = & py -3.10 -c "import sys; print(sys.version_info[:2] == (3,10))" 2>$null
if ($LASTEXITCODE -ne 0 -or $pyVersion.Trim() -ne "True") {
    Write-Error "Python 3.10 no encontrado. Instala Python 3.10 y vuelve a ejecutar."
    exit 1
}

# Create venv if missing
if (-not (Test-Path ".\\venvPrecios\\Scripts\\Activate.ps1")) {
    & py -3.10 -m venv venvPrecios
}

# Activate venv and update pip
& .\venvPrecios\Scripts\Activate.ps1
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Download ChromeDriver 127 (Windows 64)
$chromeDriverZip = "chromedriver-win64.zip"
$versionsJsonUrl = "https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json"

Write-Host "Descargando ChromeDriver 127..."
$versionsJson = Invoke-WebRequest -Uri $versionsJsonUrl | Select-Object -ExpandProperty Content
$versionsData = $versionsJson | ConvertFrom-Json
$versionEntry = $versionsData.versions | Where-Object { $_.version -like "127.*" } | Select-Object -First 1

if (-not $versionEntry) {
    Write-Error "No se encontro una version 127.x.x.x en el listado oficial."
    exit 1
}

$chromeDriverUrl = $versionEntry.downloads.chromedriver |
    Where-Object { $_.platform -eq "win64" } |
    Select-Object -ExpandProperty url -First 1

if (-not $chromeDriverUrl) {
    Write-Error "No se encontro URL de ChromeDriver 127 para win64."
    exit 1
}

if (-not (Test-Path ".\\chromedriver.exe")) {
    Invoke-WebRequest -Uri $chromeDriverUrl -OutFile $chromeDriverZip

    Write-Host "Extrayendo ChromeDriver..."
    Expand-Archive -Path $chromeDriverZip -DestinationPath . -Force

    # Move binary to project root
    Copy-Item -Force ".\\chromedriver-win64\\chromedriver.exe" ".\\chromedriver.exe"

    # Cleanup
    Remove-Item -Recurse -Force ".\\chromedriver-win64"
    Remove-Item -Force $chromeDriverZip
}

Write-Host "ChromeDriver 127 listo en $(Get-Location)\\chromedriver.exe"

# Download Chrome 127 (Windows 64)
$chromeZip = "chrome-win64.zip"
$chromeUrl = $versionEntry.downloads.chrome |
    Where-Object { $_.platform -eq "win64" } |
    Select-Object -ExpandProperty url -First 1

if (-not $chromeUrl) {
    Write-Error "No se encontro URL de Chrome 127 para win64."
    exit 1
}

if (-not (Test-Path ".\\chrome-win64\\chrome.exe")) {
    Write-Host "Descargando Chrome 127..."
    Invoke-WebRequest -Uri $chromeUrl -OutFile $chromeZip

    Write-Host "Extrayendo Chrome 127..."
    Expand-Archive -Path $chromeZip -DestinationPath . -Force
    Remove-Item -Force $chromeZip
}

$chromeBin = Resolve-Path ".\\chrome-win64\\chrome.exe"
$env:CHROME_BIN = $chromeBin.Path
Write-Host "Chrome 127 listo en $($env:CHROME_BIN)"

# Launch server
python api\api.py
