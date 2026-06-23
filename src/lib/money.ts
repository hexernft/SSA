export function formatMoney(value: number, currency = "₦") {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `${currency}${safeValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
