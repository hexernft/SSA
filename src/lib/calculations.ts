import type { DraftItem, InvoiceStatus, SaleStatus } from "../types";

export function calculateTotals(
  items: DraftItem[],
  deliveryFee: number,
  amountPaid: number
) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const calculatedItems = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const discount = Number(item.discount || 0);
    const taxRate = Number(item.taxRate || 0);

    const lineSubtotal = quantity * unitPrice;
    const lineAfterDiscount = Math.max(lineSubtotal - discount, 0);
    const lineTax = lineAfterDiscount * (taxRate / 100);
    const lineTotal = lineAfterDiscount + lineTax;

    subtotal += lineSubtotal;
    discountTotal += discount;
    taxTotal += lineTax;

    return {
      ...item,
      quantity,
      unitPrice,
      discount,
      taxRate,
      lineTotal,
    };
  });

  const grandTotal = subtotal - discountTotal + taxTotal + Number(deliveryFee || 0);
  const balanceDue = Math.max(grandTotal - Number(amountPaid || 0), 0);

  return {
    calculatedItems,
    subtotal,
    discountTotal,
    taxTotal,
    deliveryFee: Number(deliveryFee || 0),
    grandTotal,
    amountPaid: Number(amountPaid || 0),
    balanceDue,
  };
}

export function getInvoiceStatus(
  currentStatus: InvoiceStatus,
  dueDate: string,
  amountPaid: number,
  balanceDue: number
): InvoiceStatus {
  if (currentStatus === "cancelled" || currentStatus === "draft") {
    return currentStatus;
  }

  if (balanceDue <= 0) return "paid";
  if (amountPaid > 0 && balanceDue > 0) return "part_paid";

  if (dueDate) {
    const now = new Date();
    const due = new Date(`${dueDate}T23:59:59`);
    if (due < now) return "overdue";
  }

  return currentStatus === "paid" ? "paid" : "sent";
}

export function getSaleStatus(
  currentStatus: SaleStatus,
  amountPaid: number,
  balanceDue: number
): SaleStatus {
  if (currentStatus === "cancelled" || currentStatus === "refunded") {
    return currentStatus;
  }

  if (balanceDue <= 0) return "paid";
  if (amountPaid > 0 && balanceDue > 0) return "part_paid";

  return "unpaid";
}
