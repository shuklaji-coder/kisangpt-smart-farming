# Kisan GPT Setup Script for Windows PowerShell
# Run with: PowerShell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "🌾 Setting up Kisan GPT - The Emotional Agronomist 🌾" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Blue
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file. Please edit it with your API keys." -ForegroundColor Green
    Write-Host "   Required: OPENWEATHER_API_KEY, GOOGLE_MAPS_API_KEY" -ForegroundColor Blue
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Create necessary directories
Write-Host "Creating necessary directories..." -ForegroundColor Yellow
$directories = @("data/mongo-init", "logs", "uploads", "cache/tts", "static")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

# Build and start services
Write-Host ""
Write-Host "Building and starting Kisan GPT services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Blue

try {
    docker-compose up --build -d
    Write-Host "✅ Services started successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error starting services. Check Docker logs." -ForegroundColor Red
    exit 1
}

# Wait a moment for services to start
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host ""
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Display access information
Write-Host ""
Write-Host "🎉 Kisan GPT is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Blue
Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend API:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs:        http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host "  MongoDB:         localhost:27017" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Blue
Write-Host "  View logs:       docker-compose logs -f" -ForegroundColor Gray
Write-Host "  Stop services:   docker-compose down" -ForegroundColor Gray
Write-Host "  Restart:         docker-compose restart" -ForegroundColor Gray
Write-Host ""
Write-Host "Don't forget to:" -ForegroundColor Yellow
Write-Host "  1. Add your API keys to .env file" -ForegroundColor White
Write-Host "  2. Restart services after updating .env: docker-compose restart" -ForegroundColor White
Write-Host ""
Write-Host "Happy farming! 🌱" -ForegroundColor Green