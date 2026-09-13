import chalk from 'chalk';
import Table from 'cli-table3';
import { ScanResult } from '@modelguard/shared';

const SEVERITY_ICON: Record<string, string> = {
  error: chalk.red('✖ ERROR'),
  warning: chalk.yellow('⚠ WARNING'),
  info: chalk.blue('ℹ INFO'),
};

export function formatTable(result: ScanResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold.cyan('ModelGuard Scan Results'));
  lines.push(chalk.gray(`Directory: ${result.directory}`));
  lines.push(chalk.gray(`Use case: ${result.config.useCase}${result.config.mau ? `, MAU: ${result.config.mau.toLocaleString()}` : ''}`));
  lines.push(chalk.gray(`Scanned at: ${result.timestamp}`));
  lines.push('');

  if (result.models.length === 0) {
    lines.push(chalk.green('No AI models detected in this project.'));
    return lines.join('\n');
  }

  const modelTable = new Table({
    head: [
      chalk.bold('Model'),
      chalk.bold('Source'),
      chalk.bold('License'),
      chalk.bold('File'),
    ],
    colWidths: [35, 15, 25, 35],
    wordWrap: true,
  });

  for (const model of result.models) {
    modelTable.push([
      model.name,
      model.source,
      model.resolvedLicense ?? chalk.gray('unknown'),
      model.line ? `${model.filePath}:${model.line}` : model.filePath,
    ]);
  }

  lines.push(chalk.bold('Detected Models:'));
  lines.push(modelTable.toString());
  lines.push('');

  if (result.issues.length > 0) {
    const issueTable = new Table({
      head: [
        chalk.bold('Severity'),
        chalk.bold('Model'),
        chalk.bold('Issue'),
        chalk.bold('File'),
      ],
      colWidths: [14, 25, 45, 30],
      wordWrap: true,
    });

    const sorted = [...result.issues].sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    });

    for (const issue of sorted) {
      issueTable.push([
        SEVERITY_ICON[issue.severity] ?? issue.severity,
        issue.modelId,
        issue.message,
        issue.line ? `${issue.filePath}:${issue.line}` : issue.filePath,
      ]);
    }

    lines.push(chalk.bold('Compliance Issues:'));
    lines.push(issueTable.toString());
  }

  lines.push('');
  lines.push(chalk.bold('Summary:'));
  lines.push(`  Models found: ${result.summary.totalModels}`);
  lines.push(`  ${chalk.green(`✔ Compliant: ${result.summary.compliant}`)}`);
  lines.push(`  ${chalk.yellow(`⚠ Warnings: ${result.summary.warnings}`)}`);
  lines.push(`  ${chalk.red(`✖ Violations: ${result.summary.violations}`)}`);
  lines.push('');

  return lines.join('\n');
}
