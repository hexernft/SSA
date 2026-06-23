import { useRef } from "react";
import { exportBackup, importBackup } from "../lib/backup";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandHeader } from "../components/shared/BrandHeader";

type BackupProps = {
  onImported: () => Promise<void>;
};

export function Backup({ onImported }: BackupProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importBackup(file);
      await onImported();
      alert("Backup imported successfully.");
    } catch {
      alert("Could not import this backup file.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div>
      <div className="page-header">
        <BrandHeader
          title="Backup and Restore"
          subtitle="Export Sleek Stitch Atelier offline invoice and sales data regularly."
        />
      </div>

      <div className="form-grid">
        <Card>
          <h3>Install / Offline Use</h3>
          <p className="muted">
            This app can be installed from the browser and cached for offline use.
            In Chrome or Edge, open the browser menu and choose Install App or Add to desktop when available.
          </p>
          <p className="muted">
            Your business data is still stored locally on this device, so export backups regularly.
          </p>
        </Card>

        <Card>
          <h3>Export Backup</h3>
          <p className="muted">
            Download all settings, invoices, invoice items, sales, sale items, and payments.
          </p>
          <Button onClick={exportBackup}>Export Backup</Button>
        </Card>

        <Card>
          <h3>Import Backup</h3>
          <p className="muted">
            Restore from a backup. This replaces the current local data on this device.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleImport}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Import Backup
          </Button>
        </Card>
      </div>
    </div>
  );
}
