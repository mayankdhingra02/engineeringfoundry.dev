import { APPLICATION_STATUSES } from "@/lib/applications/options";

export function StatusForm({ id, status, action, compact = false }: { id: string; status: string; action: (formData: FormData) => Promise<void>; compact?: boolean }) {
  return <form className={compact ? "tracker-status-form compact" : "tracker-status-form"} action={action}><label className="sr-only" htmlFor={`status-${id}`}>Application status</label><select id={`status-${id}`} name="status" defaultValue={status}>{APPLICATION_STATUSES.map((value) => <option key={value}>{value}</option>)}</select><button className="button button-secondary button-sm" type="submit">Update</button></form>;
}
