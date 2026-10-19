"use client"
import { useEffect, useId, useRef, type ReactNode } from "react"
import { X } from "lucide-react"
import styles from "./PropertyUpgrade.module.css"
export default function PropertyDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const node = useRef<HTMLDialogElement>(null), titleId = useId()
  useEffect(() => {
    const dialog = node.current, previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"; dialog?.showModal()
    return () => { dialog?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus() }
  }, [])
  return <dialog ref={node} className={styles.modal} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
  }}><header className={styles.modalHeader}><div><p className={styles.eyebrow}>GTH PRO · YOUR NEXT STEP</p><h2 id={titleId}>{title}</h2></div><button type="button" className={styles.close} onClick={onClose} aria-label="Close enquiry"><X size={19} /></button></header><div className={styles.modalBody}>{children}</div></dialog>
}
