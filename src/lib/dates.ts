export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysInputValue(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isSameMonth(value: string) {
  if (!value) return false;

  const date = new Date(`${value}T00:00:00`);
  const now = new Date();

  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function isToday(value: string) {
  if (!value) return false;
  return value === todayInputValue();
}
