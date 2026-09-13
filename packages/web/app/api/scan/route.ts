import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { ScanResult } from '@modelguard/shared';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    const apiKeyValue = authHeader.slice(7);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: apiKeyValue },
      include: { user: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    const body = await request.json() as ScanResult;

    if (!body.directory || !body.models || !body.issues || !body.summary) {
      return NextResponse.json({ error: 'Invalid scan result format' }, { status: 400 });
    }

    const projectName = body.directory.split('/').pop() ?? body.directory;
    let project = await prisma.project.findFirst({
      where: {
        userId: apiKey.userId,
        name: projectName,
      },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectName,
          useCase: body.config?.useCase ?? 'commercial',
          mau: body.config?.mau,
          productName: body.config?.productName,
          userId: apiKey.userId,
        },
      });
    }

    const scan = await prisma.scan.create({
      data: {
        projectId: project.id,
        result: JSON.parse(JSON.stringify(body)) as Prisma.InputJsonValue,
        summary: JSON.parse(JSON.stringify(body.summary)) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      id: scan.id,
      projectId: project.id,
      summary: body.summary,
    }, { status: 201 });
  } catch (err) {
    console.error('Scan upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
