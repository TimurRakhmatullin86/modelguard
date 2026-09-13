import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { DetectedModel, ModelSource } from '@modelguard/shared';
import { SCAN_PATTERNS, OLLAMA_TO_HF_MAP, GGUF_NAME_MAP, ScanPattern } from './patterns';

const IGNORE_DIRS = [
  'node_modules', '.git', '__pycache__', '.venv', 'venv',
  'dist', 'build', '.next', '.cache', '.tox', 'egg-info',
];

export async function scanDirectory(directory: string): Promise<DetectedModel[]> {
  const models: DetectedModel[] = [];
  const seen = new Set<string>();
  const absDir = path.resolve(directory);

  for (const pattern of SCAN_PATTERNS) {
    if (pattern.contentPatterns.length === 0) {
      const fileModels = await scanForFiles(absDir, pattern);
      for (const m of fileModels) {
        const key = `${m.id}:${m.filePath}`;
        if (!seen.has(key)) {
          seen.add(key);
          models.push(m);
        }
      }
    } else {
      const contentModels = await scanForContent(absDir, pattern);
      for (const m of contentModels) {
        const key = `${m.id}:${m.filePath}`;
        if (!seen.has(key)) {
          seen.add(key);
          models.push(m);
        }
      }
    }
  }

  return models.map(m => resolveModelId(m));
}

async function scanForFiles(dir: string, pattern: ScanPattern): Promise<DetectedModel[]> {
  const models: DetectedModel[] = [];

  for (const filePattern of pattern.filePatterns) {
    const files = await glob(filePattern, {
      cwd: dir,
      absolute: true,
      ignore: IGNORE_DIRS.map(d => `**/${d}/**`),
      nodir: true,
    });

    for (const filePath of files) {
      const fileName = path.basename(filePath);
      models.push({
        id: fileName,
        name: fileName,
        source: pattern.source,
        filePath: path.relative(dir, filePath),
        confidence: pattern.confidence,
      });
    }
  }

  return models;
}

async function scanForContent(dir: string, pattern: ScanPattern): Promise<DetectedModel[]> {
  const models: DetectedModel[] = [];

  for (const filePattern of pattern.filePatterns) {
    let files: string[];
    try {
      files = await glob(filePattern, {
        cwd: dir,
        absolute: true,
        ignore: IGNORE_DIRS.map(d => `**/${d}/**`),
        nodir: true,
      });
    } catch {
      continue;
    }

    for (const filePath of files) {
      let content: string;
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > 5 * 1024 * 1024) continue;
        content = fs.readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      for (const regex of pattern.contentPatterns) {
        const re = new RegExp(regex.source, regex.flags);
        let match: RegExpExecArray | null;
        while ((match = re.exec(content)) !== null) {
          const modelId = pattern.extractModelId(match);
          if (!modelId || modelId.length < 3) continue;
          if (isGenericDocker(modelId, pattern.source)) continue;

          const lineNumber = content.substring(0, match.index).split('\n').length;
          models.push({
            id: modelId,
            name: modelId,
            source: pattern.source,
            filePath: path.relative(dir, filePath),
            line: lineNumber,
            confidence: pattern.confidence,
          });
        }
      }
    }
  }

  return models;
}

function isGenericDocker(id: string, source: ModelSource): boolean {
  if (source !== 'docker_image') return false;
  const genericImages = [
    'python', 'node', 'ubuntu', 'alpine', 'debian', 'nginx',
    'postgres', 'redis', 'mongo', 'mysql', 'golang', 'rust',
  ];
  const baseName = id.split('/').pop()?.split(':')[0] ?? '';
  return genericImages.includes(baseName);
}

function resolveModelId(model: DetectedModel): DetectedModel {
  if (model.source === 'ollama_config') {
    const hfId = OLLAMA_TO_HF_MAP[model.id.toLowerCase()];
    if (hfId) {
      return { ...model, id: hfId, name: `${model.id} → ${hfId}` };
    }
  }

  if (model.source === 'gguf_file' || model.source === 'llamacpp_config') {
    const baseName = path.basename(model.id, '.gguf').toLowerCase();
    for (const [key, hfId] of Object.entries(GGUF_NAME_MAP)) {
      if (baseName.includes(key)) {
        return { ...model, id: hfId, name: `${model.id} → ${hfId}` };
      }
    }
  }

  return model;
}
