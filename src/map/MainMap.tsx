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

type MainMapProps = {
  navigate: NavigateFunction;
};

export function MainMap({ navigate }: MainMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const registry = useMapStore((state) => state.registry);
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const visibleGroupIds = useMapStore((state) => state.visibleGroupIds);
  const setRegistry = useMapStore((state) => state.setRegistry);
  const setView = useMapStore((state) => state.setView);
  const setSelectedFeature = useMapStore((state) => state.setSelectedFeature);
  const datasets = useDatasetStore((state) => state.datasets);
  const fitDatasetId = useDatasetStore((state) => state.fitDatasetId);
  const consumeFitDataset = useDatasetStore((state) => state.consumeFitDataset);

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
      minZoom: 8,
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
      applyGroupVisibility(map, registry, visibleGroupIds);
    });

    map.on('moveend', () => {
      const nextCenter = map.getCenter();
      setView([nextCenter.lng, nextCenter.lat], map.getZoom());
    });

    map.on('click', (event) => {
      const userDatasetLayerIds = getUserDatasetLayerIds(datasets).filter((layerId) => map.getLayer(layerId));
      const interactiveLayers = [...userDatasetLayerIds, ...registry.clickableLayerIds.filter((layerId) => map.getLayer(layerId))];
      const [feature] = map.queryRenderedFeatures(event.point, { layers: interactiveLayers });
      if (!feature) return;

      setSelectedFeature(feature as GeoJSON.Feature);
      if (String(feature.layer.id).startsWith('user-data-')) return;
      navigateToFeature(feature as GeoJSON.Feature, navigate);
    });

    map.on('mousemove', (event) => {
      const interactiveLayers = [
        ...getUserDatasetLayerIds(datasets).filter((layerId) => map.getLayer(layerId)),
        ...registry.clickableLayerIds.filter((layerId) => map.getLayer(layerId)),
      ];
      const features = map.queryRenderedFeatures(event.point, { layers: interactiveLayers });
      map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, datasets, navigate, registry, setSelectedFeature, setView, visibleGroupIds, zoom]);

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
    if (!registry) return 'Loading zoning layers';
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
