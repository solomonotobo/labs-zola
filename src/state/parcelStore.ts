import { create } from 'zustand';
import { emptyFeatureCollection, fetchParcels, type ParcelBbox } from '../france/parcelsApi';

type ParcelStore = {
  parcels: GeoJSON.FeatureCollection;
  visible: boolean;
  loading: boolean;
  error: string | null;
  toggleVisible: () => void;
  loadParcels: (bbox: ParcelBbox) => Promise<void>;
};

let latestRequestId = 0;

export const useParcelStore = create<ParcelStore>((set) => ({
  parcels: emptyFeatureCollection(),
  visible: true,
  loading: false,
  error: null,
  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  loadParcels: async (bbox) => {
    const requestId = ++latestRequestId;
    set({ loading: true, error: null });

    try {
      const parcels = await fetchParcels(bbox);
      if (requestId === latestRequestId) {
        set({ parcels, loading: false });
      }
    } catch (error) {
      if (requestId === latestRequestId) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load parcels.',
        });
      }
    }
  },
}));

