import { useMemo } from 'react';
import { useMapStore } from '../state/mapStore';

export function Sidebar() {
  const registry = useMapStore((state) => state.registry);
  const visibleGroupIds = useMapStore((state) => state.visibleGroupIds);
  const toggleGroup = useMapStore((state) => state.toggleGroup);

  const groups = useMemo(() => registry?.groups ?? [], [registry]);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
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
