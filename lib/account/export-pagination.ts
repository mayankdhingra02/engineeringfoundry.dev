export const EXPORT_PAGE_SIZE = 500;
const EXPORT_MAX_PAGES = 100;

type ExportPage<T> = { data: T[] | null; error: { message: string } | null };

export async function collectAccountExportRows<T>(
  section: string,
  loadPage: (from: number, to: number) => PromiseLike<ExportPage<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < EXPORT_MAX_PAGES; page += 1) {
    const from = page * EXPORT_PAGE_SIZE;
    const result = await loadPage(from, from + EXPORT_PAGE_SIZE - 1);
    if (result.error) throw new Error(`Account export query failed: ${section}`);
    const pageRows = result.data ?? [];
    rows.push(...pageRows);
    if (pageRows.length < EXPORT_PAGE_SIZE) return rows;
  }
  throw new Error(`Account export section exceeded its safe row limit: ${section}`);
}
