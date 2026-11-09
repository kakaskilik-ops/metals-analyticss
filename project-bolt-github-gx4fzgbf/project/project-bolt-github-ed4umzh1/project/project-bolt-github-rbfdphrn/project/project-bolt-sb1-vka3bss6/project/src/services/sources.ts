import { PRICE_SOURCES, type SourceDefinition } from '@/data/sources';
import type { Metal, SourceIntegration, SourceStatus } from '@/types/market';

export interface SourceStatusRow {
  id: string;
  status: SourceStatus;
  lastSuccessAt: number | null;
  lastError: string | null;
}

export function buildSourceIntegrations(rows: SourceStatusRow[] | null): SourceIntegration[] {
  const rowById = new Map((rows ?? []).map((row) => [row.id, row]));

  return PRICE_SOURCES.map((source: SourceDefinition) => {
    const row = rowById.get(source.id);
    return {
      id: source.id,
      name: source.name,
      url: source.url,
      marketType: source.marketType,
      region: source.region,
      qualityScore: source.qualityScore,
      status: row?.status ?? source.defaultStatus,
      lastSuccessAt: row?.lastSuccessAt ?? null,
      lastError: row?.lastError ?? null,
      apiEndpoint: source.apiEndpoint,
      apiKeyRequired: source.apiKeyRequired,
      attribution: source.attribution,
      license: source.license,
      freeTierLimit: source.freeTierLimit,
    };
  });
}

export function getSourcesForMetal(metal: Metal, sources: SourceIntegration[]): SourceIntegration[] {
  return sources.filter((source) => metal.marketTypes.includes(source.marketType));
}

export function getCoverageMatrix(
  metals: Metal[],
  sources: SourceIntegration[],
  coverage: Set<string>
): Map<string, Set<string>> {
  const matrix = new Map<string, Set<string>>();
  for (const metal of metals) {
    const sourceIds = new Set<string>();
    for (const source of sources) {
      const key = `${metal.id}-${source.id}`;
      if (coverage.has(key)) {
        sourceIds.add(source.id);
      }
    }
    matrix.set(metal.id, sourceIds);
  }
  return matrix;
}
