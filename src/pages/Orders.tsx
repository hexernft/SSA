import { useMemo, useState } from "react";
import type { Customer, Order, OrderStatus } from "../types";
import { db, getNextOrderNumber } from "../db/database";
import { createId } from "../lib/ids";
import { formatDate, todayInputValue } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type OrdersProps = {
  customers: Customer[];
  orders: Order[];
  onChanged: () => Promise<void>;
  onOpenCustomer: (customerId: string) => void;
};

type OrderForm = {
  id?: string;
  customerId: string;
  outfitType: string;
  orderDate: string;
  dueDate: string;
  status: OrderStatus;
  totalAmount: number;
  depositPaid: number;
  notes: string;
};

const emptyForm: OrderForm = {
  customerId: "",
  outfitType: "",
  orderDate: todayInputValue(),
  dueDate: "",
  status: "pending",
  totalAmount: 0,
  depositPaid: 0,
  notes: "",
};

export function Orders({ customers, orders, onChanged, onOpenCustomer }: OrdersProps) {
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch =
        !term ||
        [order.orderNumber, order.customerName, order.outfitType, order.notes]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  function updateField<K extends keyof OrderForm>(key: K, value: OrderForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editOrder(order: Order) {
    setForm({
      id: order.id,
      customerId: order.customerId,
      outfitType: order.outfitType,
      orderDate: order.orderDate,
      dueDate: order.dueDate,
      status: order.status,
      totalAmount: order.totalAmount,
      depositPaid: order.depositPaid,
      notes: order.notes,
    });
  }

  async function saveOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customer = customers.find((item) => item.id === form.customerId);

    if (!customer) {
      alert("Please select a customer.");
      return;
    }

    const now = new Date().toISOString();
    const balanceDue = Math.max(Number(form.totalAmount || 0) - Number(form.depositPaid || 0), 0);

    if (form.id) {
      await db.orders.update(form.id, {
        customerId: customer.id,
        customerName: customer.name,
        outfitType: form.outfitType,
        orderDate: form.orderDate,
        dueDate: form.dueDate,
        status: form.status,
        totalAmount: Number(form.totalAmount || 0),
        depositPaid: Number(form.depositPaid || 0),
        balanceDue,
        notes: form.notes,
        updatedAt: now,
      });
    } else {
      await db.orders.add({
        id: createId("order"),
        orderNumber: await getNextOrderNumber(),
        customerId: customer.id,
        customerName: customer.name,
        outfitType: form.outfitType,
        orderDate: form.orderDate,
        dueDate: form.dueDate,
        status: form.status,
        totalAmount: Number(form.totalAmount || 0),
        depositPaid: Number(form.depositPaid || 0),
        balanceDue,
        notes: form.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    setForm(emptyForm);
    await onChanged();
  }

  async function deleteOrder(orderId: string) {
    const confirmed = window.confirm("Delete this order/job from this device?");
    if (!confirmed) return;

    await db.orders.delete(orderId);
    await onChanged();

    if (form.id === orderId) setForm(emptyForm);
  }

  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
  const readyOrders = orders.filter((order) => order.status === "ready").length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Orders / Jobs"
          subtitle="Track tailoring jobs from measurement to delivery."
        />
      </div>

      <div className="stats-grid">
        <Card>
          <span className="stat-label">Total Jobs</span>
          <strong className="stat-value">{orders.length}</strong>
        </Card>
        <Card>
          <span className="stat-label">Active Jobs</span>
          <strong className="stat-value">{activeOrders}</strong>
        </Card>
        <Card>
          <span className="stat-label">Ready</span>
          <strong className="stat-value">{readyOrders}</strong>
        </Card>
        <Card>
          <span className="stat-label">Delivered</span>
          <strong className="stat-value">{deliveredOrders}</strong>
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>{form.id ? "Edit Order / Job" : "Add Order / Job"}</h3>

          <form onSubmit={saveOrder}>
            <label className="field">
              <span>Customer</span>
              <select
                value={form.customerId}
                onChange={(event) => updateField("customerId", event.target.value)}
                required
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `- ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Outfit Type / Job</span>
              <input
                value={form.outfitType}
                onChange={(event) => updateField("outfitType", event.target.value)}
                placeholder="Sleek Executive, Agbada, alteration..."
                required
              />
            </label>

            <div className="two-grid">
              <label className="field">
                <span>Order Date</span>
                <input
                  type="date"
                  value={form.orderDate}
                  onChange={(event) => updateField("orderDate", event.target.value)}
                  required
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
                  onChange={(event) => updateField("status", event.target.value as OrderStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="measurement_taken">Measurement Taken</option>
                  <option value="fabric_received">Fabric Received</option>
                  <option value="cutting">Cutting</option>
                  <option value="sewing">Sewing</option>
                  <option value="fitting">Fitting</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="field">
                <span>Total Amount</span>
                <input
                  type="number"
                  value={form.totalAmount}
                  onChange={(event) => updateField("totalAmount", Number(event.target.value || 0))}
                />
              </label>

              <label className="field">
                <span>Deposit Paid</span>
                <input
                  type="number"
                  value={form.depositPaid}
                  onChange={(event) => updateField("depositPaid", Number(event.target.value || 0))}
                />
              </label>

              <label className="field">
                <span>Balance</span>
                <input
                  value={formatMoney(Math.max(Number(form.totalAmount || 0) - Number(form.depositPaid || 0), 0), "₦")}
                  readOnly
                />
              </label>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Fabric, fitting, delivery, customer request..."
              />
            </label>

            <div className="button-row">
              <Button type="submit">{form.id ? "Update Job" : "Save Job"}</Button>
              {form.id ? (
                <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <h3>Search / Filter</h3>

          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, order number, outfit..."
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "all")}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="measurement_taken">Measurement Taken</option>
              <option value="fabric_received">Fabric Received</option>
              <option value="cutting">Cutting</option>
              <option value="sewing">Sewing</option>
              <option value="fitting">Fitting</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </Card>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Outfit / Job</th>
              <th>Due</th>
              <th>Status</th>
              <th>Total</th>
              <th>Deposit</th>
              <th>Balance</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.length ? (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <button className="link-button" onClick={() => onOpenCustomer(order.customerId)}>
                      {order.customerName}
                    </button>
                  </td>
                  <td>
                    <strong>{order.outfitType}</strong>
                    <span className="table-subtext">{order.notes || "No notes"}</span>
                  </td>
                  <td>{order.dueDate ? formatDate(order.dueDate) : "—"}</td>
                  <td><span className={`status ${order.status}`}>{order.status.replace("_", " ")}</span></td>
                  <td>{formatMoney(order.totalAmount, "₦")}</td>
                  <td>{formatMoney(order.depositPaid, "₦")}</td>
                  <td>{formatMoney(order.balanceDue, "₦")}</td>
                  <td>
                    <div className="button-row">
                      <Button variant="secondary" onClick={() => editOrder(order)}>Edit</Button>
                      <Button variant="danger" onClick={() => deleteOrder(order.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state small">
                    <p>No orders/jobs found.</p>
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
