import { useMemo, useState } from "react";
import type {
  Customer,
  CustomerSpecialDate,
  Invoice,
  Measurement,
  Order,
  OrderStatus,
  Sale,
  SpecialDateType,
} from "../types";
import { db, getNextOrderNumber } from "../db/database";
import { createId } from "../lib/ids";
import { formatDate, todayInputValue } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { formatReminderTime, getUpcomingCelebrations } from "../lib/reminders";
import { printCustomerProfile, printMeasurementRecord, printOrderTicket } from "../lib/printDocuments";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type CustomerDetailsProps = {
  customer: Customer | null;
  specialDates: CustomerSpecialDate[];
  measurements: Measurement[];
  orders: Order[];
  invoices: Invoice[];
  sales: Sale[];
  onBack: () => void;
  onChanged: () => Promise<void>;
  canDelete: boolean;
};

type SpecialDateForm = {
  id?: string;
  title: string;
  date: string;
  type: SpecialDateType;
  notes: string;
};

type MeasurementForm = {
  id?: string;
  title: string;
  dateTaken: string;
  chest: string;
  waist: string;
  hip: string;
  shoulder: string;
  sleeve: string;
  neck: string;
  roundSleeve: string;
  topLength: string;
  trouserWaist: string;
  trouserLength: string;
  thigh: string;
  knee: string;
  ankle: string;
  agbadaLength: string;
  capSize: string;
  notes: string;
};

type OrderForm = {
  id?: string;
  outfitType: string;
  orderDate: string;
  dueDate: string;
  status: OrderStatus;
  totalAmount: number;
  depositPaid: number;
  notes: string;
};

const emptySpecialDateForm: SpecialDateForm = {
  title: "",
  date: "",
  type: "special",
  notes: "",
};

const emptyMeasurementForm: MeasurementForm = {
  title: "",
  dateTaken: todayInputValue(),
  chest: "",
  waist: "",
  hip: "",
  shoulder: "",
  sleeve: "",
  neck: "",
  roundSleeve: "",
  topLength: "",
  trouserWaist: "",
  trouserLength: "",
  thigh: "",
  knee: "",
  ankle: "",
  agbadaLength: "",
  capSize: "",
  notes: "",
};

const emptyOrderForm: OrderForm = {
  outfitType: "",
  orderDate: todayInputValue(),
  dueDate: "",
  status: "pending",
  totalAmount: 0,
  depositPaid: 0,
  notes: "",
};

