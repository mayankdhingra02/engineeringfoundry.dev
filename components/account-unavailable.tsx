import Link from "next/link";
import { Binary, MessagesSquare, ShieldCheck, Users } from "lucide-react";

export function AccountUnavailable() {
  return (
    <section className="auth-section">
      <div className="page-width">
        <div className="auth-card account-unavailable" role="status">
          <ShieldCheck size={28} aria-hidden="true" />
          <p className="auth-kicker">Public launch mode</p>
          <h1>Account features are not available yet.</h1>
          <p className="auth-intro">
            Engineering Foundry&apos;s public preparation libraries and browser-only
            practice tools are ready to use without signing in. Accounts remain
            disabled until the hosted authentication platform is qualified.
          </p>
          <div className="account-unavailable-links">
            <Link className="button" href="/dsa">
              <Binary size={16} aria-hidden="true" />Explore DSA
            </Link>
            <Link className="button button-secondary" href="/mock-interviews">
              <MessagesSquare size={16} aria-hidden="true" />Try the Mock Interview Lab
            </Link>
            <Link className="button button-secondary" href="/community">
              <Users size={16} aria-hidden="true" />Open the Community Hub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
