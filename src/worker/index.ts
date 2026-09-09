import http from 'http';
import { getBoss, QUEUE_NAMES } from '@/lib/queue';
import { processMediaJob } from './media-processor';
import { processPrintJob } from './print-job-worker';
import { processNotificationJob } from './notification-worker';
import { processDeliveryJob } from './delivery-worker';

async function startWorker() {
  console.log('====================================================');
  console.log('  CHITRABAZAAR ASYNC BACKGROUND WORKER (Sharp/Boss) ');
  console.log('====================================================');

  // Start embedded lightweight HTTP health listener for Render Web Service compatibility
  const PORT = process.env.PORT || 10000;
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          worker: 'active',
          timestamp: new Date().toISOString(),
          queues: Object.values(QUEUE_NAMES),
        })
      );
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  healthServer.listen(PORT, () => {
    console.log(`[Worker Health Server] Listening on port ${PORT} (Probe target: /health)`);
  });
  console.log(`[Worker] Connecting to Neon Postgres durable queues...`);

  const boss = await getBoss();

  if (!boss) {
    console.error('[Worker Fatal] Unable to initialize pg-boss. Exiting.');
    process.exit(1);
  }

  // Ensure queues are registered in pg-boss catalog
  for (const queueName of Object.values(QUEUE_NAMES)) {
    try {
      await boss.createQueue(queueName);
    } catch {
      // Queue already registered or schema initialized
    }
  }

  // 1. Media Processing Worker (Sharp SIMD Preflight & 300 DPI Rendering)
  // Concurrency limited to 2 to prevent CPU starvation on ARM / Free Tier VM
  await boss.work(
    QUEUE_NAMES.MEDIA_PROCESSING,
    { batchSize: 2, localConcurrency: 1 },
    async (jobs: any[]) => {
      for (const job of jobs) {
        try {
          await processMediaJob(job as any);
        } catch (err) {
          console.error(`[Worker] Error processing media job ${job.id}:`, err);
          throw err;
        }
      }
    }
  );
  console.log(`[Worker] Subscribed to queue: ${QUEUE_NAMES.MEDIA_PROCESSING}`);

  // 2. Print Job Routing Worker
  await boss.work(
    QUEUE_NAMES.PRINT_JOB,
    { batchSize: 5, localConcurrency: 2 },
    async (jobs: any[]) => {
      for (const job of jobs) {
        try {
          await processPrintJob(job as any);
        } catch (err) {
          console.error(`[Worker] Error processing print job ${job.id}:`, err);
          throw err;
        }
      }
    }
  );
  console.log(`[Worker] Subscribed to queue: ${QUEUE_NAMES.PRINT_JOB}`);

  // 3. Notification Dispatch Worker
  await boss.work(
    QUEUE_NAMES.NOTIFICATION,
    { batchSize: 5, localConcurrency: 2 },
    async (jobs: any[]) => {
      for (const job of jobs) {
        try {
          await processNotificationJob(job as any);
        } catch (err) {
          console.error(`[Worker] Error processing notification ${job.id}:`, err);
          throw err;
        }
      }
    }
  );
  console.log(`[Worker] Subscribed to queue: ${QUEUE_NAMES.NOTIFICATION}`);

  // 4. Delivery & Transit Worker
  await boss.work(
    QUEUE_NAMES.DELIVERY,
    { batchSize: 5, localConcurrency: 2 },
    async (jobs: any[]) => {
      for (const job of jobs) {
        try {
          await processDeliveryJob(job as any);
        } catch (err) {
          console.error(`[Worker] Error processing delivery job ${job.id}:`, err);
          throw err;
        }
      }
    }
  );
  console.log(`[Worker] Subscribed to queue: ${QUEUE_NAMES.DELIVERY}`);

  console.log('[Worker] All durable queue consumers are active and listening.');

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}. Stopping workers gracefully...`);
    try {
      healthServer.close();
      await boss.stop({ graceful: true, timeout: 10000 });
      console.log('[Worker] All worker tasks drained. Shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('[Worker] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startWorker().catch((err) => {
  console.error('[Worker Fatal Error]', err);
  process.exit(1);
});
