"use client";
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section className="section" role="alert" aria-labelledby="page-error-title">
      <div className="page-width">
        <div className="empty-state">
          <h1 id="page-error-title">This page couldn’t load.</h1>
          <p>The issue appears temporary. Your public content and account data were not changed.</p>
          <button className="button" onClick={retry}>Try again</button>
        </div>
      </div>
    </section>
  );
}
