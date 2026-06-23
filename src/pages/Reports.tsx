import { useMemo, useState } from "react";
import type { Customer, Invoice, Order, Receipt, Sale } from "../types";
import { formatMoney } from "../lib/money";
import { downloadCsv } from "../lib/csv";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type ReportsProps = {
  customers: Customer[];
  invoices: Invoice[];
  sales: Sale[];
  orders: Order[];
  receipts: Receipt[];
};

function inRange(dateValue: string, start: string, end: string) {
  if (!dateValue) return false;
  if (start && dateValue < start) return false;
  if (end && dateValue > end) return false;
  return true;
}

export function Reports({ customers, invoices, sales, orders, receipts }: ReportsProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredSales = useMemo(
    () => sales.filter((sale) => inRange(sale.saleDate, startDate, endDate)),
    [sales, startDate, endDate]
  );

  const filteredInvoices = useMemo(
    () => invoices.filter((invoice) => inRange(invoice.issueDate, startDate, endDate)),
    [invoices, startDate, endDate]
  );

  const filteredOrders = useMemo(
    () => orders.filter((order) => inRange(order.orderDate, startDate, endDate)),
    [orders, startDate, endDate]
  );

  const filteredReceipts = useMemo(
    () => receipts.filter((receipt) => inRange(receipt.paymentDate, startDate, endDate)),
    [receipts, startDate, endDate]
  );

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const totalPaid = filteredSales.reduce((sum, sale) => sum + sale.amountPaid, 0);
  const totalOutstanding = filteredSales.reduce((sum, sale) => sum + sale.balanceDue, 0);
  const receiptTotal = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const orderValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const orderBalance = filteredOrders.reduce((sum, order) => sum + order.balanceDue, 0);

  const paymentMethodRows = useMemo(() => {
    const result = new Map<string, number>();

    filteredSales.forEach((sale) => {
      result.set(sale.paymentMethod, (result.get(sale.paymentMethod) || 0) + sale.amountPaid);
    });

    filteredReceipts.forEach((receipt) => {
      result.set(receipt.method, (result.get(receipt.method) || 0) + receipt.amount);
    });

    return Array.from(result.entries()).map(([method, amount]) => ({ method, amount }));
  }, [filteredSales, filteredReceipts]);

  const topCustomers = useMemo(() => {
    return customers
      .map((customer) => {
        const customerSales = filteredSales.filter((sale) => sale.customerId === customer.id || sale.customerPhone === customer.phone);
        const total = customerSales.reduce((sum, sale) => sum + sale.grandTotal, 0);

        return {
          customer: customer.name,
          phone: customer.phone,
          total,
          count: customerSales.length,
        };
      })
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [customers, filteredSales]);

  function exportReport() {
    downloadCsv(
      `sleek-stitch-report-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { metric: "Total Revenue", value: totalSales },
        { metric: "Total Paid", value: totalPaid },
        { metric: "Outstanding Revenue Balance", value: totalOutstanding },
        { metric: "Receipt Total", value: receiptTotal },
        { metric: "Order Value", value: orderValue },
        { metric: "Order Balance", value: orderBalance },
        { metric: "Invoices", value: filteredInvoices.length },
        { metric: "Orders", value: filteredOrders.length },
        { metric: "Receipts", value: filteredReceipts.length },
      ]
    );
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Reports"
          subtitle="Review sales, payments, orders, receipts, and customer value."
        />
        <Button variant="secondary" onClick={exportReport}>Export Summary CSV</Button>
      </div>

      <Card>
        <div className="two-grid">
          <label className="field">
            <span>Start Date</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>

          <label className="field">
            <span>End Date</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>
      </Card>

      <div className="stats-grid mt">
        <Card><span className="stat-label">Revenue Value</span><strong className="stat-value">{formatMoney(totalSales, "₦")}</strong></Card>
        <Card><span className="stat-label">Paid Revenue</span><strong className="stat-value">{formatMoney(totalPaid, "₦")}</strong></Card>
        <Card><span className="stat-label">Revenue Balance</span><strong className="stat-value">{formatMoney(totalOutstanding, "₦")}</strong></Card>
        <Card><span className="stat-label">Receipt Total</span><strong className="stat-value">{formatMoney(receiptTotal, "₦")}</strong></Card>
        <Card><span className="stat-label">Order Value</span><strong className="stat-value">{formatMoney(orderValue, "₦")}</strong></Card>
        <Card><span className="stat-label">Order Balance</span><strong className="stat-value">{formatMoney(orderBalance, "₦")}</strong></Card>
        <Card><span className="stat-label">Invoices</span><strong className="stat-value">{filteredInvoices.length}</strong></Card>
        <Card><span className="stat-label">Orders</span><strong className="stat-value">{filteredOrders.length}</strong></Card>
      </div>

      <div className="form-grid mt">
        <Card>
          <h3>Payment by Method</h3>

          {paymentMethodRows.length ? (
            <div className="mini-list">
              {paymentMethodRows.map((row) => (
                <div key={row.method} className="mini-list-item">
                  <strong>{row.method}</strong>
                  <strong>{formatMoney(row.amount, "₦")}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state small"><p>No payment records in this period.</p></div>
          )}
        </Card>

        <Card>
          <h3>Top Customers</h3>

          {topCustomers.length ? (
            <div className="mini-list">
              {topCustomers.map((row) => (
                <div key={row.customer} className="mini-list-item">
                  <div>
                    <strong>{row.customer}</strong>
                    <span>{row.phone || "No phone"} · {row.count} sale(s)</span>
                  </div>
                  <strong>{formatMoney(row.total, "₦")}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state small"><p>No customer sales in this period.</p></div>
          )}
        </Card>
      </div>
    </div>
  );
}
