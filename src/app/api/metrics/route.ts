import { NextResponse } from 'next/server';
import { register } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metricsData = await register.metrics();
    return new NextResponse(metricsData, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to export metrics:', error);
    return new NextResponse('Internal Server Error collecting metrics', { status: 500 });
  }
}
