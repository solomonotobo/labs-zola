import { ChangeEvent, useRef } from 'react';
import { importGeoJsonFile } from './geojson';
import { uploadDataset } from './api';
import { useDatasetStore } from '../state/datasetStore';

const SUPPORTED_LOCAL_EXTENSIONS = ['.geojson', '.json'];
const API_ONLY_EXTENSIONS = ['.zip', '.shp'];

export function DataImportPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const addDataset = useDatasetStore((state) => state.addDataset);
  const importStatus = useDatasetStore((state) => state.importStatus);
  const importError = useDatasetStore((state) => state.importError);
  const setImportStatus = useDatasetStore((state) => state.setImportStatus);
  const setImportError = useDatasetStore((state) => state.setImportError);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    setImportStatus(`Importing ${file.name}`);
    setImportError(null);

    try {
      if (SUPPORTED_LOCAL_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
        const { dataset, warnings } = await importGeoJsonFile(file);
        addDataset(dataset);
        if (warnings.length) setImportStatus(warnings.join(' '));
        return;
      }

      if (API_ONLY_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
        const dataset = await uploadDataset(file);
        addDataset(dataset);
        return;
      }

      setImportError('Use GeoJSON now. Zipped Shapefile import is wired for the API boundary.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unable to import this dataset.');
    }
  }

  return (
    <section className="border-b border-zola-line px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-zola-ink/70">My Data</h2>
        <button
          className="rounded border border-zola-accent px-2 py-1 text-xs font-semibold text-zola-accent"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Add
        </button>
      </div>
      <input
        accept=".geojson,.json,.zip,.shp,application/geo+json,application/json"
        className="hidden"
        onChange={handleFileChange}
        ref={inputRef}
        type="file"
      />
      <p className="mt-2 text-xs leading-4 text-zola-ink/60">GeoJSON imports locally. Shapefiles are ready for the dataset API endpoint.</p>
      {importStatus ? <p className="mt-2 text-xs text-zola-accent">{importStatus}</p> : null}
      {importError ? <p className="mt-2 text-xs text-red-700">{importError}</p> : null}
    </section>
  );
}

