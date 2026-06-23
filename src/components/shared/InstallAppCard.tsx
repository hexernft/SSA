import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { isAppInstalledMode, promptInstallApp, setupInstallPromptListener } from "../../lib/installPrompt";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function InstallAppCard() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isAppInstalledMode());
    setupInstallPromptListener(() => setCanInstall(true));
  }, []);

  async function handleInstall() {
    const accepted = await promptInstallApp();

    if (accepted) {
      setCanInstall(false);
      setIsInstalled(true);
    }
  }

  if (isInstalled) {
    return (
      <Card className="install-card">
        <div>
          <span className="soft-pill">Installed</span>
          <h3>Desktop app mode</h3>
          <p>This app is running like an installed offline business tool.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="install-card">
      <div>
        <span className="soft-pill">Offline App</span>
        <h3>Install Sleek Stitch</h3>
        <p>
          After opening once, the app can be installed and reopened from the computer like a normal business app.
        </p>
      </div>

      {canInstall ? (
        <Button onClick={handleInstall}>
          <Download size={16} />
          Install App
        </Button>
      ) : (
        <p className="muted">
          In Chrome or Edge, use the install icon in the address bar or browser menu after the app loads.
        </p>
      )}
    </Card>
  );
}
