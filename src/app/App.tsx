import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import {
  db,
  getFullInvoice,
  getFullSale,
  getNextInvoiceNumber,
  getNextSaleNumber,
  getSettings,
} from "../db/database";
import { calculateTotals, getInvoiceStatus, getSaleStatus } from "../lib/calculations";
import { createId } from "../lib/ids";
import { getUpcomingOrders } from "../lib/orderReminders";
import { getUpcomingCelebrations } from "../lib/reminders";
import { applyTheme, getStoredTheme, type ThemeMode } from "../lib/theme";
import type {
  BusinessSettings,
  Customer,
  CustomerSpecialDate,
  Invoice,
  InvoiceFormState,
  InvoiceItem,
  Measurement,
  Order,
  Page,
  Product,
  Receipt,
  Sale,
  SaleFormState,
  SaleItem,
} from "../types";
import { AddSale } from "../pages/AddSale";
import { Backup } from "../pages/Backup";
import { CreateInvoice } from "../pages/CreateInvoice";
import { CustomerDetails } from "../pages/CustomerDetails";
import { Customers } from "../pages/Customers";
import { Dashboard } from "../pages/Dashboard";
import { InvoiceDetails } from "../pages/InvoiceDetails";
import { Invoices } from "../pages/Invoices";
import { Orders } from "../pages/Orders";
import { Products } from "../pages/Products";
import { ReceiptDetails } from "../pages/ReceiptDetails";
import { Receipts } from "../pages/Receipts";
import { Reports } from "../pages/Reports";
import { SaleDetails } from "../pages/SaleDetails";
import { Search } from "../pages/Search";
import { Sales } from "../pages/Sales";
import { Settings } from "../pages/Settings";

