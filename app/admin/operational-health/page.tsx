import { operationalHealth } from "@/lib/admin/operations";

export default function AdminOperationalHealthPage() {
  const items = operationalHealth();
  return <><header className="admin-page-header"><h2>Operational configuration</h2><p>These are safe configuration signals only. They never expose secret values and do not claim an external service is healthy.</p></header><div className="admin-health-list">{items.map((item) => <article key={item.id}><span className={`status-pill ${item.configured ? "success" : "warning"}`}>{item.configured ? "Configured" : "Not configured"}</span><h3>{item.label}</h3><p>{item.detail}</p></article>)}</div></>;
}
