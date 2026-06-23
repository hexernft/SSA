import { db } from "../db/database";

export async function exportBackup() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: 5,
    settings: await db.settings.toArray(),
    customers: await db.customers.toArray(),
    customerSpecialDates: await db.customerSpecialDates.toArray(),
    products: await db.products.toArray(),
    measurements: await db.measurements.toArray(),
    orders: await db.orders.toArray(),
    receipts: await db.receipts.toArray(),
    invoices: await db.invoices.toArray(),
    invoiceItems: await db.invoiceItems.toArray(),
    sales: await db.sales.toArray(),
    saleItems: await db.saleItems.toArray(),
    payments: await db.payments.toArray(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sleek-stitch-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File) {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!data || ![1, 2, 3, 4, 5].includes(data.version)) {
    throw new Error("Invalid backup file.");
  }

  await db.transaction(
    "rw",
    [
      db.settings,
      db.customers,
      db.customerSpecialDates,
      db.products,
      db.measurements,
      db.orders,
      db.receipts,
      db.invoices,
      db.invoiceItems,
      db.sales,
      db.saleItems,
      db.payments,
    ],
    async () => {
      await db.settings.clear();
      await db.customers.clear();
      await db.customerSpecialDates.clear();
      await db.products.clear();
      await db.measurements.clear();
      await db.orders.clear();
      await db.receipts.clear();
      await db.invoices.clear();
      await db.invoiceItems.clear();
      await db.sales.clear();
      await db.saleItems.clear();
      await db.payments.clear();

      await db.settings.bulkAdd(data.settings || []);
      await db.customers.bulkAdd(data.customers || []);
      await db.customerSpecialDates.bulkAdd(data.customerSpecialDates || []);
      await db.products.bulkAdd(data.products || []);
      await db.measurements.bulkAdd(data.measurements || []);
      await db.orders.bulkAdd(data.orders || []);
      await db.receipts.bulkAdd(data.receipts || []);
      await db.invoices.bulkAdd(data.invoices || []);
      await db.invoiceItems.bulkAdd(data.invoiceItems || []);
      await db.sales.bulkAdd(data.sales || []);
      await db.saleItems.bulkAdd(data.saleItems || []);
      await db.payments.bulkAdd(data.payments || []);
    }
  );
}
