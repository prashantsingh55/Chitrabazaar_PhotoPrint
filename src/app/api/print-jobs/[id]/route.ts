import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PrintJobStatus, OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, studioId } = session.user;
    const printJobId = params.id;
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(PrintJobStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid print job status' }, { status: 400 });
    }

    const printJob = await prisma.printJob.findUnique({
      where: { id: printJobId },
      include: { order: { include: { printJobs: true } } },
    });

    if (!printJob) {
      return NextResponse.json({ error: 'Print job not found' }, { status: 404 });
    }

    if (role === 'STUDIO_ADMIN' && printJob.studioId !== studioId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedJob = await prisma.printJob.update({
      where: { id: printJobId },
      data: { status },
    });

    // Check if all print jobs for this order are completed
    if (status === PrintJobStatus.COMPLETED) {
      const allJobs = await prisma.printJob.findMany({
        where: { orderId: printJob.orderId },
      });
      const allDone = allJobs.every((j) => j.status === PrintJobStatus.COMPLETED);
      if (allDone) {
        await prisma.order.update({
          where: { id: printJob.orderId },
          data: { status: OrderStatus.READY },
        });
      }
    }

    return NextResponse.json({ success: true, printJob: updatedJob });
  } catch (error) {
    console.error('Failed to update print job status:', error);
    return NextResponse.json({ error: 'Failed to update print job' }, { status: 500 });
  }
}
