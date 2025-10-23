# Restart Backend Server Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restarting Laravel Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to backend directory
Set-Location -Path ".\capstone_backend"

Write-Host "`n[1/4] Clearing route cache..." -ForegroundColor Yellow
php artisan route:clear

Write-Host "[2/4] Clearing config cache..." -ForegroundColor Yellow
php artisan config:clear

Write-Host "[3/4] Clearing application cache..." -ForegroundColor Yellow
php artisan cache:clear

Write-Host "[4/4] Caching routes..." -ForegroundColor Yellow
php artisan route:cache

Write-Host "`n✓ Cache cleared successfully!" -ForegroundColor Green
Write-Host "`nStarting development server..." -ForegroundColor Cyan
Write-Host "Backend API will be available at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Start the server
php artisan serve
