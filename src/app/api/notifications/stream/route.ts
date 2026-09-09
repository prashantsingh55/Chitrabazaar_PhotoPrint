import { NextRequest } from 'next/server';
import { notificationBroadcaster } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const recipientId = req.nextUrl.searchParams.get('recipientId');

  if (!recipientId) {
    return new Response('Missing recipientId', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`)
      );

      // Subscribe to broadcaster
      const unsubscribe = notificationBroadcaster.subscribe(recipientId, (data) => {
        try {
          const payload = `event: notification\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might have closed
        }
      });

      // Keepalive heartbeat every 20 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
