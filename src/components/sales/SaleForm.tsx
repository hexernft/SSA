import { useEffect, useMemo, useState } from "react";
import type {
  BusinessSettings,
  Customer,
  PaymentMethod,
  Product,
  SaleFormState,
  SaleStatus,
} from "../../types";
import { calculateTotals, getSaleStatus } from "../../lib/calculations";
import { todayInputValue } from "../../lib/dates";
import { createId } from "../../lib/ids";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LineItemsEditor } from "../forms/LineItemsEditor";
import { TotalsPanel } from "../shared/TotalsPanel";
import { BrandHeader } from "../shared/BrandHeader";

type SaleFormProps = {
  settings: BusinessSettings | null;
  customers: Customer[];
  products: Product[];
  onSave: (form: SaleFormState) => Promise<void>;
};

export function SaleForm({ settings, customers, products, onSave }: SaleFormProps) {
  const [form, setForm] = useState<SaleFormState>(() => ({
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    saleDate: todayInputValue(),
    status: "paid",
    currency: "₦",
    deliveryFee: 0,
    amountPaid: 0,
    paymentMethod: "cash",
    note: "",
    items: [
      {
        id: createId("draft_item"),
        productId: "",
        description: "",
        productDetails: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 0,
      },
    ],
  }));

  useEffect(() => {
    if (!settings) return;

    setForm((current) => ({
      ...current,
      currency: current.currency || settings.currency || "₦",
      items: current.items.map((item) => ({
        ...item,
        taxRate: item.taxRate === "" ? "" : item.taxRate || settings.defaultTaxRate || 0,
      })),
    }));
  }, [settings]);

  const totals = useMemo(() => {
    const result = calculateTotals(form.items, form.deliveryFee, form.amountPaid);
    const status = getSaleStatus(form.status, result.amountPaid, result.balanceDue);
    return { ...result, status };
  }, [form]);

  function updateField<K extends keyof SaleFormState>(key: K, value: SaleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);

    if (!customer) {
      setForm((current) => ({
        ...current,
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address,
    }));
  }

  function updateItem(
    itemId: string,
    key: "productId" | "description" | "productDetails" | "quantity" | "unitPrice" | "discount" | "taxRate",
    value: string | number
  ) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [key]: key === "productId" || key === "description" || key === "productDetails" ? value : value === "" ? "" : Number(value),
            }
          : item
      ),
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          id: createId("draft_item"),
          productId: "",
          description: "",
          productDetails: "",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxRate: settings?.defaultTaxRate || 0,
        },
      ],
    }));
  }

  function removeItem(itemId: string) {
    setForm((current) => {
      if (current.items.length === 1) return current;
      return { ...current, items: current.items.filter((item) => item.id !== itemId) };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({ ...form, status: totals.status });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header">
        <BrandHeader
          title="Add Direct Sale"
          subtitle="Record a Sleek Stitch Atelier sale without creating a formal invoice."
        />
        <Button type="submit">Save Sale</Button>
      </div>

      <div className="form-grid">
        <Card>
          <h3>Customer</h3>

          <label className="field">
            <span>Select Saved Customer</span>
            <select value={form.customerId || ""} onChange={(event) => selectCustomer(event.target.value)}>
              <option value="">Walk-in / Custom customer</option>
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
                required
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
                onChange={(event) => updateField("deliveryFee", event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span>Amount Paid</span>
              <input
                type="number"
                value={form.amountPaid}
                onChange={(event) => updateField("amountPaid", event.target.value === "" ? "" : Number(event.target.value))}
              />
            </label>
          </div>
        </Card>
      </div>

      <LineItemsEditor
        currency={form.currency}
        items={totals.calculatedItems}
        products={products}
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
