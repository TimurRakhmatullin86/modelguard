import {
  DetectedModel,
  ComplianceIssue,
  ScanConfig,
  Severity,
  LicenseDefinition,
  getLicenseForModel,
} from '@modelguard/shared';

export function checkCompliance(
  models: DetectedModel[],
  config: ScanConfig
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  for (const model of models) {
    const license = getLicenseForModel(model.id);
    if (!license) {
      if (model.source !== 'api_reference') {
        issues.push({
          modelId: model.id,
          modelName: model.name,
          licenseId: 'unknown',
          licenseName: 'Unknown License',
          severity: 'warning',
          category: 'unknown_license',
          message: `Could not determine license for model "${model.id}". Manual review recommended.`,
          recommendation: 'Check the model\'s repository or documentation for license information.',
          filePath: model.filePath,
          line: model.line,
        });
      }
      continue;
    }

    model.resolvedLicense = license.id;

    if (model.source === 'api_reference') {
      issues.push({
        modelId: model.id,
        modelName: model.name,
        licenseId: license.id,
        licenseName: license.name,
        severity: 'info',
        category: 'proprietary_api',
        message: `Using proprietary API: ${model.id}. Check provider's Terms of Service.`,
        recommendation: 'Review the API provider\'s Terms of Service for output ownership and usage restrictions.',
        filePath: model.filePath,
        line: model.line,
      });
      continue;
    }

    issues.push(...checkCommercialUse(model, license, config));
    issues.push(...checkSaasUse(model, license, config));
    issues.push(...checkRestrictedUses(model, license, config));
    issues.push(...checkMauLimits(model, license, config));
    issues.push(...checkAttribution(model, license, config));
    issues.push(...checkPassThrough(model, license, config));
    issues.push(...checkDistribution(model, license, config));
  }

  return issues;
}

function checkCommercialUse(
  model: DetectedModel,
  license: LicenseDefinition,
  config: ScanConfig
): ComplianceIssue[] {
  if (config.useCase === 'research' || config.useCase === 'education') return [];
  if (license.commercial) return [];

  return [{
    modelId: model.id,
    modelName: model.name,
    licenseId: license.id,
    licenseName: license.name,
    severity: 'error',
    category: 'commercial_restriction',
    message: `Model "${model.id}" is licensed under ${license.name} which does NOT allow commercial use.`,
    recommendation: license.research_only
      ? 'This model is research-only. Find an alternative model with a commercial-friendly license or contact the provider for a commercial license.'
      : 'Contact the model provider for a commercial license or use an alternative model.',
    filePath: model.filePath,
    line: model.line,
  }];
}

function checkSaasUse(
  model: DetectedModel,
  license: LicenseDefinition,
  config: ScanConfig
): ComplianceIssue[] {
  if (config.useCase !== 'saas') return [];
  if (license.saas_allowed) return [];

  return [{
    modelId: model.id,
    modelName: model.name,
    licenseId: license.id,
    licenseName: license.name,
    severity: 'error',
    category: 'saas_restriction',
    message: `Model "${model.id}" licensed under ${license.name} does NOT allow SaaS/hosted use.`,
    recommendation: 'Do not deploy this model in a SaaS product. Consider self-hosted deployment or an alternative model.',
    filePath: model.filePath,
    line: model.line,
  }];
}

function checkRestrictedUses(
  model: DetectedModel,
  license: LicenseDefinition,
  config: ScanConfig
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const useCaseMap: Record<string, string[]> = {
    medical: ['medical_diagnosis', 'medical_advice'],
    government: ['surveillance', 'critical_infrastructure'],
  };

  const restrictedCategories = useCaseMap[config.useCase] ?? [];
  for (const category of restrictedCategories) {
    if (license.restricted_uses.includes(category)) {
      issues.push({
        modelId: model.id,
        modelName: model.name,
        licenseId: license.id,
        licenseName: license.name,
        severity: 'error',
        category: 'restricted_use',
        message: `Model "${model.id}" explicitly restricts use in "${category}" under ${license.name}.`,
        recommendation: `This model cannot be used for ${category}. Find an alternative model that permits this use case.`,
        filePath: model.filePath,
        line: model.line,
      });
    }
  }

  if (license.restricted_uses.length > 0) {
    issues.push({
      modelId: model.id,
      modelName: model.name,
      licenseId: license.id,
      licenseName: license.name,
      severity: 'info',
      category: 'restricted_uses_notice',
      message: `Model "${model.id}" has restricted use categories: ${license.restricted_uses.join(', ')}.`,
      recommendation: 'Ensure your use case does not fall within these restricted categories.',
      filePath: model.filePath,
      line: model.line,
    });
  }

  return issues;
}

