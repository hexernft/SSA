import type { Invoice } from "../../types";
import { formatDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
import { Button } from "../ui/Button";

type InvoiceListProps = {
  invoices: Invoice[];
  onOpen: (invoiceId: string) => void;
};

export function InvoiceList({ invoices, onOpen }: InvoiceListProps) {
  if (!invoices.length) {
    return (
      <div className="empty-state">
        <h3>No invoices yet</h3>
        <p>Create your first Sleek Stitch Atelier invoice to start tracking records offline.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Balance</th>
            <th>Sale Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.customerName || "—"}</td>
              <td>{formatDate(invoice.issueDate)}</td>
              <td>
                <span className={`status ${invoice.status}`}>{invoice.status.replace("_", " ")}</span>
              </td>
              <td>{formatMoney(invoice.grandTotal, invoice.currency)}</td>
              <td>{formatMoney(invoice.balanceDue, invoice.currency)}</td>
              <td>{invoice.linkedSaleId ? "Recorded" : "Not recorded"}</td>
              <td>
                <Button variant="secondary" onClick={() => onOpen(invoice.id)}>
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
