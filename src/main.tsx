import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import { App } from './shell/App';
import { PreserveRouteScreen } from './routes/PreserveRouteScreen';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <PreserveRouteScreen routeName="index" /> },
      { path: 'bbox/:west/:south/:east/:north', element: <PreserveRouteScreen routeName="bbox" /> },
      { path: 'bbl/:bbl', element: <PreserveRouteScreen routeName="bbl" /> },
      { path: 'about', element: <PreserveRouteScreen routeName="about" /> },
      { path: 'bookmarks', element: <PreserveRouteScreen routeName="bookmarks" /> },
      { path: 'data', element: <PreserveRouteScreen routeName="data" /> },
      { path: 'features', element: <PreserveRouteScreen routeName="features" /> },
      { path: 'l/lot/:boro/:block/:lot', element: <PreserveRouteScreen routeName="map-feature.lot" /> },
      {
        path: 'l/lot-comparison/:boro/:block/:lot/:comparisonboro/:comparisonblock/:comparisonlot',
        element: <PreserveRouteScreen routeName="map-feature.lot-comparison" />,
      },
      { path: 'l/zoning-district/:id', element: <PreserveRouteScreen routeName="map-feature.zoning-district" /> },
      { path: 'l/commercial-overlay/:id', element: <PreserveRouteScreen routeName="map-feature.commercial-overlay" /> },
      {
        path: 'l/special-purpose-district/:id',
        element: <PreserveRouteScreen routeName="map-feature.special-purpose-district" />,
      },
      {
        path: 'l/special-purpose-subdistrict/:id',
        element: <PreserveRouteScreen routeName="map-feature.special-purpose-subdistrict" />,
      },
      { path: 'l/zma/:id', element: <PreserveRouteScreen routeName="map-feature.zoning-map-amendment" /> },
      { path: 'l/e-designation/:id', element: <PreserveRouteScreen routeName="map-feature.e-designation" /> },
      { path: 'l/zoning-map-index/:id', element: <PreserveRouteScreen routeName="map-feature.zoning-map-index" /> },
      {
        path: 'l/zoning-for-accessibility/:id',
        element: <PreserveRouteScreen routeName="map-feature.zoning-for-accessibility" />,
      },
      { path: 'commercial-overlay/:id', element: <PreserveRouteScreen routeName="legacy.commercial-overlay" /> },
      { path: 'zoning-district/:id', element: <PreserveRouteScreen routeName="legacy.zoning-district" /> },
      { path: 'special-purpose-district/:id', element: <PreserveRouteScreen routeName="legacy.special-purpose-district" /> },
      { path: 'special-purpose-subdistrict/:id', element: <PreserveRouteScreen routeName="legacy.special-purpose-subdistrict" /> },
      { path: 'zoning-map-amendment/:id', element: <PreserveRouteScreen routeName="legacy.zoning-map-amendment" /> },
      { path: 'zma/:id', element: <PreserveRouteScreen routeName="legacy.zma" /> },
      { path: 'lot/:boro/:block/:lot', element: <PreserveRouteScreen routeName="legacy.lot" /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
