import type {Metadata} from "next";
import Link from "next/link";
import {ArrowUpRight, Download, ExternalLink, LockKeyhole, ShieldCheck, Smartphone, Wallet} from "lucide-react";
import {SITE_CONFIG} from "@/lib/site-config";

export const metadata:Metadata={
  title:"Install GTH PRO on Android | Official Free App Access",
  description:"Install the official GTH PRO web app at no cost, or access the separately tested native Android QA build through GitHub. Learn how release signing and Play Protect work.",
  alternates:{canonical:"/get-app"},
  openGraph:{
    title:"GTH PRO | Free Official Android App Access",
    description:"Official GTH PRO install options, private-data and signing disclosures. No Play Store registration needed for browser installation.",
    url:"/get-app",
    type:"website"
  }
};

/** This URL must be supplied only AFTER an owner-approved stable-key signed GitHub Release exists.
 * It is deliberately absent by default: never redirect visitors to an expired CI artifact,
 * unsigned/debug APK, arbitrary third-party URL or an imaginary Play Store listing.
 */
const trustedPublicApkPattern=
  /^https:\/\/github\.com\/p13780811-debug\/GTH-tour-travels-booking\/releases\/download\/android-v\d+\.\d+\.\d+(?:-rc\.\d+)?\/GTH-PRO-Android\.apk$/;
const configuredApkUrl=process.env.GTH_ANDROID_PUBLIC_APK_URL?.trim()??"";
const publishedApkUrl=trustedPublicApkPattern.test(configuredApkUrl)?configuredApkUrl:null;

const githubQaRun="https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/42530216006";
const releasesPage="https://github.com/p13780811-debug/GTH-tour-travels-booking/releases";

export default function GetAppPage(){
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <section className="border-b border-[var(--border)] bg-[var(--card)]">
   <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 md:py-16">
    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gold)]"><Smartphone size={18} aria-hidden="true"/> Official GTH PRO app access</p>
    <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Install GTH PRO at no cost</h1>
    <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-soft)]">
     GTH PRO connects Real Estate, Travel and Tenders. Choose the ready-to-install
     web app, or open the independently built Android test package on GitHub.
     This is not a Google Play Store listing.
    </p>
    <p className="mt-4 flex items-center gap-2 text-sm text-[var(--text-soft)]"><Wallet size={17} aria-hidden="true"/> No paid travel API or Google Play developer account is needed to install the web app.</p>
   </div>
  </section>
  <section className="mx-auto grid max-w-5xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-2" aria-label="Install options">
   <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--gold)]"><ShieldCheck size={21} aria-hidden="true"/> Recommended: browser install</div>
    <h2 className="mt-3 text-xl font-semibold">GTH PRO installable web app</h2>
    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Open GTH PRO in Chrome on Android. Use the browser menu, choose <strong>Install app</strong> (or <strong>Add to Home screen</strong>) and confirm. This creates a GTH PRO home-screen app shortcut while preserving existing secure website services.</p>
    <Link href="/app" className="gth-btn-gold mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold">Open GTH PRO web app <ArrowUpRight size={17}/></Link>
   </article>
   <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--gold)]"><Download size={21} aria-hidden="true"/> Native Android testing</div>
    <h2 className="mt-3 text-xl font-semibold">GTH PRO Android APK</h2>
    {publishedApkUrl
      ? <><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Download the owner-approved, release-signed Android APK from the official GTH PRO GitHub Release. Verify the published SHA-256 checksum and keep Google Play Protect enabled.</p>
         <a href={publishedApkUrl} className="gth-btn-gold mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold" rel="noopener noreferrer">Download official Android APK <ExternalLink size={17}/></a></>
      : <><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">A standalone QA APK passed automated build and emulator checks. It is a test package, not a production-signed public release. GitHub sign-in is required to access Actions artifacts; the previously tested archive expires on 15 November 2026.</p>
         <a href={githubQaRun} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--gold)] underline">Open tested APK build on GitHub <ExternalLink size={17}/></a>
         <p className="mt-2 text-xs text-[var(--text-soft)]">Under Artifacts, select <strong>gth-pro-native-standalone-qa-apk-not-play-store</strong>, unzip it and install only if you trust its source.</p></>}
    <p className="mt-5 text-sm text-[var(--text-soft)]">Future signed APK releases: <a href={releasesPage} className="font-semibold text-[var(--gold)] underline" target="_blank" rel="noopener noreferrer">Official GitHub Releases</a>.</p>
   </article>
  </section>
  <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-8" aria-labelledby="android-safety">
   <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
    <h2 id="android-safety" className="flex items-center gap-2 text-xl font-semibold"><LockKeyhole size={20} className="text-[var(--gold)]"/> Security, privacy and future updates</h2>
    <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[var(--text-soft)]">
     <li>Google Play Protect may scan sideloaded APKs. A passed scan is useful but does not establish Google Play approval or guarantee the absence of vulnerabilities. Do not disable Play Protect.</li>
     <li>Our native app uses local research notes/bookmarks and opens existing GTH PRO services through explicit website handoffs. Do not share app data with unofficial APK distributors.</li>
     <li>QA APK signatures can differ from a future official signing certificate. Before replacing a QA install with a differently signed APK, back up any important local-only notes: Android may require uninstalling the older app, which can erase its local data.</li>
     <li>Public native APK updates will only be announced here after stable signing, matching package identity, integrity checks and owner-approved physical-device acceptance. No automatic APK installations are performed.</li>
    </ul>
    <p className="mt-5 text-sm leading-7 text-[var(--text-soft)]">Questions or suspicious download? Email <a className="font-semibold text-[var(--gold)] underline" href={`mailto:${SITE_CONFIG.supportEmail}`}>{SITE_CONFIG.supportEmail}</a>. Read our <Link href="/privacy-policy" className="text-[var(--gold)] underline">privacy policy</Link> and <Link href="/verification" className="text-[var(--gold)] underline">platform verification</Link>.</p>
   </div>
  </section>
 </main>;
}
