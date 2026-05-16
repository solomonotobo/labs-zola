import { create } from 'zustand';
import type { LayerRegistry, RegisteredLayerGroup } from '../layers/types';
import { activeDomain } from '../config/domains';

type MapStore = {
  center: [number, number];
  zoom: number;
  registry: LayerRegistry | null;
  visibleGroupIds: Set<string>;
  selectedFeature: GeoJSON.Feature | null;
  setView: (center: [number, number], zoom: number) => void;
  setRegistry: (registry: LayerRegistry) => void;
  toggleGroup: (groupId: string) => void;
  setSelectedFeature: (feature: GeoJSON.Feature | null) => void;
};

const params = new URLSearchParams(window.location.search);
const layerParam = params.get('layers');
const initialLayers = new Set(layerParam ? layerParam.split(',').filter(Boolean) : []);
const initialCenter = parsePair(params.get('center')) ?? activeDomain.map.center;
const initialZoom = Number(params.get('zoom') ?? activeDomain.map.zoom);

export const useMapStore = create<MapStore>((set, get) => ({
  center: initialCenter,
  zoom: Number.isFinite(initialZoom) ? initialZoom : 12,
  registry: null,
  visibleGroupIds: initialLayers,
  selectedFeature: null,
  setView: (center, zoom) => set({ center, zoom }),
  setRegistry: (registry) => {
    const currentVisible = get().visibleGroupIds;
    const visibleGroupIds =
      currentVisible.size > 0
        ? currentVisible
        : new Set(registry.groups.filter((group) => group.visibleByDefault).map((group) => group.id));

    set({ registry, visibleGroupIds });
  },
  toggleGroup: (groupId) =>
    set((state) => {
      const visibleGroupIds = new Set(state.visibleGroupIds);
      if (visibleGroupIds.has(groupId)) {
        visibleGroupIds.delete(groupId);
      } else {
        enforceSingletonSelection(state.registry?.groups ?? [], visibleGroupIds, groupId);
        visibleGroupIds.add(groupId);
      }

      return { visibleGroupIds };
    }),
  setSelectedFeature: (selectedFeature) => set({ selectedFeature }),
}));

function enforceSingletonSelection(groups: RegisteredLayerGroup[], visibleGroupIds: Set<string>, groupId: string) {
  const group = groups.find((candidate) => candidate.id === groupId);
  if (group?.visibilityType !== 'singleton') return;

  group.layerIds.forEach((layerId) => visibleGroupIds.delete(layerId));
}

function parsePair(value: string | null): [number, number] | null {
  if (!value) return null;
  const [lng, lat] = value.split(',').map(Number);
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
}
