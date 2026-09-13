import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json() as { name: string };
  const userId = (session.user as Record<string, unknown>).id as string;

  const key = `mg_${uuidv4().replace(/-/g, '')}`;
  const apiKey = await prisma.apiKey.create({
    data: {
      key,
      name: name ?? 'Default',
      userId,
    },
  });

  return NextResponse.json({ id: apiKey.id, key, name: apiKey.name }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, createdAt: true, lastUsed: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(keys);
}
