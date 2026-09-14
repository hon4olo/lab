export interface ProductionAsset {
  readonly id: string;
  readonly path: string;
  readonly status: string;
}

interface ManifestAsset {
  readonly id: string;
  readonly path: string;
  readonly status: string;
}

export function getProductionAssets(manifest: unknown): ProductionAsset[] {
  return getManifestAssets(manifest).filter((asset) => asset.status === 'production-approved');
}

export function getManifestAssets(manifest: unknown): ProductionAsset[] {
  if (!isRecord(manifest) || !Array.isArray(manifest.assets)) {
    throw new Error('Asset manifest must contain an assets array.');
  }

  const ids = new Set<string>();
  const assets: ProductionAsset[] = [];

  for (const candidate of manifest.assets) {
    if (!isManifestAsset(candidate)) {
      throw new Error('Asset manifest contains an invalid asset entry.');
    }
    if (ids.has(candidate.id)) {
      throw new Error(`Asset manifest contains a duplicate ID: ${candidate.id}`);
    }
    ids.add(candidate.id);
    validateAssetPath(candidate.path, candidate.id);
    assets.push({ id: candidate.id, path: candidate.path, status: candidate.status });
  }

  return assets;
}

function isManifestAsset(value: unknown): value is ManifestAsset {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.path === 'string' &&
    typeof value.status === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateAssetPath(path: string, id: string): void {
  const segments = path.split('/');
  const isSafePath =
    path.startsWith('assets/') &&
    (path.endsWith('.png') || path.endsWith('.webp')) &&
    segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');

  if (!isSafePath) {
    throw new Error(`Asset ${id} has an invalid public asset path: ${path}`);
  }
}
