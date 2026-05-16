import type { LayerSpecification, SourceSpecification, StyleSpecification } from 'maplibre-gl';

export type LayerVisibilityType = 'singleton' | 'multi';

export type LayerGroupDocument = {
  data: JsonApiLayerGroup[];
  included: JsonApiLayer[];
  meta: {
    mapboxStyle: StyleSpecification & {
      sources: Record<string, SourceSpecification>;
    };
  };
};

export type JsonApiLayerGroup = {
  type: 'layer-groups';
  id: string;
  attributes: {
    id: string;
    title: string;
    visible?: boolean;
    'layer-visibility-type'?: LayerVisibilityType;
    'title-tooltip'?: string;
    'legend-color'?: string;
    'legend-icon'?: string;
    meta?: Record<string, unknown>;
  };
  relationships: {
    layers: {
      data: Array<{
        type: 'layers';
        id: string;
      }>;
    };
  };
};

export type JsonApiLayer = WrappedJsonApiLayer | LayerSpecification;

export type WrappedJsonApiLayer = {
  type: 'layers';
  id: string;
  attributes: {
    style: LayerSpecification;
    before?: string;
    clickable?: boolean;
    highlightable?: boolean;
    'display-name'?: string;
  };
};

export type RegisteredLayer = {
  id: string;
  groupId: string;
  groupTitle: string;
  displayName: string;
  before?: string;
  clickable: boolean;
  highlightable: boolean;
  style: LayerSpecification;
};

export type RegisteredLayerGroup = {
  id: string;
  title: string;
  visibleByDefault: boolean;
  visibilityType: LayerVisibilityType;
  tooltip?: string;
  legendColor?: string;
  layerIds: string[];
};

export type LayerRegistry = {
  groups: RegisteredLayerGroup[];
  layers: RegisteredLayer[];
  style: StyleSpecification;
  clickableLayerIds: string[];
};
