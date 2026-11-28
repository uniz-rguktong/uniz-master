# UniZ Landing Page Backend (`uniz-landing-backend`)

FastAPI CMS and public institutional content API (`Uniz-Landing-Page-API`) backing [`rguktong.in`](https://rguktong.in) and gateway-proxied CMS/analytics routes.

## Architecture

- **Framework:** FastAPI + Starlette + Uvicorn (`main.py`, Python 3.11+)
- **Database:** SQLAlchemy async (`asyncpg` / `aiosqlite`)
- **Caching:** `PublicEdgeCacheMiddleware` for cache-friendly `GET` / `HEAD` responses
- **CORS:** Allows `https://uniz.rguktong.in`, `https://rguktong.in`, and local development origins
- **API Routers:**
  - `home` (`/`) & health endpoints
  - `preview` (`/api/preview`)
  - `institute` (`/api/institute`)
  - `academics` (`/api/academics`)
  - `departments` (`/api/departments`)
  - `notifications` (`/api/notifications`)
  - `analytics` (`/api/analytics`, exposed via gateway at `/api/v1/analytics/*`)

## Local Development

```bash
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or run via root Docker Compose (see [`../../docker/README.md`](../../docker/README.md)).

> Part of [`uniz-master`](../../README.md).
