import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { severityColor } from '@/lib/utils';
import { getLicenseById, getLicenseForModel } from '@modelguard/shared';
import type { ScanResult, ComplianceIssue, DetectedModel } from '@modelguard/shared';

async function getProjectAndModel(projectId: string, modelId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!project || !project.scans[0]) return null;

  const scanResult = project.scans[0].result as unknown as ScanResult;
  const decodedModelId = decodeURIComponent(modelId);
  const model = scanResult.models.find(m => m.id === decodedModelId);
  const issues = scanResult.issues.filter(i => i.modelId === decodedModelId);

  return { project, model, issues };
}

export default async function ModelDetailPage({
  params,
}: {
  params: { id: string; modelId: string };
}) {
  const data = await getProjectAndModel(params.id, params.modelId);
  if (!data || !data.model) notFound();

  const { project, model, issues } = data;
  const license = getLicenseForModel(model.id);

  return (
    <div>
      <div className="mb-6">
        <a href={`/projects/${project.id}`} className="text-sm text-blue-600 hover:underline">
          &larr; Back to {project.name}
        </a>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{model.name}</h1>
      <p className="text-gray-500 mb-8">
        Source: {model.source} | File: {model.filePath}{model.line ? `:${model.line}` : ''}
      </p>

      {/* License info */}
      {license ? (
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">License: {license.name}</h2>
            {license.url && (
              <a href={license.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                View full license text &rarr;
              </a>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Commercial Use</p>
                <p className={`font-semibold ${license.commercial ? 'text-green-600' : 'text-red-600'}`}>
                  {license.commercial ? 'Allowed' : 'Not Allowed'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">SaaS Use</p>
                <p className={`font-semibold ${license.saas_allowed ? 'text-green-600' : 'text-red-600'}`}>
                  {license.saas_allowed ? 'Allowed' : 'Not Allowed'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Attribution</p>
                <p className={`font-semibold ${license.attribution_required ? 'text-yellow-600' : 'text-green-600'}`}>
                  {license.attribution_required ? 'Required' : 'Not Required'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Distribution</p>
                <p className="font-semibold text-gray-900">{license.derivative_distribution}</p>
              </div>
            </div>

            {license.commercial_conditions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Conditions</h3>
                <div className="space-y-2">
                  {license.commercial_conditions.map((cond, i) => (
                    <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800 capitalize">{cond.type.replace(/_/g, ' ')}</p>
                      {cond.value && <p className="text-sm text-yellow-700">Limit: {cond.value.toLocaleString()}</p>}
                      {cond.text && <p className="text-sm text-yellow-700">{cond.text}</p>}
                      {cond.restriction && <p className="text-sm text-yellow-700">{cond.restriction}</p>}
                      {cond.action && <p className="text-sm text-yellow-700">Action: {cond.action.replace(/_/g, ' ')}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {license.restricted_uses.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Restricted Uses</h3>
                <div className="flex flex-wrap gap-2">
                  {license.restricted_uses.map((use) => (
                    <span key={use} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                      {use.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {license.notes && (
              <p className="mt-4 text-sm text-gray-600 italic">{license.notes}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-yellow-800">License Unknown</h2>
          <p className="text-yellow-700 mt-1">
            Could not determine the license for this model. Please check the model&apos;s repository or documentation.
          </p>
        </div>
      )}

      {/* Issues for this model */}
      {issues.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Issues ({issues.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {issues.map((issue, i) => (
              <div key={i} className={`px-6 py-4 border-l-4 ${severityColor(issue.severity)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{issue.message}</p>
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
    </div>
  );
}
