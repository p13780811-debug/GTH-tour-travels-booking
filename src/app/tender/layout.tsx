import type { ReactNode } from "react";
import styles from "./TenderForms.module.css";

export default function TenderLayout({ children }: { children: ReactNode }) {
  return <div className={styles.controls}>{children}</div>;
}
