# Architecture

```
┌─────────────────────┐
│  Nginx Reverse      │  Port 80
│  Proxy              │  (Tailscale Funnel)
└──────────┬──────────┘
           │
           ├──> /api/v1/* ──────> Sync Service
           │                        ├─ Port 8000 (aiohttp)
           │                        │  - Health check JSON
           │                        │  - Root status alias
           │                        │
           │                        └─ Port 8001 (FastAPI)
           │                           - All API endpoints
           │
           └──> /* ───────────────> Firefly III (Port 8080)
```
