@echo off
REM Create self-signed code signing certificate and sign the binary
setlocal

set "OPENSSL=D:\Development\cygwin64\bin\openssl.exe"
set "SIGNTOOL=C:\Program Files (x86)\Windows Kits\10\App Certification Kit\signtool.exe"
set "BINARY=E:\Projects\Go\bifrost\tmp\bifrost-http.exe"
set "CERTDIR=E:\Projects\Go\bifrost\tmp\cert"

echo Creating certificate directory...
mkdir "%CERTDIR%" 2>nul

echo.
echo ============================================================
echo Step 1: Generate private key
echo ============================================================
"%OPENSSL%" genrsa -out "%CERTDIR%\codesign.key" 2048

echo.
echo ============================================================
echo Step 2: Create certificate request with Code Signing EKU
echo ============================================================
(
echo [req]
echo distinguished_name = req_distinguished_name
echo x509_extensions = v3_req
echo prompt = no
echo.
echo [req_distinguished_name]
echo CN = Bifrost Code Signing
echo O = Bifrost Project
echo C = US
echo.
echo [v3_req]
echo keyUsage = digitalSignature
echo extendedKeyUsage = codeSigning
echo basicConstraints = CA:FALSE
echo subjectKeyIdentifier = hash
) > "%CERTDIR%\openssl.cnf"

"%OPENSSL%" req -new -key "%CERTDIR%\codesign.key" -out "%CERTDIR%\codesign.csr" -config "%CERTDIR%\openssl.cnf"

echo.
echo ============================================================
echo Step 3: Generate self-signed certificate
echo ============================================================
"%OPENSSL%" x509 -req -days 365 -in "%CERTDIR%\codesign.csr" -signkey "%CERTDIR%\codesign.key" -out "%CERTDIR%\codesign.crt" -extensions v3_req -extfile "%CERTDIR%\openssl.cnf"

echo.
echo ============================================================
echo Step 4: Convert to PFX
echo ============================================================
"%OPENSSL%" pkcs12 -export -out "%CERTDIR%\codesign.pfx" -inkey "%CERTDIR%\codesign.key" -in "%CERTDIR%\codesign.crt" -passout pass:

echo.
echo ============================================================
echo Step 5: Import certificate to Windows store
echo ============================================================
certutil -f -p "" -importuser "%CERTDIR%\codesign.pfx"

echo.
echo ============================================================
echo Step 6: Get certificate thumbprint
echo ============================================================
for /f "tokens=2 delims==" %%a in ('certutil -store -user MY ^| findstr /C:"Bifrost"') do set "SUBJECT=%%a"

certutil -store -user MY | findstr /C:"Bifrost" /A:8

echo.
echo ============================================================
echo Step 7: Sign the binary
echo ============================================================
REM Try signing with the imported certificate
"%SIGNTOOL%" sign /fd SHA256 /a /tr http://timestamp.globalsign.com/tsa/r6advanced1 /td SHA256 "%BINARY%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo Signing successful!
    echo ============================================================
    "%SIGNTOOL%" verify /pa /v "%BINARY%"
) else (
    echo.
    echo Signing failed. Manual intervention required.
    echo Please import the PFX manually and re-run signing.
    echo PFX location: %CERTDIR%\codesign.pfx
)

echo.
echo ============================================================
echo Certificate files created in: %CERTDIR%
echo ============================================================
echo   codesign.key  - Private key
echo   codesign.crt  - Certificate
echo   codesign.pfx  - PFX for import
echo ============================================================

endlocal
