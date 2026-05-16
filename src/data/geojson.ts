import type { DatasetGeometryKind, DatasetImportResult, UserDataset } from './types';

export async function importGeoJsonFile(file: File): Promise<DatasetImportResult> {
  const text = await file.text();
  const parsed = JSON.parse(text) as GeoJSON.GeoJSON;
  const data = normalizeGeoJson(parsed);

  const warnings: string[] = [];
  if (data.features.length === 0) {
    warnings.push('This file imported successfully, but it does not contain any features.');
  }

  return {
    dataset: {
      id: crypto.randomUUID(),
      name: cleanDatasetName(file.name),
      source: 'upload',
      format: 'geojson',
      geometryKind: detectGeometryKind(data),
      featureCount: data.features.length,
      visible: true,
      createdAt: new Date().toISOString(),
      data,
    },
    warnings,
  };
}

export function normalizeGeoJson(input: GeoJSON.GeoJSON): GeoJSON.FeatureCollection {
  if (input.type === 'FeatureCollection') {
    return {
      type: 'FeatureCollection',
      features: input.features.filter((feature) => Boolean(feature.geometry)),
    };
  }

  if (input.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: input.geometry ? [input] : [],
    };
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: input,
      },
    ],
  };
}

export function detectGeometryKind(collection: GeoJSON.FeatureCollection): DatasetGeometryKind {
  const geometryTypes = new Set(
    collection.features
      .map((feature) => feature.geometry?.type)
      .filter((type): type is NonNullable<typeof type> => Boolean(type)),
  );

  if (geometryTypes.size === 0) return 'mixed';
  if ([...geometryTypes].every((type) => type.includes('Point'))) return 'point';
  if ([...geometryTypes].every((type) => type.includes('LineString'))) return 'line';
  if ([...geometryTypes].every((type) => type.includes('Polygon'))) return 'polygon';
  return 'mixed';
}

export function getDatasetBounds(collection: GeoJSON.FeatureCollection): [[number, number], [number, number]] | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  visitCoordinates(collection, ([lng, lat]) => {
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  });

  if (![west, south, east, north].every(Number.isFinite)) return null;
  return [
    [west, south],
    [east, north],
  ];
}

function visitCoordinates(geojson: GeoJSON.GeoJSON, visitor: (coordinate: [number, number]) => void) {
  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach((feature) => visitCoordinates(feature, visitor));
    return;
  }

  if (geojson.type === 'Feature') {
    if (geojson.geometry) visitCoordinates(geojson.geometry, visitor);
    return;
  }

  if (geojson.type === 'GeometryCollection') {
    geojson.geometries.forEach((geometry) => visitCoordinates(geometry, visitor));
    return;
  }

  walkPositionTree(geojson.coordinates, visitor);
}

function walkPositionTree(value: GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][], visitor: (coordinate: [number, number]) => void) {
  if (typeof value[0] === 'number') {
    const [lng, lat] = value as GeoJSON.Position;
    if (Number.isFinite(lng) && Number.isFinite(lat)) visitor([lng, lat]);
    return;
  }

  (value as Array<GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][]>).forEach((item) => walkPositionTree(item, visitor));
}

function cleanDatasetName(name: string) {
  return name.replace(/\.(geo)?json$/i, '').trim() || 'Untitled dataset';
}

