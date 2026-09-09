import prisma from '@/lib/prisma';
import { RecipientType } from '@prisma/client';

/**
 * ARCHITECTURAL NOTE:
 * We deliberately use Server-Sent Events (SSE) paired with a 4-second polling fallback
 * for real-time order notifications in v1.
 * 
 * Reason:
 * - Unidirectional server -> client push is lightweight, robust, and works natively in HTTP/1.1 and HTTP/2
 *   without requiring persistent WebSocket servers or third-party paid subscriptions.
 * - If bidirectional interactive features (e.g. live studio <-> customer chat or collaborative editing)
 *   are introduced in future iterations, a bidirectional transport (such as WebSockets via Pusher/Ably)
 *   will be implemented to replace or augment this layer.
 */

type ListenerCallback = (data: unknown) => void;

class NotificationBroadcaster {
  private listeners: Map<string, Set<ListenerCallback>> = new Map();

  subscribe(recipientId: string, callback: ListenerCallback) {
    if (!this.listeners.has(recipientId)) {
      this.listeners.set(recipientId, new Set());
    }
    this.listeners.get(recipientId)!.add(callback);

    return () => {
      const set = this.listeners.get(recipientId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(recipientId);
        }
      }
    };
  }

  broadcast(recipientId: string, data: unknown) {
    // Specific recipient
    const set = this.listeners.get(recipientId);
    if (set) {
      set.forEach((cb) => cb(data));
    }
    // Global broadcast listeners
    const globalSet = this.listeners.get('ALL');
    if (globalSet && recipientId !== 'ALL') {
      globalSet.forEach((cb) => cb(data));
    }
  }
}

export const notificationBroadcaster = new NotificationBroadcaster();

export interface CreateNotificationParams {
  recipientType: RecipientType;
  recipientId: string;
  title: string;
  message: string;
  link?: string;
  customerEmail?: string;
}

export async function sendNotification(params: CreateNotificationParams) {
  try {
    // 1. Persist notification to PostgreSQL database
    const notification = await prisma.notification.create({
      data: {
        recipientType: params.recipientType,
        recipientId: params.recipientId,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });

    // 2. Push event to live SSE listeners
    notificationBroadcaster.broadcast(params.recipientId, notification);
    if (params.recipientType === RecipientType.SUPER_ADMIN) {
      notificationBroadcaster.broadcast('ALL_ADMINS', notification);
    }

    // 3. Email Backup Dispatcher (Simulated console delivery for development/audit)
    console.log(
      `📧 [EMAIL NOTIFICATION SENT] To: ${params.customerEmail || params.recipientId} | Subject: "${params.title}" | Body: "${params.message}"`
    );

    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return null;
  }
}
