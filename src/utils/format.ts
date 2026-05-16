const jmdFormatter = new Intl.NumberFormat('en-JM', {
  style: 'currency',
  currency: 'JMD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return jmdFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatInvoiceDate(value: string): string {
  if (!value) return '';

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-JM', {
    month: 'numeric',
    day: '2-digit',
    year: 'numeric',
  });
}