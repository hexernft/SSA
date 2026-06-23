import type { Customer, Invoice, Measurement, Order, Sale } from "../types";
import { formatDate } from "./dates";
import { formatMoney } from "./money";
import logoDark from "../assets/logo-dark.png";
import watermark from "../assets/logo-mark-dark.png";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openPrintWindow(title: string, body: string) {
  const win = window.open("", "_blank", "width=960,height=1100");

  if (!win) {
    alert("Please allow pop-ups so the print document can open.");
    return;
  }

  win.document.open();
  win.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        --ink: #17120c;
        --muted: #6f665f;
        --line: #e2d6c5;
        --accent: #8a643d;
        --paper: #ffffff;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        background: #f4efe7;
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .sheet {
        width: min(960px, calc(100vw - 32px));
        min-height: 100vh;
        margin: 16px auto;
        background: var(--paper);
        padding: 38px;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--line);
      }

      .watermark {
        position: absolute;
        inset: 0;
        margin: auto;
        width: 46%;
        opacity: 0.045;
        z-index: 0;
        pointer-events: none;
      }

      .content {
        position: relative;
        z-index: 1;
      }

      .top {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 1px solid var(--line);
        padding-bottom: 24px;
        margin-bottom: 24px;
      }

      .brand {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .brand img {
        width: 116px;
        height: auto;
      }

      .brand h2 {
        margin: 0 0 8px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 28px;
        font-weight: 500;
        letter-spacing: -0.04em;
      }

      .doc-title {
        text-align: right;
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 12px;
        color: var(--accent);
        font-weight: 800;
        margin: 0 0 8px;
      }

      h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 52px;
        font-weight: 500;
        letter-spacing: -0.07em;
        line-height: 0.95;
      }

      h3 {
        margin: 0 0 12px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 24px;
        font-weight: 500;
        letter-spacing: -0.04em;
      }

      p {
        margin: 4px 0;
        color: var(--muted);
        line-height: 1.55;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .box {
        border: 1px solid var(--line);
        padding: 14px;
        background: rgba(244, 239, 231, 0.35);
      }

      .label {
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 11px;
        color: var(--accent);
        font-weight: 800;
        margin-bottom: 5px;
      }

      .value {
        display: block;
        font-weight: 800;
        color: var(--ink);
        line-height: 1.4;
      }

      .section {
        margin-top: 24px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid var(--line);
      }

      th {
        text-align: left;
        background: #f5efe8;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        padding: 12px;
      }

      td {
        border-top: 1px solid var(--line);
        padding: 12px;
        vertical-align: top;
      }

      .total-box {
        border: 1px solid var(--line);
        padding: 18px;
        background: #fffaf2;
      }

      .total-box strong {
        display: block;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 32px;
        font-weight: 500;
        letter-spacing: -0.05em;
      }

      .signatures {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 28px;
        margin-top: 52px;
      }

      .signature-line {
        border-top: 1px solid var(--ink);
        padding-top: 8px;
        color: var(--muted);
        font-size: 13px;
      }

      .no-print {
        width: min(960px, calc(100vw - 32px));
        margin: 16px auto 0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      button {
        border: 0;
        background: #000;
        color: #fff;
        padding: 12px 15px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      }

      @media print {
        body { background: white; }
        .no-print { display: none; }
        .sheet {
          width: auto;
          margin: 0;
          border: 0;
          min-height: auto;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="no-print">
      <button onclick="window.print()">Print / Save PDF</button>
      <button onclick="window.close()">Close</button>
    </div>
    <main class="sheet">
      <img class="watermark" src="${watermark}" alt="" />
      <div class="content">
        ${body}
      </div>
    </main>
  </body>
</html>`);
  win.document.close();
}

function header(documentType: string, title: string) {
  return `
    <div class="top">
      <div class="brand">
        <img src="${logoDark}" alt="Sleek Stitch Atelier" />
        <div>
          <h2>Sleek Stitch Atelier</h2>
          <p>Premium tailoring and atelier records</p>
        </div>
      </div>
      <div class="doc-title">
        <p class="eyebrow">${escapeHtml(documentType)}</p>
        <h1>${escapeHtml(title)}</h1>
      </div>
    </div>
  `;
}

function measurementRows(measurement: Measurement) {
  const rows = [
    ["Chest", measurement.chest],
    ["Waist", measurement.waist],
    ["Hip", measurement.hip],
    ["Shoulder", measurement.shoulder],
    ["Sleeve", measurement.sleeve],
    ["Neck", measurement.neck],
    ["Round Sleeve", measurement.roundSleeve],
    ["Top Length", measurement.topLength],
    ["Trouser Waist", measurement.trouserWaist],
    ["Trouser Length", measurement.trouserLength],
    ["Thigh", measurement.thigh],
    ["Knee", measurement.knee],
    ["Ankle", measurement.ankle],
    ["Agbada Length", measurement.agbadaLength],
    ["Cap Size", measurement.capSize],
  ];

  return rows
    .map(
      ([label, value]) => `
        <div class="box">
          <span class="label">${escapeHtml(label)}</span>
          <span class="value">${escapeHtml(value || "—")}</span>
        </div>
      `
    )
    .join("");
}

export function printMeasurementRecord(customer: Customer, measurement: Measurement) {
  openPrintWindow(
    `${customer.name} Measurement`,
    `
      ${header("Measurement Sheet", measurement.title || customer.name)}
      <div class="grid">
        <div class="box"><span class="label">Customer</span><span class="value">${escapeHtml(customer.name)}</span></div>
        <div class="box"><span class="label">Phone</span><span class="value">${escapeHtml(customer.phone || "—")}</span></div>
        <div class="box"><span class="label">Date Taken</span><span class="value">${escapeHtml(formatDate(measurement.dateTaken))}</span></div>
        <div class="box"><span class="label">Purpose</span><span class="value">${escapeHtml(measurement.title || "—")}</span></div>
      </div>

      <div class="section">
        <h3>Measurements</h3>
        <div class="grid-3">${measurementRows(measurement)}</div>
      </div>

      <div class="section">
        <h3>Notes</h3>
        <p>${escapeHtml(measurement.notes || "No notes.")}</p>
      </div>

      <div class="signatures">
        <div class="signature-line">Tailor / Staff Signature</div>
        <div class="signature-line">Customer Confirmation</div>
      </div>
    `
  );
}

export function printOrderTicket(customer: Customer, order: Order, latestMeasurement?: Measurement) {
  openPrintWindow(
    `${order.orderNumber} Job Ticket`,
    `
      ${header("Order / Job Ticket", order.orderNumber)}
      <div class="grid">
        <div class="box"><span class="label">Customer</span><span class="value">${escapeHtml(customer.name)}</span></div>
        <div class="box"><span class="label">Phone</span><span class="value">${escapeHtml(customer.phone || "—")}</span></div>
        <div class="box"><span class="label">Outfit / Job</span><span class="value">${escapeHtml(order.outfitType)}</span></div>
        <div class="box"><span class="label">Status</span><span class="value">${escapeHtml(order.status.replace("_", " "))}</span></div>
        <div class="box"><span class="label">Order Date</span><span class="value">${escapeHtml(formatDate(order.orderDate))}</span></div>
        <div class="box"><span class="label">Due Date</span><span class="value">${escapeHtml(order.dueDate ? formatDate(order.dueDate) : "—")}</span></div>
      </div>

      <div class="section grid">
        <div class="total-box">
          <span class="label">Total Amount</span>
          <strong>${escapeHtml(formatMoney(order.totalAmount, "₦"))}</strong>
        </div>
        <div class="total-box">
          <span class="label">Balance Due</span>
          <strong>${escapeHtml(formatMoney(order.balanceDue, "₦"))}</strong>
          <p>Deposit: ${escapeHtml(formatMoney(order.depositPaid, "₦"))}</p>
        </div>
      </div>

      <div class="section">
        <h3>Job Notes</h3>
        <p>${escapeHtml(order.notes || "No notes.")}</p>
      </div>

      ${
        latestMeasurement
          ? `
            <div class="section">
              <h3>Latest Measurement Summary</h3>
              <p>${escapeHtml(latestMeasurement.title)} · ${escapeHtml(formatDate(latestMeasurement.dateTaken))}</p>
              <div class="grid-3">${measurementRows(latestMeasurement)}</div>
            </div>
          `
          : `
            <div class="section">
              <h3>Measurement Summary</h3>
              <p>No measurement record attached yet.</p>
            </div>
          `
      }

      <div class="signatures">
        <div class="signature-line">Tailor / Production Signature</div>
        <div class="signature-line">Quality Check / Delivery Signature</div>
      </div>
    `
  );
}

export function printCustomerProfile(
  customer: Customer,
  measurements: Measurement[],
  orders: Order[],
  invoices: Invoice[],
  sales: Sale[]
) {
  const latestMeasurement = measurements[0];
  const totalSales = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const outstanding = sales.reduce((sum, sale) => sum + sale.balanceDue, 0);

  openPrintWindow(
    `${customer.name} Profile`,
    `
      ${header("Customer Profile", customer.name)}
      <div class="grid">
        <div class="box"><span class="label">Phone</span><span class="value">${escapeHtml(customer.phone || "—")}</span></div>
        <div class="box"><span class="label">Email</span><span class="value">${escapeHtml(customer.email || "—")}</span></div>
        <div class="box"><span class="label">Address</span><span class="value">${escapeHtml(customer.address || "—")}</span></div>
        <div class="box"><span class="label">Birthday</span><span class="value">${escapeHtml(customer.birthday ? formatDate(customer.birthday) : "—")}</span></div>
        <div class="box"><span class="label">Wedding Anniversary</span><span class="value">${escapeHtml(customer.weddingAnniversary ? formatDate(customer.weddingAnniversary) : "—")}</span></div>
        <div class="box"><span class="label">Spouse</span><span class="value">${escapeHtml(customer.spouseName || "—")}</span></div>
        <div class="box"><span class="label">Preferred Style</span><span class="value">${escapeHtml(customer.preferredStyle || "—")}</span></div>
        <div class="box"><span class="label">Preferred Color</span><span class="value">${escapeHtml(customer.preferredColor || "—")}</span></div>
        <div class="box"><span class="label">Preferred Fabric</span><span class="value">${escapeHtml(customer.preferredFabric || "—")}</span></div>
        <div class="box"><span class="label">Total Sales</span><span class="value">${escapeHtml(formatMoney(totalSales, "₦"))}</span></div>
        <div class="box"><span class="label">Outstanding</span><span class="value">${escapeHtml(formatMoney(outstanding, "₦"))}</span></div>
      </div>

      <div class="section">
        <h3>Fit Notes</h3>
        <p>${escapeHtml(customer.fitNotes || "No fit notes.")}</p>
      </div>

      <div class="section">
        <h3>General Notes</h3>
        <p>${escapeHtml(customer.notes || "No notes.")}</p>
      </div>

      <div class="section">
        <h3>Latest Measurement</h3>
        ${
          latestMeasurement
            ? `<p>${escapeHtml(latestMeasurement.title)} · ${escapeHtml(formatDate(latestMeasurement.dateTaken))}</p><div class="grid-3">${measurementRows(latestMeasurement)}</div>`
            : `<p>No measurement record yet.</p>`
        }
      </div>

      <div class="section">
        <h3>Recent Orders</h3>
        ${
          orders.length
            ? `<table><thead><tr><th>Order</th><th>Outfit</th><th>Status</th><th>Due</th><th>Balance</th></tr></thead><tbody>${orders
                .slice(0, 8)
                .map(
                  (order) => `
                    <tr>
                      <td>${escapeHtml(order.orderNumber)}</td>
                      <td>${escapeHtml(order.outfitType)}</td>
                      <td>${escapeHtml(order.status.replace("_", " "))}</td>
                      <td>${escapeHtml(order.dueDate ? formatDate(order.dueDate) : "—")}</td>
                      <td>${escapeHtml(formatMoney(order.balanceDue, "₦"))}</td>
                    </tr>
                  `
                )
                .join("")}</tbody></table>`
            : `<p>No orders yet.</p>`
        }
      </div>

      <div class="section">
        <h3>Invoice / Sales Summary</h3>
        <div class="grid">
          <div class="box"><span class="label">Invoices</span><span class="value">${escapeHtml(invoices.length)}</span></div>
          <div class="box"><span class="label">Sales Records</span><span class="value">${escapeHtml(sales.length)}</span></div>
        </div>
      </div>
    `
  );
}