export function CustomerDetails({
  customer,
  specialDates,
  measurements,
  orders,
  invoices,
  sales,
  onBack,
  onChanged,
  canDelete,
}: CustomerDetailsProps) {
  const [specialDateForm, setSpecialDateForm] = useState<SpecialDateForm>(emptySpecialDateForm);
  const [measurementForm, setMeasurementForm] = useState<MeasurementForm>(emptyMeasurementForm);
  const [orderForm, setOrderForm] = useState<OrderForm>(emptyOrderForm);

  const customerSpecialDates = useMemo(() => {
    if (!customer) return [];
    return specialDates.filter((item) => item.customerId === customer.id);
  }, [customer, specialDates]);

  const customerMeasurements = useMemo(() => {
    if (!customer) return [];
    return measurements.filter((item) => item.customerId === customer.id);
  }, [customer, measurements]);

  const customerOrders = useMemo(() => {
    if (!customer) return [];
    return orders.filter((item) => item.customerId === customer.id);
  }, [customer, orders]);

  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices.filter(
      (invoice) =>
        invoice.customerId === customer.id ||
        (!invoice.customerId && invoice.customerPhone && invoice.customerPhone === customer.phone)
    );
  }, [customer, invoices]);

  const customerSales = useMemo(() => {
    if (!customer) return [];
    return sales.filter(
      (sale) =>
        sale.customerId === customer.id ||
        (!sale.customerId && sale.customerPhone && sale.customerPhone === customer.phone)
    );
  }, [customer, sales]);

  const upcomingDates = useMemo(() => {
    if (!customer) return [];
    return getUpcomingCelebrations([customer], customerSpecialDates, 365);
  }, [customer, customerSpecialDates]);

  if (!customer) {
    return (
      <div>
        <div className="page-header">
          <BrandHeader title="Customer not found" subtitle="The selected customer could not be opened." />
          <Button variant="secondary" onClick={onBack}>Back</Button>
        </div>
      </div>
    );
  }

  const activeCustomer = customer;

  const totalSales = customerSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const totalPaid = customerSales.reduce((sum, sale) => sum + sale.amountPaid, 0);
  const totalBalance = customerSales.reduce((sum, sale) => sum + sale.balanceDue, 0);
  const currency = customerSales[0]?.currency || "₦";

  function updateSpecialDateField<K extends keyof SpecialDateForm>(key: K, value: SpecialDateForm[K]) {
    setSpecialDateForm((current) => ({ ...current, [key]: value }));
  }

  function updateMeasurementField<K extends keyof MeasurementForm>(key: K, value: MeasurementForm[K]) {
    setMeasurementForm((current) => ({ ...current, [key]: value }));
  }

  function updateOrderField<K extends keyof OrderForm>(key: K, value: OrderForm[K]) {
    setOrderForm((current) => ({ ...current, [key]: value }));
  }

  async function saveSpecialDate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date().toISOString();

    if (specialDateForm.id) {
      await db.customerSpecialDates.update(specialDateForm.id, {
        title: specialDateForm.title,
        date: specialDateForm.date,
        type: specialDateForm.type,
        notes: specialDateForm.notes,
        updatedAt: now,
      });
    } else {
      await db.customerSpecialDates.add({
        id: createId("special_date"),
        customerId: activeCustomer.id,
        title: specialDateForm.title,
        date: specialDateForm.date,
        type: specialDateForm.type,
        notes: specialDateForm.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    setSpecialDateForm(emptySpecialDateForm);
    await onChanged();
  }

  function editSpecialDate(specialDate: CustomerSpecialDate) {
    setSpecialDateForm({
      id: specialDate.id,
      title: specialDate.title,
      date: specialDate.date,
      type: specialDate.type,
      notes: specialDate.notes,
    });
  }

  async function deleteSpecialDate(specialDateId: string) {
    const confirmed = window.confirm("Delete this special date?");
    if (!confirmed) return;
    await db.customerSpecialDates.delete(specialDateId);
    await onChanged();
  }

  async function saveMeasurement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date().toISOString();

    const payload = {
      customerId: activeCustomer.id,
      title: measurementForm.title,
      dateTaken: measurementForm.dateTaken,
      chest: measurementForm.chest,
      waist: measurementForm.waist,
      hip: measurementForm.hip,
      shoulder: measurementForm.shoulder,
      sleeve: measurementForm.sleeve,
      neck: measurementForm.neck,
      roundSleeve: measurementForm.roundSleeve,
      topLength: measurementForm.topLength,
      trouserWaist: measurementForm.trouserWaist,
      trouserLength: measurementForm.trouserLength,
      thigh: measurementForm.thigh,
      knee: measurementForm.knee,
      ankle: measurementForm.ankle,
      agbadaLength: measurementForm.agbadaLength,
      capSize: measurementForm.capSize,
      notes: measurementForm.notes,
      updatedAt: now,
    };

    if (measurementForm.id) {
      await db.measurements.update(measurementForm.id, payload);
    } else {
      await db.measurements.add({
        id: createId("measurement"),
        ...payload,
        createdAt: now,
      });
    }

    setMeasurementForm(emptyMeasurementForm);
    await onChanged();
  }

  function editMeasurement(measurement: Measurement) {
    setMeasurementForm({
      id: measurement.id,
      title: measurement.title,
      dateTaken: measurement.dateTaken,
      chest: measurement.chest,
      waist: measurement.waist,
      hip: measurement.hip,
      shoulder: measurement.shoulder,
      sleeve: measurement.sleeve,
      neck: measurement.neck,
      roundSleeve: measurement.roundSleeve,
      topLength: measurement.topLength,
      trouserWaist: measurement.trouserWaist,
      trouserLength: measurement.trouserLength,
      thigh: measurement.thigh,
      knee: measurement.knee,
      ankle: measurement.ankle,
      agbadaLength: measurement.agbadaLength,
      capSize: measurement.capSize,
      notes: measurement.notes,
    });
  }

  async function deleteMeasurement(measurementId: string) {
    const confirmed = window.confirm("Delete this measurement record?");
    if (!confirmed) return;
    await db.measurements.delete(measurementId);
    await onChanged();
  }

  async function saveOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date().toISOString();
    const balanceDue = Math.max(Number(orderForm.totalAmount || 0) - Number(orderForm.depositPaid || 0), 0);

    if (orderForm.id) {
      await db.orders.update(orderForm.id, {
        outfitType: orderForm.outfitType,
        orderDate: orderForm.orderDate,
        dueDate: orderForm.dueDate,
        status: orderForm.status,
        totalAmount: Number(orderForm.totalAmount || 0),
        depositPaid: Number(orderForm.depositPaid || 0),
        balanceDue,
        notes: orderForm.notes,
        updatedAt: now,
      });
    } else {
      await db.orders.add({
        id: createId("order"),
        orderNumber: await getNextOrderNumber(),
        customerId: activeCustomer.id,
        customerName: activeCustomer.name,
        outfitType: orderForm.outfitType,
        orderDate: orderForm.orderDate,
        dueDate: orderForm.dueDate,
        status: orderForm.status,
        totalAmount: Number(orderForm.totalAmount || 0),
        depositPaid: Number(orderForm.depositPaid || 0),
        balanceDue,
        notes: orderForm.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    setOrderForm(emptyOrderForm);
    await onChanged();
  }

  function editOrder(order: Order) {
    setOrderForm({
      id: order.id,
      outfitType: order.outfitType,
      orderDate: order.orderDate,
      dueDate: order.dueDate,
      status: order.status,
      totalAmount: order.totalAmount,
      depositPaid: order.depositPaid,
      notes: order.notes,
    });
  }

  async function deleteOrder(orderId: string) {
    const confirmed = window.confirm("Delete this order/job?");
    if (!confirmed) return;
    await db.orders.delete(orderId);
    await onChanged();
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title={customer.name}
          subtitle="Customer profile, dates, orders, measurements, invoice history, and sales history."
        />
        <div className="button-row">
          <Button
            variant="secondary"
            onClick={() => printCustomerProfile(customer, customerMeasurements, customerOrders, customerInvoices, customerSales)}
          >
            Print Profile
          </Button>
          <Button variant="secondary" onClick={onBack}>Back to Customers</Button>
        </div>
      </div>

      <div className="stats-grid">
        <Card>
          <span className="stat-label">Total Revenue</span>
          <strong className="stat-value">{formatMoney(totalSales, currency)}</strong>
        </Card>
        <Card>
          <span className="stat-label">Total Paid</span>
          <strong className="stat-value">{formatMoney(totalPaid, currency)}</strong>
        </Card>
        <Card>
          <span className="stat-label">Outstanding</span>
          <strong className="stat-value">{formatMoney(totalBalance, currency)}</strong>
        </Card>
        <Card>
          <span className="stat-label">Orders</span>
          <strong className="stat-value">{customerOrders.length}</strong>
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>Profile</h3>
          <div className="profile-grid">
            <div><span>Phone</span><strong>{customer.phone || "—"}</strong></div>
            <div><span>Email</span><strong>{customer.email || "—"}</strong></div>
            <div><span>Address</span><strong>{customer.address || "—"}</strong></div>
            <div><span>Birthday</span><strong>{customer.birthday ? formatDate(customer.birthday) : "—"}</strong></div>
            <div><span>Wedding Anniversary</span><strong>{customer.weddingAnniversary ? formatDate(customer.weddingAnniversary) : "—"}</strong></div>
            <div><span>Spouse</span><strong>{customer.spouseName || "—"}</strong></div>
            <div><span>Preferred Style</span><strong>{customer.preferredStyle || "—"}</strong></div>
            <div><span>Preferred Color</span><strong>{customer.preferredColor || "—"}</strong></div>
            <div><span>Preferred Fabric</span><strong>{customer.preferredFabric || "—"}</strong></div>
          </div>

          {customer.fitNotes ? <><h3 className="subsection-title">Fit Notes</h3><p className="muted">{customer.fitNotes}</p></> : null}
          {customer.notes ? <><h3 className="subsection-title">General Notes</h3><p className="muted">{customer.notes}</p></> : null}
        </Card>

        <Card>
          <h3>Upcoming Dates</h3>
          {upcomingDates.length ? (
            <div className="reminder-list">
              {upcomingDates.slice(0, 6).map((reminder) => (
                <div key={reminder.id} className="reminder-item static">
                  <span className={`reminder-badge ${reminder.type}`}>{reminder.type}</span>
                  <div>
                    <strong>{reminder.title}</strong>
                    <span>{formatReminderTime(reminder.daysUntil)} · {formatDate(reminder.date)}</span>
                    {reminder.notes ? <span>{reminder.notes}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state small"><p>No customer dates saved yet.</p></div>}
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>{orderForm.id ? "Edit Order / Job" : "Add Order / Job"}</h3>
          <form onSubmit={saveOrder}>
            <label className="field">
              <span>Outfit Type / Job</span>
              <input value={orderForm.outfitType} onChange={(e) => updateOrderField("outfitType", e.target.value)} placeholder="Agbada, senator, alteration..." required />
            </label>
            <div className="two-grid">
              <label className="field"><span>Order Date</span><input type="date" value={orderForm.orderDate} onChange={(e) => updateOrderField("orderDate", e.target.value)} required /></label>
              <label className="field"><span>Due Date</span><input type="date" value={orderForm.dueDate} onChange={(e) => updateOrderField("dueDate", e.target.value)} /></label>
              <label className="field">
                <span>Status</span>
                <select value={orderForm.status} onChange={(e) => updateOrderField("status", e.target.value as OrderStatus)}>
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
              <label className="field"><span>Total Amount</span><input type="number" value={orderForm.totalAmount} onChange={(e) => updateOrderField("totalAmount", Number(e.target.value || 0))} /></label>
              <label className="field"><span>Deposit Paid</span><input type="number" value={orderForm.depositPaid} onChange={(e) => updateOrderField("depositPaid", Number(e.target.value || 0))} /></label>
              <label className="field"><span>Balance</span><input value={formatMoney(Math.max(Number(orderForm.totalAmount || 0) - Number(orderForm.depositPaid || 0), 0), "₦")} readOnly /></label>
            </div>
            <label className="field"><span>Notes</span><textarea value={orderForm.notes} onChange={(e) => updateOrderField("notes", e.target.value)} placeholder="Fabric, fitting, delivery, customer request..." /></label>
            <div className="button-row">
              <Button type="submit">{orderForm.id ? "Update Job" : "Save Job"}</Button>
              {orderForm.id ? <Button type="button" variant="secondary" onClick={() => setOrderForm(emptyOrderForm)}>Cancel Edit</Button> : null}
            </div>
          </form>
        </Card>

        <Card>
          <h3>Order / Job History</h3>
          {customerOrders.length ? (
            <div className="mini-list">
              {customerOrders.map((order) => (
                <div key={order.id} className="mini-list-item">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.outfitType} · {order.status.replace("_", " ")} · Due {order.dueDate ? formatDate(order.dueDate) : "—"}</span>
                    {order.notes ? <span>{order.notes}</span> : null}
                  </div>
                  <div className="button-row">
                    <Button
                      variant="secondary"
                      onClick={() => printOrderTicket(customer, order, customerMeasurements[0])}
                    >
                      Print
                    </Button>
                    <Button variant="secondary" onClick={() => editOrder(order)}>Edit</Button>
                    {canDelete ? (
                      <Button variant="danger" onClick={() => deleteOrder(order.id)}>Delete</Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state small"><p>No orders/jobs yet.</p></div>}
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>{measurementForm.id ? "Edit Measurement" : "Add Measurement"}</h3>
          <form onSubmit={saveMeasurement}>
            <label className="field"><span>Title / Purpose</span><input value={measurementForm.title} onChange={(e) => updateMeasurementField("title", e.target.value)} placeholder="Regular native wear, wedding outfit..." required /></label>
            <label className="field"><span>Date Taken</span><input type="date" value={measurementForm.dateTaken} onChange={(e) => updateMeasurementField("dateTaken", e.target.value)} /></label>
            <div className="measurement-grid">
              {[
                ["chest", "Chest"], ["waist", "Waist"], ["hip", "Hip"], ["shoulder", "Shoulder"],
                ["sleeve", "Sleeve"], ["neck", "Neck"], ["roundSleeve", "Round Sleeve"],
                ["topLength", "Top Length"], ["trouserWaist", "Trouser Waist"],
                ["trouserLength", "Trouser Length"], ["thigh", "Thigh"], ["knee", "Knee"],
                ["ankle", "Ankle"], ["agbadaLength", "Agbada Length"], ["capSize", "Cap Size"]
              ].map(([key, label]) => (
                <label key={key} className="field">
                  <span>{label}</span>
                  <input
                    value={measurementForm[key as keyof MeasurementForm] as string}
                    onChange={(e) => updateMeasurementField(key as keyof MeasurementForm, e.target.value)}
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
            <label className="field"><span>Notes</span><textarea value={measurementForm.notes} onChange={(e) => updateMeasurementField("notes", e.target.value)} placeholder="Fit preference, posture, style adjustment..." /></label>
            <div className="button-row">
              <Button type="submit">{measurementForm.id ? "Update Measurement" : "Save Measurement"}</Button>
              {measurementForm.id ? <Button type="button" variant="secondary" onClick={() => setMeasurementForm(emptyMeasurementForm)}>Cancel Edit</Button> : null}
            </div>
          </form>
        </Card>

        <Card>
          <h3>Measurement Records</h3>
          {customerMeasurements.length ? (
            <div className="mini-list">
              {customerMeasurements.map((measurement) => (
                <div key={measurement.id} className="mini-list-item measurement-item">
                  <div>
                    <strong>{measurement.title}</strong>
                    <span>{formatDate(measurement.dateTaken)}</span>
                    <div className="measurement-summary">
                      <span>Chest: {measurement.chest || "—"}</span>
                      <span>Waist: {measurement.waist || "—"}</span>
                      <span>Shoulder: {measurement.shoulder || "—"}</span>
                      <span>Top Length: {measurement.topLength || "—"}</span>
                      <span>Trouser: {measurement.trouserLength || "—"}</span>
                      <span>Agbada: {measurement.agbadaLength || "—"}</span>
                    </div>
                    {measurement.notes ? <span>{measurement.notes}</span> : null}
                  </div>
                  <div className="button-row">
                    <Button
                      variant="secondary"
                      onClick={() => printMeasurementRecord(customer, measurement)}
                    >
                      Print
                    </Button>
                    <Button variant="secondary" onClick={() => editMeasurement(measurement)}>Edit</Button>
                    {canDelete ? (
                      <Button variant="danger" onClick={() => deleteMeasurement(measurement.id)}>Delete</Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state small"><p>No measurement records yet.</p></div>}
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>{specialDateForm.id ? "Edit Special Date" : "Add Special Date"}</h3>
          <form onSubmit={saveSpecialDate}>
            <label className="field"><span>Title</span><input value={specialDateForm.title} onChange={(e) => updateSpecialDateField("title", e.target.value)} placeholder="Spouse birthday, child birthday..." required /></label>
            <div className="two-grid">
              <label className="field"><span>Date</span><input type="date" value={specialDateForm.date} onChange={(e) => updateSpecialDateField("date", e.target.value)} required /></label>
              <label className="field">
                <span>Type</span>
                <select value={specialDateForm.type} onChange={(e) => updateSpecialDateField("type", e.target.value as SpecialDateType)}>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="special">Special Date</option>
                </select>
              </label>
            </div>
            <label className="field"><span>Notes</span><textarea value={specialDateForm.notes} onChange={(e) => updateSpecialDateField("notes", e.target.value)} placeholder="Gift idea, reminder note..." /></label>
            <div className="button-row">
              <Button type="submit">{specialDateForm.id ? "Update Date" : "Save Date"}</Button>
              {specialDateForm.id ? <Button type="button" variant="secondary" onClick={() => setSpecialDateForm(emptySpecialDateForm)}>Cancel Edit</Button> : null}
            </div>
          </form>
        </Card>

        <Card>
          <h3>Saved Special Dates</h3>
          {customerSpecialDates.length ? (
            <div className="mini-list">
              {customerSpecialDates.map((date) => (
                <div key={date.id} className="mini-list-item">
                  <div>
                    <strong>{date.title}</strong>
                    <span>{date.type} · {formatDate(date.date)}</span>
                    {date.notes ? <span>{date.notes}</span> : null}
                  </div>
                  <div className="button-row">
                    <Button variant="secondary" onClick={() => editSpecialDate(date)}>Edit</Button>
                    {canDelete ? (
                      <Button variant="danger" onClick={() => deleteSpecialDate(date.id)}>Delete</Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state small"><p>No extra special dates yet.</p></div>}
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>Invoice History</h3>
          {customerInvoices.length ? (
            <div className="mini-list">
              {customerInvoices.map((invoice) => (
                <div key={invoice.id} className="mini-list-item">
                  <div><strong>{invoice.invoiceNumber}</strong><span>{formatDate(invoice.issueDate)} · {invoice.status.replace("_", " ")}</span></div>
                  <strong>{formatMoney(invoice.grandTotal, invoice.currency)}</strong>
                </div>
              ))}
            </div>
          ) : <div className="empty-state small"><p>No invoices yet for this customer.</p></div>}
        </Card>

        <Card>
          <h3>Revenue History</h3>
          {customerSales.length ? (
            <div className="mini-list">
              {customerSales.map((sale) => (
                <div key={sale.id} className="mini-list-item">
                  <div><strong>{sale.saleNumber}</strong><span>{formatDate(sale.saleDate)} · {sale.source} · {sale.status.replace("_", " ")}</span></div>
                  <strong>{formatMoney(sale.grandTotal, sale.currency)}</strong>
                </div>
              ))}
            </div>
          ) : <div className="empty-state small"><p>No sales yet for this customer.</p></div>}
        </Card>
      </div>
    </div>
  );
}
