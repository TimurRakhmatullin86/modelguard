import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: authHeader.slice(7) },
  });

  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId: apiKey.userId },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { summary: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(projects);
}
