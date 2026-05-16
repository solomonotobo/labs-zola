import type { NavigateFunction } from 'react-router-dom';
import { bblDemux } from '../utils/bblDemux';

export function navigateToFeature(feature: GeoJSON.Feature, navigate: NavigateFunction, search = false) {
  const properties = feature.properties ?? {};
  const query = search ? '?search=true' : '?search=false';

  if (typeof properties.bbl === 'string' || typeof properties.bbl === 'number') {
    const { boro, block, lot } = bblDemux(String(properties.bbl));
    navigate(`/l/lot/${boro}/${block}/${lot}${query}`);
    return;
  }

  if (properties.ulurpno) {
    navigate(`/l/zma/${properties.ulurpno}${query}`);
    return;
  }

  if (properties.zonedist) {
    navigate(`/l/zoning-district/${properties.zonedist}${query}`);
    return;
  }

  if (properties.sdlbl) {
    navigate(`/l/special-purpose-district/${properties.cartodb_id}${query}`);
    return;
  }

  if (properties.splbl) {
    navigate(`/l/special-purpose-subdistrict/${properties.cartodb_id}${query}`);
    return;
  }

  if (properties.overlay) {
    navigate(`/l/commercial-overlay/${properties.overlay}${query}`);
    return;
  }

  if (properties.ceqr_num && properties.id) {
    navigate(`/l/e-designation/${properties.id}${query}`);
    return;
  }

  if (properties.zmi_id) {
    navigate(`/l/zoning-map-index/${properties.zmi_id}${query}`);
    return;
  }

  if (properties.zfa_id) {
    navigate(`/l/zoning-for-accessibility/${properties.zfa_id}${query}`);
  }
}
