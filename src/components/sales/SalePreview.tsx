import type { BusinessSettings, Sale, SaleItem } from "../../types";
import { formatDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
import { TotalsPanel } from "../shared/TotalsPanel";
import { PrintBrand } from "../shared/PrintBrand";
import watermark from "../../assets/logo-mark-dark.png";

type SalePreviewProps = {
  settings: BusinessSettings | null;
  sale: Sale;
  items: SaleItem[];
};

export function SalePreview({ settings, sale, items }: SalePreviewProps) {
  return (
    <div className="print-surface">
      <div className="invoice-preview has-watermark">
        <img src={watermark} alt="" className="document-watermark" aria-hidden="true" />

        <div className="invoice-preview-header">
          <div>
            <p className="eyebrow">Sales Record</p>
            <h1>{sale.saleNumber}</h1>
            <span className={`status ${sale.status}`}>{sale.status.replace("_", " ")}</span>
          </div>

          <PrintBrand settings={settings} />
        </div>

        <div className="invoice-meta-grid">
          <div>
            <span>Customer</span>
            <strong>{sale.customerName || "Walk-in customer"}</strong>
            <p>{sale.customerAddress}</p>
            <p>{sale.customerPhone}</p>
            <p>{sale.customerEmail}</p>
          </div>

          <div>
            <span>Sale Date</span>
            <strong>{formatDate(sale.saleDate)}</strong>
          </div>

          <div>
            <span>Source</span>
            <strong>{sale.source}</strong>
            <p>{sale.paymentMethod}</p>
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
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unitPrice, sale.currency)}</td>
                <td>{formatMoney(item.discount, sale.currency)}</td>
                <td>{item.taxRate}%</td>
                <td>{formatMoney(item.lineTotal, sale.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="preview-bottom">
          <div className="payment-box">
            <h3>Record Details</h3>
            <p>Source: {sale.source}</p>
            <p>Payment Method: {sale.paymentMethod}</p>
            {sale.invoiceId ? <p>Linked to invoice record</p> : null}

            {sale.note ? (
              <>
                <h3>Note</h3>
                <p>{sale.note}</p>
              </>
            ) : null}
          </div>

          <TotalsPanel
            currency={sale.currency}
            subtotal={sale.subtotal}
            discountTotal={sale.discountTotal}
            taxTotal={sale.taxTotal}
            deliveryFee={sale.deliveryFee}
            grandTotal={sale.grandTotal}
            amountPaid={sale.amountPaid}
            balanceDue={sale.balanceDue}
          />
        </div>
      </div>
    </div>
  );
}
