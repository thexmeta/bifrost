# Import PFX and sign the binary
$PFX = "E:\Projects\Go\bifrost\tmp\cert\codesign.pfx"
$BINARY = "E:\Projects\Go\bifrost\tmp\bifrost-http.exe"
$SIGNTOOL = "C:\Program Files (x86)\Windows Kits\10\App Certification Kit\signtool.exe"

# Create empty secure string for password (our PFX has no password)
$sec = New-Object System.Security.SecureString

Write-Host "Importing PFX certificate..."
Import-PfxCertificate -FilePath $PFX -CertStoreLocation "Cert:\CurrentUser\My" -Password $sec -Exportable

Write-Host "Listing imported certificates..."
Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { $_.Subject -match "Bifrost" } | Select-Object Subject, Thumbprint

Write-Host "Attempting to sign binary..."
& $SIGNTOOL sign /fd SHA256 /a /tr http://timestamp.globalsign.com/tsa/r6advanced1 /td SHA256 $BINARY

if ($LASTEXITCODE -eq 0) {
    Write-Host "Signing successful!" -ForegroundColor Green
    & $SIGNTOOL verify /pa $BINARY
} else {
    Write-Host "Signing failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
