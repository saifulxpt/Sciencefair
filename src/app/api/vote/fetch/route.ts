import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const yes_count = await prisma.vote.count({ where: { type: 'yes' } });
    const no_count = await prisma.vote.count({ where: { type: 'no' } });
    
    const feed = await prisma.vote.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: { name: true, type: true }
    });

    return NextResponse.json({
      yes: yes_count,
      no: no_count,
      feed: feed
    });
  } catch (error: any) {
    return NextResponse.json({
      yes: 0,
      no: 0,
      feed: [],
      error: error.message
    });
  }
}
