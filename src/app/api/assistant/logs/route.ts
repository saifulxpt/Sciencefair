import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await prisma.aiLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    return NextResponse.json({ status: 'success', logs });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}
