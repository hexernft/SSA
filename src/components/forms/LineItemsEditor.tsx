import { Plus, Trash2 } from "lucide-react";
import type { DraftItem, Product } from "../../types";
import { formatMoney } from "../../lib/money";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type CalculatedItem = DraftItem & { lineTotal: number };

type LineItemsEditorProps = {
  currency: string;
  items: CalculatedItem[];
  products: Product[];
  defaultTaxRate: number;
  showProductDetails?: boolean;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (
    itemId: string,
    key: "productId" | "description" | "productDetails" | "quantity" | "unitPrice" | "discount" | "taxRate",
    value: string | number
  ) => void;
};

export function LineItemsEditor({
  currency,
  items,
  products,
  defaultTaxRate,
  showProductDetails = false,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: LineItemsEditorProps) {
  function selectProduct(itemId: string, productId: string) {
    const product = products.find((item) => item.id === productId);

    onUpdateItem(itemId, "productId", productId);

    if (!product) return;

    onUpdateItem(itemId, "description", product.name);
    onUpdateItem(itemId, "productDetails", product.description || "");
    onUpdateItem(itemId, "unitPrice", product.defaultPrice);
    onUpdateItem(itemId, "taxRate", product.taxable ? defaultTaxRate : 0);
  }

  return (
    <Card>
      <div className="section-head">
        <h3>Items</h3>
        <Button type="button" variant="secondary" onClick={onAddItem}>
          <Plus size={16} />
          Add Item
        </Button>
      </div>

      <div className="responsive-table">
        <table className="item-table">
          <thead>
            <tr>
              <th>Saved Item</th>
              <th>Description</th>
              {showProductDetails ? <th>Product Details</th> : null}
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Tax %</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <select
                    value={item.productId || ""}
                    onChange={(event) => selectProduct(item.id, event.target.value)}
                  >
                    <option value="">Custom item</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </td>

                <td>
                  <input
                    value={item.description}
                    onChange={(event) => onUpdateItem(item.id, "description", event.target.value)}
                    required
                  />
                </td>

                {showProductDetails ? (
                  <td>
                    <textarea
                      value={item.productDetails || ""}
                      onChange={(event) => onUpdateItem(item.id, "productDetails", event.target.value)}
                    />
                  </td>
                ) : null}

                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(event) => onUpdateItem(item.id, "quantity", event.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(event) => onUpdateItem(item.id, "unitPrice", event.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.discount}
                    onChange={(event) => onUpdateItem(item.id, "discount", event.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    min="0"
                    value={item.taxRate}
                    onChange={(event) => onUpdateItem(item.id, "taxRate", event.target.value)}
                  />
                </td>

                <td>{formatMoney(item.lineTotal, currency)}</td>

                <td>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
