import { useMemo, useState } from "react";
import type { Invoice, InvoiceStatus } from "../types";
import { InvoiceList } from "../components/invoices/InvoiceList";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";
import { downloadCsv } from "../lib/csv";

type InvoicesProps = {
  invoices: Invoice[];
  onOpenInvoice: (invoiceId: string) => void;
  onCreateInvoice: () => void;
};

export function Invoices({ invoices, onOpenInvoice, onCreateInvoice }: InvoicesProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");

  const filteredInvoices = useMemo(() => {
    const term = search.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const matchesStatus = status === "all" || invoice.status === status;
      const matchesSearch =
        !term ||
        [
          invoice.invoiceNumber,
          invoice.customerName,
          invoice.customerPhone,
          invoice.customerEmail,
          invoice.customerAddress,
          invoice.notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, status]);

  function exportInvoices() {
    downloadCsv(
      `sleek-stitch-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredInvoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        grandTotal: invoice.grandTotal,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
      }))
    );
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Invoices"
          subtitle="Formal invoices you can print, save as PDF, search, filter, and export."
        />
        <div className="button-row">
          <Button variant="secondary" onClick={exportInvoices}>Export CSV</Button>
          <Button onClick={onCreateInvoice}>Create Invoice</Button>
        </div>
      </div>

      <Card className="mb">
        <div className="two-grid">
          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice, customer, phone..."
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus | "all")}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="part_paid">Part Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
      </Card>

      <InvoiceList invoices={filteredInvoices} onOpen={onOpenInvoice} />
    </div>
  );
}
