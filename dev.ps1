$ErrorActionPreference = "Stop"

$rootDir = $PSScriptRoot
$frontendDir = Join-Path $rootDir "Frontend"
$backendDir = Join-Path $rootDir "Backend"
$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source

if (-not (Test-Path $backendPython)) {
    throw "Backend venv Python was not found at: $backendPython"
}

if (-not $npm) {
    throw "npm.cmd was not found on PATH."
}

if (-not (Test-Path (Join-Path $frontendDir "package.json"))) {
    throw "Frontend package.json was not found at: $frontendDir"
}

Write-Host "Starting TruthLens frontend and backend..." -ForegroundColor Cyan
Write-Host "Frontend: npm run dev" -ForegroundColor DarkCyan
Write-Host "Backend:  .venv\Scripts\python.exe -m uvicorn app.main:app --reload" -ForegroundColor DarkCyan
Write-Host "Press Ctrl+C to stop both." -ForegroundColor DarkCyan

$processes = @()

try {
    $backend = Start-Process `
        -FilePath $backendPython `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--reload") `
        -WorkingDirectory $backendDir `
        -NoNewWindow `
        -PassThru

    $frontend = Start-Process `
        -FilePath $npm `
        -ArgumentList @("run", "dev") `
        -WorkingDirectory $frontendDir `
        -NoNewWindow `
        -PassThru

    $processes = @($backend, $frontend)

    while ($true) {
        foreach ($process in $processes) {
            if ($process.HasExited) {
                throw "A dev process exited. Stopping the remaining process."
            }
        }

        Start-Sleep -Seconds 1
    }
}
finally {
    foreach ($process in $processes) {
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
