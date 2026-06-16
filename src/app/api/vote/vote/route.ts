import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const name = data.name?.trim();
    const type = data.type;

    if (name && (type === 'yes' || type === 'no')) {
      await prisma.vote.create({
        data: {
          name: name,
          type: type
        }
      });
      return NextResponse.json({ status: 'success' });
    } else {
      return NextResponse.json({ status: 'invalid' });
    }
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}
