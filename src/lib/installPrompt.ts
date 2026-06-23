export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupInstallPromptListener(onAvailable: () => void) {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    onAvailable();
  });
}

export async function promptInstallApp() {
  if (!deferredPrompt) return false;

  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;

  return choice.outcome === "accepted";
}

export function isAppInstalledMode() {
  return window.matchMedia("(display-mode: standalone)").matches;
}
