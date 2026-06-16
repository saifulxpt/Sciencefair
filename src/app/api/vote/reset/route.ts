import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.vote.deleteMany({});
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}
