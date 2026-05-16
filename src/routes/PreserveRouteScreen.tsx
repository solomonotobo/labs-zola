import { useLocation, useParams } from 'react-router-dom';

type PreserveRouteScreenProps = {
  routeName: string;
};

export function PreserveRouteScreen({ routeName }: PreserveRouteScreenProps) {
  const params = useParams();
  const location = useLocation();

  return (
    <section className="absolute bottom-3 left-3 z-10 max-w-[min(25rem,calc(100vw-1.5rem))] rounded border border-zola-line bg-white/95 px-3 py-2 text-xs shadow-mapPanel">
      <div className="font-semibold">{routeName}</div>
      <div className="mt-1 break-words text-zola-ink/70">{location.pathname}</div>
      {Object.keys(params).length > 0 ? (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          {Object.entries(params).map(([key, value]) => (
            <div className="contents" key={key}>
              <dt className="font-medium">{key}</dt>
              <dd className="truncate text-zola-ink/70">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
