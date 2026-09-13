import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
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
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await request.json();
  const { issueIndex, resolution } = body as { issueIndex: number; resolution: string };

  return NextResponse.json({
    projectId: params.id,
    issueIndex,
    resolution,
    resolvedAt: new Date().toISOString(),
  });
}
