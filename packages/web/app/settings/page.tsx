'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface ApiKeyRecord {
  id: string;
  name: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [useCase, setUseCase] = useState('commercial');
  const [mau, setMau] = useState('');
  const [productName, setProductName] = useState('');
  const [saved, setSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const [loadingKeys, setLoadingKeys] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApiKeys();
    }
  }, [status]);

  if (status === 'loading') return <div className="text-gray-500">Loading...</div>;
  if (status === 'unauthenticated') redirect('/auth/signin');

  async function fetchApiKeys() {
    setLoadingKeys(true);
    try {
      const res = await fetch('/api/api-keys');
      if (res.ok) setApiKeys(await res.json());
    } finally {
      setLoadingKeys(false);
    }
  }

  async function createApiKey() {
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName || 'Default' }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreatedKey(data.key);
      setNewKeyName('');
      fetchApiKeys();
    }
  }

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 mb-8">Configure scanning parameters and manage API keys.</p>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Scan Defaults</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Use Case</label>
          <select
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="commercial">Commercial</option>
            <option value="saas">SaaS</option>
            <option value="medical">Medical / Healthcare</option>
            <option value="research">Research</option>
            <option value="education">Education</option>
            <option value="government">Government</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Determines which license restrictions are checked against your project.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Active Users (MAU)</label>
          <input
            type="number"
            value={mau}
            onChange={(e) => setMau(e.target.value)}
            placeholder="e.g., 500000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Some licenses (e.g., Llama) have MAU limits. Leave empty if not applicable.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., My AI App"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Used to check naming restrictions (e.g., cannot use &quot;Llama&quot; in product name).
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
        <p className="text-sm text-gray-500 mb-4">
          Use API keys to upload scan results from CI/CD pipelines.
        </p>

        {createdKey && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-1">API key created! Copy it now — it won&apos;t be shown again.</p>
            <code className="block bg-green-100 px-3 py-2 rounded text-sm font-mono text-green-900 break-all">
              {createdKey}
            </code>
            <button
              onClick={() => setCreatedKey('')}
              className="mt-2 text-xs text-green-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., GitHub CI)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={createApiKey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Create Key
          </button>
        </div>

        {loadingKeys ? (
          <p className="text-sm text-gray-500">Loading keys...</p>
        ) : apiKeys.length === 0 ? (
          <p className="text-sm text-gray-500">No API keys yet. Create one to get started.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {apiKeys.map((key) => (
              <div key={key.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{key.name}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && ` | Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
