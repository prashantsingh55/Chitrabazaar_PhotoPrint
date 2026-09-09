import prisma from '@/lib/prisma';
import { PrintJobPayload } from '@/lib/queue';

export async function processPrintJob(job: { data: PrintJobPayload }) {
  const { printJobId, orderId, studioId, jobDocketNumber } = job.data;
  console.log(`[PrintJob Worker] Dispatching Docket ${jobDocketNumber} to Studio ${studioId}`);

  const studio = await prisma.photoStudio.findUnique({
    where: { id: studioId },
    select: { name: true, email: true },
  });

  if (!studio) {
    console.warn(`[PrintJob Worker] Assigned studio ${studioId} not found`);
    return;
  }

  // Record audit log or telemetry
  console.log(`[PrintJob Worker] Docket ${jobDocketNumber} confirmed at ${studio.name}`);
}