function checkMauLimits(
  model: DetectedModel,
  license: LicenseDefinition,
  config: ScanConfig
): ComplianceIssue[] {
  if (!config.mau) return [];

  const mauCondition = license.commercial_conditions.find(c => c.type === 'mau_limit');
  if (!mauCondition || !mauCondition.value) return [];

  if (config.mau > mauCondition.value) {
    return [{
      modelId: model.id,
      modelName: model.name,
      licenseId: license.id,
      licenseName: license.name,
      severity: 'error',
      category: 'mau_limit_exceeded',
      message: `MAU limit exceeded: your ${config.mau.toLocaleString()} MAU exceeds the ${mauCondition.value.toLocaleString()} MAU limit under ${license.name}. Action: ${mauCondition.action ?? 'contact provider'}.`,
      recommendation: `Contact the model provider for a license that covers ${config.mau.toLocaleString()} MAU.`,
      filePath: model.filePath,
      line: model.line,
    }];
  }

  if (config.mau > mauCondition.value * 0.8) {
    return [{
      modelId: model.id,
      modelName: model.name,
      licenseId: license.id,
      licenseName: license.name,
      severity: 'warning',
      category: 'mau_limit_approaching',
      message: `Approaching MAU limit: your ${config.mau.toLocaleString()} MAU is within 20% of the ${mauCondition.value.toLocaleString()} limit under ${license.name}.`,
      recommendation: 'Plan ahead: contact the model provider about a higher-tier license before exceeding the limit.',
      filePath: model.filePath,
      line: model.line,
    }];
  }

  return [];
}

function checkAttribution(
  model: DetectedModel,
  license: LicenseDefinition,
  config: ScanConfig
): ComplianceIssue[] {
  if (!license.attribution_required) return [];

  const attrConditions = license.commercial_conditions.filter(c => c.type === 'attribution');
  if (attrConditions.length === 0 && !license.attribution_required) return [];

  const messages = attrConditions.map(c => c.text).filter(Boolean);
  const attrText = messages.length > 0 ? messages.join('; ') : 'Attribution required per license terms';

  return [{
    modelId: model.id,
    modelName: model.name,
    licenseId: license.id,
    licenseName: license.name,
    severity: 'warning',
    category: 'attribution_required',
    message: `Model "${model.id}" requires attribution under ${license.name}: ${attrText}.`,
    recommendation: 'Ensure your product includes the required attribution text.',
    filePath: model.filePath,
    line: model.line,
  }];
}

function checkPassThrough(
  model: DetectedModel,
  license: LicenseDefinition,
  config: ScanConfig
): ComplianceIssue[] {
  const passThrough = license.commercial_conditions.filter(c => c.type === 'pass_through');
  if (passThrough.length === 0) return [];

  return [{
    modelId: model.id,
    modelName: model.name,
    licenseId: license.id,
    licenseName: license.name,
    severity: 'warning',
    category: 'pass_through_obligation',
    message: `Model "${model.id}" has pass-through obligations: ${passThrough.map(c => c.text).join('; ')}.`,
    recommendation: 'Ensure downstream users/customers are informed of and comply with these restrictions.',
    filePath: model.filePath,
    line: model.line,
  }];
}

function checkDistribution(
  model: DetectedModel,
  license: LicenseDefinition,
  config: ScanConfig
): ComplianceIssue[] {
  if (license.derivative_distribution === 'permissive') return [];

  const severity: Severity = license.derivative_distribution === 'no_derivatives' ? 'error' : 'warning';
  const messages: Record<string, string> = {
    same_license_required: `Derivatives of "${model.id}" must be distributed under ${license.name}.`,
    no_derivatives: `Model "${model.id}" does NOT allow derivative distribution under ${license.name}.`,
    with_notice: `Distribution of "${model.id}" derivatives requires including the license notice.`,
  };

  return [{
    modelId: model.id,
    modelName: model.name,
    licenseId: license.id,
    licenseName: license.name,
    severity,
    category: 'distribution_restriction',
    message: messages[license.derivative_distribution] ?? `Check distribution terms for ${license.name}.`,
    recommendation: license.derivative_distribution === 'no_derivatives'
      ? 'Do not distribute model derivatives. Use the model only internally.'
      : 'Ensure any model distribution includes the required license terms.',
    filePath: model.filePath,
    line: model.line,
  }];
}
