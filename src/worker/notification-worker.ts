import { sendNotification } from '@/lib/notifications';
import { NotificationPayload } from '@/lib/queue';

export async function processNotificationJob(job: { data: NotificationPayload }) {
  const { recipientType, recipientId, title, message, link, email } = job.data;
  console.log(`[Notification Worker] Dispatching alert to ${recipientType} ${recipientId}: "${title}"`);

  await sendNotification({
    recipientType,
    recipientId,
    title,
    message,
    link,
    customerEmail: email,
  });
}
