export interface ScanPattern {
  name: string;
  filePatterns: string[];
  contentPatterns: RegExp[];
  extractModelId: (match: RegExpMatchArray) => string;
  source: import('@modelguard/shared').ModelSource;
  confidence: 'high' | 'medium' | 'low';
}

const HF_MODEL_ID = /(?:['"`])([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)(?:['"`])/;

export const SCAN_PATTERNS: ScanPattern[] = [
  {
    name: 'Hugging Face AutoModel',
    filePatterns: ['**/*.py', '**/*.ipynb'],
    contentPatterns: [
      /(?:AutoModel|AutoTokenizer|AutoProcessor|AutoModelFor\w+|pipeline)\.from_pretrained\(\s*['"`]([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)['"`]/g,
    ],
    extractModelId: (m) => m[1],
    source: 'huggingface',
    confidence: 'high',
  },
  {
    name: 'Hugging Face sentence-transformers',
    filePatterns: ['**/*.py', '**/*.ipynb'],
    contentPatterns: [
      /SentenceTransformer\(\s*['"`]([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)['"`]/g,
    ],
    extractModelId: (m) => m[1],
    source: 'huggingface',
    confidence: 'high',
  },
  {
    name: 'Hugging Face model ID in config',
    filePatterns: ['**/*.json', '**/*.yaml', '**/*.yml', '**/*.toml', '**/*.env', '**/.env*'],
    contentPatterns: [
      /(?:model_id|model_name|model|hf_model|huggingface_model|pretrained_model_name_or_path)\s*[:=]\s*['"`]?([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)['"`]?/g,
    ],
    extractModelId: (m) => m[1],
    source: 'huggingface',
    confidence: 'medium',
  },
  {
    name: 'Hugging Face model in JS/TS',
    filePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs'],
    contentPatterns: [
      /(?:model|modelId|model_id|modelName)\s*[:=]\s*['"`]([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)['"`]/g,
      /HfInference\([^)]*\)[\s\S]*?['"`]([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)['"`]/g,
    ],
    extractModelId: (m) => m[1],
    source: 'huggingface',
    confidence: 'medium',
  },
  {
    name: 'GGUF model file',
    filePatterns: ['**/*.gguf'],
    contentPatterns: [],
    extractModelId: (m) => m[0],
    source: 'gguf_file',
    confidence: 'high',
  },
  {
    name: 'GGUF reference in code/config',
    filePatterns: ['**/*.py', '**/*.yaml', '**/*.yml', '**/*.json', '**/*.toml', '**/*.sh'],
    contentPatterns: [
      /['"`]([^'"`\s]*\.gguf)['"`]/g,
      /(?:model_path|model_file|gguf_file)\s*[:=]\s*['"`]?([^\s'"`]+\.gguf)['"`]?/g,
    ],
    extractModelId: (m) => m[1],
    source: 'gguf_file',
    confidence: 'high',
  },
  {
    name: 'ONNX model file',
    filePatterns: ['**/*.onnx'],
    contentPatterns: [],
    extractModelId: (m) => m[0],
    source: 'onnx_file',
    confidence: 'high',
  },
  {
    name: 'OpenAI API',
    filePatterns: ['**/*.py', '**/*.ts', '**/*.js', '**/*.mjs', '**/*.jsx', '**/*.tsx'],
    contentPatterns: [
      /(?:openai|OpenAI)\s*\(/g,
      /(?:api\.openai\.com|OPENAI_API_KEY)/g,
      /model\s*[:=]\s*['"`](gpt-[a-zA-Z0-9._-]+)['"`]/g,
    ],
    extractModelId: (m) => m[1] ? `openai/${m[1]}` : 'openai/api',
    source: 'api_reference',
    confidence: 'medium',
  },
  {
    name: 'Anthropic API',
    filePatterns: ['**/*.py', '**/*.ts', '**/*.js', '**/*.mjs', '**/*.jsx', '**/*.tsx'],
    contentPatterns: [
      /(?:anthropic|Anthropic)\s*\(/g,
      /(?:api\.anthropic\.com|ANTHROPIC_API_KEY)/g,
      /model\s*[:=]\s*['"`](claude-[a-zA-Z0-9._-]+)['"`]/g,
    ],
    extractModelId: (m) => m[1] ? `anthropic/${m[1]}` : 'anthropic/api',
    source: 'api_reference',
    confidence: 'medium',
  },
  {
    name: 'Google AI API',
    filePatterns: ['**/*.py', '**/*.ts', '**/*.js', '**/*.mjs', '**/*.jsx', '**/*.tsx'],
    contentPatterns: [
      /(?:generativelanguage\.googleapis\.com|GOOGLE_API_KEY)/g,
      /model\s*[:=]\s*['"`](gemini-[a-zA-Z0-9._-]+)['"`]/g,
    ],
    extractModelId: (m) => m[1] ? `google/${m[1]}` : 'google/api',
    source: 'api_reference',
    confidence: 'medium',
  },
  {
    name: 'Ollama config',
    filePatterns: ['**/Modelfile', '**/ollama*.yaml', '**/ollama*.yml', '**/ollama*.json', '**/*.py', '**/*.ts', '**/*.js'],
    contentPatterns: [
      /(?:FROM|model)\s+([a-zA-Z0-9_-]+(?::[a-zA-Z0-9._-]+)?)/g,
      /ollama\.(?:chat|generate|pull)\(\s*(?:model\s*[:=]\s*)?['"`]([a-zA-Z0-9_/:.-]+)['"`]/g,
    ],
    extractModelId: (m) => m[1],
    source: 'ollama_config',
    confidence: 'medium',
  },
  {
    name: 'llama.cpp config',
    filePatterns: ['**/*.sh', '**/*.yaml', '**/*.yml', '**/*.json', '**/Makefile', '**/CMakeLists.txt'],
    contentPatterns: [
      /llama[-_]?cpp[\s\S]*?(?:-m|--model)\s+['"`]?([^\s'"`]+)['"`]?/g,
      /(?:llama-server|llama-cli|main)\s+[\s\S]*?-m\s+['"`]?([^\s'"`]+\.gguf)['"`]?/g,
    ],
    extractModelId: (m) => m[1],
    source: 'llamacpp_config',
    confidence: 'high',
  },
  {
    name: 'vLLM config',
    filePatterns: ['**/*.py', '**/*.yaml', '**/*.yml', '**/*.json', '**/*.sh'],
    contentPatterns: [
      /(?:vllm|LLM)\(\s*(?:model\s*=\s*)?['"`]([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)['"`]/g,
      /--model\s+['"`]?([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)['"`]?/g,
    ],
    extractModelId: (m) => m[1],
    source: 'vllm_config',
    confidence: 'high',
  },
  {
    name: 'Docker image with model',
    filePatterns: ['**/Dockerfile*', '**/docker-compose*.yml', '**/docker-compose*.yaml'],
    contentPatterns: [
      /(?:FROM|image:\s*)['"`]?([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?)['"`]?/g,
    ],
    extractModelId: (m) => m[1],
    source: 'docker_image',
    confidence: 'low',
  },
];

export const OLLAMA_TO_HF_MAP: Record<string, string> = {
  'llama2': 'meta-llama/Llama-2-7b',
  'llama2:7b': 'meta-llama/Llama-2-7b',
  'llama2:13b': 'meta-llama/Llama-2-13b',
  'llama2:70b': 'meta-llama/Llama-2-70b',
  'llama3': 'meta-llama/Meta-Llama-3-8B',
  'llama3:8b': 'meta-llama/Meta-Llama-3-8B',
  'llama3:70b': 'meta-llama/Meta-Llama-3-70B',
  'llama3.1': 'meta-llama/Llama-3.1-8B',
  'llama3.1:8b': 'meta-llama/Llama-3.1-8B',
  'llama3.1:70b': 'meta-llama/Llama-3.1-70B',
  'llama3.2': 'meta-llama/Llama-3.2-3B',
  'llama3.3': 'meta-llama/Llama-3.3-70B',
  'codellama': 'meta-llama/CodeLlama-7b-hf',
  'gemma': 'google/gemma-7b',
  'gemma:2b': 'google/gemma-2b',
  'gemma:7b': 'google/gemma-7b',
  'gemma2': 'google/gemma-2-9b',
  'gemma2:9b': 'google/gemma-2-9b',
  'gemma2:27b': 'google/gemma-2-27b',
  'mistral': 'mistralai/Mistral-7B-v0.1',
  'mixtral': 'mistralai/Mixtral-8x7B-v0.1',
  'mixtral:8x22b': 'mistralai/Mixtral-8x22B-v0.1',
  'deepseek-coder': 'deepseek-ai/deepseek-coder-6.7b-base',
  'deepseek-coder:33b': 'deepseek-ai/deepseek-coder-33b-base',
  'deepseek-v2': 'deepseek-ai/DeepSeek-V2',
  'qwen': 'Qwen/Qwen-7B',
  'qwen:7b': 'Qwen/Qwen-7B',
  'qwen:14b': 'Qwen/Qwen-14B',
  'qwen2': 'Qwen/Qwen2-7B',
  'qwen2.5': 'Qwen/Qwen2.5-7B',
  'falcon': 'tiiuae/falcon-7b',
  'falcon:7b': 'tiiuae/falcon-7b',
  'falcon:40b': 'tiiuae/falcon-40b',
};

export const GGUF_NAME_MAP: Record<string, string> = {
  'llama': 'meta-llama/Llama-2-7b',
  'llama-2': 'meta-llama/Llama-2-7b',
  'llama-3': 'meta-llama/Meta-Llama-3-8B',
  'codellama': 'meta-llama/CodeLlama-7b-hf',
  'mistral': 'mistralai/Mistral-7B-v0.1',
  'mixtral': 'mistralai/Mixtral-8x7B-v0.1',
  'gemma': 'google/gemma-7b',
  'phi': 'microsoft/phi-2',
  'qwen': 'Qwen/Qwen-7B',
  'deepseek': 'deepseek-ai/deepseek-llm-7b-base',
  'falcon': 'tiiuae/falcon-7b',
};
