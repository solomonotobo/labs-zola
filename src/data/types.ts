export type DatasetGeometryKind = 'point' | 'line' | 'polygon' | 'mixed';

export type UserDataset = {
  id: string;
  name: string;
  source: 'upload' | 'api';
  format: 'geojson' | 'shapefile' | 'remote';
  geometryKind: DatasetGeometryKind;
  featureCount: number;
  visible: boolean;
  createdAt: string;
  data: GeoJSON.FeatureCollection;
};

export type DatasetImportResult = {
  dataset: UserDataset;
  warnings: string[];
};

