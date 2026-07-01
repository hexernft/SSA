import { useMemo, useState } from "react";
import type { Sale, SaleStatus } from "../types";
import { SaleList } from "../components/sales/SaleList";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";
import { downloadCsv } from "../lib/csv";

type SalesProps = {
  sales: Sale[];
  onOpenSale: (saleId: string) => void;
  onAddSale: () => void;
};

export function Sales({ sales, onOpenSale, onAddSale }: SalesProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SaleStatus | "all">("all");

  const filteredSales = useMemo(() => {
    const term = search.toLowerCase().trim();

    return sales.filter((sale) => {
      const matchesStatus = status === "all" || sale.status === status;
      const matchesSearch =
        !term ||
        [
          sale.saleNumber,
          sale.customerName,
          sale.customerPhone,
          sale.paymentMethod,
          sale.note,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [sales, search, status]);

  function exportSales() {
    downloadCsv(
      `sleek-stitch-sales-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredSales.map((sale) => ({
        saleNumber: sale.saleNumber,
        customerName: sale.customerName,
        saleDate: sale.saleDate,
        source: sale.source,
        status: sale.status,
        paymentMethod: sale.paymentMethod,
        grandTotal: sale.grandTotal,
        amountPaid: sale.amountPaid,
        balanceDue: sale.balanceDue,
      }))
    );
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Sales"
          subtitle="Direct sales and invoice-linked sales are tracked here."
        />
        <div className="button-row">
          <Button variant="secondary" onClick={exportSales}>Export CSV</Button>
          <Button onClick={onAddSale}>Add Sale</Button>
        </div>
      </div>

      <Card className="mb">
        <div className="two-grid">
          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as SaleStatus | "all")}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="part_paid">Part Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
      </Card>

      <SaleList sales={filteredSales} onOpen={onOpenSale} />
    </div>
  );
}
