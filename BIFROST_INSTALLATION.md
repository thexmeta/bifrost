# Bifrost AI Gateway - Debian x64 Release Build

## Installation Summary

✅ **Binary installed**: `/usr/local/bin/bifrost-http` (94 MB, statically linked)  
✅ **Config location**: `/etc/bifrost/config.json`  
✅ **Data directory**: `/var/lib/bifrost/`  
✅ **Systemd service**: `bifrost-http.service` (enabled)

## Quick Start

### 1. Configure Bifrost

Edit the configuration file:
```bash
sudo nano /etc/bifrost/config.json
```

**Key settings to configure:**
- Add your LLM provider API keys in the `providers` section
- Configure virtual keys for access control
- Set up teams and budgets if needed

### 2. Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl restart bifrost-http
sudo systemctl status bifrost-http
```

### 3. Verify Installation

Check if the service is running:
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status": "ok"}
```

### 4. Access the Web UI

Open your browser and navigate to:
```
http://localhost:8080
```

### 5. Test the API

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Build Script Usage

The build script supports multiple modes:

```bash
# Build only (creates binary in tmp/)
./scripts/build-debian-x64.sh build

# Install system-wide (requires sudo)
sudo ./scripts/build-debian-x64.sh install

# Create .deb package
./scripts/build-debian-x64.sh deb

# Build, install, and setup service (all-in-one)
sudo ./scripts/build-debian-x64.sh all
```

## Service Management

### View Logs
```bash
# Follow logs in real-time
sudo journalctl -u bifrost-http -f

# View last 100 lines
sudo journalctl -u bifrost-http -n 100 --no-pager
```

### Stop/Start/Restart
```bash
sudo systemctl stop bifrost-http
sudo systemctl start bifrost-http
sudo systemctl restart bifrost-http
```

### Disable Auto-Start
```bash
sudo systemctl disable bifrost-http
```

## Troubleshooting

### Service Won't Start

1. **Check logs**:
   ```bash
   sudo journalctl -u bifrost-http -n 50 --no-pager
   ```

2. **Common issues**:
   - **Qdrant connection refused**: Disable semantic caching in config.json or start Qdrant
   - **Port already in use**: Change the port in config.json or stop the conflicting service
   - **Config validation failed**: Ensure config.json matches the schema

3. **Test binary directly**:
   ```bash
   /usr/local/bin/bifrost-http -host 127.0.0.1 -port 9999 -app-dir /etc/bifrost
   ```

### Vector Store (Semantic Caching)

If you want to use semantic caching, you need a running vector store:

**Option 1: Qdrant**
```bash
docker run -p 6334:6334 qdrant/qdrant
```

**Option 2: Disable caching**
Edit `/etc/bifrost/config.json` and set:
```json
"caching": {
  "enabled": false
}
```

### Performance Tuning

Edit the systemd service file for Go runtime tuning:
```bash
sudo nano /etc/systemd/system/bifrost-http.service
```

Add environment variables:
```ini
[Service]
Environment=GOGC=200
Environment=GOMEMLIMIT=1800MiB
```

## File Locations

| Component | Path |
|-----------|------|
| Binary | `/usr/local/bin/bifrost-http` |
| Config | `/etc/bifrost/config.json` |
| Logs | `/var/lib/bifrost/logs/` |
| Systemd Service | `/etc/systemd/system/bifrost-http.service` |

## Architecture

- **Statically linked binary**: No external dependencies required
- **SQLite database**: Config and logs stored in SQLite (embedded)
- **Vector store**: Optional (Qdrant/Weaviate/Redis/Pinecone) for semantic caching
- **Web UI**: Next.js static export served by Bifrost
- **API**: OpenAI-compatible REST API on port 8080 (configurable)

## Version Information

- **Build version**: `transports/v1.4.22-20-gfae691263-dirty`
- **Build date**: April 12, 2026
- **Target**: Linux x86_64 (Debian/Ubuntu compatible)
- **Go version**: 1.24.4
- **Binary type**: ELF 64-bit LSB executable, statically linked

## Support

- **Documentation**: https://docs.getbifrost.ai
- **GitHub**: https://github.com/maximhq/bifrost
- **Discord**: https://discord.gg/exN5KAydbU
