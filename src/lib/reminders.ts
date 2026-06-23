import type { CelebrationReminder, Customer, CustomerSpecialDate, SpecialDateType } from "../types";

function normalizeDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getNextOccurrence(dateValue: string, today = new Date()) {
  if (!dateValue) return null;

  const parts = dateValue.split("-").map(Number);
  if (parts.length !== 3) return null;

  const month = parts[1] - 1;
  const day = parts[2];

  const baseToday = normalizeDateOnly(today);
  let next = new Date(baseToday.getFullYear(), month, day);

  if (next < baseToday) {
    next = new Date(baseToday.getFullYear() + 1, month, day);
  }

  return next;
}

function daysBetween(start: Date, end: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const cleanStart = normalizeDateOnly(start);
  const cleanEnd = normalizeDateOnly(end);

  return Math.round((cleanEnd.getTime() - cleanStart.getTime()) / oneDay);
}

function makeReminder(params: {
  id: string;
  customer: Customer;
  title: string;
  type: SpecialDateType;
  date: string;
  notes: string;
  today: Date;
  windowDays: number;
}) {
  const nextDate = getNextOccurrence(params.date, params.today);

  if (!nextDate) return null;

  const daysUntil = daysBetween(params.today, nextDate);

  if (daysUntil < 0 || daysUntil > params.windowDays) return null;

  const reminder: CelebrationReminder = {
    id: params.id,
    customerId: params.customer.id,
    customerName: params.customer.name,
    customerPhone: params.customer.phone,
    title: params.title,
    type: params.type,
    date: params.date,
    nextDate,
    daysUntil,
    notes: params.notes,
  };

  return reminder;
}

export function getUpcomingCelebrations(
  customers: Customer[],
  specialDates: CustomerSpecialDate[],
  windowDays = 14
) {
  const today = new Date();
  const reminders: CelebrationReminder[] = [];

  customers.forEach((customer) => {
    const birthday = makeReminder({
      id: `${customer.id}_birthday`,
      customer,
      title: "Birthday",
      type: "birthday",
      date: customer.birthday,
      notes: "",
      today,
      windowDays,
    });

    if (birthday) reminders.push(birthday);

    const anniversary = makeReminder({
      id: `${customer.id}_wedding_anniversary`,
      customer,
      title: "Wedding Anniversary",
      type: "anniversary",
      date: customer.weddingAnniversary,
      notes: customer.spouseName ? `Spouse: ${customer.spouseName}` : "",
      today,
      windowDays,
    });

    if (anniversary) reminders.push(anniversary);
  });

  specialDates.forEach((specialDate) => {
    const customer = customers.find((item) => item.id === specialDate.customerId);

    if (!customer) return;

    const reminder = makeReminder({
      id: specialDate.id,
      customer,
      title: specialDate.title,
      type: specialDate.type,
      date: specialDate.date,
      notes: specialDate.notes,
      today,
      windowDays,
    });

    if (reminder) reminders.push(reminder);
  });

  return reminders.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    return a.customerName.localeCompare(b.customerName);
  });
}

export function formatReminderTime(daysUntil: number) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil} days`;
}
