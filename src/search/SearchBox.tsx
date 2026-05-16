import { FormEvent, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { bblDemux } from '../utils/bblDemux';
import { useMapStore } from '../state/mapStore';

type SearchBoxProps = {
  navigate: NavigateFunction;
};

const zoningDistrictPattern = /^(?:R\d{1,2}[A-Z]?|C\d-\d|C\d|M\d-\d|M\d|PARK|BPC)$/i;

export function SearchBox({ navigate }: SearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const setView = useMapStore((state) => state.setView);

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    if (/^\d{10}$/.test(query)) {
      const { boro, block, lot } = bblDemux(query);
      navigate(`/l/lot/${boro}/${block}/${lot}?search=true`);
      setMessage(null);
      return;
    }

    if (zoningDistrictPattern.test(query)) {
      navigate(`/l/zoning-district/${encodeURIComponent(query.toUpperCase())}?search=true`);
      setMessage(null);
      return;
    }

    const result = await lookupGeosearch(query);
    if (result) {
      setView(result.center, 15);
      setMessage(result.label);
      return;
    }

    setMessage('No direct match yet');
  }

  return (
    <form className="mt-3" onSubmit={submitSearch}>
      <div className="flex rounded border border-zola-line bg-white focus-within:border-zola-accent">
        <input
          aria-label="Search by address, BBL, or zoning district"
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Address, BBL, or zoning district"
          type="search"
          value={searchTerm}
        />
        <button className="border-l border-zola-line px-3 text-sm font-semibold text-zola-accent" type="submit">
          Search
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-zola-ink/65">{message}</p> : null}
    </form>
  );
}

async function lookupGeosearch(query: string): Promise<{ center: [number, number]; label: string } | null> {
  const url = new URL('https://geosearch.planninglabs.nyc/v2/search');
  url.searchParams.set('text', query);
  url.searchParams.set('size', '1');

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: { label?: string } }>;
    };
    const [feature] = data.features ?? [];
    const coordinates = feature?.geometry?.coordinates;
    if (!coordinates) return null;
    return {
      center: coordinates,
      label: feature.properties?.label ?? query,
    };
  } catch {
    return null;
  }
}
