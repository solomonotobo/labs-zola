import { FormEvent, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { bblDemux } from '../utils/bblDemux';
import { useMapStore } from '../state/mapStore';
import { activeDomain } from '../config/domains';
import { lookupPlace } from './providers';

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

    if (activeDomain.id === 'zola' && /^\d{10}$/.test(query)) {
      const { boro, block, lot } = bblDemux(query);
      navigate(`/l/lot/${boro}/${block}/${lot}?search=true`);
      setMessage(null);
      return;
    }

    if (activeDomain.id === 'zola' && zoningDistrictPattern.test(query)) {
      navigate(`/l/zoning-district/${encodeURIComponent(query.toUpperCase())}?search=true`);
      setMessage(null);
      return;
    }

    const result = await lookupPlace(query);
    if (result) {
      setView(result.center, 15);
      setMessage(result.label);
      return;
    }

    setMessage(activeDomain.search.noMatch);
  }

  return (
    <form className="mt-3" onSubmit={submitSearch}>
      <div className="flex rounded border border-zola-line bg-white focus-within:border-zola-accent">
        <input
          aria-label={activeDomain.search.ariaLabel}
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={activeDomain.search.placeholder}
          type="search"
          value={searchTerm}
        />
        <button className="border-l border-zola-line px-3 text-sm font-semibold text-zola-accent" type="submit">
          {activeDomain.search.buttonLabel}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-zola-ink/65">{message}</p> : null}
    </form>
  );
}
