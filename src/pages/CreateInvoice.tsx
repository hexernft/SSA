import type { BusinessSettings, Customer, InvoiceFormState, Product } from "../types";
import { InvoiceForm } from "../components/invoices/InvoiceForm";

type CreateInvoiceProps = {
  settings: BusinessSettings | null;
  customers: Customer[];
  products: Product[];
  onSave: (form: InvoiceFormState) => Promise<void>;
};

export function CreateInvoice({ settings, customers, products, onSave }: CreateInvoiceProps) {
  return (
    <InvoiceForm
      settings={settings}
      customers={customers}
      products={products}
      onSave={onSave}
    />
  );
}