export function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSpecialDates, setCustomerSpecialDates] = useState<CustomerSpecialDate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedSaleItems, setSelectedSaleItems] = useState<SaleItem[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const celebrations = useMemo(
    () => getUpcomingCelebrations(customers, customerSpecialDates, 14),
    [customers, customerSpecialDates]
  );

  const orderReminders = useMemo(
    () => getUpcomingOrders(orders, 7),
    [orders]
  );

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((customer) => customer.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  async function refreshData() {
    const [
      loadedSettings,
      loadedCustomers,
      loadedSpecialDates,
      loadedProducts,
      loadedMeasurements,
      loadedOrders,
      loadedReceipts,
      loadedInvoices,
      loadedSales,
    ] = await Promise.all([
      getSettings(),
      db.customers.orderBy("createdAt").reverse().toArray(),
      db.customerSpecialDates.orderBy("createdAt").reverse().toArray(),
      db.products.orderBy("createdAt").reverse().toArray(),
      db.measurements.orderBy("createdAt").reverse().toArray(),
      db.orders.orderBy("createdAt").reverse().toArray(),
      db.receipts.orderBy("createdAt").reverse().toArray(),
      db.invoices.orderBy("createdAt").reverse().toArray(),
      db.sales.orderBy("createdAt").reverse().toArray(),
    ]);

    setSettings(loadedSettings);
    setCustomers(loadedCustomers);
    setCustomerSpecialDates(loadedSpecialDates);
    setProducts(loadedProducts);
    setMeasurements(loadedMeasurements);
    setOrders(loadedOrders);
    setReceipts(loadedReceipts);
    setInvoices(loadedInvoices);
    setSales(loadedSales);
  }

  useEffect(() => {
    refreshData().finally(() => setIsLoading(false));
  }, []);

  function openCustomer(customerId: string) {
    setSelectedCustomerId(customerId);
    setActivePage("customer-details");
  }

  async function openInvoice(invoiceId: string) {
    const fullInvoice = await getFullInvoice(invoiceId);
    if (!fullInvoice) {
      setSelectedInvoice(null);
      setSelectedInvoiceItems([]);
      setActivePage("invoices");
      return;
    }

    setSelectedInvoice(fullInvoice.invoice);
    setSelectedInvoiceItems(fullInvoice.items);
    setActivePage("invoice-details");
  }

  async function openSale(saleId: string) {
    const fullSale = await getFullSale(saleId);
    if (!fullSale) {
      setSelectedSale(null);
      setSelectedSaleItems([]);
      setActivePage("sales");
      return;
    }

    setSelectedSale(fullSale.sale);
    setSelectedSaleItems(fullSale.items);
    setActivePage("sale-details");
  }

  async function openReceipt(receiptId: string) {
    const receipt = await db.receipts.get(receiptId);
    setSelectedReceipt(receipt || null);
    setActivePage("receipt-details");
  }

  async function createSaleFromInvoice(
    invoice: Invoice,
    invoiceItems: InvoiceItem[],
    paymentMethod: Sale["paymentMethod"],
    saleNumber: string
  ) {
    const now = new Date().toISOString();
    const saleId = createId("sale");
    const saleStatus = getSaleStatus("unpaid", invoice.amountPaid, invoice.balanceDue);

    const sale: Sale = {
      id: saleId,
      saleNumber,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerEmail: invoice.customerEmail,
      customerAddress: invoice.customerAddress,
      saleDate: invoice.issueDate,
      source: "invoice",
      status: saleStatus,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      discountTotal: invoice.discountTotal,
      taxTotal: invoice.taxTotal,
      deliveryFee: invoice.deliveryFee,
      grandTotal: invoice.grandTotal,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      paymentMethod,
      note: `Created from invoice ${invoice.invoiceNumber}`,
      createdAt: now,
      updatedAt: now,
    };

    const saleItems: SaleItem[] = invoiceItems.map((item) => ({
      id: createId("sale_item"),
      saleId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      lineTotal: item.lineTotal,
    }));

    await db.sales.add(sale);
    await db.saleItems.bulkAdd(saleItems);
    return saleId;
  }

  async function saveInvoice(form: InvoiceFormState) {
    const now = new Date().toISOString();
    const invoiceId = createId("invoice");
    const invoiceNumber = await getNextInvoiceNumber();
    const totals = calculateTotals(form.items, form.deliveryFee, form.amountPaid);
    const status = getInvoiceStatus(form.status, form.dueDate, totals.amountPaid, totals.balanceDue);

    let linkedSaleId: string | undefined;
    const shouldCreateLinkedSale = totals.amountPaid > 0 || status === "paid" || status === "part_paid";
    const linkedSaleNumber = shouldCreateLinkedSale ? await getNextSaleNumber() : undefined;

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      customerId: form.customerId || undefined,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      customerAddress: form.customerAddress,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status,
      currency: form.currency,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      deliveryFee: totals.deliveryFee,
      grandTotal: totals.grandTotal,
      amountPaid: totals.amountPaid,
      balanceDue: totals.balanceDue,
      notes: form.notes,
      terms: form.terms,
      createdAt: now,
      updatedAt: now,
    };

    const invoiceItems: InvoiceItem[] = totals.calculatedItems.map((item) => ({
      id: createId("invoice_item"),
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      lineTotal: item.lineTotal,
    }));

    await db.transaction("rw", [db.invoices, db.invoiceItems, db.sales, db.saleItems, db.payments], async () => {
      await db.invoices.add(invoice);
      await db.invoiceItems.bulkAdd(invoiceItems);

      if (shouldCreateLinkedSale && linkedSaleNumber) {
        linkedSaleId = await createSaleFromInvoice(invoice, invoiceItems, form.paymentMethod, linkedSaleNumber);
        await db.invoices.update(invoiceId, { linkedSaleId });
      }

      if (totals.amountPaid > 0) {
        await db.payments.add({
          id: createId("payment"),
          invoiceId,
          saleId: linkedSaleId,
          amount: totals.amountPaid,
          paymentDate: form.issueDate,
          method: form.paymentMethod,
          reference: "",
          note: "Payment recorded from invoice creation.",
          createdAt: now,
        });
      }
    });

    await refreshData();
    await openInvoice(invoiceId);
  }

  async function recordInvoiceAsSale(invoiceId: string) {
    const fullInvoice = await getFullInvoice(invoiceId);
    if (!fullInvoice) return;

    if (fullInvoice.invoice.linkedSaleId) {
      alert("This invoice is already recorded as a sale.");
      return;
    }

    const saleNumber = await getNextSaleNumber();

    await db.transaction("rw", db.invoices, db.sales, db.saleItems, async () => {
      const saleId = await createSaleFromInvoice(fullInvoice.invoice, fullInvoice.items, "transfer", saleNumber);
      await db.invoices.update(invoiceId, {
        linkedSaleId: saleId,
        updatedAt: new Date().toISOString(),
      });
    });

    await refreshData();
    await openInvoice(invoiceId);
    alert("Invoice recorded as a sale.");
  }

  async function saveDirectSale(form: SaleFormState) {
    const now = new Date().toISOString();
    const saleId = createId("sale");
    const saleNumber = await getNextSaleNumber();
    const totals = calculateTotals(form.items, form.deliveryFee, form.amountPaid);
    const status = getSaleStatus(form.status, totals.amountPaid, totals.balanceDue);

    const sale: Sale = {
      id: saleId,
      saleNumber,
      customerId: form.customerId || undefined,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      customerAddress: form.customerAddress,
      saleDate: form.saleDate,
      source: "direct",
      status,
      currency: form.currency,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      deliveryFee: totals.deliveryFee,
      grandTotal: totals.grandTotal,
      amountPaid: totals.amountPaid,
      balanceDue: totals.balanceDue,
      paymentMethod: form.paymentMethod,
      note: form.note,
      createdAt: now,
      updatedAt: now,
    };

    const saleItems: SaleItem[] = totals.calculatedItems.map((item) => ({
      id: createId("sale_item"),
      saleId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      lineTotal: item.lineTotal,
    }));

    await db.transaction("rw", db.sales, db.saleItems, db.payments, async () => {
      await db.sales.add(sale);
      await db.saleItems.bulkAdd(saleItems);

      if (totals.amountPaid > 0) {
        await db.payments.add({
          id: createId("payment"),
          saleId,
          amount: totals.amountPaid,
          paymentDate: form.saleDate,
          method: form.paymentMethod,
          reference: "",
          note: "Payment recorded from direct sale.",
          createdAt: now,
        });
      }
    });

    await refreshData();
    await openSale(saleId);
  }

  async function refreshSelectedInvoice(invoiceId: string) {
    await refreshData();
    await openInvoice(invoiceId);
  }

  async function refreshSelectedSale(saleId: string) {
    await refreshData();
    await openSale(saleId);
  }

  async function refreshSelectedReceipt(receiptId: string) {
    await refreshData();
    const receipt = await db.receipts.get(receiptId);
    setSelectedReceipt(receipt || null);
  }

  async function deleteInvoice(invoiceId: string) {
    const confirmed = window.confirm("Delete this invoice from this device?");
    if (!confirmed) return;

    await db.transaction("rw", [db.invoices, db.invoiceItems, db.sales, db.saleItems, db.payments], async () => {
      const invoice = await db.invoices.get(invoiceId);

      await db.invoices.delete(invoiceId);
      await db.invoiceItems.where("invoiceId").equals(invoiceId).delete();
      await db.payments.where("invoiceId").equals(invoiceId).delete();

      if (invoice?.linkedSaleId) {
        await db.sales.delete(invoice.linkedSaleId);
        await db.saleItems.where("saleId").equals(invoice.linkedSaleId).delete();
        await db.payments.where("saleId").equals(invoice.linkedSaleId).delete();
      }
    });

    setSelectedInvoice(null);
    setSelectedInvoiceItems([]);
    await refreshData();
    setActivePage("invoices");
  }

  async function deleteSale(saleId: string) {
    const confirmed = window.confirm("Delete this sales record from this device?");
    if (!confirmed) return;

    await db.transaction("rw", [db.sales, db.saleItems, db.payments, db.invoices], async () => {
      await db.sales.delete(saleId);
      await db.saleItems.where("saleId").equals(saleId).delete();
      await db.payments
        .where("saleId")
        .equals(saleId)
        .filter((payment) => !payment.invoiceId)
        .delete();

      const linkedInvoices = await db.invoices.where("linkedSaleId").equals(saleId).toArray();
      await Promise.all(
        linkedInvoices.map((invoice) =>
          db.invoices.update(invoice.id, {
            linkedSaleId: undefined,
            updatedAt: new Date().toISOString(),
          })
        )
      );
    });

    setSelectedSale(null);
    setSelectedSaleItems([]);
    await refreshData();
    setActivePage("search");
  }

  if (isLoading) {
    return <div className="loading-screen">Loading Sleek Stitch Atelier sales & invoice app...</div>;
  }

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage} theme={theme} onThemeToggle={toggleTheme}>
      {activePage === "search" ? (
        <Search
          customers={customers}
          invoices={invoices}
          sales={sales}
          orders={orders}
          receipts={receipts}
          products={products}
          measurements={measurements}
          specialDates={customerSpecialDates}
          onOpenCustomer={openCustomer}
          onOpenInvoice={openInvoice}
          onOpenSale={openSale}
          onOpenReceipt={openReceipt}
          onOpenOrders={() => setActivePage("orders")}
          onOpenProducts={() => setActivePage("products")}
        />
      ) : null}

      {activePage === "dashboard" ? (
        <Dashboard
          invoices={invoices}
          sales={sales}
          celebrations={celebrations}
          orderReminders={orderReminders}
          onCreateInvoice={() => setActivePage("create-invoice")}
          onOpenOrders={() => setActivePage("orders")}
          onOpenCustomer={openCustomer}
        />
      ) : null}

      {activePage === "invoices" ? (
        <Invoices
          invoices={invoices}
          onOpenInvoice={openInvoice}
          onCreateInvoice={() => setActivePage("create-invoice")}
        />
      ) : null}

      {activePage === "create-invoice" ? (
        <CreateInvoice
          settings={settings}
          customers={customers}
          products={products}
          onSave={saveInvoice}
        />
      ) : null}

      {activePage === "invoice-details" ? (
        <InvoiceDetails
          settings={settings}
          invoice={selectedInvoice}
          items={selectedInvoiceItems}
          onBack={() => setActivePage("invoices")}
          onDelete={deleteInvoice}
          onRecordAsSale={recordInvoiceAsSale}
          onUpdated={refreshSelectedInvoice}
        />
      ) : null}

      {activePage === "sales" ? (
        <Sales
          sales={sales}
          onOpenSale={openSale}
          onAddSale={() => setActivePage("add-sale")}
        />
      ) : null}

      {activePage === "add-sale" ? (
        <AddSale
          settings={settings}
          customers={customers}
          products={products}
          onSave={saveDirectSale}
        />
      ) : null}

      {activePage === "sale-details" ? (
        <SaleDetails
          settings={settings}
          sale={selectedSale}
          items={selectedSaleItems}
          onBack={() => setActivePage("search")}
          onDelete={deleteSale}
          onUpdated={refreshSelectedSale}
        />
      ) : null}

      {activePage === "customers" ? (
        <Customers
          customers={customers}
          invoices={invoices}
          sales={sales}
          onChanged={refreshData}
          onOpenCustomer={openCustomer}
        />
      ) : null}

      {activePage === "customer-details" ? (
        <CustomerDetails
          customer={selectedCustomer}
          specialDates={customerSpecialDates}
          measurements={measurements}
          orders={orders}
          invoices={invoices}
          sales={sales}
          onBack={() => setActivePage("customers")}
          onChanged={refreshData}
        />
      ) : null}

      {activePage === "orders" ? (
        <Orders
          customers={customers}
          orders={orders}
          onChanged={refreshData}
          onOpenCustomer={openCustomer}
        />
      ) : null}

      {activePage === "receipts" ? (
        <Receipts
          customers={customers}
          invoices={invoices}
          sales={sales}
          orders={orders}
          receipts={receipts}
          onChanged={refreshData}
          onOpenReceipt={openReceipt}
        />
      ) : null}

      {activePage === "receipt-details" ? (
        <ReceiptDetails
          settings={settings}
          receipt={selectedReceipt}
          onBack={() => setActivePage("receipts")}
          onUpdated={refreshSelectedReceipt}
        />
      ) : null}

      {activePage === "reports" ? (
        <Reports
          customers={customers}
          invoices={invoices}
          sales={sales}
          orders={orders}
          receipts={receipts}
        />
      ) : null}

      {activePage === "products" ? (
        <Products products={products} onChanged={refreshData} />
      ) : null}

      {activePage === "settings" ? (
        <Settings settings={settings} onSettingsSaved={(savedSettings) => setSettings(savedSettings)} />
      ) : null}

      {activePage === "backup" ? <Backup onImported={refreshData} /> : null}
    </AppShell>
  );
}
