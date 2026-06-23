import type { CelebrationReminder, Invoice, OrderReminder, Sale } from "../types";
import { isSameMonth, isToday } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { formatOrderDueText } from "../lib/orderReminders";
import { formatReminderTime } from "../lib/reminders";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BrandHeader } from "../components/shared/BrandHeader";
import { InstallAppCard } from "../components/shared/InstallAppCard";

type DashboardProps = {
  invoices: Invoice[];
  sales: Sale[];
  celebrations: CelebrationReminder[];
  orderReminders: OrderReminder[];
  onCreateInvoice: () => void;
  onOpenOrders: () => void;
  onOpenCustomer: (customerId: string) => void;
};

export function Dashboard({
  invoices,
  sales,
  celebrations,
  orderReminders,
  onOpenOrders,
  onOpenCustomer,
}: DashboardProps) {
  const currency = sales[0]?.currency || invoices[0]?.currency || "₦";

  const totalSales = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const revenueReceived = sales.reduce((sum, sale) => sum + sale.amountPaid, 0);
  const outstandingBalance = sales.reduce((sum, sale) => sum + sale.balanceDue, 0);
  const todaySales = sales.filter((sale) => isToday(sale.saleDate)).reduce((sum, sale) => sum + sale.grandTotal, 0);
  const monthSales = sales.filter((sale) => isSameMonth(sale.saleDate)).reduce((sum, sale) => sum + sale.grandTotal, 0);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid").length;
  const unpaidInvoices = invoices.filter((invoice) =>
    ["sent", "part_paid", "overdue"].includes(invoice.status)
  ).length;

  const recentSales = sales.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Command Center"
          subtitle="A clear view of invoices, cash received, balances, jobs due soon, and customer moments that need attention."
        />
      </div>

      <InstallAppCard />

      <div className="stats-grid mt">
        <Card className="metric-card metric-card-primary">
          <span className="stat-label">Revenue Booked</span>
          <strong className="stat-value">{formatMoney(totalSales, currency)}</strong>
          <span className="stat-caption">Paid invoice and revenue value</span>
        </Card>
        <Card className="metric-card">
          <span className="stat-label">Cash Received</span>
          <strong className="stat-value">{formatMoney(revenueReceived, currency)}</strong>
          <span className="stat-caption">Payments already collected</span>
        </Card>
        <Card className="metric-card metric-card-alert">
          <span className="stat-label">Balance Due</span>
          <strong className="stat-value">{formatMoney(outstandingBalance, currency)}</strong>
          <span className="stat-caption">Follow-up opportunity</span>
        </Card>
        <Card className="metric-card">
          <span className="stat-label">Today</span>
          <strong className="stat-value">{formatMoney(todaySales, currency)}</strong>
          <span className="stat-caption">Revenue logged today</span>
        </Card>
        <Card className="metric-card">
          <span className="stat-label">This Month</span>
          <strong className="stat-value">{formatMoney(monthSales, currency)}</strong>
          <span className="stat-caption">Month-to-date revenue</span>
        </Card>
        <Card className="metric-card">
          <span className="stat-label">Invoices</span>
          <strong className="stat-value">{invoices.length}</strong>
          <span className="stat-caption">Total invoice records</span>
        </Card>
        <Card className="metric-card">
          <span className="stat-label">Paid</span>
          <strong className="stat-value">{paidInvoices}</strong>
          <span className="stat-caption">Invoices fully settled</span>
        </Card>
        <Card className="metric-card metric-card-alert">
          <span className="stat-label">Needs Payment</span>
          <strong className="stat-value">{unpaidInvoices}</strong>
          <span className="stat-caption">Sent, part-paid, or overdue</span>
        </Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <div className="section-head">
            <div>
              <span className="section-kicker">Production</span>
              <h3>Jobs Needing Attention</h3>
            </div>
            <Button variant="secondary" onClick={onOpenOrders}>View Jobs</Button>
          </div>

          {orderReminders.length ? (
            <div className="reminder-list">
              {orderReminders.slice(0, 8).map((order) => (
                <button key={order.id} type="button" className="reminder-item" onClick={() => onOpenCustomer(order.customerId)}>
                  <span className={`reminder-badge ${order.daysUntil < 0 ? "birthday" : "special"}`}>
                    {formatOrderDueText(order.daysUntil)}
                  </span>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.customerName} · {order.outfitType} · {order.status.replace("_", " ")}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state small">
              <p>No active orders due soon.</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="section-head">
            <div>
              <span className="section-kicker">Client Care</span>
              <h3>Customer Moments</h3>
            </div>
            <span className="soft-pill">Next 14 days</span>
          </div>

          {celebrations.length ? (
            <div className="reminder-list">
              {celebrations.slice(0, 8).map((reminder) => (
                <button key={reminder.id} type="button" className="reminder-item" onClick={() => onOpenCustomer(reminder.customerId)}>
                  <span className={`reminder-badge ${reminder.type}`}>{reminder.type}</span>
                  <div>
                    <strong>{reminder.customerName}</strong>
                    <span>{reminder.title} · {formatReminderTime(reminder.daysUntil)}{reminder.customerPhone ? ` · ${reminder.customerPhone}` : ""}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state small">
              <p>No birthdays, anniversaries, or special dates in the next 14 days.</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt">
        <div className="section-head">
          <div>
            <span className="section-kicker">Latest Activity</span>
            <h3>Recent Revenue Activity</h3>
          </div>
        </div>

        {recentSales.length ? (
          <div className="mini-list">
            {recentSales.map((sale) => (
              <div key={sale.id} className="mini-list-item">
                <div>
                  <strong>{sale.saleNumber}</strong>
                  <span>{sale.customerName || "Walk-in customer"} · {sale.source}</span>
                </div>
                <div>
                  <strong>{formatMoney(sale.grandTotal, sale.currency)}</strong>
                  <span className={`status ${sale.status}`}>{sale.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state small"><p>No revenue records yet. Create an invoice and record payment to see activity here.</p></div>
        )}
      </Card>
    </div>
  );
}

