import type { Order, OrderReminder } from "../types";

function normalizeDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function daysBetween(start: Date, end: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const cleanStart = normalizeDateOnly(start);
  const cleanEnd = normalizeDateOnly(end);

  return Math.round((cleanEnd.getTime() - cleanStart.getTime()) / oneDay);
}

export function getUpcomingOrders(orders: Order[], windowDays = 7) {
  const today = new Date();

  return orders
    .filter((order) => order.status !== "delivered" && order.status !== "cancelled" && order.dueDate)
    .map((order): OrderReminder => {
      const dueDate = new Date(`${order.dueDate}T00:00:00`);

      return {
        id: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        outfitType: order.outfitType,
        dueDate: order.dueDate,
        status: order.status,
        daysUntil: daysBetween(today, dueDate),
      };
    })
    .filter((order) => order.daysUntil <= windowDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function formatOrderDueText(daysUntil: number) {
  if (daysUntil < 0) return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} overdue`;
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `Due in ${daysUntil} days`;
}
