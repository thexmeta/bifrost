# Build and Deploy Script for Bifrost
# This script builds the bifrost-http binary and deploys it to the target directory

param(
    [string]$Version = "local-build",
    [string]$TargetDir = "D:\Development\CodeMode\bifrost",
    [switch]$NoStop
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bifrost Build and Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get build version
if ($Version -eq "local-build") {
    $GitVersion = git describe --tags --always --dirty 2>$null
    if (-not $GitVersion) {
        $GitVersion = git rev-parse --short HEAD 2>$null
    }
    if (-not $GitVersion) {
        $GitVersion = "dev-build"
    }
    $BuildVersion = $GitVersion
} else {
    $BuildVersion = $Version
}

Write-Host "Build Version: $BuildVersion" -ForegroundColor Yellow
Write-Host "Target Directory: $TargetDir" -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop existing Bifrost service or process
if (-not $NoStop) {
    Write-Host "Step 1: Stopping existing Bifrost instance..." -ForegroundColor Green
    
    # Try to stop Windows Service first
    $serviceName = "Bifrost"
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    if ($service) {
        Write-Host "  Found Windows Service: $serviceName" -ForegroundColor Yellow
        if ($service.Status -eq "Running") {
            Write-Host "  Stopping service..." -ForegroundColor Yellow
            Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            
            # Verify service stopped
            $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
            if ($service.Status -eq "Running") {
                Write-Host "  WARNING: Service still running, forcing stop..." -ForegroundColor Red
                Stop-Service -Name $serviceName -Force -ErrorAction Stop
            }
            Write-Host "  Service stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "  Service is already stopped" -ForegroundColor Green
        }
    } else {
        Write-Host "  No Windows Service found, checking for running process..." -ForegroundColor Yellow
        
        # Try to stop bifrost-http.exe process
        $process = Get-Process -Name "bifrost-http" -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Found running process: $($process.Id)" -ForegroundColor Yellow
            Stop-Process -Name "bifrost-http" -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            
            # Verify process stopped
            $process = Get-Process -Name "bifrost-http" -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  WARNING: Process still running, forcing termination..." -ForegroundColor Red
                Stop-Process -Name "bifrost-http" -Force -ErrorAction Stop
            }
            Write-Host "  Process stopped successfully" -ForegroundColor Green
        } else {
            Write-Host "  No running Bifrost process found" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}

# Step 2: Build the binary
Write-Host "Step 2: Building bifrost-http..." -ForegroundColor Green

$BuildDir = "transports\bifrost-http"
$OutputPath = "tmp\bifrost-http.exe"

# Check if Go is installed
$goVersion = go version 2>$null
if (-not $goVersion) {
    Write-Host "ERROR: Go is not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "  Go version: $goVersion" -ForegroundColor Gray

# Build the binary
Write-Host "  Building with ldflags: -X main.Version=$BuildVersion" -ForegroundColor Gray
$buildArgs = @(
    "build",
    "-ldflags", "-w -s -X main.Version=$BuildVersion",
    "-a",
    "-trimpath",
    "-tags", "sqlite_static",
    "-o", "..\..\$OutputPath",
    "."
)

Set-Location $BuildDir
& go @buildArgs
$buildExitCode = $LASTEXITCODE
Set-Location ..\..

if ($buildExitCode -ne 0) {
    Write-Host "ERROR: Build failed with exit code $buildExitCode" -ForegroundColor Red
    exit 1
}

Write-Host "  Build successful: $OutputPath" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy to target directory
Write-Host "Step 3: Deploying to $TargetDir..." -ForegroundColor Green

# Create target directory if it doesn't exist
if (-not (Test-Path $TargetDir)) {
    Write-Host "  Creating target directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

# Copy the binary
$targetBinary = Join-Path $TargetDir "bifrost-http.exe"
Write-Host "  Copying binary to $targetBinary" -ForegroundColor Gray
Copy-Item -Path $OutputPath -Destination $targetBinary -Force

# Verify copy
if (Test-Path $targetBinary) {
    $fileSize = (Get-Item $targetBinary).Length / 1MB
    Write-Host "  Binary deployed successfully ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Failed to copy binary" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Restart service if it was running
if (-not $NoStop -and $service -and $service.Status -eq "Stopped") {
    Write-Host "Step 4: Restarting Bifrost service..." -ForegroundColor Green
    Start-Service -Name $serviceName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service.Status -eq "Running") {
        Write-Host "  Service started successfully" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Service failed to start automatically" -ForegroundColor Yellow
        Write-Host "  You can start it manually with: Start-Service -Name Bifrost" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build and Deploy Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: $BuildVersion" -ForegroundColor Yellow
Write-Host "Location: $targetBinary" -ForegroundColor Yellow
Write-Host ""

if (-not $NoStop) {
    if ($service -and $service.Status -eq "Running") {
        Write-Host "Bifrost service is running" -ForegroundColor Green
    } elseif ($service) {
        Write-Host "Bifrost service is stopped - start manually if needed" -ForegroundColor Yellow
    } else {
        Write-Host "To start Bifrost manually:" -ForegroundColor Yellow
        Write-Host "  cd $TargetDir" -ForegroundColor Gray
        Write-Host "  .\bifrost-http.exe -host 0.0.0.0 -port 8080" -ForegroundColor Gray
    }
}

Write-Host ""
