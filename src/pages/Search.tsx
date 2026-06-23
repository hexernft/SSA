import { useMemo, useState } from "react";
import type {
  Customer,
  CustomerSpecialDate,
  Invoice,
  Measurement,
  Order,
  Product,
  Receipt,
  Sale,
} from "../types";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type SearchProps = {
  customers: Customer[];
  invoices: Invoice[];
  sales: Sale[];
  orders: Order[];
  receipts: Receipt[];
  products: Product[];
  measurements: Measurement[];
  specialDates: CustomerSpecialDate[];
  onOpenCustomer: (customerId: string) => void;
  onOpenInvoice: (invoiceId: string) => Promise<void>;
  onOpenSale: (saleId: string) => Promise<void>;
  onOpenReceipt: (receiptId: string) => Promise<void>;
  onOpenOrders: () => void;
  onOpenProducts: () => void;
};

type SearchType =
  | "all"
  | "customers"
  | "invoices"
  | "sales"
  | "orders"
  | "receipts"
  | "products"
  | "measurements"
  | "dates";

type SearchResult = {
  id: string;
  type: Exclude<SearchType, "all">;
  title: string;
  subtitle: string;
  meta: string;
  amount?: string;
  actionLabel: string;
  onOpen: () => void;
};

function includesTerm(values: Array<unknown>, term: string) {
  return values.join(" ").toLowerCase().includes(term);
}

function resultTypeLabel(type: SearchResult["type"]) {
  switch (type) {
    case "customers":
      return "Customer";
    case "invoices":
      return "Invoice";
    case "sales":
      return "Sale";
    case "orders":
      return "Order / Job";
    case "receipts":
      return "Receipt";
    case "products":
      return "Product / Service";
    case "measurements":
      return "Measurement";
    case "dates":
      return "Special Date";
    default:
      return type;
  }
}

