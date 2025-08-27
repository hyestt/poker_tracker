package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Exported Prometheus handler for /metrics endpoint
var Handler http.Handler = promhttp.Handler()

var (
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "app_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status_code"},
	)

	httpRequestDurationSeconds = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "app_http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path", "status_code"},
	)

	httpErrorsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "app_http_errors_total",
			Help: "Total number of HTTP requests that resulted in 5xx errors",
		},
		[]string{"method", "path", "status_code"},
	)
)

// statusRecorder wraps http.ResponseWriter to capture status code and bytes written
type statusRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

// WithMetrics instruments a handler with request count, latency, and error rate
func WithMetrics(path string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		recorder := &statusRecorder{ResponseWriter: w, statusCode: http.StatusOK}

		next(recorder, r)

		statusCode := recorder.statusCode
		labels := prometheus.Labels{
			"method":      r.Method,
			"path":        path,
			"status_code": strconv.Itoa(statusCode),
		}

		httpRequestsTotal.With(labels).Inc()
		httpRequestDurationSeconds.With(labels).Observe(time.Since(start).Seconds())

		if statusCode >= 500 {
			httpErrorsTotal.With(labels).Inc()
		}
	}
}
