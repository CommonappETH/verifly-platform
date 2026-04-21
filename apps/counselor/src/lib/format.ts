export function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatRelative(iso?: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  const days = Math.round(diff / day);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 0 && days < 30) return `${days}d ago`;
  if (days < 0 && days > -30) return `in ${Math.abs(days)}d`;
  return formatDate(iso);
}

export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
