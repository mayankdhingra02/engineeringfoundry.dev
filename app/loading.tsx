export default function Loading() {
  return (
    <div className="page-loading-state page-width" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading-bar" aria-hidden="true"><span /></div>
      <p>Loading Engineering Foundry…</p>
    </div>
  );
}
