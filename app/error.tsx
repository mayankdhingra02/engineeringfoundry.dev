"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section" role="alert" aria-labelledby="page-error-title">
      <div className="page-width">
        <div className="empty-state">
          <h1 id="page-error-title">This page couldn’t load.</h1>
          <p>The issue appears temporary. Your public content and account data were not changed.</p>
          <button className="button" onClick={reset}>Try again</button>
        </div>
      </div>
    </section>
  );
}