export function Search({
  customers,
  invoices,
  sales,
  orders,
  receipts,
  products,
  measurements,
  specialDates,
  onOpenCustomer,
  onOpenInvoice,
  onOpenSale,
  onOpenReceipt,
  onOpenOrders,
  onOpenProducts,
}: SearchProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");

  const customerById = useMemo(() => {
    return new Map(customers.map((customer) => [customer.id, customer]));
  }, [customers]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return [];

    const matchesType = (itemType: SearchResult["type"]) => type === "all" || type === itemType;

    const found: SearchResult[] = [];

    if (matchesType("customers")) {
      customers.forEach((customer) => {
        if (
          includesTerm(
            [
              customer.name,
              customer.phone,
              customer.email,
              customer.address,
              customer.preferredStyle,
              customer.preferredColor,
              customer.preferredFabric,
              customer.fitNotes,
              customer.notes,
            ],
            term
          )
        ) {
          found.push({
            id: customer.id,
            type: "customers",
            title: customer.name,
            subtitle: customer.phone || customer.email || "Customer profile",
            meta: customer.preferredStyle || customer.address || "Saved customer",
            actionLabel: "Open Customer",
            onOpen: () => onOpenCustomer(customer.id),
          });
        }
      });
    }

    if (matchesType("invoices")) {
      invoices.forEach((invoice) => {
        if (
          includesTerm(
            [
              invoice.invoiceNumber,
              invoice.customerName,
              invoice.customerPhone,
              invoice.customerEmail,
              invoice.customerAddress,
              invoice.status,
              invoice.notes,
              invoice.terms,
            ],
            term
          )
        ) {
          found.push({
            id: invoice.id,
            type: "invoices",
            title: invoice.invoiceNumber,
            subtitle: `${invoice.customerName || "Customer"} · ${invoice.status.replace("_", " ")}`,
            meta: `Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}`,
            amount: formatMoney(invoice.grandTotal, invoice.currency),
            actionLabel: "Open Invoice",
            onOpen: () => void onOpenInvoice(invoice.id),
          });
        }
      });
    }

    if (matchesType("sales")) {
      sales.forEach((sale) => {
        if (
          includesTerm(
            [
              sale.saleNumber,
              sale.customerName,
              sale.customerPhone,
              sale.status,
              sale.paymentMethod,
              sale.source,
              sale.note,
            ],
            term
          )
        ) {
          found.push({
            id: sale.id,
            type: "sales",
            title: sale.saleNumber,
            subtitle: `${sale.customerName || "Customer"} · ${sale.status.replace("_", " ")}`,
            meta: `${formatDate(sale.saleDate)} · ${sale.paymentMethod} · ${sale.source}`,
            amount: formatMoney(sale.grandTotal, sale.currency),
            actionLabel: "Open Sale",
            onOpen: () => void onOpenSale(sale.id),
          });
        }
      });
    }

    if (matchesType("orders")) {
      orders.forEach((order) => {
        if (
          includesTerm(
            [
              order.orderNumber,
              order.customerName,
              order.outfitType,
              order.status,
              order.notes,
            ],
            term
          )
        ) {
          found.push({
            id: order.id,
            type: "orders",
            title: order.orderNumber,
            subtitle: `${order.customerName} · ${order.outfitType}`,
            meta: `${order.status.replace("_", " ")} · Due ${order.dueDate ? formatDate(order.dueDate) : "—"}`,
            amount: formatMoney(order.balanceDue, "₦"),
            actionLabel: "Open Customer",
            onOpen: () => onOpenCustomer(order.customerId),
          });
        }
      });
    }

    if (matchesType("receipts")) {
      receipts.forEach((receipt) => {
        if (
          includesTerm(
            [
              receipt.receiptNumber,
              receipt.customerName,
              receipt.method,
              receipt.reference,
              receipt.description,
              receipt.notes,
            ],
            term
          )
        ) {
          found.push({
            id: receipt.id,
            type: "receipts",
            title: receipt.receiptNumber,
            subtitle: `${receipt.customerName} · ${receipt.method}`,
            meta: `${formatDate(receipt.paymentDate)} · ${receipt.reference || "No reference"}`,
            amount: formatMoney(receipt.amount, "₦"),
            actionLabel: "Open Receipt",
            onOpen: () => void onOpenReceipt(receipt.id),
          });
        }
      });
    }

    if (matchesType("products")) {
      products.forEach((product) => {
        if (
          includesTerm(
            [product.name, product.category, product.description, product.defaultPrice],
            term
          )
        ) {
          found.push({
            id: product.id,
            type: "products",
            title: product.name,
            subtitle: product.category || "Product / service",
            meta: product.description || "Saved item",
            amount: formatMoney(product.defaultPrice, "₦"),
            actionLabel: "Open Products",
            onOpen: onOpenProducts,
          });
        }
      });
    }

    if (matchesType("measurements")) {
      measurements.forEach((measurement) => {
        const customer = customerById.get(measurement.customerId);

        if (
          includesTerm(
            [
              measurement.title,
              customer?.name,
              customer?.phone,
              measurement.dateTaken,
              measurement.chest,
              measurement.waist,
              measurement.hip,
              measurement.shoulder,
              measurement.sleeve,
              measurement.neck,
              measurement.notes,
            ],
            term
          )
        ) {
          found.push({
            id: measurement.id,
            type: "measurements",
            title: measurement.title,
            subtitle: `${customer?.name || "Customer"} · ${formatDate(measurement.dateTaken)}`,
            meta: `Chest ${measurement.chest || "—"} · Waist ${measurement.waist || "—"} · Shoulder ${measurement.shoulder || "—"}`,
            actionLabel: "Open Customer",
            onOpen: () => onOpenCustomer(measurement.customerId),
          });
        }
      });
    }

    if (matchesType("dates")) {
      specialDates.forEach((date) => {
        const customer = customerById.get(date.customerId);

        if (
          includesTerm(
            [date.title, date.type, date.date, date.notes, customer?.name, customer?.phone],
            term
          )
        ) {
          found.push({
            id: date.id,
            type: "dates",
            title: date.title,
            subtitle: `${customer?.name || "Customer"} · ${date.type}`,
            meta: `${formatDate(date.date)} · ${date.notes || "No notes"}`,
            actionLabel: "Open Customer",
            onOpen: () => onOpenCustomer(date.customerId),
          });
        }
      });
    }

    return found.slice(0, 80);
  }, [
    query,
    type,
    customers,
    invoices,
    sales,
    orders,
    receipts,
    products,
    measurements,
    specialDates,
    customerById,
    onOpenCustomer,
    onOpenInvoice,
    onOpenSale,
    onOpenReceipt,
    onOpenProducts,
  ]);

  const groupedCounts = useMemo(() => {
    const counts = {
      customers: 0,
      invoices: 0,
      sales: 0,
      orders: 0,
      receipts: 0,
      products: 0,
      measurements: 0,
      dates: 0,
    };

    results.forEach((result) => {
      counts[result.type] += 1;
    });

    return counts;
  }, [results]);

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Global Search"
          subtitle="Find customers, invoices, sales, receipts, orders, measurements, dates, and services from one place."
        />
      </div>

      <Card className="mb">
        <div className="two-grid">
          <label className="field">
            <span>Search anything</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try customer name, phone, order number, outfit, receipt reference..."
              autoFocus
            />
          </label>

          <label className="field">
            <span>Filter type</span>
            <select value={type} onChange={(event) => setType(event.target.value as SearchType)}>
              <option value="all">All records</option>
              <option value="customers">Customers</option>
              <option value="invoices">Invoices</option>
              <option value="sales">Sales</option>
              <option value="orders">Orders / Jobs</option>
              <option value="receipts">Receipts</option>
              <option value="products">Products / Services</option>
              <option value="measurements">Measurements</option>
              <option value="dates">Special Dates</option>
            </select>
          </label>
        </div>
      </Card>

      {query.trim() ? (
        <>
          <div className="stats-grid">
            <Card>
              <span className="stat-label">Results</span>
              <strong className="stat-value">{results.length}</strong>
            </Card>
            <Card>
              <span className="stat-label">Customers</span>
              <strong className="stat-value">{groupedCounts.customers}</strong>
            </Card>
            <Card>
              <span className="stat-label">Orders</span>
              <strong className="stat-value">{groupedCounts.orders}</strong>
            </Card>
            <Card>
              <span className="stat-label">Receipts</span>
              <strong className="stat-value">{groupedCounts.receipts}</strong>
            </Card>
          </div>

          <div className="search-results mt">
            {results.length ? (
              results.map((result) => (
                <Card key={`${result.type}_${result.id}`} className="search-result-card">
                  <div>
                    <span className="soft-pill">{resultTypeLabel(result.type)}</span>
                    <h3>{result.title}</h3>
                    <p>{result.subtitle}</p>
                    <p>{result.meta}</p>
                  </div>

                  <div className="search-result-side">
                    {result.amount ? <strong>{result.amount}</strong> : null}
                    <Button variant="secondary" onClick={result.onOpen}>
                      {result.actionLabel}
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="empty-state">
                <h3>No results found</h3>
                <p>Try a customer name, phone number, order number, outfit type, invoice number, or receipt reference.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h3>Start searching</h3>
          <p>Use this page when you need to quickly find anything saved inside the offline Sleek Stitch app.</p>
          <div className="button-row search-shortcuts">
            <Button variant="secondary" onClick={onOpenOrders}>Open Orders</Button>
            <Button variant="secondary" onClick={onOpenProducts}>Open Products</Button>
          </div>
        </div>
      )}
    </div>
  );
}
