import { useMemo, useState } from "react";
import type { Customer, Invoice, Sale } from "../types";
import { db } from "../db/database";
import { createId } from "../lib/ids";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type CustomersProps = {
  customers: Customer[];
  invoices: Invoice[];
  sales: Sale[];
  onChanged: () => Promise<void>;
  onOpenCustomer: (customerId: string) => void;
};

type CustomerForm = {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  weddingAnniversary: string;
  spouseName: string;
  preferredStyle: string;
  preferredColor: string;
  preferredFabric: string;
  fitNotes: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  birthday: "",
  weddingAnniversary: "",
  spouseName: "",
  preferredStyle: "",
  preferredColor: "",
  preferredFabric: "",
  fitNotes: "",
  notes: "",
};

export function Customers({ customers, invoices, sales, onChanged, onOpenCustomer }: CustomersProps) {
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
        customer.preferredStyle,
        customer.preferredFabric,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [customers, search]);

  function updateField<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editCustomer(customer: Customer) {
    setForm({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      birthday: customer.birthday || "",
      weddingAnniversary: customer.weddingAnniversary || "",
      spouseName: customer.spouseName || "",
      preferredStyle: customer.preferredStyle || "",
      preferredColor: customer.preferredColor || "",
      preferredFabric: customer.preferredFabric || "",
      fitNotes: customer.fitNotes || "",
      notes: customer.notes,
    });
  }

  async function saveCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();

    if (form.id) {
      await db.customers.update(form.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        birthday: form.birthday,
        weddingAnniversary: form.weddingAnniversary,
        spouseName: form.spouseName,
        preferredStyle: form.preferredStyle,
        preferredColor: form.preferredColor,
        preferredFabric: form.preferredFabric,
        fitNotes: form.fitNotes,
        notes: form.notes,
        updatedAt: now,
      });
    } else {
      await db.customers.add({
        id: createId("customer"),
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        birthday: form.birthday,
        weddingAnniversary: form.weddingAnniversary,
        spouseName: form.spouseName,
        preferredStyle: form.preferredStyle,
        preferredColor: form.preferredColor,
        preferredFabric: form.preferredFabric,
        fitNotes: form.fitNotes,
        notes: form.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    setForm(emptyForm);
    await onChanged();
  }

  async function deleteCustomer(customerId: string) {
    const confirmed = window.confirm("Delete this customer from this device?");
    if (!confirmed) return;

    await db.transaction("rw", db.customers, db.customerSpecialDates, async () => {
      await db.customers.delete(customerId);
      await db.customerSpecialDates.where("customerId").equals(customerId).delete();
    });

    await onChanged();

    if (form.id === customerId) {
      setForm(emptyForm);
    }
  }

  function customerStats(customer: Customer) {
    const customerInvoices = invoices.filter(
      (invoice) =>
        invoice.customerId === customer.id ||
        (!invoice.customerId && invoice.customerPhone && invoice.customerPhone === customer.phone)
    );

    const customerSales = sales.filter(
      (sale) =>
        sale.customerId === customer.id ||
        (!sale.customerId && sale.customerPhone && sale.customerPhone === customer.phone)
    );

    const totalSales = customerSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    const balance = customerSales.reduce((sum, sale) => sum + sale.balanceDue, 0);
    const currency = customerSales[0]?.currency || "₦";

    return {
      invoiceCount: customerInvoices.length,
      saleCount: customerSales.length,
      totalSales,
      balance,
      currency,
    };
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Customers"
          subtitle="Save customer details, birthdays, anniversaries, preferences, and style notes."
        />
      </div>

      <div className="form-grid">
        <Card>
          <h3>{form.id ? "Edit Customer" : "Add Customer"}</h3>

          <form onSubmit={saveCustomer}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Customer name"
                required
              />
            </label>

            <div className="two-grid">
              <label className="field">
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+234..."
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="customer@example.com"
                />
              </label>
            </div>

            <label className="field">
              <span>Address</span>
              <textarea
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Customer address"
              />
            </label>

            <div className="two-grid">
              <label className="field">
                <span>Birthday</span>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(event) => updateField("birthday", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Wedding Anniversary</span>
                <input
                  type="date"
                  value={form.weddingAnniversary}
                  onChange={(event) => updateField("weddingAnniversary", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Spouse Name</span>
                <input
                  value={form.spouseName}
                  onChange={(event) => updateField("spouseName", event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="field">
                <span>Preferred Style</span>
                <input
                  value={form.preferredStyle}
                  onChange={(event) => updateField("preferredStyle", event.target.value)}
                  placeholder="Native, luxury, senator..."
                />
              </label>

              <label className="field">
                <span>Preferred Color</span>
                <input
                  value={form.preferredColor}
                  onChange={(event) => updateField("preferredColor", event.target.value)}
                  placeholder="Black, cream, navy..."
                />
              </label>

              <label className="field">
                <span>Preferred Fabric</span>
                <input
                  value={form.preferredFabric}
                  onChange={(event) => updateField("preferredFabric", event.target.value)}
                  placeholder="Cashmere, senator, linen..."
                />
              </label>
            </div>

            <label className="field">
              <span>Fit Notes</span>
              <textarea
                value={form.fitNotes}
                onChange={(event) => updateField("fitNotes", event.target.value)}
                placeholder="Slim fit, loose trousers, long sleeves..."
              />
            </label>

            <label className="field">
              <span>General Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Customer preferences, relationship notes, etc."
              />
            </label>

            <div className="button-row">
              <Button type="submit">{form.id ? "Update Customer" : "Save Customer"}</Button>
              {form.id ? (
                <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <h3>Customer Search</h3>

          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone, email, style, fabric"
            />
          </label>

          <p className="muted">
            Customer birthdays and anniversaries appear automatically on the dashboard when they are near.
          </p>
        </Card>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Birthday</th>
              <th>Anniversary</th>
              <th>Invoices</th>
              <th>Sales</th>
              <th>Total Sales</th>
              <th>Balance</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.length ? (
              filteredCustomers.map((customer) => {
                const stats = customerStats(customer);

                return (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                      <span className="table-subtext">{customer.preferredStyle || customer.address || "No style note"}</span>
                    </td>
                    <td>
                      <span>{customer.phone || "—"}</span>
                      <span className="table-subtext">{customer.email || "No email"}</span>
                    </td>
                    <td>{customer.birthday ? formatDate(customer.birthday) : "—"}</td>
                    <td>{customer.weddingAnniversary ? formatDate(customer.weddingAnniversary) : "—"}</td>
                    <td>{stats.invoiceCount}</td>
                    <td>{stats.saleCount}</td>
                    <td>{formatMoney(stats.totalSales, stats.currency)}</td>
                    <td>{formatMoney(stats.balance, stats.currency)}</td>
                    <td>
                      <div className="button-row">
                        <Button variant="secondary" onClick={() => onOpenCustomer(customer.id)}>
                          View
                        </Button>
                        <Button variant="secondary" onClick={() => editCustomer(customer)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => deleteCustomer(customer.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state small">
                    <p>No customers found.</p>
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
