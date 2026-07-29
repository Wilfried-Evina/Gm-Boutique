/** Format monétaire suisse : CHF avec séparateur de milliers par apostrophe. */
export function formatCHF(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `CHF ${value.toLocaleString('de-CH').replace(/’/g, "'")}`;
}

/** Date au format suisse JJ.MM.AAAA. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  const jj = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = d.getFullYear();
  return `${jj}.${mm}.${aaaa}`;
}
