## Key PromQL Queries

- API count per route (rate):
  ```promql
  sum by (path) (rate(app_http_requests_total[5m]))
  ```

- Error rate (5xx) per route:
  ```promql
  sum by (path) (rate(app_http_errors_total[5m]))
  ```

- Latency P50/P90/P99 by route:
  ```promql
  histogram_quantile(0.5, sum by (le, path) (rate(app_http_request_duration_seconds_bucket[5m])))
  ```
  ```promql
  histogram_quantile(0.9, sum by (le, path) (rate(app_http_request_duration_seconds_bucket[5m])))
  ```
  ```promql
  histogram_quantile(0.99, sum by (le, path) (rate(app_http_request_duration_seconds_bucket[5m])))
  ```

- Global error ratio:
  ```promql
  sum(rate(app_http_errors_total[5m])) / sum(rate(app_http_requests_total[5m]))
  ```

- Requests by status_code:
  ```promql
  sum by (status_code) (rate(app_http_requests_total[5m]))
  ```

## Grafana Panels

- Stat: Total RPS (sum over all paths)
- Table: RPS by path
- Time series: Error rate (%)
- Time series: P50/P90/P99 latency by path
- Table: Request count by status_code


