# ModelGuard

**AI Model License Compliance Scanner — CLI + Web Dashboard**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@modelguard/cli.svg)](https://www.npmjs.com/package/@modelguard/cli)

37% of "open-weight" AI models have hidden commercial restrictions. ModelGuard scans your project, identifies every AI model in use, and checks license compliance — before legal does.

## The Problem

Open-weight models like Llama, Gemma, Mistral, and DeepSeek come with restrictions that most teams miss:

- **Llama**: 700M MAU limit (need a separate license from Meta above that)
- **Llama**: Mandatory "Built with Meta Llama 3" attribution
- **Gemma**: Cannot use for medical diagnosis or legal advice
- **DeepSeek**: Must pass through restrictions to all downstream users
- **Falcon**: Royalty required above $1M revenue

ModelGuard catches these **before** they become legal problems.

## Quick Start

### CLI Scanner

```bash
npx @modelguard/cli scan ./my-project
```

That's it. ModelGuard scans your project and reports license compliance issues.

### Options

```bash
# Check for a specific use case
modelguard scan . --use-case commercial
modelguard scan . --use-case saas
modelguard scan . --use-case medical

# Check MAU limits
modelguard scan . --mau 1000000

# Different output formats
modelguard scan . --format json
modelguard scan . --format sarif    # For GitHub Security tab
modelguard scan . --format markdown # For PR comments

# Fail on warnings too (default: only errors)
modelguard scan . --fail-on warning

# Check a specific model
modelguard check meta-llama/Llama-3.1-8B --use-case saas --mau 500000

# List all known licenses
modelguard licenses
```

### Example Output

```
ModelGuard Scan Results
Directory: ./my-project
Use case: commercial, MAU: 1,000,000

Detected Models:
┌───────────────────────────────────┬───────────────┬─────────────────────────┬───────────────────┐
│ Model                             │ Source        │ License                 │ File              │
├───────────────────────────────────┼───────────────┼─────────────────────────┼───────────────────┤
│ meta-llama/Llama-3.1-8B           │ huggingface   │ llama-3.1-community     │ src/model.py:12   │
│ google/gemma-2-9b                 │ ollama_config │ gemma-terms             │ Modelfile:1       │
│ openai/gpt-4                      │ api_reference │ proprietary-api         │ src/api.ts:45     │
└───────────────────────────────────┴───────────────┴─────────────────────────┴───────────────────┘

Compliance Issues:
┌──────────────┬─────────────────────────┬─────────────────────────────────────────────┐
│ Severity     │ Model                   │ Issue                                       │
├──────────────┼─────────────────────────┼─────────────────────────────────────────────┤
│ ⚠ WARNING    │ meta-llama/Llama-3.1-8B │ Attribution required: "Built with Meta      │
│              │                         │ Llama 3.1"                                  │
│ ⚠ WARNING    │ google/gemma-2-9b       │ Pass-through obligations: Must pass through │
│              │                         │ all usage restrictions to downstream users   │
└──────────────┴─────────────────────────┴─────────────────────────────────────────────┘

Summary:
  Models found: 3
  ✔ Compliant: 1
  ⚠ Warnings: 2
  ✖ Violations: 0
```

## What ModelGuard Detects

| Source | Detection Method |
|--------|-----------------|
| Hugging Face models | `AutoModel.from_pretrained()`, `SentenceTransformer()`, config files |
| GGUF files | `.gguf` files on disk + references in code |
| ONNX models | `.onnx` files on disk |
| API references | OpenAI, Anthropic, Google AI imports and config |
| Ollama models | `Modelfile`, ollama config, API calls |
| llama.cpp | CLI args, config files |
| vLLM | Python config, CLI args |
| Docker images | Dockerfile FROM, docker-compose images |

## License Database

ModelGuard ships with a built-in database of 17 AI model licenses:

| License | Commercial | SaaS | Key Restriction |
|---------|-----------|------|-----------------|
| Apache 2.0 | ✅ | ✅ | Attribution |
| MIT | ✅ | ✅ | Attribution |
| Llama Community | ✅ | ✅ | 700M MAU limit, attribution, naming |
| Gemma Terms | ✅ | ✅ | Pass-through obligations, restricted uses |
| Mistral Research | ❌ | ❌ | Research only |
| OpenRAIL-M | ✅ | ✅ | Use-based restrictions |
| CC-BY-NC-4.0 | ❌ | ❌ | Non-commercial only |
| Tongyi Qianwen | ✅ | ✅ | 100M MAU limit |
| DeepSeek License | ✅ | ✅ | Pass-through obligations |
| Falcon License | ✅ | ✅ | Royalty above $1M revenue |
| BLOOM RAIL | ✅ | ✅ | Use-based restrictions |

## CI/CD Integration

### GitHub Actions

```yaml
name: Model License Audit
on: [push, pull_request]

jobs:
  license-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: modelguard/scan@v1
        with:
          use-case: commercial
          mau: 500000
          fail-on: warning
```

### GitLab CI

```yaml
license-audit:
  image: node:20
  script:
    - npx @modelguard/cli scan . --use-case commercial --format sarif
  artifacts:
    reports:
      sast: modelguard-report.sarif
```

### Any CI

```bash
npx @modelguard/cli scan . --use-case commercial --mau 500000
# Exit code 1 on violations → fails the pipeline
```

## Web Dashboard

ModelGuard includes a web dashboard for tracking compliance across multiple projects.

### Self-Hosted (Docker)

```bash
cp .env.example .env
# Edit .env with your settings
docker compose up -d
```

### Features

- **Dashboard** — overview of all projects with compliance status
- **Project Detail** — models found, issues, scan history
- **Model Detail** — full license info, conditions, restricted uses
- **CI/CD Integration** — API keys, upload instructions
- **REST API** — `POST /api/scan`, `GET /api/projects`, webhooks

### API

```bash
# Upload scan results
modelguard scan . --format json | \
  curl -X POST https://your-instance/api/scan \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -d @-

# List projects
curl https://your-instance/api/projects \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get project issues
curl https://your-instance/api/projects/PROJECT_ID/issues \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Development

```bash
# Install dependencies
npm install

# Build everything
npm run build

# Run CLI locally
npm run scan -- ./test-project --use-case commercial

# Start web dashboard
npm run dev:web
```

## Project Structure

```
modelguard/
├── packages/
│   ├── cli/              # @modelguard/cli — npm package
│   │   └── src/
│   │       ├── scanner/  # Model detection engine
│   │       ├── licenses/ # Compliance checker
│   │       ├── output/   # Report formatters (json/table/sarif/md)
│   │       └── index.ts  # CLI entry point
│   ├── web/              # Next.js dashboard
│   │   ├── app/          # App Router pages + API routes
│   │   ├── lib/          # Prisma, auth, utilities
│   │   └── prisma/       # Database schema
│   └── shared/           # Shared types + license database
│       └── src/
│           ├── types.ts
│           ├── licenses.json  # 17 AI model licenses
│           └── index.ts
├── .github/actions/scan/ # GitHub Action
├── docker-compose.yml    # Self-hosted deployment
└── README.md
```

## Contributing

Contributions welcome! Areas where help is especially valued:

- **License database** — adding new AI model licenses as they emerge
- **Scanner patterns** — detecting more model formats and frameworks
- **Integrations** — more CI/CD platforms, IDE plugins

## License

MIT — see [LICENSE](LICENSE) for details.
