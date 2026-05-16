import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import type { NavigateFunction } from 'react-router-dom';
import { fetchLayerRegistry } from '../layers/registry';
import { useMapStore } from '../state/mapStore';
import { navigateToFeature } from '../routes/featureRoutes';
import type { LayerRegistry } from '../layers/types';
import { useDatasetStore } from '../state/datasetStore';
import type { UserDataset } from '../data/types';
import { getDatasetBounds } from '../data/geojson';
import { activeDomain } from '../config/domains';
import { useParcelStore } from '../state/parcelStore';

const CADASTRE_SOURCE_ID = 'fr-cadastre-parcels';
const CADASTRE_FILL_LAYER_ID = 'fr-cadastre-parcels-fill';
const CADASTRE_LINE_LAYER_ID = 'fr-cadastre-parcels-line';

type MainMapProps = {
  navigate: NavigateFunction;
};

export function MainMap({ navigate }: MainMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const datasetsRef = useRef<UserDataset[]>([]);
  const parcelsRef = useRef<GeoJSON.FeatureCollection>({ type: 'FeatureCollection', features: [] });
  const parcelsVisibleRef = useRef(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const registry = useMapStore((state) => state.registry);
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const visibleGroupIds = useMapStore((state) => state.visibleGroupIds);
  const visibleGroupIdsRef = useRef<Set<string>>(visibleGroupIds);
  const setRegistry = useMapStore((state) => state.setRegistry);
  const setView = useMapStore((state) => state.setView);
  const setSelectedFeature = useMapStore((state) => state.setSelectedFeature);
  const datasets = useDatasetStore((state) => state.datasets);
  const fitDatasetId = useDatasetStore((state) => state.fitDatasetId);
  const consumeFitDataset = useDatasetStore((state) => state.consumeFitDataset);
  const parcels = useParcelStore((state) => state.parcels);
  const parcelsVisible = useParcelStore((state) => state.visible);
  const loadParcels = useParcelStore((state) => state.loadParcels);

  useEffect(() => {
    datasetsRef.current = datasets;
  }, [datasets]);

  useEffect(() => {
    parcelsRef.current = parcels;
  }, [parcels]);

  useEffect(() => {
    parcelsVisibleRef.current = parcelsVisible;
  }, [parcelsVisible]);

  useEffect(() => {
    visibleGroupIdsRef.current = visibleGroupIds;
  }, [visibleGroupIds]);

  useEffect(() => {
    fetchLayerRegistry().then(setRegistry).catch((error: Error) => setLoadError(error.message));
  }, [setRegistry]);

  useEffect(() => {
    if (!containerRef.current || !registry || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: registry.style,
      center,
      zoom,
      minZoom: activeDomain.map.minZoom,
      hash: true,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-left');
    map.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }), 'bottom-left');

    map.on('load', () => {
      registry.layers.forEach((layer) => {
        if (map.getLayer(layer.id) || !hasSource(layer.style) || !map.getSource(String(layer.style.source))) return;
        const before = layer.before && map.getLayer(layer.before) ? layer.before : undefined;
        map.addLayer(layer.style, before);
      });
      if (activeDomain.id === 'fr-real-estate') {
        addCadastreLayers(map, parcelsRef.current, parcelsVisibleRef.current);
        void loadParcels(getMapBbox(map));
      }
      applyGroupVisibility(map, registry, visibleGroupIdsRef.current);
    });

    map.on('moveend', () => {
      const nextCenter = map.getCenter();
      setView([nextCenter.lng, nextCenter.lat], map.getZoom());
      if (activeDomain.id === 'fr-real-estate') {
        void loadParcels(getMapBbox(map));
      }
    });

    map.on('click', (event) => {
      const cadastreLayerIds = activeDomain.id === 'fr-real-estate' ? [CADASTRE_FILL_LAYER_ID].filter((layerId) => map.getLayer(layerId)) : [];
      const userDatasetLayerIds = getUserDatasetLayerIds(datasetsRef.current).filter((layerId) => map.getLayer(layerId));
      const interactiveLayers = [
        ...cadastreLayerIds,
        ...userDatasetLayerIds,
        ...registry.clickableLayerIds.filter((layerId) => map.getLayer(layerId)),
      ];
      const [feature] = map.queryRenderedFeatures(event.point, { layers: interactiveLayers });
      if (!feature) return;

      setSelectedFeature(feature as GeoJSON.Feature);
      if (String(feature.layer.id).startsWith('user-data-') || feature.layer.id === CADASTRE_FILL_LAYER_ID) return;
      navigateToFeature(feature as GeoJSON.Feature, navigate);
    });

    map.on('mousemove', (event) => {
      const interactiveLayers = [
        ...(activeDomain.id === 'fr-real-estate' ? [CADASTRE_FILL_LAYER_ID].filter((layerId) => map.getLayer(layerId)) : []),
        ...getUserDatasetLayerIds(datasetsRef.current).filter((layerId) => map.getLayer(layerId)),
        ...registry.clickableLayerIds.filter((layerId) => map.getLayer(layerId)),
      ];
      const features = map.queryRenderedFeatures(event.point, { layers: interactiveLayers });
      map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loadParcels, navigate, registry, setSelectedFeature, setView]);

  useEffect(() => {
    if (!registry || !mapRef.current || !mapRef.current.isStyleLoaded()) return;
    applyGroupVisibility(mapRef.current, registry, visibleGroupIds);
  }, [registry, visibleGroupIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentCenter = map.getCenter();
    const centerMoved = Math.abs(currentCenter.lng - center[0]) > 0.0001 || Math.abs(currentCenter.lat - center[1]) > 0.0001;
    const zoomMoved = Math.abs(map.getZoom() - zoom) > 0.01;
    if (centerMoved || zoomMoved) {
      map.flyTo({ center, zoom, essential: true });
    }
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncUserDatasets(map, datasets);
  }, [datasets]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || activeDomain.id !== 'fr-real-estate') return;
    syncCadastreParcels(map, parcels, parcelsVisible);
  }, [parcels, parcelsVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitDatasetId) return;

    const dataset = datasets.find((candidate) => candidate.id === fitDatasetId);
    const bounds = dataset ? getDatasetBounds(dataset.data) : null;
    consumeFitDataset();

    if (bounds) {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 15,
        duration: 700,
      });
    }
  }, [consumeFitDataset, datasets, fitDatasetId]);

  const status = useMemo(() => {
    if (loadError) return loadError;
    if (!registry) return activeDomain.map.loadingLabel;
    return null;
  }, [loadError, registry]);

  return (
    <>
      <div className="h-full w-full" ref={containerRef} />
      {status ? (
        <div className="absolute right-3 top-3 z-10 rounded bg-white px-3 py-2 text-sm shadow-mapPanel">
          {status}
        </div>
      ) : null}
    </>
  );
}

