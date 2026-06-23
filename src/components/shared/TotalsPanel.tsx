import { formatMoney } from "../../lib/money";

type TotalsPanelProps = {
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  deliveryFee: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
};

export function TotalsPanel({
  currency,
  subtotal,
  discountTotal,
  taxTotal,
  deliveryFee,
  grandTotal,
  amountPaid,
  balanceDue,
}: TotalsPanelProps) {
  return (
    <div className="totals-panel">
      <div>
        <span>Subtotal</span>
        <strong>{formatMoney(subtotal, currency)}</strong>
      </div>
      <div>
        <span>Discount</span>
        <strong>{formatMoney(discountTotal, currency)}</strong>
      </div>
      <div>
        <span>Tax</span>
        <strong>{formatMoney(taxTotal, currency)}</strong>
      </div>
      <div>
        <span>Delivery / Extra Fee</span>
        <strong>{formatMoney(deliveryFee, currency)}</strong>
      </div>
      <div className="grand">
        <span>Total</span>
        <strong>{formatMoney(grandTotal, currency)}</strong>
      </div>
      <div>
        <span>Amount Paid</span>
        <strong>{formatMoney(amountPaid, currency)}</strong>
      </div>
      <div className="balance">
        <span>Balance Due</span>
        <strong>{formatMoney(balanceDue, currency)}</strong>
      </div>
    </div>
  );
}
