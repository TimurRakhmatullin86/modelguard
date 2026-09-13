'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [useCase, setUseCase] = useState('commercial');
  const [mau, setMau] = useState('');
  const [productName, setProductName] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 mb-8">Configure default scanning parameters for your projects.</p>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
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
    </div>
  );
}
