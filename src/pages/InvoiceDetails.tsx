import { useMemo, useState } from "react";
import type { BusinessSettings, Invoice, InvoiceItem, InvoiceStatus } from "../types";
import { calculateTotals, getInvoiceStatus } from "../lib/calculations";
import { createId } from "../lib/ids";
import { db } from "../db/database";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { InvoicePreview } from "../components/invoices/InvoicePreview";
import { LineItemsEditor } from "../components/forms/LineItemsEditor";
import { TotalsPanel } from "../components/shared/TotalsPanel";

type InvoiceDetailsProps = {
  settings: BusinessSettings | null;
  invoice: Invoice | null;
  items: InvoiceItem[];
  onBack: () => void;
  onDelete: (invoiceId: string) => Promise<void>;
  onRecordAsSale: (invoiceId: string) => Promise<void>;
  onUpdated: (invoiceId: string) => Promise<void>;
};

export function InvoiceDetails({
  settings,
  invoice,
  items,
  onBack,
  onDelete,
  onRecordAsSale,
  onUpdated,
}: InvoiceDetailsProps) {
  const invoiceRecord = invoice as Invoice;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => {
    if (!invoice) return null;

    return {
      customerName: invoiceRecord.customerName,
      customerPhone: invoiceRecord.customerPhone,
      customerEmail: invoiceRecord.customerEmail,
      customerAddress: invoiceRecord.customerAddress,
      issueDate: invoiceRecord.issueDate,
      dueDate: invoiceRecord.dueDate,
      status: invoiceRecord.status,
      currency: invoiceRecord.currency,
      deliveryFee: invoiceRecord.deliveryFee,
      amountPaid: invoiceRecord.amountPaid,
      notes: invoiceRecord.notes,
      terms: invoiceRecord.terms,
      items: items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
    };
  });

  const totals = useMemo(() => {
    if (!form) return null;

    const result = calculateTotals(form.items, form.deliveryFee, form.amountPaid);
    const status = getInvoiceStatus(
      form.status,
      form.dueDate,
      result.amountPaid,
      result.balanceDue
    );

    return { ...result, status };
  }, [form]);

  if (!invoiceRecord) {
    return (
      <div>
        <div className="page-header">
          <div>
            <p className="eyebrow">Invoice</p>
            <h2>Invoice not found</h2>
          </div>
          <Button variant="secondary" onClick={onBack}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  if (!form || !totals) {
    return null;
  }

  function resetForm() {
    if (!invoice) return;

    setForm({
      customerName: invoiceRecord.customerName,
      customerPhone: invoiceRecord.customerPhone,
      customerEmail: invoiceRecord.customerEmail,
      customerAddress: invoiceRecord.customerAddress,
      issueDate: invoiceRecord.issueDate,
      dueDate: invoiceRecord.dueDate,
      status: invoiceRecord.status,
      currency: invoiceRecord.currency,
      deliveryFee: invoiceRecord.deliveryFee,
      amountPaid: invoiceRecord.amountPaid,
      notes: invoiceRecord.notes,
      terms: invoiceRecord.terms,
      items: items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
    });

    setIsEditing(false);
  }

  function updateField(key: string, value: string | number | InvoiceStatus) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateItem(
    itemId: string,
    key: "productId" | "description" | "quantity" | "unitPrice" | "discount" | "taxRate",
    value: string | number
  ) {
    setForm((current) => {
      if (!current) return current;

      return {
        ...current,
        items: current.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                [key]: key === "description" || key === "productId" ? value : Number(value || 0),
              }
            : item
        ),
      };
    });
  }

  function addItem() {
    setForm((current) => {
      if (!current) return current;

      return {
        ...current,
        items: [
          ...current.items,
          {
            id: createId("draft_item"),
            description: "",
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            taxRate: settings?.defaultTaxRate || 0,
          },
        ],
      };
    });
  }

  function removeItem(itemId: string) {
    setForm((current) => {
      if (!current || current.items.length === 1) return current;
      return { ...current, items: current.items.filter((item) => item.id !== itemId) };
    });
  }

  async function saveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form || !totals) return;

    const now = new Date().toISOString();

    await db.transaction("rw", db.invoices, db.invoiceItems, async () => {
      await db.invoices.update(invoiceRecord.id, {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        status: totals.status,
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
        updatedAt: now,
      });

      await db.invoiceItems.where("invoiceId").equals(invoiceRecord.id).delete();

      await db.invoiceItems.bulkAdd(
        totals.calculatedItems.map((item) => ({
          id: createId("invoice_item"),
          invoiceId: invoiceRecord.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          lineTotal: item.lineTotal,
        }))
      );
    });

    setIsEditing(false);
    await onUpdated(invoiceRecord.id);
  }

  if (isEditing) {
    return (
      <form onSubmit={saveChanges}>
        <div className="page-header">
          <div>
            <p className="eyebrow">Edit Invoice</p>
            <h2>{invoiceRecord.invoiceNumber}</h2>
            <p>Update invoice details, customer information, amounts, status, and items.</p>
          </div>

          <div className="button-row">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>

        <div className="form-grid">
          <Card>
            <h3>Customer</h3>

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
                <span>Phone</span>
                <input
                  value={form.customerPhone}
                  onChange={(event) => updateField("customerPhone", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  value={form.customerEmail}
                  onChange={(event) => updateField("customerEmail", event.target.value)}
                />
              </label>
            </div>

            <label className="field">
              <span>Address</span>
              <textarea
                value={form.customerAddress}
                onChange={(event) => updateField("customerAddress", event.target.value)}
              />
            </label>
          </Card>

          <Card>
            <h3>Invoice Details</h3>

            <div className="two-grid">
              <label className="field">
                <span>Issue Date</span>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => updateField("issueDate", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Due Date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => updateField("dueDate", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as InvoiceStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="part_paid">Part Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="field">
                <span>Currency</span>
                <select
                  value={form.currency}
                  onChange={(event) => updateField("currency", event.target.value)}
                >
                  <option value="₦">NGN - ₦</option>
                  <option value="$">USD - $</option>
                  <option value="€">EUR - €</option>
                  <option value="£">GBP - £</option>
                </select>
              </label>

              <label className="field">
                <span>Delivery / Extra Fee</span>
                <input
                  type="number"
                  value={form.deliveryFee}
                  onChange={(event) => updateField("deliveryFee", Number(event.target.value || 0))}
                />
              </label>

              <label className="field">
                <span>Amount Paid</span>
                <input
                  type="number"
                  value={form.amountPaid}
                  onChange={(event) => updateField("amountPaid", Number(event.target.value || 0))}
                />
              </label>
            </div>
          </Card>
        </div>

        <LineItemsEditor
          currency={form.currency}
          items={totals.calculatedItems}
          products={[]}
          defaultTaxRate={settings?.defaultTaxRate || 0}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
        />

        <div className="form-grid mt">
          <Card>
            <h3>Notes and Terms</h3>

            <label className="field">
              <span>Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Terms</span>
              <textarea
                value={form.terms}
                onChange={(event) => updateField("terms", event.target.value)}
              />
            </label>
          </Card>

          <TotalsPanel
            currency={form.currency}
            subtotal={totals.subtotal}
            discountTotal={totals.discountTotal}
            taxTotal={totals.taxTotal}
            deliveryFee={totals.deliveryFee}
            grandTotal={totals.grandTotal}
            amountPaid={totals.amountPaid}
            balanceDue={totals.balanceDue}
          />
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <p className="eyebrow">Invoice Details</p>
          <h2>{invoiceRecord.invoiceNumber}</h2>
          <p>View, print, save PDF, edit, record as sale, or delete this invoiceRecord.</p>
        </div>

        <div className="button-row">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
          {!invoiceRecord.linkedSaleId ? (
            <Button variant="secondary" onClick={() => onRecordAsSale(invoiceRecord.id)}>
              Record as Sale
            </Button>
          ) : null}
          <Button variant="danger" onClick={() => onDelete(invoiceRecord.id)}>
            Delete
          </Button>
        </div>
      </div>

      <InvoicePreview settings={settings} invoice={invoiceRecord} items={items} />
    </div>
  );
}
