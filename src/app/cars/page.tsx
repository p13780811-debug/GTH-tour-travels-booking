import { redirect } from "next/navigation";

// Keep previously shared /cars links working while the travel transport catalog uses /transfers.
export default function LegacyCarsPage() {
  redirect("/transfers");
}
