# Test runner script
Set-Location "C:\99_Develop\SynologyDrive\20_Projects\PJT_CDC_The_Nexus"

Write-Host "Starting test run at $(Get-Date)" -ForegroundColor Green

# Run tests with a 30 second timeout
$proc = Start-Process npm -ArgumentList "test", "--run" -PassThru -NoNewWindow

# Wait up to 30 seconds
$elapsed = 0
while (!$proc.HasExited -and $elapsed -lt 30) {
    Start-Sleep -Seconds 1
    $elapsed++
}

# If still running, kill it
if (!$proc.HasExited) {
    $proc.Kill()
    Write-Host "Tests timed out after 30 seconds - killed process" -ForegroundColor Yellow
}

Write-Host "Test execution finished at $(Get-Date)" -ForegroundColor Green
