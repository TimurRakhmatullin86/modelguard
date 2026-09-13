import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { severityColor, statusBadge } from '@/lib/utils';
import type { ScanResult, ComplianceIssue, DetectedModel } from '@modelguard/shared';

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
  return project;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);
  if (!project) notFound();

  const latestScan = project.scans[0];
  const scanResult = latestScan?.result as unknown as ScanResult | undefined;
  const summary = (latestScan?.summary as Record<string, number>) ?? {};
  const models = scanResult?.models ?? [];
  const issues = scanResult?.issues ?? [];
  const badge = statusBadge(summary.violations ?? 0, summary.warnings ?? 0);

  const issuesByModel = new Map<string, ComplianceIssue[]>();
  for (const issue of issues) {
    const existing = issuesByModel.get(issue.modelId) ?? [];
    existing.push(issue);
    issuesByModel.set(issue.modelId, existing);
  }

  return (
    <div>
      <div className="mb-6">
        <a href="/" className="text-sm text-blue-600 hover:underline">&larr; Back to Dashboard</a>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            Use case: {project.useCase}{project.mau ? ` | MAU: ${project.mau.toLocaleString()}` : ''}
            {project.productName ? ` | Product: ${project.productName}` : ''}
          </p>
        </div>
        {latestScan && (
          <p className="text-sm text-gray-500">
            Last scan: {new Date(latestScan.createdAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Models</p>
          <p className="text-2xl font-bold text-gray-900">{summary.totalModels ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600">Compliant</p>
          <p className="text-2xl font-bold text-green-600">{summary.compliant ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-600">Warnings</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.warnings ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600">Violations</p>
          <p className="text-2xl font-bold text-red-600">{summary.violations ?? 0}</p>
        </div>
      </div>

      {/* Models list */}
      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detected Models</h2>
        </div>
        {models.length === 0 ? (
          <p className="p-6 text-gray-500">No models detected in latest scan.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {models.map((model, i) => {
              const modelIssues = issuesByModel.get(model.id) ?? [];
              const hasError = modelIssues.some(i => i.severity === 'error');
              const hasWarning = modelIssues.some(i => i.severity === 'warning');

              return (
                <a
                  key={`${model.id}-${i}`}
                  href={`/projects/${project.id}/models/${encodeURIComponent(model.id)}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${hasError ? 'bg-red-500' : hasWarning ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <span className="font-medium text-gray-900">{model.name}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span>Source: {model.source}</span>
                      <span>License: {model.resolvedLicense ?? 'unknown'}</span>
                      <span>File: {model.filePath}{model.line ? `:${model.line}` : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasError && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        {modelIssues.filter(i => i.severity === 'error').length} error(s)
                      </span>
                    )}
                    {hasWarning && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        {modelIssues.filter(i => i.severity === 'warning').length} warning(s)
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Issues list */}
      {issues.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Issues</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[...issues]
              .sort((a, b) => {
                const order = { error: 0, warning: 1, info: 2 };
                return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3);
              })
              .map((issue, i) => (
                <div key={i} className={`px-6 py-4 border-l-4 ${severityColor(issue.severity)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{issue.message}</p>
                      <p className="text-sm mt-1 opacity-75">
                        Model: {issue.modelId} | License: {issue.licenseName}
                      </p>
                      <p className="text-sm mt-2">
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                      issue.severity === 'error' ? 'bg-red-100 text-red-800' :
                      issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Scan history */}
      {project.scans.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Scan History</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {project.scans.map((scan) => {
              const s = scan.summary as Record<string, number>;
              return (
                <div key={scan.id} className="px-6 py-3 flex justify-between items-center text-sm">
                  <span className="text-gray-600">{new Date(scan.createdAt).toLocaleString()}</span>
                  <div className="flex gap-4">
                    <span>Models: {s.totalModels ?? 0}</span>
                    <span className="text-red-600">Violations: {s.violations ?? 0}</span>
                    <span className="text-yellow-600">Warnings: {s.warnings ?? 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
