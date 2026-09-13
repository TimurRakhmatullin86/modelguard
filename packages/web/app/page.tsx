import { prisma } from '@/lib/prisma';
import { statusBadge } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { ScanResult } from '@modelguard/shared';

export const dynamic = 'force-dynamic';

async function getProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');
  const userId = (session.user as Record<string, unknown>).id as string;
  const projects = await getProjects(userId);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor AI model license compliance across your projects</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">Upload your first scan result to get started.</p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm text-left inline-block">
            <code>npx modelguard scan ./my-project --format json &gt; scan.json{'\n'}curl -X POST https://your-instance/api/scan \{'\n'}  -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \{'\n'}  -d @scan.json</code>
          </pre>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const scan = project.scans[0];
            const summary = (scan?.summary as Record<string, number>) ?? { totalModels: 0, violations: 0, warnings: 0 };
            const badge = statusBadge(summary.violations ?? 0, summary.warnings ?? 0);

            return (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Use case: {project.useCase}{project.mau ? ` | MAU: ${project.mau.toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {scan && (
                      <p>Last scan: {new Date(scan.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {scan && (
                  <div className="mt-4 flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Models: </span>
                      <span className="font-medium">{summary.totalModels}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Compliant: </span>
                      <span className="font-medium">{summary.compliant ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-yellow-600">Warnings: </span>
                      <span className="font-medium">{summary.warnings ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-red-600">Violations: </span>
                      <span className="font-medium">{summary.violations ?? 0}</span>
                    </div>
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
