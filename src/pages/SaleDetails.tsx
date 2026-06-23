import { useMemo, useState } from "react";
import type { BusinessSettings, PaymentMethod, Sale, SaleItem, SaleStatus } from "../types";
import { calculateTotals, getSaleStatus } from "../lib/calculations";
import { createId } from "../lib/ids";
import { db } from "../db/database";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LineItemsEditor } from "../components/forms/LineItemsEditor";
import { SalePreview } from "../components/sales/SalePreview";
import { TotalsPanel } from "../components/shared/TotalsPanel";

type SaleDetailsProps = {
  settings: BusinessSettings | null;
  sale: Sale | null;
  items: SaleItem[];
  onBack: () => void;
  onDelete: (saleId: string) => Promise<void>;
  onUpdated: (saleId: string) => Promise<void>;
};

export function SaleDetails({
  settings,
  sale,
  items,
  onBack,
  onDelete,
  onUpdated,
}: SaleDetailsProps) {
  const saleRecord = sale as Sale;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => {
    if (!sale) return null;

    return {
      customerName: saleRecord.customerName,
      customerPhone: saleRecord.customerPhone,
      customerEmail: saleRecord.customerEmail,
      customerAddress: saleRecord.customerAddress,
      saleDate: saleRecord.saleDate,
      status: saleRecord.status,
      currency: saleRecord.currency,
      deliveryFee: saleRecord.deliveryFee,
      amountPaid: saleRecord.amountPaid,
      paymentMethod: saleRecord.paymentMethod,
      note: saleRecord.note,
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
    const status = getSaleStatus(form.status, result.amountPaid, result.balanceDue);

    return { ...result, status };
  }, [form]);

  if (!saleRecord) {
    return (
      <div>
        <div className="page-header">
          <div>
            <p className="eyebrow">Sale</p>
            <h2>Sale not found</h2>
          </div>

          <Button variant="secondary" onClick={onBack}>
            Back to Sales
          </Button>
        </div>
      </div>
    );
  }

  if (!form || !totals) return null;

  function resetForm() {
    if (!sale) return;

    setForm({
      customerName: saleRecord.customerName,
      customerPhone: saleRecord.customerPhone,
      customerEmail: saleRecord.customerEmail,
      customerAddress: saleRecord.customerAddress,
      saleDate: saleRecord.saleDate,
      status: saleRecord.status,
      currency: saleRecord.currency,
      deliveryFee: saleRecord.deliveryFee,
      amountPaid: saleRecord.amountPaid,
      paymentMethod: saleRecord.paymentMethod,
      note: saleRecord.note,
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

  function updateField(key: string, value: string | number | SaleStatus | PaymentMethod) {
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

    await db.transaction("rw", db.sales, db.saleItems, async () => {
      await db.sales.update(saleRecord.id, {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        saleDate: form.saleDate,
        status: totals.status,
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
        updatedAt: now,
      });

      await db.saleItems.where("saleId").equals(saleRecord.id).delete();

      await db.saleItems.bulkAdd(
        totals.calculatedItems.map((item) => ({
          id: createId("sale_item"),
          saleId: saleRecord.id,
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
    await onUpdated(saleRecord.id);
  }

  if (isEditing) {
    return (
      <form onSubmit={saveChanges}>
        <div className="page-header">
          <div>
            <p className="eyebrow">Edit Sale</p>
            <h2>{saleRecord.saleNumber}</h2>
            <p>Update customer details, payment details, status, and sale items.</p>
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
            <h3>Sale Details</h3>

            <div className="two-grid">
              <label className="field">
                <span>Sale Date</span>
                <input
                  type="date"
                  value={form.saleDate}
                  onChange={(event) => updateField("saleDate", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as SaleStatus)}
                >
                  <option value="paid">Paid</option>
                  <option value="part_paid">Part Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="refunded">Refunded</option>
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
                <span>Payment Method</span>
                <select
                  value={form.paymentMethod}
                  onChange={(event) => updateField("paymentMethod", event.target.value as PaymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="pos">POS</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
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
            <h3>Note</h3>

            <label className="field">
              <span>Sale Note</span>
              <textarea
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
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
          <p className="eyebrow">Sale Details</p>
          <h2>{saleRecord.saleNumber}</h2>
          <p>View, print, edit, or delete this sales record.</p>
        </div>

        <div className="button-row">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button onClick={() => window.print()}>Print</Button>
          <Button variant="danger" onClick={() => onDelete(saleRecord.id)}>
            Delete
          </Button>
        </div>
      </div>

      <SalePreview settings={settings} sale={saleRecord} items={items} />
    </div>
  );
}
