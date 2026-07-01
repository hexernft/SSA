import { useMemo, useState } from "react";
import type { Customer, Invoice, Order, PaymentMethod, Receipt, Sale } from "../types";
import { db, getNextReceiptNumber } from "../db/database";
import { createId } from "../lib/ids";
import { formatDate, todayInputValue } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { downloadCsv } from "../lib/csv";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type ReceiptsProps = {
  customers: Customer[];
  invoices: Invoice[];
  sales: Sale[];
  orders: Order[];
  receipts: Receipt[];
  onChanged: () => Promise<void>;
  onOpenReceipt: (receiptId: string) => void;
  canDelete: boolean;
};

type ReceiptForm = {
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number | "";
  method: PaymentMethod;
  reference: string;
  description: string;
  linkedInvoiceId: string;
  linkedSaleId: string;
  linkedOrderId: string;
  notes: string;
};

const emptyForm: ReceiptForm = {
  customerId: "",
  customerName: "",
  paymentDate: todayInputValue(),
  amount: 0,
  method: "transfer",
  reference: "",
  description: "",
  linkedInvoiceId: "",
  linkedSaleId: "",
  linkedOrderId: "",
  notes: "",
};

export function Receipts({
  customers,
  invoices,
  sales,
  orders,
  receipts,
  onChanged,
  onOpenReceipt,
  canDelete,
}: ReceiptsProps) {
  const [form, setForm] = useState<ReceiptForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all");

  const filteredReceipts = useMemo(() => {
    const term = search.toLowerCase().trim();

    return receipts.filter((receipt) => {
      const matchesMethod = methodFilter === "all" || receipt.method === methodFilter;
      const matchesSearch =
        !term ||
        [
          receipt.receiptNumber,
          receipt.customerName,
          receipt.reference,
          receipt.description,
          receipt.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesMethod && matchesSearch;
    });
  }, [receipts, search, methodFilter]);

  function updateField<K extends keyof ReceiptForm>(key: K, value: ReceiptForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);

    if (!customer) {
      setForm((current) => ({
        ...current,
        customerId: "",
        customerName: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      customerId: customer.id,
      customerName: customer.name,
    }));
  }

  async function saveReceipt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();

    await db.receipts.add({
      id: createId("receipt"),
      receiptNumber: await getNextReceiptNumber(),
      customerId: form.customerId || undefined,
      customerName: form.customerName,
      paymentDate: form.paymentDate,
      amount: Number(form.amount || 0),
      method: form.method,
      reference: form.reference,
      description: form.description,
      linkedInvoiceId: form.linkedInvoiceId || undefined,
      linkedSaleId: form.linkedSaleId || undefined,
      linkedOrderId: form.linkedOrderId || undefined,
      notes: form.notes,
      createdAt: now,
      updatedAt: now,
    });

    setForm(emptyForm);
    await onChanged();
  }

  async function deleteReceipt(receiptId: string) {
    const confirmed = window.confirm("Delete this receipt from this device?");
    if (!confirmed) return;

    await db.receipts.delete(receiptId);
    await onChanged();
  }

  function exportReceipts() {
    downloadCsv(
      `sleek-stitch-receipts-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredReceipts.map((receipt) => ({
        receiptNumber: receipt.receiptNumber,
        customerName: receipt.customerName,
        paymentDate: receipt.paymentDate,
        amount: receipt.amount,
        method: receipt.method,
        reference: receipt.reference,
        description: receipt.description,
        notes: receipt.notes,
      }))
    );
  }

  const totalReceived = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Receipts"
          subtitle="Issue and print payment receipts for customer deposits and completed payments."
        />
        <Button variant="secondary" onClick={exportReceipts}>Export CSV</Button>
      </div>

      <div className="stats-grid">
        <Card>
          <span className="stat-label">Receipts</span>
          <strong className="stat-value">{filteredReceipts.length}</strong>
        </Card>
        <Card>
          <span className="stat-label">Total Received</span>
          <strong className="stat-value">{formatMoney(totalReceived, "₦")}</strong>
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>Create Receipt</h3>

          <form onSubmit={saveReceipt}>
            <label className="field">
              <span>Select Customer</span>
              <select value={form.customerId} onChange={(event) => selectCustomer(event.target.value)}>
                <option value="">Custom / Walk-in customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `- ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Customer Name</span>
              <input
                value={form.customerName}
                onChange={(event) => updateField("customerName", event.target.value)}
                required
              />
            </label>

            <div className="two-grid">
              <label className="field">
                <span>Payment Date</span>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) => updateField("paymentDate", event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value === "" ? "" : Number(event.target.value))}
                  required
                />
              </label>

              <label className="field">
                <span>Payment Method</span>
                <select
                  value={form.method}
                  onChange={(event) => updateField("method", event.target.value as PaymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="pos">POS</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="field">
                <span>Reference</span>
                <input
                  value={form.reference}
                  onChange={(event) => updateField("reference", event.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <input
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </label>

            <div className="two-grid">
              <label className="field">
                <span>Link Invoice</span>
                <select
                  value={form.linkedInvoiceId}
                  onChange={(event) => updateField("linkedInvoiceId", event.target.value)}
                >
                  <option value="">No invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.customerName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Link Sale</span>
                <select
                  value={form.linkedSaleId}
                  onChange={(event) => updateField("linkedSaleId", event.target.value)}
                >
                  <option value="">No sale</option>
                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.saleNumber} - {sale.customerName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Link Order / Job</span>
                <select
                  value={form.linkedOrderId}
                  onChange={(event) => updateField("linkedOrderId", event.target.value)}
                >
                  <option value="">No order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </label>

            <Button type="submit">Save Receipt</Button>
          </form>
        </Card>

        <Card>
          <h3>Search / Filter</h3>

          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Payment Method</span>
            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value as PaymentMethod | "all")}
            >
              <option value="all">All methods</option>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="pos">POS</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </label>
        </Card>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredReceipts.length ? (
              filteredReceipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td>{receipt.receiptNumber}</td>
                  <td>{receipt.customerName}</td>
                  <td>{formatDate(receipt.paymentDate)}</td>
                  <td>{receipt.method}</td>
                  <td>{formatMoney(receipt.amount, "₦")}</td>
                  <td>{receipt.reference || "—"}</td>
                  <td>{receipt.description || "—"}</td>
                  <td>
                    <div className="button-row">
                      <Button variant="secondary" onClick={() => onOpenReceipt(receipt.id)}>View</Button>
                      {canDelete ? (
                        <Button variant="danger" onClick={() => deleteReceipt(receipt.id)}>Delete</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state small">
                    <p>No receipts found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
