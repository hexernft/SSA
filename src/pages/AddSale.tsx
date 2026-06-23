import type { BusinessSettings, Customer, Product, SaleFormState } from "../types";
import { SaleForm } from "../components/sales/SaleForm";

type AddSaleProps = {
  settings: BusinessSettings | null;
  customers: Customer[];
  products: Product[];
  onSave: (form: SaleFormState) => Promise<void>;
};

export function AddSale({ settings, customers, products, onSave }: AddSaleProps) {
  return (
    <SaleForm
      settings={settings}
      customers={customers}
      products={products}
      onSave={onSave}
    />
  );
}
