import { useEffect, useState } from "react";
import type { BusinessSettings } from "../types";
import { saveSettings } from "../db/database";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import logoDark from "../assets/logo-dark.png";

type SettingsProps = {
  settings: BusinessSettings | null;
  onSettingsSaved: (settings: BusinessSettings) => void;
};

export function Settings({ settings, onSettingsSaved }: SettingsProps) {
  const [form, setForm] = useState<BusinessSettings | null>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  if (!form) return null;

  function updateField<K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const saved = await saveSettings(form);
    onSettingsSaved(saved);
    alert("Business settings saved offline.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header">
        <div className="brand-header">
          <img src={logoDark} alt="Sleek Stitch Atelier" className="brand-header-logo" />
          <div>
            <h2>Business Settings</h2>
            <p>Core business information for Sleek Stitch Atelier invoices and sales records.</p>
          </div>
        </div>

        <Button type="submit">Save Settings</Button>
      </div>

      <div className="form-grid">
        <Card>
          <h3>Business Information</h3>

          <label className="field">
            <span>Business Name</span>
            <input
              value={form.businessName}
              onChange={(event) => updateField("businessName", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Business Address</span>
            <textarea
              value={form.businessAddress}
              onChange={(event) => updateField("businessAddress", event.target.value)}
            />
          </label>

          <div className="two-grid">
            <label className="field">
              <span>Phone</span>
              <input
                value={form.businessPhone}
                onChange={(event) => updateField("businessPhone", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                value={form.businessEmail}
                onChange={(event) => updateField("businessEmail", event.target.value)}
              />
            </label>
          </div>
        </Card>

        <Card>
          <h3>Record Defaults</h3>

          <div className="two-grid">
            <label className="field">
              <span>Default Currency</span>
              <select
                value={form.currency}
                onChange={(event) => updateField("currency", event.target.value)}
              >
                <option value="₦">NGN - ₦</option>
                <option value="$">USD - $</option>
                <option value="€">EUR - €</option>
                <option value="£">GBP - £</option>
              </select>
            </label>

            <label className="field">
              <span>Invoice Prefix</span>
              <input
                value={form.invoicePrefix}
                onChange={(event) => updateField("invoicePrefix", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Sale Prefix</span>
              <input
                value={form.salePrefix}
                onChange={(event) => updateField("salePrefix", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Order Prefix</span>
              <input
                value={form.orderPrefix}
                onChange={(event) => updateField("orderPrefix", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Receipt Prefix</span>
              <input
                value={form.receiptPrefix}
                onChange={(event) => updateField("receiptPrefix", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Default Tax Rate %</span>
              <input
                type="number"
                value={form.defaultTaxRate}
                onChange={(event) => updateField("defaultTaxRate", event.target.value === "" ? 0 : Number(event.target.value))}
              />
            </label>
          </div>

          <label className="field">
            <span>Default Invoice Terms</span>
            <textarea
              value={form.defaultTerms}
              onChange={(event) => updateField("defaultTerms", event.target.value)}
            />
          </label>
        </Card>

        <Card>
          <h3>Payment Details</h3>

          <label className="field">
            <span>Bank Name</span>
            <input
              value={form.bankName}
              onChange={(event) => updateField("bankName", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Account Name</span>
            <input
              value={form.accountName}
              onChange={(event) => updateField("accountName", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Account Number</span>
            <input
              value={form.accountNumber}
              onChange={(event) => updateField("accountNumber", event.target.value)}
            />
          </label>
        </Card>
      </div>
    </form>
  );
}
