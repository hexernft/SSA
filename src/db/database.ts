import Dexie, { type Table } from "dexie";
import type {
  BusinessSettings,
  Customer,
  CustomerSpecialDate,
  Invoice,
  InvoiceItem,
  Measurement,
  Order,
  Payment,
  Product,
  Receipt,
  Sale,
  SaleItem,
} from "../types";
import { createId } from "../lib/ids";

export class OfflineBusinessDatabase extends Dexie {
  settings!: Table<BusinessSettings, string>;
  customers!: Table<Customer, string>;
  customerSpecialDates!: Table<CustomerSpecialDate, string>;
  products!: Table<Product, string>;
  measurements!: Table<Measurement, string>;
  orders!: Table<Order, string>;
  receipts!: Table<Receipt, string>;
  invoices!: Table<Invoice, string>;
  invoiceItems!: Table<InvoiceItem, string>;
  sales!: Table<Sale, string>;
  saleItems!: Table<SaleItem, string>;
  payments!: Table<Payment, string>;

  constructor() {
    super("SleekStitchInvoiceSalesDatabase");

    this.version(1).stores({
      settings: "id",
      invoices: "id, invoiceNumber, status, issueDate, dueDate, linkedSaleId, createdAt",
      invoiceItems: "id, invoiceId",
      sales: "id, saleNumber, invoiceId, source, status, saleDate, createdAt",
      saleItems: "id, saleId",
      payments: "id, invoiceId, saleId, paymentDate",
    });

    this.version(2).stores({
      settings: "id",
      customers: "id, name, phone, email, createdAt",
      products: "id, name, category, createdAt",
      invoices: "id, invoiceNumber, customerId, status, issueDate, dueDate, linkedSaleId, createdAt",
      invoiceItems: "id, invoiceId",
      sales: "id, saleNumber, invoiceId, customerId, source, status, saleDate, createdAt",
      saleItems: "id, saleId",
      payments: "id, invoiceId, saleId, paymentDate",
    });

    this.version(3).stores({
      settings: "id",
      customers: "id, name, phone, email, birthday, weddingAnniversary, createdAt",
      customerSpecialDates: "id, customerId, date, type, createdAt",
      products: "id, name, category, createdAt",
      invoices: "id, invoiceNumber, customerId, status, issueDate, dueDate, linkedSaleId, createdAt",
      invoiceItems: "id, invoiceId",
      sales: "id, saleNumber, invoiceId, customerId, source, status, saleDate, createdAt",
      saleItems: "id, saleId",
      payments: "id, invoiceId, saleId, paymentDate",
    }).upgrade(async (tx) => {
      const customers = tx.table("customers");

      await customers.toCollection().modify((customer) => {
        customer.birthday = customer.birthday || "";
        customer.weddingAnniversary = customer.weddingAnniversary || "";
        customer.spouseName = customer.spouseName || "";
        customer.preferredStyle = customer.preferredStyle || "";
        customer.preferredColor = customer.preferredColor || "";
        customer.preferredFabric = customer.preferredFabric || "";
        customer.fitNotes = customer.fitNotes || "";
      });
    });

    this.version(4).stores({
      settings: "id",
      customers: "id, name, phone, email, birthday, weddingAnniversary, createdAt",
      customerSpecialDates: "id, customerId, date, type, createdAt",
      products: "id, name, category, createdAt",
      measurements: "id, customerId, dateTaken, createdAt",
      orders: "id, orderNumber, customerId, status, orderDate, dueDate, createdAt",
      invoices: "id, invoiceNumber, customerId, status, issueDate, dueDate, linkedSaleId, createdAt",
      invoiceItems: "id, invoiceId",
      sales: "id, saleNumber, invoiceId, customerId, source, status, saleDate, createdAt",
      saleItems: "id, saleId",
      payments: "id, invoiceId, saleId, paymentDate",
    }).upgrade(async (tx) => {
      const settings = await tx.table("settings").toCollection().first();
      if (settings && !settings.orderPrefix) {
        await tx.table("settings").update(settings.id, { orderPrefix: "SSA-ORD" });
      }
    });

    this.version(5).stores({
      settings: "id",
      customers: "id, name, phone, email, birthday, weddingAnniversary, createdAt",
      customerSpecialDates: "id, customerId, date, type, createdAt",
      products: "id, name, category, createdAt",
      measurements: "id, customerId, dateTaken, createdAt",
      orders: "id, orderNumber, customerId, status, orderDate, dueDate, createdAt",
      receipts: "id, receiptNumber, customerId, paymentDate, method, createdAt",
      invoices: "id, invoiceNumber, customerId, status, issueDate, dueDate, linkedSaleId, createdAt",
      invoiceItems: "id, invoiceId",
      sales: "id, saleNumber, invoiceId, customerId, source, status, saleDate, createdAt",
      saleItems: "id, saleId",
      payments: "id, invoiceId, saleId, paymentDate",
    }).upgrade(async (tx) => {
      const settings = await tx.table("settings").toCollection().first();
      if (settings && !settings.receiptPrefix) {
        await tx.table("settings").update(settings.id, { receiptPrefix: "SSA-RCP" });
      }
    });
  }
}

