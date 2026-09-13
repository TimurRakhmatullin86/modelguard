import { ScanResult } from '@modelguard/shared';

export function formatJson(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}
