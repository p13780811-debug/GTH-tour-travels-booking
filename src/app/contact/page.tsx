import type {Metadata} from "next";
import Link from "next/link";
import {ArrowRight, Globe2, Mail} from "lucide-react";
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm";
export const metadata:Metadata={
 title:"Contact & Business Enquiries | GTH PRO",
 description:"Contact GTH PRO about ecosystem collaboration, real estate onboarding, global travel integrations and platform support.",
 alternates:{canonical:"/contact"}
};
export default function ContactPage(){
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]"><Globe2 size={16}/> Contact the ecosystem</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Let's connect.</h1>
      <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--text-soft)]">Reach out for genuine partnership discussions or questions about the GTH PRO platform. We review enquiries individually; availability and response times may vary.</p>
      <div className="mt-9 grid gap-7 lg:grid-cols-[1.5fr_1fr]">
        <PartnerApplicationForm defaultType="general"/>
        <aside className="space-y-5">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
            <Mail className="text-[var(--gold)]" size={24}/>
            <h2 className="mt-4 text-lg font-semibold">Business enquiries</h2><a href="mailto:official.gthpro@gmail.com" className="mt-4 inline-block break-all text-sm font-semibold text-[var(--gold)] underline">official.gthpro@gmail.com</a><p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Direct email for business, partnership and platform enquiries.</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Send business enquiries using the form. Submissions are stored privately for review. Do not share sensitive credentials, payment details or identity-document scans. See our privacy policy for data handling.</p>
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold">Developer or agent?</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">We provide separate review paths for real-estate projects, suppliers and affiliate programme introductions.</p>
            <Link href="/partners" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">Explore partnerships <ArrowRight size={16}/></Link>
          </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6"><h2 className="text-lg font-semibold">Company & transparency</h2><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Learn about the operator and commercial relationships before enquiring.</p><div className="mt-4 flex flex-wrap gap-4 text-sm"><Link href="/about" className="font-semibold text-[var(--gold)]">About GTH PRO</Link><Link href="/affiliate-disclosure" className="font-semibold text-[var(--gold)]">Affiliate disclosure</Link></div></div></aside>
      </div>
    </section>
  </main>;
}
