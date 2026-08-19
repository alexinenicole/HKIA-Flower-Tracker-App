# sync-to-build.ps1
# Run this after editing source files to update the built .exe
# Usage: powershell -ExecutionPolicy Bypass -File sync-to-build.ps1

$resources = "dist\win-unpacked\resources"
$asar      = "$resources\app.asar"
$temp      = "$resources\app_unpacked"

if (-not (Test-Path $asar)) {
    Write-Host "ERROR: $asar not found. Run 'npm run build:portable' first." -ForegroundColor Red
    exit 1
}

Write-Host "Extracting ASAR..." -ForegroundColor Cyan
npx -y @electron/asar extract $asar $temp

Write-Host "Copying updated source files..." -ForegroundColor Cyan
Copy-Item -Force "tracker.js"  "$temp\tracker.js"
Copy-Item -Force "style.css"   "$temp\style.css"
Copy-Item -Force "index.html"  "$temp\index.html"
Copy-Item -Force "data.json"   "$temp\data.json"
Copy-Item -Force -Recurse "assets\*" "$temp\assets\"
Copy-Item -Force "data.json"   "$resources\data.json"  # keep outside ASAR too

Write-Host "Repacking ASAR..." -ForegroundColor Cyan
npx @electron/asar pack $temp $asar

Write-Host "Cleaning up..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $temp

Write-Host "Done! Reopen the .exe to see your changes." -ForegroundColor Green
