import { useEffect } from 'react';
import { useMapStore } from './mapStore';

export function useUrlStateBridge() {
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const visibleGroupIds = useMapStore((state) => state.visibleGroupIds);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('center', center.map((value) => value.toFixed(5)).join(','));
    url.searchParams.set('zoom', zoom.toFixed(2));
    url.searchParams.set('layers', Array.from(visibleGroupIds).join(','));
    window.history.replaceState(window.history.state, '', url);
  }, [center, zoom, visibleGroupIds]);
}
