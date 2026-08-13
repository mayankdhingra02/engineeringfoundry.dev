import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="Engineering Foundry home">
      <span className="logo-mark" aria-hidden="true"><span>EF</span></span>
      {!compact && <span className="logo-type">Engineering <strong>Foundry</strong></span>}
    </Link>
  );
}
