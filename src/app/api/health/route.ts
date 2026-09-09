import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkR2Health } from '@/modules/storage/r2';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'unhealthy';
  let dbLatencyMs = 0;

  // 1. Check Neon PostgreSQL
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'healthy';
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 2. Check Cloudflare R2
  const r2Result = await checkR2Health();
  const r2Status = r2Result.ok ? 'healthy' : `error: ${r2Result.message}`;

  const isHealthy = dbStatus === 'healthy';
  const totalDurationMs = Date.now() - startTime;

  const responsePayload = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: totalDurationMs,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      storage: {
        status: r2Status,
        provider: process.env.STORAGE_PROVIDER || (r2Result.ok ? 'cloudflare-r2' : 'local'),
      },
    },
    system: {
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      },
    },
  };

  return NextResponse.json(responsePayload, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
