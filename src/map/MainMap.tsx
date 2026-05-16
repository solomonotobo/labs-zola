import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import type { NavigateFunction } from 'react-router-dom';
import { fetchLayerRegistry } from '../layers/registry';
import { useMapStore } from '../state/mapStore';
import { navigateToFeature } from '../routes/featureRoutes';
import type { LayerRegistry } from '../layers/types';

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
      maxBounds: [
        [-75.2, 39.5],
        [-71.8, 41.4],
      ],
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
      const interactiveLayers = registry.clickableLayerIds.filter((layerId) => map.getLayer(layerId));
      const [feature] = map.queryRenderedFeatures(event.point, { layers: interactiveLayers });
      if (!feature) return;

      setSelectedFeature(feature as GeoJSON.Feature);
      navigateToFeature(feature as GeoJSON.Feature, navigate);
    });

    map.on('mousemove', (event) => {
      const interactiveLayers = registry.clickableLayerIds.filter((layerId) => map.getLayer(layerId));
      const features = map.queryRenderedFeatures(event.point, { layers: interactiveLayers });
      map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, navigate, registry, setSelectedFeature, setView, visibleGroupIds, zoom]);

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
