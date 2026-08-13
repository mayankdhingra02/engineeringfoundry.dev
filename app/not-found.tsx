import Link from "next/link";
export default function NotFound() { return <section className="section"><div className="page-width"><div className="empty-state"><strong>That blueprint isn’t in the Foundry.</strong><p>The page may have moved, or it has not been built yet.</p><Link className="button" href="/">Return home</Link></div></div></section>; }
