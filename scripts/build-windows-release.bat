@echo off
REM ============================================================================
REM Bifrost HTTP Gateway - Windows x64 Release Build Script
REM ============================================================================
REM This script builds a production-ready Windows x64 executable with:
REM - Static linking (no external DLL dependencies)
REM - Stripped debug symbols (smaller binary)
REM - Optimized compilation flags
REM ============================================================================

setlocal EnableDelayedExpansion

REM Configuration
set VERSION=1.0.0
set BUILD_DIR=%~dp0..\tmp
set OUTPUT_NAME=bifrost-http.exe
set SOURCE_DIR=%~dp0..\transports\bifrost-http

REM Colors for output
set "GREEN=[32m"
set "YELLOW=[33m"
set "CYAN=[36m"
set "RESET=[0m"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     Bifrost HTTP Gateway - Windows x64 Release Build      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Go is installed
where go >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%ERROR: Go is not installed or not in PATH%RESET%
    echo Please install Go 1.26.1 or later from https://go.dev/dl/
    exit /b 1
)

REM Check Go version
for /f "tokens=3" %%i in ('go version') do set GO_VERSION=%%i
echo %CYAN%Go version: !GO_VERSION!%RESET%

REM Check if Node.js is installed (needed for UI build)
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%WARNING: Node.js is not installed. UI will not be built.%RESET%
    echo To include the UI, install Node.js from https://nodejs.org/
    set BUILD_UI=false
) else (
    set BUILD_UI=true
)

REM Create build directory
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

REM Build UI if Node.js is available
if "!BUILD_UI!"=="true" (
    echo.
    echo %CYAN%Building UI...%RESET%
    cd /d "%~dp0..\ui"
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo %YELLOW%WARNING: npm install failed, continuing without UI%RESET%
        set BUILD_UI=false
    ) else (
        call npm run build
        if %ERRORLEVEL% neq 0 (
            echo %YELLOW%WARNING: npm build failed, continuing without UI%RESET%
            set BUILD_UI=false
        ) else (
            call npm run copy-build
            if %ERRORLEVEL% neq 0 (
                echo %YELLOW%WARNING: npm copy-build failed, continuing without UI%RESET%
                set BUILD_UI=false
            ) else (
                echo %GREEN%UI built successfully%RESET%
            )
        )
    )
    cd /d "%~dp0.."
)

REM Set build environment
echo.
echo %CYAN%Configuring build environment...%RESET%
set CGO_ENABLED=1

REM Display build configuration
echo.
echo %CYAN%Build Configuration:%RESET%
echo   Target OS:        windows (native)
echo   Target Arch:      amd64 (native)
echo   CGO:              %CGO_ENABLED%
echo   Version:          v%VERSION%
echo   Output:           %BUILD_DIR%\%OUTPUT_NAME%
echo.

REM Build the binary
echo %CYAN%Building bifrost-http.exe with static linking...%RESET%
echo.

cd /d "%SOURCE_DIR%"

REM Run go mod tidy first to ensure dependencies are in sync
echo %CYAN%Syncing dependencies...%RESET%
cd /d "%~dp0..\transports"
call go mod tidy
if %ERRORLEVEL% neq 0 (
    echo %RED%ERROR: go mod tidy failed!%RESET%
    exit /b 1
)
cd /d "%SOURCE_DIR%"

REM Use static linking for production build
REM On Windows, we don't set GOOS/GOARCH as we're building natively
echo %CYAN%Compiling bifrost-http.exe...%RESET%
go build ^
    -ldflags="-w -s -X main.Version=v%VERSION%" ^
    -a -trimpath ^
    -tags "sqlite_static" ^
    -o "%BUILD_DIR%\%OUTPUT_NAME%" ^
    .

if %ERRORLEVEL% neq 0 (
    echo.
    echo %RED%ERROR: Build failed!%RESET%
    echo Check the error messages above for details.
    echo.
    echo Common issues:
    echo   - Missing C compiler (install Visual Studio Build Tools)
    echo   - Missing Go dependencies (run: go mod tidy)
    echo   - CGO configuration issues
    exit /b 1
)

cd /d "%~dp0.."

REM Display build results
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    Build Successful!                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo %GREEN%Binary created:%RESET% %BUILD_DIR%\%OUTPUT_NAME%
echo.

REM Show file size
for %%A in ("%BUILD_DIR%\%OUTPUT_NAME%") do (
    set FILE_SIZE=%%~zA
    set /a FILE_SIZE_MB=%%~zA/1048576
)
echo %CYAN%File size:%RESET% !FILE_SIZE_MB! MB (!FILE_SIZE! bytes)
echo.

REM Show file info if sigcheck is available, otherwise use dir
echo %CYAN%File details:%RESET%
dir "%BUILD_DIR%\%OUTPUT_NAME%" | findstr /C:"%OUTPUT_NAME%"
echo.

echo %YELLOW%Next steps:%RESET%
echo   1. Copy config.json to the same directory as the executable
echo   2. Set required environment variables (API keys, etc.)
echo   3. Run: bifrost-http.exe -app-dir .\data -port 8080
echo.
echo %CYAN%To test the build:%RESET%
echo   cd %BUILD_DIR%
echo   .\%OUTPUT_NAME% -help
echo.

endlocal
