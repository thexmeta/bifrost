$configPath = 'D:\Development\CodeMode\bifrost\bifrost-data\config.json'

# Read existing config
$json = Get-Content $configPath -Raw | ConvertFrom-Json -Depth 20

# Add providers section if missing
if (-not $json.providers) {
    $json | Add-Member -NotePropertyName 'providers' -NotePropertyValue @{}
}

# Add nvidia-nim provider
$json.providers | Add-Member -NotePropertyName 'nvidia-nim' -NotePropertyValue @{
    'network_config' = @{
        'base_url' = 'https://integrate.api.nvidia.com'
        'default_request_timeout_in_seconds' = 120
        'max_retries' = 3
        'retry_backoff_initial' = 1000
        'retry_backoff_max' = 10000
    }
    'custom_provider_config' = @{
        'base_provider_type' = 'openai'
        'is_key_less' = $false
        'allowed_requests' = @{
            'chat_completion' = $true
            'chat_completion_stream' = $true
            'embedding' = $true
        }
    }
    'keys' = @(
        @{
            'name' = 'nim-main'
            'value' = 'env.NVIDIA_NIM_API_KEY'
            'models' = @('z-ai/glm4.7', 'qwen/qwen3-coder-480b-a35b-instruct', 'qwen/qwen3.5-122b-a10b', 'nvidia/nv-embed-v1', 'nvidia/nv-embedcode-7b-v1', 'google/gemma-3-27b-it', 'deepseek-ai/deepseek-v3.2', 'deepseek-ai/deepseek-v3.1-terminus', 'qwen/qwen2.5-coder-7b-instruct', 'qwen/qwq-32b')
            'weight' = 1.0
        },
        @{
            'name' = 'nim-glm5-key'
            'value' = 'env.NIM_GLM_API_KEY'
            'models' = @('z-ai/glm5')
            'weight' = 1.0
        },
        @{
            'name' = 'nim-minimax-key'
            'value' = 'env.NIM_MINIMAX_API_KEY'
            'models' = @('minimaxai/minimax-m2.5')
            'weight' = 1.0
        },
        @{
            'name' = 'nim-kimi-k2i-key'
            'value' = 'env.NIM_KIMIK2I_API_KEY'
            'models' = @('moonshotai/kimi-k2-instruct')
            'weight' = 1.0
        },
        @{
            'name' = 'nim-kimi-k2t-key'
            'value' = 'env.NIM_KIMIK2T_API_KEY'
            'models' = @('moonshotai/kimi-k2-thinking')
            'weight' = 1.0
        }
    )
}

# Save updated config
$json | ConvertTo-Json -Depth 20 | Set-Content $configPath -Encoding UTF8

Write-Host "✓ Providers section added to config.json"
Write-Host "✓ nvidia-nim provider configured"
