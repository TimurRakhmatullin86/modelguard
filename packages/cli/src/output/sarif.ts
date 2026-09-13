import { ScanResult } from '@modelguard/shared';

interface SarifResult {
  ruleId: string;
  level: string;
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region?: { startLine: number };
    };
  }>;
  properties?: Record<string, unknown>;
}

export function formatSarif(result: ScanResult): string {
  const severityMap: Record<string, string> = {
    error: 'error',
    warning: 'warning',
    info: 'note',
  };

  const rules = new Map<string, { id: string; shortDescription: { text: string } }>();
  const results: SarifResult[] = [];

  for (const issue of result.issues) {
    if (!rules.has(issue.category)) {
      rules.set(issue.category, {
        id: issue.category,
        shortDescription: { text: issue.category.replace(/_/g, ' ') },
      });
    }

    const sarifResult: SarifResult = {
      ruleId: issue.category,
      level: severityMap[issue.severity] ?? 'note',
      message: { text: issue.message },
      locations: [{
        physicalLocation: {
          artifactLocation: { uri: issue.filePath },
          ...(issue.line ? { region: { startLine: issue.line } } : {}),
        },
      }],
      properties: {
        modelId: issue.modelId,
        licenseId: issue.licenseId,
        recommendation: issue.recommendation,
      },
    };

    results.push(sarifResult);
  }

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'ModelGuard',
          version: '1.0.0',
          informationUri: 'https://github.com/timurrakhmatullin/modelguard',
          rules: Array.from(rules.values()),
        },
      },
      results,
    }],
  };

  return JSON.stringify(sarif, null, 2);
}
