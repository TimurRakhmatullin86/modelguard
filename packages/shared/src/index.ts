export * from './types';
export { default as licensesData } from './licenses.json';
import licensesJson from './licenses.json';
import { LicenseDefinition } from './types';

const licenses: LicenseDefinition[] = licensesJson.licenses as LicenseDefinition[];

export function getLicenseById(id: string): LicenseDefinition | undefined {
  return licenses.find(l => l.id === id);
}

export function getLicenseForModel(modelId: string): LicenseDefinition | undefined {
  return licenses.find(l =>
    l.models.some(pattern => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(modelId);
    })
  );
}

export function getAllLicenses(): LicenseDefinition[] {
  return licenses;
}
