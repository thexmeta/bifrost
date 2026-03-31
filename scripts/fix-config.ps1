$configPath = 'D:\Development\CodeMode\bifrost\bifrost-data\config.json'

# Read config
$json = Get-Content $configPath -Raw | ConvertFrom-Json

# Remove governance.providers array (not needed - providers are defined at root level)
if ($json.governance.psobject.Properties.Name -contains 'providers') {
    $json.governance.psobject.Properties.Remove('providers')
    Write-Host "✓ Removed governance.providers array"
}

# Save updated config
$json | ConvertTo-Json -Depth 20 | Set-Content $configPath -Encoding UTF8
Write-Host "✓ Config updated successfully"
