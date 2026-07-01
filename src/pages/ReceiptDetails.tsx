import { useState } from "react";
import type { BusinessSettings, PaymentMethod, Receipt } from "../types";
import { db } from "../db/database";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ReceiptPreview } from "../components/receipts/ReceiptPreview";

type ReceiptDetailsProps = {
  settings: BusinessSettings | null;
  receipt: Receipt | null;
  onBack: () => void;
  onUpdated: (receiptId: string) => Promise<void>;
};

export function ReceiptDetails({ settings, receipt, onBack, onUpdated }: ReceiptDetailsProps) {
  const receiptRecord = receipt as Receipt;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => {
    if (!receipt) return null;

    return {
      customerName: receiptRecord.customerName,
      paymentDate: receiptRecord.paymentDate,
      amount: receiptRecord.amount,
      method: receiptRecord.method,
      reference: receiptRecord.reference,
      description: receiptRecord.description,
      notes: receiptRecord.notes,
    };
  });

  if (!receiptRecord) {
    return (
      <div>
        <div className="page-header">
          <div>
            <p className="eyebrow">Receipt</p>
            <h2>Receipt not found</h2>
          </div>
          <Button variant="secondary" onClick={onBack}>Back to Receipts</Button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  function updateField(key: string, value: string | number | PaymentMethod) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function resetForm() {
    setForm({
      customerName: receiptRecord.customerName,
      paymentDate: receiptRecord.paymentDate,
      amount: receiptRecord.amount,
      method: receiptRecord.method,
      reference: receiptRecord.reference,
      description: receiptRecord.description,
      notes: receiptRecord.notes,
    });

    setIsEditing(false);
  }

  async function saveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formRecord = form;
    if (!formRecord) return;

    await db.receipts.update(receiptRecord.id, {
      customerName: formRecord.customerName,
      paymentDate: formRecord.paymentDate,
      amount: Number(formRecord.amount || 0),
      method: formRecord.method,
      reference: formRecord.reference,
      description: formRecord.description,
      notes: formRecord.notes,
      updatedAt: new Date().toISOString(),
    });

    setIsEditing(false);
    await onUpdated(receiptRecord.id);
  }

  if (isEditing) {
    return (
      <form onSubmit={saveChanges}>
        <div className="page-header">
          <div>
            <p className="eyebrow">Edit Receipt</p>
            <h2>{receiptRecord.receiptNumber}</h2>
            <p>Update receipt customer, payment details, reference, description, and notes.</p>
          </div>

          <div className="button-row">
            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>

        <Card>
          <div className="two-grid">
            <label className="field">
              <span>Customer Name</span>
              <input
                value={form.customerName}
                onChange={(event) => updateField("customerName", event.target.value)}
                required
              />
            </label>

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

            <label className="field">
              <span>Description</span>
              <input
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </label>
        </Card>
      </form>
    );
  }

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <p className="eyebrow">Receipt Details</p>
          <h2>{receiptRecord.receiptNumber}</h2>
          <p>View, print, edit, or save this receipt as PDF.</p>
        </div>

        <div className="button-row">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </div>
      </div>

      <ReceiptPreview settings={settings} receipt={receiptRecord} />
    </div>
  );
}
