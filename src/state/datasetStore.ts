import { create } from 'zustand';
import type { UserDataset } from '../data/types';

type DatasetStore = {
  datasets: UserDataset[];
  fitDatasetId: string | null;
  importStatus: string | null;
  importError: string | null;
  addDataset: (dataset: UserDataset) => void;
  removeDataset: (datasetId: string) => void;
  toggleDataset: (datasetId: string) => void;
  consumeFitDataset: () => string | null;
  setImportStatus: (status: string | null) => void;
  setImportError: (error: string | null) => void;
};

export const useDatasetStore = create<DatasetStore>((set) => ({
  datasets: [],
  fitDatasetId: null,
  importStatus: null,
  importError: null,
  addDataset: (dataset) =>
    set((state) => ({
      datasets: [dataset, ...state.datasets.filter((candidate) => candidate.id !== dataset.id)],
      fitDatasetId: dataset.id,
      importStatus: `${dataset.name} added`,
      importError: null,
    })),
  removeDataset: (datasetId) =>
    set((state) => ({
      datasets: state.datasets.filter((dataset) => dataset.id !== datasetId),
    })),
  toggleDataset: (datasetId) =>
    set((state) => ({
      datasets: state.datasets.map((dataset) =>
        dataset.id === datasetId ? { ...dataset, visible: !dataset.visible } : dataset,
      ),
    })),
  consumeFitDataset: () => {
    let nextFitDatasetId: string | null = null;
    set((state) => {
      nextFitDatasetId = state.fitDatasetId;
      return { fitDatasetId: null };
    });
    return nextFitDatasetId;
  },
  setImportStatus: (importStatus) => set({ importStatus }),
  setImportError: (importError) => set({ importError, importStatus: null }),
}));
