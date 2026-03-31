@echo off
REM Import PFX certificate using PowerShell and sign the binary
setlocal

set "BINARY=E:\Projects\Go\bifrost\tmp\bifrost-http.exe"
set "PFX=E:\Projects\Go\bifrost\tmp\cert\codesign.pfx"
set "SIGNTOOL=C:\Program Files (x86)\Windows Kits\10\App Certification Kit\signtool.exe"

echo Importing PFX certificate...
powershell -NoProfile -Command ^
    "$sec = New-Object System.Security.SecureString; ^
    Import-PfxCertificate -FilePath '%PFX%' -CertStoreLocation 'Cert:\CurrentUser\My' -Password $sec -Exportable"

echo.
echo Listing imported certificates...
certutil -store -user MY | findstr /C:"Bifrost" /C:"Thumbprint"

echo.
echo Attempting to sign...
"%SIGNTOOL%" sign /fd SHA256 /a /tr http://timestamp.globalsign.com/tsa/r6advanced1 /td SHA256 "%BINARY%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Signing successful!
    "%SIGNTOOL%" verify /pa "%BINARY%"
) else (
    echo.
    echo Signing failed.
    echo.
    echo Alternative: Use OpenSSL to create signature
    echo The binary is located at: %BINARY%
)

endlocal
