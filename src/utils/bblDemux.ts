export function bblDemux(bbl: string) {
  const normalized = bbl.padStart(10, '0');
  return {
    boro: normalized.slice(0, 1),
    block: String(Number(normalized.slice(1, 6))),
    lot: String(Number(normalized.slice(6, 10))),
  };
}
