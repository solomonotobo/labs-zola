export type AppDomain = 'zola' | 'fr-real-estate';

export type DomainConfig = {
  id: AppDomain;
  brandName: string;
  nav: Array<{ label: string; href: string }>;
  search: {
    placeholder: string;
    ariaLabel: string;
    buttonLabel: string;
    noMatch: string;
  };
  map: {
    center: [number, number];
    zoom: number;
    minZoom: number;
    loadingLabel: string;
  };
  data: {
    panelTitle: string;
    addLabel: string;
    helperText: string;
    unsupportedText: string;
  };
  layersTitle: string;
};

const domainFromEnv = import.meta.env.VITE_APP_DOMAIN as AppDomain | undefined;

export const activeDomain: DomainConfig =
  domainFromEnv === 'fr-real-estate'
    ? {
        id: 'fr-real-estate',
        brandName: 'ZoLa France',
        nav: [
          { label: 'Biens', href: '/properties' },
          { label: 'Donnees', href: '/data' },
        ],
        search: {
          placeholder: 'Adresse, ville, code postal',
          ariaLabel: 'Rechercher une adresse, ville ou code postal en France',
          buttonLabel: 'Rechercher',
          noMatch: 'Aucun resultat direct',
        },
        map: {
          center: [2.3522, 48.8566],
          zoom: 11,
          minZoom: 2,
          loadingLabel: 'Chargement des couches',
        },
        data: {
          panelTitle: 'Mes donnees',
          addLabel: 'Ajouter',
          helperText: "GeoJSON local maintenant. SHP/ZIP passera par l'API de donnees.",
          unsupportedText: 'Utilisez GeoJSON maintenant. SHP/ZIP est branche sur la future API.',
        },
        layersTitle: 'Couches ZoLa',
      }
    : {
        id: 'zola',
        brandName: 'ZoLa',
        nav: [
          { label: 'About', href: '/about' },
          { label: 'Data', href: '/data' },
        ],
        search: {
          placeholder: 'Address, BBL, or zoning district',
          ariaLabel: 'Search by address, BBL, or zoning district',
          buttonLabel: 'Search',
          noMatch: 'No direct match yet',
        },
        map: {
          center: [-73.98, 40.705],
          zoom: 12,
          minZoom: 2,
          loadingLabel: 'Loading zoning layers',
        },
        data: {
          panelTitle: 'My Data',
          addLabel: 'Add',
          helperText: 'GeoJSON imports locally. Shapefiles are ready for the dataset API endpoint.',
          unsupportedText: 'Use GeoJSON now. Zipped Shapefile import is wired for the API boundary.',
        },
        layersTitle: 'Layers',
      };
