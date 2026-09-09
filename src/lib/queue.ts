import { PgBoss } from 'pg-boss';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const QUEUE_NAMES = {
  MEDIA_PROCESSING: 'media-processing',
  PRINT_JOB: 'print-job',
  NOTIFICATION: 'notification',
  DELIVERY: 'delivery',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

export interface MediaProcessingPayload {
  printJobId: string;
  orderId: string;
  orderItemId: string;
  rawAssetKey: string;
  targetSize: string; // e.g. "SIZE_4X6"
  paperType: string;  // e.g. "GLOSSY"
  finish: string;     // e.g. "BORDERLESS"
  cropRotation?: number;
  cropAspect?: string;
}

export interface PrintJobPayload {
  printJobId: string;
  orderId: string;
  studioId: string;
  jobDocketNumber: string;
}

export interface NotificationPayload {
  recipientType: 'CUSTOMER' | 'STUDIO' | 'SUPER_ADMIN';
  recipientId: string;
  title: string;
  message: string;
  link?: string;
  email?: string;
}

export interface DeliveryPayload {
  orderId: string;
  deliveryMethod: 'PICKUP' | 'DELIVERY';
  action: 'DISPATCH_COURIER' | 'GENERATE_PICKUP_PIN' | 'NOTIFY_OUT_FOR_DELIVERY' | 'CONFIRM_DELIVERY';
  metadata?: Record<string, unknown>;
}

let bossInstance: PgBoss | null = null;
let isStarting = false;

/**
 * Retrieves or initializes the shared PgBoss instance.
 */
export async function getBoss(): Promise<PgBoss | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[pg-boss] DATABASE_URL is not set. Background queuing will operate in deferred mode.');
    return null;
  }

  if (bossInstance) {
    return bossInstance;
  }

  if (isStarting) {
    // Wait briefly if already starting
    await new Promise((res) => setTimeout(res, 500));
    if (bossInstance) return bossInstance;
  }

  try {
    isStarting = true;
    // Neon connection pooler safe configuration for pg-boss
    const boss = new PgBoss({
      connectionString,
      application_name: 'chitrabazaar-boss',
      max: 5,
      ssl: connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    });

    boss.on('error', (err: any) => {
      console.error('[pg-boss error]', err);
    });

    await boss.start();
    console.log('[pg-boss] Durable queue supervisor started successfully');

    // Register all platform queues
    for (const queueName of Object.values(QUEUE_NAMES)) {
      try {
        await boss.createQueue(queueName);
      } catch {
        // Queue exists
      }
    }

    bossInstance = boss;
    return bossInstance;
  } catch (error) {
    console.error('[pg-boss] Failed to connect or start durable queue:', error);
    return null;
  } finally {
    isStarting = false;
  }
}

/**
 * Enqueue a media preflight & 300 DPI master rendering job.
 */
export async function enqueueMediaProcessing(payload: MediaProcessingPayload): Promise<string | null> {
  try {
    const boss = await getBoss();
    if (!boss) {
      console.warn(`[Queue: ${QUEUE_NAMES.MEDIA_PROCESSING}] Queuing skipped (no boss instance)`);
      return null;
    }
    const jobId = await boss.send(QUEUE_NAMES.MEDIA_PROCESSING, payload, {
      retryLimit: 3,
      retryDelay: 30,
      expireInSeconds: 300,
    });
    return jobId;
  } catch (err) {
    console.error(`[Queue: ${QUEUE_NAMES.MEDIA_PROCESSING}] Enqueue failed:`, err);
    return null;
  }
}

/**
 * Enqueue a darkroom print plate job dispatch.
 */
export async function enqueuePrintJob(payload: PrintJobPayload): Promise<string | null> {
  try {
    const boss = await getBoss();
    if (!boss) return null;
    return await boss.send(QUEUE_NAMES.PRINT_JOB, payload, {
      retryLimit: 5,
      retryDelay: 60,
    });
  } catch (err) {
    console.error(`[Queue: ${QUEUE_NAMES.PRINT_JOB}] Enqueue failed:`, err);
    return null;
  }
}

/**
 * Enqueue a notification dispatch (Email / Live stream / Dashboard).
 */
export async function enqueueNotification(payload: NotificationPayload): Promise<string | null> {
  try {
    const boss = await getBoss();
    if (!boss) return null;
    return await boss.send(QUEUE_NAMES.NOTIFICATION, payload, {
      retryLimit: 3,
      retryDelay: 15,
    });
  } catch (err) {
    console.error(`[Queue: ${QUEUE_NAMES.NOTIFICATION}] Enqueue failed:`, err);
    return null;
  }
}

/**
 * Enqueue a delivery task (Pickup PIN issuance, courier dispatch, handover sync).
 */
export async function enqueueDeliveryTask(payload: DeliveryPayload): Promise<string | null> {
  try {
    const boss = await getBoss();
    if (!boss) return null;
    return await boss.send(QUEUE_NAMES.DELIVERY, payload, {
      retryLimit: 3,
      retryDelay: 60,
    });
  } catch (err) {
    console.error(`[Queue: ${QUEUE_NAMES.DELIVERY}] Enqueue failed:`, err);
    return null;
  }
}

/**
 * Transactional Enqueue:
 * Attempts to insert a job into pgboss.job in the EXACT SAME ACID transaction as Prisma writes.
 * If pgboss schema is not yet bootstrapped, falls back to sending via boss.send after transaction commits.
 */
export async function transactionalEnqueueJob(
  tx: Prisma.TransactionClient,
  queueName: QueueName,
  data: Record<string, unknown>
): Promise<void> {
  try {
    await tx.$executeRaw`
      INSERT INTO pgboss.job (name, data, state)
      VALUES (${queueName}, ${JSON.stringify(data)}::jsonb, 'created')
    `;
  } catch {
    // If table doesn't exist yet or boss schema isn't present in this migration state,
    // schedule via background queue helper after transaction completion
    setImmediate(async () => {
      const boss = await getBoss();
      if (boss) {
        await boss.send(queueName, data);
      }
    });
  }
}
