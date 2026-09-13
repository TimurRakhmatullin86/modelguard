export type UseCase = 'commercial' | 'saas' | 'medical' | 'research' | 'education' | 'government';

export type Severity = 'error' | 'warning' | 'info';

export type OutputFormat = 'json' | 'table' | 'sarif' | 'markdown';

export type ModelSource =
  | 'huggingface'
  | 'gguf_file'
  | 'onnx_file'
  | 'api_reference'
  | 'docker_image'
  | 'ollama_config'
  | 'llamacpp_config'
  | 'vllm_config'
  | 'code_import';

export interface DetectedModel {
  id: string;
  name: string;
  source: ModelSource;
  filePath: string;
  line?: number;
  confidence: 'high' | 'medium' | 'low';
  resolvedLicense?: string;
}

export interface CommercialCondition {
  type: 'mau_limit' | 'attribution' | 'naming' | 'revenue_limit' | 'employee_limit' | 'pass_through';
  value?: number;
  text?: string;
  restriction?: string;
  action?: string;
  required?: boolean;
}

export interface LicenseDefinition {
  id: string;
  name: string;
  spdx?: string;
  url?: string;
  commercial: boolean;
  commercial_conditions: CommercialCondition[];
  restricted_uses: string[];
  saas_allowed: boolean;
  research_only: boolean;
  derivative_distribution: 'permissive' | 'same_license_required' | 'no_derivatives' | 'with_notice';
  attribution_required: boolean;
  models: string[];
  notes?: string;
}

export interface ComplianceIssue {
  modelId: string;
  modelName: string;
  licenseId: string;
  licenseName: string;
  severity: Severity;
  category: string;
  message: string;
  recommendation: string;
  filePath: string;
  line?: number;
}

export interface ScanConfig {
  useCase: UseCase;
  mau?: number;
  productName?: string;
  outputFormat: OutputFormat;
  directory: string;
  failOn: 'error' | 'warning';
}

export interface ScanResult {
  timestamp: string;
  directory: string;
  config: ScanConfig;
  models: DetectedModel[];
  issues: ComplianceIssue[];
  summary: {
    totalModels: number;
    compliant: number;
    warnings: number;
    violations: number;
  };
}

export interface ProjectRecord {
  id: string;
  name: string;
  useCase: UseCase;
  mau?: number;
  productName?: string;
  lastScan?: ScanResult;
  createdAt: string;
  updatedAt: string;
}
