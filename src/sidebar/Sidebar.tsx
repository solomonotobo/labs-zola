import { useMemo } from 'react';
import { useMapStore } from '../state/mapStore';
import { DataImportPanel } from '../data/DataImportPanel';
import { useDatasetStore } from '../state/datasetStore';

export function Sidebar() {
  const registry = useMapStore((state) => state.registry);
  const visibleGroupIds = useMapStore((state) => state.visibleGroupIds);
  const toggleGroup = useMapStore((state) => state.toggleGroup);
  const datasets = useDatasetStore((state) => state.datasets);
  const toggleDataset = useDatasetStore((state) => state.toggleDataset);
  const removeDataset = useDatasetStore((state) => state.removeDataset);

  const groups = useMemo(() => registry?.groups ?? [], [registry]);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <DataImportPanel />
      {datasets.length > 0 ? (
        <div className="divide-y divide-zola-line border-b border-zola-line">
          {datasets.map((dataset) => (
            <div className="flex gap-3 px-4 py-3" key={dataset.id}>
              <input
                aria-label={`Toggle ${dataset.name}`}
                checked={dataset.visible}
                className="mt-1 h-4 w-4 accent-zola-accent"
                onChange={() => toggleDataset(dataset.id)}
                type="checkbox"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium leading-5">{dataset.name}</div>
                <div className="mt-1 text-xs text-zola-ink/60">
                  {dataset.featureCount} features · {dataset.geometryKind}
                </div>
              </div>
              <button
                aria-label={`Remove ${dataset.name}`}
                className="self-start rounded px-2 py-1 text-xs font-semibold text-zola-ink/60 hover:bg-zola-panel"
                onClick={() => removeDataset(dataset.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="border-b border-zola-line px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-normal text-zola-ink/70">Layers</h2>
      </div>
      <div className="divide-y divide-zola-line">
        {groups.map((group) => {
          const checked = visibleGroupIds.has(group.id);
          return (
            <label className="flex cursor-pointer gap-3 px-4 py-3 hover:bg-zola-panel" key={group.id}>
              <input
                aria-label={`Toggle ${group.title}`}
                checked={checked}
                className="mt-1 h-4 w-4 accent-zola-accent"
                onChange={() => toggleGroup(group.id)}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {group.legendColor ? (
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-sm border border-zola-line"
                      style={{ background: group.legendColor }}
                    />
                  ) : null}
                  <span className="text-sm font-medium leading-5">{group.title}</span>
                </span>
                {group.tooltip ? <span className="mt-1 block text-xs leading-4 text-zola-ink/60">{group.tooltip}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
