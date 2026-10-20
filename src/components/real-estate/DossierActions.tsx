"use client";
import { Download, MessageCircle, Printer } from "lucide-react";

export default function DossierActions({ title, url, printMode = false }: {
  title: string; url: string; printMode?: boolean;
}) {
  const shareUrl = url.startsWith("/") ? "https://gthproglobal.com" + url : url;
  const message = "GTH PRO research dossier: " + title + "\n" + shareUrl +
    "\nPlease check the official source and current inventory independently.";
  const whatsapp = "https://wa.me/?text=" + encodeURIComponent(message);
  return <div className="flex flex-wrap items-center gap-3 print:hidden">
    {printMode
      ? <button type="button" onClick={() => window.print()} className="gth-btn gth-btn-gold inline-flex min-h-11 items-center gap-2">
        <Printer size={16} aria-hidden="true" /> Print / Save as PDF
      </button>
      : <a className="gth-btn gth-btn-gold inline-flex min-h-11 items-center gap-2" href={url} target="_blank" rel="noopener noreferrer">
        <Download size={16} aria-hidden="true" /> Export luxury dossier (PDF)
      </a>}
    <a className="gth-btn inline-flex min-h-11 items-center gap-2" href={whatsapp} target="_blank" rel="noopener noreferrer">
      <MessageCircle size={16} aria-hidden="true" /> Share on WhatsApp
    </a>
  </div>;
}
