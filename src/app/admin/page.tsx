import Link from "next/link";

export const metadata = {
  title: "Admin Access | GTH PRO",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="gth-container min-h-screen px-4 py-24">
      <section className="gth-glass-ultra gth-stack mx-auto max-w-3xl rounded-[32px] p-6 md:p-8">
        <div className="gth-badge gth-badge-gold">Restricted Area</div>
        <h1 className="gth-title">Admin Portal</h1>
        <p className="gth-sub">
          Administrative booking controls are disabled on the public build until
          authenticated admin authorization and database RLS policies are verified.
        </p>
        <div>
          <Link href="/" className="gth-btn-gold inline-flex px-5 py-3">
            Return to GTH PRO
          </Link>
        </div>
      </section>
    </main>
  );
}
