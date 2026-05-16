import { activeDomain } from '../config/domains';

export type SearchResult = {
  center: [number, number];
  label: string;
};

export async function lookupPlace(query: string): Promise<SearchResult | null> {
  if (activeDomain.id === 'fr-real-estate') {
    return lookupFrenchAddress(query);
  }

  return lookupPlanningLabsGeosearch(query);
}

async function lookupFrenchAddress(query: string): Promise<SearchResult | null> {
  const url = new URL('https://api-adresse.data.gouv.fr/search/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: { label?: string } }>;
    };
    const [feature] = data.features ?? [];
    const coordinates = feature?.geometry?.coordinates;
    if (!coordinates) return null;

    return {
      center: coordinates,
      label: feature.properties?.label ?? query,
    };
  } catch {
    return null;
  }
}

async function lookupPlanningLabsGeosearch(query: string): Promise<SearchResult | null> {
  const url = new URL('https://geosearch.planninglabs.nyc/v2/search');
  url.searchParams.set('text', query);
  url.searchParams.set('size', '1');

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: { label?: string } }>;
    };
    const [feature] = data.features ?? [];
    const coordinates = feature?.geometry?.coordinates;
    if (!coordinates) return null;
    return {
      center: coordinates,
      label: feature.properties?.label ?? query,
    };
  } catch {
    return null;
  }
}