function applyGroupVisibility(map: MapLibreMap, registry: LayerRegistry, visibleGroupIds: Set<string>) {
  registry.layers.forEach((layer) => {
    if (!map.getLayer(layer.id)) return;
    map.setLayoutProperty(layer.id, 'visibility', visibleGroupIds.has(layer.groupId) ? 'visible' : 'none');
  });
}

function hasSource(layer: unknown): layer is { source: string } {
  return typeof layer === 'object' && layer !== null && 'source' in layer && typeof layer.source === 'string';
}

function addCadastreLayers(map: MapLibreMap, parcels: GeoJSON.FeatureCollection, visible: boolean) {
  if (!map.getSource(CADASTRE_SOURCE_ID)) {
    map.addSource(CADASTRE_SOURCE_ID, {
      type: 'geojson',
      data: parcels,
    });
  }

  const visibility = visible ? 'visible' : 'none';

  if (!map.getLayer(CADASTRE_FILL_LAYER_ID)) {
    map.addLayer({
      id: CADASTRE_FILL_LAYER_ID,
      type: 'fill',
      source: CADASTRE_SOURCE_ID,
      paint: {
        'fill-color': '#d4a017',
        'fill-opacity': 0.14,
      },
      layout: { visibility },
    });
  }

  if (!map.getLayer(CADASTRE_LINE_LAYER_ID)) {
    map.addLayer({
      id: CADASTRE_LINE_LAYER_ID,
      type: 'line',
      source: CADASTRE_SOURCE_ID,
      paint: {
        'line-color': '#8a5d00',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 18, 1.4],
        'line-opacity': 0.8,
      },
      layout: { visibility },
    });
  }
}

