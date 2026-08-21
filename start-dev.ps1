# start-dev.ps1 — sets up backend venv, installs deps, starts backend and frontend dev servers
# Run from project root: .\start-dev.ps1

param(
  [switch]$OpenBrowser = $true
)

$projectRoot = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Write-Host "Project root: $projectRoot"

# Create venv if missing
if (-Not (Test-Path ".\.venv")) {
  Write-Host "Creating virtual environment..."
  python -m venv .venv
} else {
  Write-Host "Virtual environment exists"
}

# Allow running scripts in this session
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force

# Activate venv
Write-Host "Activating virtual environment..."
. .\.venv\Scripts\Activate.ps1

# Upgrade pip and install backend deps
Write-Host "Installing backend Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r backend-requirements.txt

# Start backend (uvicorn) in a new PowerShell window
$uvicornCmd = "python -m uvicorn backend_app:app --reload --port 8000"
Write-Host "Starting backend: $uvicornCmd"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$projectRoot`"; $uvicornCmd"

# Install frontend deps and start dev server in a new window
Write-Host "Installing frontend dependencies (npm)..."
cmd /c "npm install"

$npmDevCmd = "npm run dev"
Write-Host "Starting frontend dev server: $npmDevCmd"
Start-Process cmd -ArgumentList "/k", "cd /d `"$projectRoot`" & $npmDevCmd"

# Optionally open browser when dev server likely ready
if ($OpenBrowser) {
  Start-Sleep -Seconds 3
  Write-Host "Opening browser to http://localhost:5173"
  Start-Process "http://localhost:5173"
}

Write-Host "Done. Backend runs in a new PowerShell window, frontend runs in a new CMD window."
