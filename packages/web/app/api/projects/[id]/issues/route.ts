import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ScanResult } from '@modelguard/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: apiKey.userId },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const scan = project.scans[0];
  if (!scan) {
    return NextResponse.json({ issues: [] });
  }

  const result = scan.result as unknown as ScanResult;
  return NextResponse.json({ issues: result.issues ?? [] });
}
