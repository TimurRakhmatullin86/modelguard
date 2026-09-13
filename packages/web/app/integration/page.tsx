export default function IntegrationPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">CI/CD Integration</h1>
      <p className="text-gray-500 mb-8">Add ModelGuard to your CI/CD pipeline to automatically check license compliance on every commit.</p>

      {/* GitHub Actions */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">GitHub Actions</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Add this to your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.github/workflows/modelguard.yml</code>:
          </p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`name: Model License Audit
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
          fail-on: warning  # or error`}
          </pre>
        </div>
      </div>

      {/* GitLab CI */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">GitLab CI</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Add this to your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.gitlab-ci.yml</code>:
          </p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`license-audit:
  image: node:20
  script:
    - npx @modelguard/cli scan . --use-case commercial --format sarif
  artifacts:
    reports:
      sast: modelguard-report.sarif`}
          </pre>
        </div>
      </div>

      {/* CLI direct */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">CLI (Any CI)</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Install and run the CLI directly in any CI environment:
          </p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`# Install
npm install -g @modelguard/cli

# Scan with exit code on violations
modelguard scan . --use-case commercial --mau 1000000

# JSON output for machine parsing
modelguard scan . --format json > modelguard-report.json

# SARIF output for GitHub Security tab
modelguard scan . --format sarif > modelguard.sarif`}
          </pre>
        </div>
      </div>

      {/* Upload to Dashboard */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload Results to Dashboard</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Send scan results to your ModelGuard dashboard for tracking and alerting:
          </p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`# Generate JSON report
modelguard scan . --use-case commercial --format json > scan.json

# Upload to dashboard
curl -X POST https://your-modelguard-instance/api/scan \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d @scan.json`}
          </pre>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800">API Key</h3>
            <p className="text-sm text-blue-700 mt-1">
              Generate an API key in Settings to authenticate CI/CD uploads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
