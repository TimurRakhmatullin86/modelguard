#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  ScanConfig,
  ScanResult,
  UseCase,
  OutputFormat,
  ComplianceIssue,
  getAllLicenses,
} from '@modelguard/shared';
import { scanDirectory } from './scanner';
import { checkCompliance } from './licenses/checker';
import { formatOutput } from './output';

const program = new Command();

program
  .name('modelguard')
  .description('AI model license compliance scanner')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a project directory for AI models and check license compliance')
  .argument('[directory]', 'Directory to scan', '.')
  .option('--use-case <type>', 'Use case: commercial, saas, medical, research, education, government', 'commercial')
  .option('--mau <number>', 'Monthly active users', parseInt)
  .option('--product-name <name>', 'Product name (for naming restriction checks)')
  .option('--format <format>', 'Output format: json, table, sarif, markdown', 'table')
  .option('--fail-on <level>', 'Exit with code 1 on: error, warning', 'error')
  .option('--quiet', 'Suppress spinner and non-essential output')
  .action(async (directory: string, options: Record<string, unknown>) => {
    const config: ScanConfig = {
      useCase: options.useCase as UseCase,
      mau: options.mau as number | undefined,
      productName: options.productName as string | undefined,
      outputFormat: options.format as OutputFormat,
      directory,
      failOn: (options.failOn as 'error' | 'warning') ?? 'error',
    };

    const quiet = Boolean(options.quiet);
    const spinner = quiet ? null : ora('Scanning for AI models...').start();

    try {
      const models = await scanDirectory(directory);
      if (spinner) spinner.text = `Found ${models.length} models. Checking compliance...`;

      const issues = checkCompliance(models, config);

      if (spinner) spinner.stop();

      const modelsWithIssues = new Set(issues.filter(i => i.severity === 'error').map(i => i.modelId));
      const modelsWithWarnings = new Set(issues.filter(i => i.severity === 'warning').map(i => i.modelId));

      const result: ScanResult = {
        timestamp: new Date().toISOString(),
        directory,
        config,
        models,
        issues,
        summary: {
          totalModels: models.length,
          compliant: models.length - modelsWithIssues.size - modelsWithWarnings.size,
          warnings: modelsWithWarnings.size,
          violations: modelsWithIssues.size,
        },
      };

      console.log(formatOutput(result, config.outputFormat));

      const shouldFail = config.failOn === 'error'
        ? issues.some(i => i.severity === 'error')
        : issues.some(i => i.severity === 'error' || i.severity === 'warning');

      if (shouldFail) {
        process.exit(1);
      }
    } catch (err) {
      if (spinner) spinner.fail('Scan failed');
      console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(2);
    }
  });

program
  .command('licenses')
  .description('List all known AI model licenses in the database')
  .option('--format <format>', 'Output format: json, table', 'table')
  .action((options: Record<string, unknown>) => {
    const licenses = getAllLicenses();

    if (options.format === 'json') {
      console.log(JSON.stringify(licenses, null, 2));
      return;
    }

    console.log('');
    console.log(chalk.bold.cyan(`ModelGuard License Database (${licenses.length} licenses)`));
    console.log('');

    for (const lic of licenses) {
      const commercial = lic.commercial ? chalk.green('YES') : chalk.red('NO');
      const saas = lic.saas_allowed ? chalk.green('YES') : chalk.red('NO');
      console.log(`  ${chalk.bold(lic.name)} (${lic.id})`);
      console.log(`    Commercial: ${commercial}  |  SaaS: ${saas}  |  Attribution: ${lic.attribution_required ? chalk.yellow('Required') : 'No'}`);
      if (lic.restricted_uses.length > 0) {
        console.log(`    Restricted: ${chalk.gray(lic.restricted_uses.join(', '))}`);
      }
      if (lic.models.length > 0) {
        console.log(`    Models: ${chalk.gray(lic.models.join(', '))}`);
      }
      console.log('');
    }
  });

program
  .command('check')
  .description('Check a specific model ID against the license database')
  .argument('<model-id>', 'Model ID (e.g., meta-llama/Llama-3.1-8B)')
  .option('--use-case <type>', 'Use case to check against', 'commercial')
  .option('--mau <number>', 'Monthly active users', parseInt)
  .action((modelId: string, options: Record<string, unknown>) => {
    const { getLicenseForModel } = require('@modelguard/shared');
    const license = getLicenseForModel(modelId);

    if (!license) {
      console.log(chalk.yellow(`No license found for model "${modelId}" in the database.`));
      console.log(chalk.gray('Try checking the model\'s repository or HuggingFace page.'));
      process.exit(0);
    }

    console.log('');
    console.log(chalk.bold.cyan(`License for ${modelId}`));
    console.log('');
    console.log(`  License: ${chalk.bold(license.name)}`);
    console.log(`  Commercial: ${license.commercial ? chalk.green('YES') : chalk.red('NO')}`);
    console.log(`  SaaS: ${license.saas_allowed ? chalk.green('YES') : chalk.red('NO')}`);
    console.log(`  Attribution: ${license.attribution_required ? chalk.yellow('Required') : chalk.green('Not required')}`);
    console.log(`  Distribution: ${license.derivative_distribution}`);

    if (license.commercial_conditions.length > 0) {
      console.log('');
      console.log(chalk.bold('  Conditions:'));
      for (const cond of license.commercial_conditions) {
        if (cond.type === 'mau_limit') {
          console.log(`    - MAU limit: ${(cond.value ?? 0).toLocaleString()} (${cond.action})`);
        } else if (cond.type === 'attribution') {
          console.log(`    - Attribution: "${cond.text}"`);
        } else if (cond.type === 'naming') {
          console.log(`    - Naming: ${cond.restriction}`);
        } else if (cond.type === 'pass_through') {
          console.log(`    - Pass-through: ${cond.text}`);
        }
      }
    }

    if (license.restricted_uses.length > 0) {
      console.log('');
      console.log(chalk.bold('  Restricted uses:'));
      for (const use of license.restricted_uses) {
        console.log(`    - ${use}`);
      }
    }

    console.log('');
  });

program.parse();
