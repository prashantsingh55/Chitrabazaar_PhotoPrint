import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  CounterConfiguration,
  HistogramConfiguration,
} from 'prom-client';

// Global singleton Prometheus registry (persists across Next.js HMR reloads)
const globalForMetrics = global as unknown as {
  metricsRegistry: Registry;
  hasDefaultMetrics: boolean;
};

export const register = globalForMetrics.metricsRegistry || new Registry();

if (!globalForMetrics.metricsRegistry) {
  globalForMetrics.metricsRegistry = register;
}

if (!globalForMetrics.hasDefaultMetrics) {
  collectDefaultMetrics({ register, prefix: 'chitrabazaar_' });
  globalForMetrics.hasDefaultMetrics = true;
}

// Helpers to prevent duplicate registration errors during Next.js Hot Module Reloads
function getOrCreateCounter<T extends string>(config: CounterConfiguration<T>): Counter<T> {
  const existing = register.getSingleMetric(config.name) as Counter<T> | undefined;
  if (existing) return existing;
  return new Counter<T>({ ...config, registers: [register] });
}

function getOrCreateHistogram<T extends string>(config: HistogramConfiguration<T>): Histogram<T> {
  const existing = register.getSingleMetric(config.name) as Histogram<T> | undefined;
  if (existing) return existing;
  return new Histogram<T>({ ...config, registers: [register] });
}

// Business & Operational Metrics
export const httpRequestsTotal = getOrCreateCounter({
  name: 'chitrabazaar_http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = getOrCreateHistogram({
  name: 'chitrabazaar_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const ordersCreatedTotal = getOrCreateCounter({
  name: 'chitrabazaar_orders_created_total',
  help: 'Total number of customer print orders placed',
  labelNames: ['delivery_method'],
});

export const ordersPaidTotal = getOrCreateCounter({
  name: 'chitrabazaar_orders_paid_total',
  help: 'Total number of verified paid orders',
  labelNames: ['gateway'],
});

export const printJobsCreatedTotal = getOrCreateCounter({
  name: 'chitrabazaar_print_jobs_created_total',
  help: 'Total number of print plates dispatched to darkroom queues',
  labelNames: ['format', 'paper_type'],
});

export const printJobsCompletedTotal = getOrCreateCounter({
  name: 'chitrabazaar_print_jobs_completed_total',
  help: 'Total number of completed and inspected physical prints',
});

export const mediaProcessingDurationSeconds = getOrCreateHistogram({
  name: 'chitrabazaar_media_processing_duration_seconds',
  help: 'Time taken by Sharp SIMD pipeline to preflight and render 300 DPI master',
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
});
