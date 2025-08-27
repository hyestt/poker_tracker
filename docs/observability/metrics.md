# Metrics status

## Backend
- Exposes Prometheus metrics at `/metrics`.
- Middleware instruments all API routes with labels: `method`, `path`, `status_code`.
- Metrics:
  - `app_http_requests_total`
  - `app_http_request_duration_seconds_bucket` (+ `_sum`, `_count`)
  - `app_http_errors_total` (5xx only)

Code refs:
- Go middleware: `be_poker/metrics/metrics.go`
- Routes registration with instrumentation: `be_poker/routes/routes.go`

## Observability assets
- Grafana Alloy example config: `docs/observability/ALLOY_CONFIG.river`
- PromQL examples: `docs/observability/PROMQL.md`

## Railway + Grafana Cloud plan
1) Create a new Railway Worker service using image `grafana/alloy:latest`.
2) Set env vars:
   - `GRAFANA_RW_URL` = Remote write endpoint (`/api/prom/push`)
   - `GRAFANA_RW_USERNAME` = Instance ID (User)
   - `GRAFANA_RW_PASSWORD` = API key with metrics:write
   - `BACKEND_ADDR` = `<backend-service-name>:8080` (e.g., `poker:8080`)
3) Paste the Start command from the README snippet (same as in `ALLOY_CONFIG.river` content).
4) Deploy and verify in Grafana Cloud → Explore with `app_http_requests_total`.

## Security (optional)
- Consider protecting `/metrics` via header token; if enabled, update Alloy scrape auth in config.

## Current status
- Backend metrics integrated and built successfully.
- Local `/metrics` endpoint returns data.
- Pending in Railway: create Alloy Worker, set env vars, deploy.
- Pending in Grafana Cloud: confirm series ingest and build dashboards.


