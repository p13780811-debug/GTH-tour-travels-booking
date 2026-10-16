"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Smartphone } from "lucide-react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function AppInstall() {
  const pending = useRef<DeferredInstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Installation remains a browser decision; no false success status.
      });
    }
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      pending.current = event as DeferredInstallPrompt;
      setAvailable(true);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setAvailable(false);
      pending.current = null;
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    const prompt = pending.current;
    if (!prompt) { setInstructions(true); return; }
    pending.current = null;
    setAvailable(false);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome !== "accepted") setInstructions(true);
    } catch {
      // Browser installability is platform-controlled; provide manual instructions.
      setInstructions(true);
    }
  }

  if (installed) return <p className="text-xs font-semibold text-[var(--text-soft)]">App mode active on this device</p>;

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => void install()}
        className="gth-btn-gold inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold sm:w-auto"
        aria-expanded={instructions}>
        {available ? <Download size={18} /> : <Smartphone size={18} />}
        {available ? "Install GTH PRO" : "Add GTH PRO to home screen"}
      </button>
      {instructions && (
        <p role="status" className="max-w-lg text-xs leading-6 text-[var(--text-soft)]">
          {ios
            ? "On Safari, tap Share, then Add to Home Screen."
            : "In Chrome or your browser's menu, choose Install app or Add to Home screen. Browser installation availability varies."}
        </p>
      )}
    </div>
  );
}
