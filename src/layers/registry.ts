import type {
  JsonApiLayer,
  LayerGroupDocument,
  LayerRegistry,
  RegisteredLayer,
  RegisteredLayerGroup,
} from './types';

const STARTUP_GROUPS = new Set(['tax-lots', 'zoning-districts']);

export async function fetchLayerRegistry(): Promise<LayerRegistry> {
  const response = await fetch('/layer-groups.json');
  if (!response.ok) {
    throw new Error(`Unable to load layer-groups.json: ${response.status}`);
  }

  return createLayerRegistry((await response.json()) as LayerGroupDocument);
}

export function createLayerRegistry(document: LayerGroupDocument): LayerRegistry {
  const layersById = new Map(document.included.map((layer) => [layer.id, layer]));
  const groups: RegisteredLayerGroup[] = document.data.map((group) => ({
    id: group.id,
    title: group.attributes.title,
    visibleByDefault: STARTUP_GROUPS.has(group.id),
    visibilityType: group.attributes['layer-visibility-type'] ?? 'multi',
    tooltip: group.attributes['title-tooltip'],
    legendColor: group.attributes['legend-color'],
    layerIds: group.relationships.layers.data.map((layer) => layer.id),
  }));

  const layers = groups.flatMap((group) =>
    group.layerIds
      .map((layerId) => layersById.get(layerId))
      .filter((layer): layer is JsonApiLayer => Boolean(layer))
      .filter((layer) => isRenderableLayer(getLayerStyle(layer)))
      .map((layer): RegisteredLayer => {
        const style = getLayerStyle(layer);
        const before = 'attributes' in layer ? layer.attributes.before : undefined;
        const displayName = 'attributes' in layer ? layer.attributes['display-name'] : undefined;
        const clickable = 'attributes' in layer ? Boolean(layer.attributes.clickable) : false;
        const highlightable = 'attributes' in layer ? Boolean(layer.attributes.highlightable) : false;
        const metadata = {
          ...(style.metadata ?? {}),
          'nycplanninglabs:layergroupid': group.id,
        };

        return {
          id: layer.id,
          groupId: group.id,
          groupTitle: group.title,
          displayName: displayName ?? layer.id,
          before,
          clickable,
          highlightable,
          style: {
            ...style,
            id: layer.id,
            metadata,
            layout: {
              ...(style.layout ?? {}),
              visibility: group.visibleByDefault ? 'visible' : 'none',
            },
          },
        };
      }),
  );

  return {
    groups,
    layers,
    style: document.meta.mapboxStyle,
    clickableLayerIds: layers.filter((layer) => layer.clickable).map((layer) => layer.id),
  };
}

export function getGroupLayerIds(registry: LayerRegistry, groupId: string) {
  return registry.layers.filter((layer) => layer.groupId === groupId).map((layer) => layer.id);
}

function getLayerStyle(layer: JsonApiLayer) {
  return 'attributes' in layer ? layer.attributes.style : layer;
}

function isRenderableLayer(style: { type?: unknown; ref?: unknown }) {
  return typeof style.type === 'string' || typeof style.ref === 'string';
}
