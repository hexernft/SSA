import { useMemo, useState } from "react";
import type { Product } from "../types";
import { db } from "../db/database";
import { createId } from "../lib/ids";
import { formatMoney } from "../lib/money";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type ProductsProps = {
  products: Product[];
  onChanged: () => Promise<void>;
};

type ProductForm = {
  id?: string;
  name: string;
  category: string;
  description: string;
  defaultPrice: number | "";
  taxable: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  category: "",
  description: "",
  defaultPrice: 0,
  taxable: false,
};

export function Products({ products, onChanged }: ProductsProps) {
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.category, product.description]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [products, search]);

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editProduct(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      defaultPrice: product.defaultPrice,
      taxable: product.taxable,
    });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();

    if (form.id) {
      await db.products.update(form.id, {
        name: form.name,
        category: form.category,
        description: form.description,
        defaultPrice: Number(form.defaultPrice || 0),
        taxable: form.taxable,
        updatedAt: now,
      });
    } else {
      await db.products.add({
        id: createId("product"),
        name: form.name,
        category: form.category,
        description: form.description,
        defaultPrice: Number(form.defaultPrice || 0),
        taxable: form.taxable,
        createdAt: now,
        updatedAt: now,
      });
    }

    setForm(emptyForm);
    await onChanged();
  }

  async function deleteProduct(productId: string) {
    const confirmed = window.confirm("Delete this product/service from this device?");
    if (!confirmed) return;

    await db.products.delete(productId);
    await onChanged();

    if (form.id === productId) {
      setForm(emptyForm);
    }
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Products / Services"
          subtitle="Save common outfits, services, packages, and charges for faster invoices and sales."
        />
      </div>

      <div className="form-grid">
        <Card>
          <h3>{form.id ? "Edit Product / Service" : "Add Product / Service"}</h3>

          <form onSubmit={saveProduct}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>

            <div className="two-grid">
              <label className="field">
                <span>Category</span>
                <input
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Default Price</span>
                <input
                  type="number"
                  value={form.defaultPrice}
                  onChange={(event) => updateField("defaultPrice", event.target.value === "" ? "" : Number(event.target.value))}
                />
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.taxable}
                onChange={(event) => updateField("taxable", event.target.checked)}
              />
              <span>Taxable by default</span>
            </label>

            <div className="button-row">
              <Button type="submit">{form.id ? "Update Item" : "Save Item"}</Button>
              {form.id ? (
                <Button type="button" variant="secondary" onClick={() => setForm(emptyForm)}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </Card>

        <Card>
          <h3>Search Items</h3>

          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <p className="muted">
            Saved products/services can be selected directly inside invoices and sales.
          </p>
        </Card>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Default Price</th>
              <th>Taxable</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length ? (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.category || "—"}</td>
                  <td>{product.description || "—"}</td>
                  <td>{formatMoney(product.defaultPrice, "₦")}</td>
                  <td>{product.taxable ? "Yes" : "No"}</td>
                  <td>
                    <div className="button-row">
                      <Button variant="secondary" onClick={() => editProduct(product)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => deleteProduct(product.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state small">
                    <p>No products or services found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
