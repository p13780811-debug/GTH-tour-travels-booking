"use client"
import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
export default function PropertyDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const node = useRef<HTMLDialogElement>(null), titleId = useId()
  useEffect(() => {
    const dialog = node.current, previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"; dialog?.showModal()
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus() }
  }, [])
  if (typeof document === "undefined") return null
  return createPortal(<dialog ref={node} className={"gth-glass m-auto w-[min(720px,calc(100vw-28px))] max-h-[calc(100dvh-32px)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 text-[var(--text)] shadow-xl backdrop:bg-[var(--bg)]/80 backdrop:backdrop-blur-sm"} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
  }}><header className={"sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)] px-6 py-5 max-[600px]:px-5"}><div><p className={"text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"}>GTH PRO · YOUR NEXT STEP</p><h2 id={titleId}>{title}</h2></div><button type="button" className="gth-btn grid shrink-0 place-items-center" onClick={onClose} aria-label="Close enquiry"><X size={19} /></button></header><div className={"p-6 max-[600px]:p-5"}>{children}</div></dialog>, document.body)
}
