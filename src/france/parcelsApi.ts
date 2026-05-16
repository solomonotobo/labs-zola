const API_BASE_URL = import.meta.env.VITE_DATA_API_URL;

export type ParcelBbox = [number, number, number, number];

export async function fetchParcels(bbox: ParcelBbox): Promise<GeoJSON.FeatureCollection> {
  if (!API_BASE_URL) {
    return emptyFeatureCollection();
  }

  const url = new URL(`${API_BASE_URL}/parcels`);
  url.searchParams.set('bbox', bbox.join(','));
  url.searchParams.set('limit', '5000');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load parcels: ${response.status}`);
  }

  return (await response.json()) as GeoJSON.FeatureCollection;
}

export function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [],
  };
}

