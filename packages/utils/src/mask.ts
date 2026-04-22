export function maskAccount(num: string): string {
  const tail = num.slice(-4);
  return `••••${tail}`;
}
