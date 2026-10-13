import { redirect } from "next/navigation";

// The legacy Digha campaign contained illustrative hotel names, prices and
// unverified badges. Use the live-source destination guide instead.
export default function DighaPage() {
  redirect("/destinations/digha");
}
