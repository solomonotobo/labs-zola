import { Outlet, useNavigate } from 'react-router-dom';
import { MainMap } from '../map/MainMap';
import { Sidebar } from '../sidebar/Sidebar';
import { SearchBox } from '../search/SearchBox';
import { useUrlStateBridge } from '../state/urlState';
import { activeDomain } from '../config/domains';

export function App() {
  const navigate = useNavigate();
  useUrlStateBridge();

  return (
    <main className="h-full min-h-0 overflow-hidden bg-zola-panel text-zola-ink">
      <MainMap navigate={navigate} />
      <aside className="absolute left-3 top-3 z-10 flex max-h-[calc(100%-1.5rem)] w-[min(25rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded bg-white shadow-mapPanel">
        <header className="border-b border-zola-line px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <a className="text-2xl font-semibold leading-none tracking-normal" href="/">
              {activeDomain.brandName}
            </a>
            <nav className="flex gap-3 text-sm font-medium text-zola-accent">
              {activeDomain.nav.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <SearchBox navigate={navigate} />
        </header>
        <Sidebar />
      </aside>
      <Outlet />
    </main>
  );
}