function syncCadastreParcels(map: MapLibreMap, parcels: GeoJSON.FeatureCollection, visible: boolean) {
  if (!map.getSource(CADASTRE_SOURCE_ID)) {
    addCadastreLayers(map, parcels, visible);
  }

  const source = map.getSource(CADASTRE_SOURCE_ID);
  if (source && 'setData' in source) {
    (source as GeoJSONSource).setData(parcels);
  }

  const visibility = visible ? 'visible' : 'none';
  [CADASTRE_FILL_LAYER_ID, CADASTRE_LINE_LAYER_ID].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  });
}

function getMapBbox(map: MapLibreMap): [number, number, number, number] {
  const bounds = map.getBounds();
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
}

function syncUserDatasets(map: MapLibreMap, datasets: UserDataset[]) {
  const currentSourceIds = new Set(datasets.map((dataset) => getUserDatasetSourceId(dataset.id)));

  datasets.forEach((dataset) => {
    const sourceId = getUserDatasetSourceId(dataset.id);
    const existingSource = map.getSource(sourceId);

    if (existingSource && 'setData' in existingSource) {
      (existingSource as GeoJSONSource).setData(dataset.data);
    } else if (!existingSource) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: dataset.data,
      });
      addUserDatasetLayers(map, dataset);
    }

    getUserDatasetLayerIds([dataset]).forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', dataset.visible ? 'visible' : 'none');
      }
    });
  });

  Array.from(map.getStyle().sources ? Object.keys(map.getStyle().sources) : [])
    .filter((sourceId) => sourceId.startsWith('user-data-source-') && !currentSourceIds.has(sourceId))
    .forEach((sourceId) => {
      getUserDatasetLayerIdsFromSource(sourceId).forEach((layerId) => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
}

function addUserDatasetLayers(map: MapLibreMap, dataset: UserDataset) {
  const sourceId = getUserDatasetSourceId(dataset.id);
  const layerPrefix = getUserDatasetLayerPrefix(dataset.id);
  const visibility = dataset.visible ? 'visible' : 'none';

  map.addLayer({
    id: `${layerPrefix}-polygon-fill`,
    type: 'fill',
    source: sourceId,
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
    paint: {
      'fill-color': '#007c89',
      'fill-opacity': 0.28,
    },
    layout: { visibility },
  });

  map.addLayer({
    id: `${layerPrefix}-polygon-line`,
    type: 'line',
    source: sourceId,
    filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon', 'LineString', 'MultiLineString']]],
    paint: {
      'line-color': '#004f5f',
      'line-width': 2,
      'line-opacity': 0.9,
    },
    layout: { visibility },
  });

  map.addLayer({
    id: `${layerPrefix}-point`,
    type: 'circle',
    source: sourceId,
    filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
    paint: {
      'circle-color': '#f25f4c',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 7],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
    layout: { visibility },
  });
}

function getUserDatasetLayerIds(datasets: UserDataset[]) {
  return datasets.flatMap((dataset) => getUserDatasetLayerIdsFromSource(getUserDatasetSourceId(dataset.id)));
}

function getUserDatasetLayerIdsFromSource(sourceId: string) {
  const datasetId = sourceId.replace('user-data-source-', '');
  const prefix = getUserDatasetLayerPrefix(datasetId);
  return [`${prefix}-point`, `${prefix}-polygon-line`, `${prefix}-polygon-fill`];
}

function getUserDatasetSourceId(datasetId: string) {
  return `user-data-source-${datasetId}`;
}

function getUserDatasetLayerPrefix(datasetId: string) {
  return `user-data-${datasetId}`;
}
