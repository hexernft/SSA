import type { BusinessSettings, Receipt } from "../../types";
import { formatDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
import { PrintBrand } from "../shared/PrintBrand";
import watermark from "../../assets/logo-mark-dark.png";

type ReceiptPreviewProps = {
  settings: BusinessSettings | null;
  receipt: Receipt;
};

export function ReceiptPreview({ settings, receipt }: ReceiptPreviewProps) {
  return (
    <div className="print-surface">
      <div className="invoice-preview has-watermark">
        <img src={watermark} alt="" className="document-watermark" aria-hidden="true" />

        <div className="invoice-preview-header">
          <div>
            <p className="eyebrow">Payment Receipt</p>
            <h1>{receipt.receiptNumber}</h1>
            <span className="status paid">Received</span>
          </div>

          <PrintBrand settings={settings} />
        </div>

        <div className="invoice-meta-grid">
          <div>
            <span>Received From</span>
            <strong>{receipt.customerName || "Customer"}</strong>
          </div>

          <div>
            <span>Payment Date</span>
            <strong>{formatDate(receipt.paymentDate)}</strong>
          </div>

          <div>
            <span>Payment Method</span>
            <strong>{receipt.method}</strong>
            <p>{receipt.reference || "No reference"}</p>
          </div>
        </div>

        <div className="receipt-amount-box">
          <span>Amount Received</span>
          <strong>{formatMoney(receipt.amount, settings?.currency || "₦")}</strong>
        </div>

        <div className="form-grid mt">
          <div className="payment-box">
            <h3>Description</h3>
            <p>{receipt.description || "Payment received."}</p>

            {receipt.notes ? (
              <>
                <h3>Notes</h3>
                <p>{receipt.notes}</p>
              </>
            ) : null}
          </div>

          <div className="payment-box">
            <h3>Linked Record</h3>
            <p>{receipt.linkedInvoiceId ? "Linked to invoice" : "No linked invoice"}</p>
            <p>{receipt.linkedSaleId ? "Linked to sale" : "No linked sale"}</p>
            <p>{receipt.linkedOrderId ? "Linked to order/job" : "No linked order"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