export const db = new OfflineBusinessDatabase();

export async function getSettings() {
  const existing = await db.settings.toCollection().first();

  if (existing) {
    const updated = {
      ...existing,
      orderPrefix: existing.orderPrefix || "SSA-ORD",
      receiptPrefix: existing.receiptPrefix || "SSA-RCP",
    };

    if (updated.orderPrefix !== existing.orderPrefix || updated.receiptPrefix !== existing.receiptPrefix) {
      await db.settings.put(updated);
    }

    return updated;
  }

  const now = new Date().toISOString();

  const defaultSettings: BusinessSettings = {
    id: createId("settings"),
    businessName: "Sleek Stitch Atelier",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    currency: "₦",
    invoicePrefix: "SSA-INV",
    salePrefix: "SSA-SALE",
    orderPrefix: "SSA-ORD",
    receiptPrefix: "SSA-RCP",
    defaultTaxRate: 0,
    defaultTerms: "Payment is due on or before the due date. Thank you for choosing Sleek Stitch Atelier.",
    createdAt: now,
    updatedAt: now,
  };

  await db.settings.add(defaultSettings);
  return defaultSettings;
}

export async function saveSettings(settings: BusinessSettings) {
  const updatedSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  await db.settings.put(updatedSettings);
  return updatedSettings;
}

export async function getNextInvoiceNumber() {
  const settings = await getSettings();
  const count = await db.invoices.count();
  const number = String(count + 1).padStart(4, "0");
  return `${settings.invoicePrefix || "SSA-INV"}-${new Date().getFullYear()}-${number}`;
}

export async function getNextSaleNumber() {
  const settings = await getSettings();
  const count = await db.sales.count();
  const number = String(count + 1).padStart(4, "0");
  return `${settings.salePrefix || "SSA-SALE"}-${new Date().getFullYear()}-${number}`;
}

export async function getNextOrderNumber() {
  const settings = await getSettings();
  const count = await db.orders.count();
  const number = String(count + 1).padStart(4, "0");
  return `${settings.orderPrefix || "SSA-ORD"}-${new Date().getFullYear()}-${number}`;
}

export async function getNextReceiptNumber() {
  const settings = await getSettings();
  const count = await db.receipts.count();
  const number = String(count + 1).padStart(4, "0");
  return `${settings.receiptPrefix || "SSA-RCP"}-${new Date().getFullYear()}-${number}`;
}

export async function getFullInvoice(invoiceId: string) {
  const invoice = await db.invoices.get(invoiceId);
  if (!invoice) return null;

  const items = await db.invoiceItems.where("invoiceId").equals(invoiceId).toArray();
  const payments = await db.payments.where("invoiceId").equals(invoiceId).toArray();

  return { invoice, items, payments };
}

export async function getFullSale(saleId: string) {
  const sale = await db.sales.get(saleId);
  if (!sale) return null;

  const items = await db.saleItems.where("saleId").equals(saleId).toArray();
  const payments = await db.payments.where("saleId").equals(saleId).toArray();

  return { sale, items, payments };
}
