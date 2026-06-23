import type { Sale } from "../../types";
import { formatDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
import { Button } from "../ui/Button";

type SaleListProps = {
  sales: Sale[];
  onOpen: (saleId: string) => void;
};

export function SaleList({ sales, onOpen }: SaleListProps) {
  if (!sales.length) {
    return (
      <div className="empty-state">
        <h3>No sales records yet</h3>
        <p>Add a direct sale or record payment on an invoice to create sales records.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Sale</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Source</th>
            <th>Status</th>
            <th>Method</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Balance</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.saleNumber}</td>
              <td>{sale.customerName || "Walk-in customer"}</td>
              <td>{formatDate(sale.saleDate)}</td>
              <td>{sale.source}</td>
              <td>
                <span className={`status ${sale.status}`}>{sale.status.replace("_", " ")}</span>
              </td>
              <td>{sale.paymentMethod}</td>
              <td>{formatMoney(sale.grandTotal, sale.currency)}</td>
              <td>{formatMoney(sale.amountPaid, sale.currency)}</td>
              <td>{formatMoney(sale.balanceDue, sale.currency)}</td>
              <td>
                <Button variant="secondary" onClick={() => onOpen(sale.id)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
