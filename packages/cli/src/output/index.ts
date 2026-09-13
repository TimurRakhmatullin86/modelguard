import { ScanResult, OutputFormat } from '@modelguard/shared';
import { formatTable } from './table';
import { formatJson } from './json';
import { formatSarif } from './sarif';
import { formatMarkdown } from './markdown';

export function formatOutput(result: ScanResult, format: OutputFormat): string {
  switch (format) {
    case 'table': return formatTable(result);
    case 'json': return formatJson(result);
    case 'sarif': return formatSarif(result);
    case 'markdown': return formatMarkdown(result);
  }
}
