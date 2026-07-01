import type { BusinessSettings, Invoice, InvoiceItem } from "../../types";
import { formatDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
import { TotalsPanel } from "../shared/TotalsPanel";
import { PrintBrand } from "../shared/PrintBrand";
import watermark from "../../assets/logo-mark-dark.png";

type InvoicePreviewProps = {
  settings: BusinessSettings | null;
  invoice: Invoice;
  items: InvoiceItem[];
};

export function InvoicePreview({ settings, invoice, items }: InvoicePreviewProps) {
  return (
    <div className="print-surface">
      <div className="invoice-preview has-watermark">
        <img src={watermark} alt="" className="document-watermark" aria-hidden="true" />

        <div className="invoice-preview-header">
          <div>
            <p className="eyebrow">Invoice</p>
            <h1>{invoice.invoiceNumber}</h1>
            <span className={`status ${invoice.status}`}>{invoice.status.replace("_", " ")}</span>
          </div>
          <PrintBrand settings={settings} />
        </div>

        <div className="invoice-meta-grid">
          <div>
            <span>Bill To</span>
            <strong>{invoice.customerName || "Customer name"}</strong>
            <p>{invoice.customerAddress}</p>
            <p>{invoice.customerPhone}</p>
            <p>{invoice.customerEmail}</p>
          </div>

          <div>
            <span>Issue Date</span>
            <strong>{formatDate(invoice.issueDate)}</strong>
          </div>

          <div>
            <span>Due Date</span>
            <strong>{formatDate(invoice.dueDate)}</strong>
          </div>
        </div>

        <table className="preview-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.description}</strong>
                  {item.productDetails ? <span className="table-subtext">{item.productDetails}</span> : null}
                </td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unitPrice, invoice.currency)}</td>
                <td>{formatMoney(item.discount, invoice.currency)}</td>
                <td>{item.taxRate}%</td>
                <td>{formatMoney(item.lineTotal, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="preview-bottom">
          <div className="payment-box">
            <h3>Payment Details</h3>
            <p>{settings?.bankName}</p>
            <p>{settings?.accountName}</p>
            <p>{settings?.accountNumber}</p>

            {invoice.notes ? (
              <>
                <h3>Notes</h3>
                <p>{invoice.notes}</p>
              </>
            ) : null}

            {invoice.terms ? (
              <>
                <h3>Terms</h3>
                <p>{invoice.terms}</p>
              </>
            ) : null}
          </div>

          <TotalsPanel
            currency={invoice.currency}
            subtotal={invoice.subtotal}
            discountTotal={invoice.discountTotal}
            taxTotal={invoice.taxTotal}
            deliveryFee={invoice.deliveryFee}
            grandTotal={invoice.grandTotal}
            amountPaid={invoice.amountPaid}
            balanceDue={invoice.balanceDue}
          />
        </div>
      </div>
    </div>
  );
}
