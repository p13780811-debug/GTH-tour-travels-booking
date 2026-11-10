import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {configureReleaseSigning,assertSigningEnvironment} from "../scripts/android/configure-release-signing.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

const gradleFixture=`plugins {
    id 'com.android.application'
}
android {
    namespace "com.gthpro.mobile"
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled false
        }
    }
}`;

test("protected release signer never turns an Expo debug signing key into a public release",()=>{
 const output=configureReleaseSigning(gradleFixture);
 assert.match(output,/gthProduction\s*\{/);
 assert.match(output,/storeFile file\(System\.getenv\('GTH_ANDROID_KEYSTORE_PATH'\)\)/);
 assert.match(output,/signingConfig signingConfigs\.gthProduction/);
 assert.match(output,/debug\s*\{\s*signingConfig signingConfigs\.debug/);
 assert.doesNotMatch(output,/storePassword ['"]real-password/);
 assert.equal((output.match(/signingConfig signingConfigs\.gthProduction/g)||[]).length,1);
 assert.throws(()=>configureReleaseSigning(output),/already configured/);
 assert.throws(()=>configureReleaseSigning(gradleFixture.replace("signingConfig signingConfigs.debug\n            minifyEnabled","minifyEnabled")) ,/default debug signingConfig/);
 assert.throws(()=>configureReleaseSigning("invalid source"),/missing/);
});

test("signing fails closed on missing owner keys and accepts only complete env configuration",()=>{
 const valid={GTH_ANDROID_KEYSTORE_PATH:"/tmp/test.jks",GTH_ANDROID_STORE_PASSWORD:"private",
  GTH_ANDROID_KEY_ALIAS:"publisher",GTH_ANDROID_KEY_PASSWORD:"private"};
 assert.doesNotThrow(()=>assertSigningEnvironment(valid));
 for(const key of Object.keys(valid))assert.throws(
  ()=>assertSigningEnvironment({...valid,[key]:""}),new RegExp(key)
 );
});

test("public installation page includes only trusted official destinations and does not fake a public APK",()=>{
 const page=read("src/app/get-app/page.tsx");
 const footer=read("src/components/sections/EcosystemFooter.tsx");
 const sitemap=read("src/app/sitemap.ts");
 assert.match(page,/canonical:"\/get-app"/);
 assert.match(page,/href="\/app"/);
 assert.match(page,/actions\/runs\/42530216006/);
 assert.match(page,/GitHub sign-in is required/);
 assert.match(page,/expires on 15 November 2026/);
 assert.match(page,/trustedPublicApkPattern\.test\(configuredApkUrl\)/);
 assert.match(page,/publishedApkUrl\s*\?/);
 assert.match(page,/do not disable Play Protect|Do not disable Play Protect/);
 assert.match(page,/This is not a Google Play Store listing/);
 assert.doesNotMatch(page,/SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_.*SECRET|ghp_|sk_live_|Google Play approved/);
 assert.match(footer,/\["Install Android App","\/get-app"\]/);
 assert.match(sitemap,/"\/get-app"/);
});

test("release workflow is manually gated, immutable, certificate-pinned and free of embedded secrets",()=>{
 const w=read(".github/workflows/gth-android-public-apk.yml");
 assert.match(w,/workflow_dispatch:/);
 assert.doesNotMatch(w,/^  push:/m);
 assert.doesNotMatch(w,/^  schedule:/m);
 assert.match(w,/github\.ref == 'refs\/heads\/main'/);
 assert.match(w,/GTH_SIGNED_ANDROID_RELEASE_ENABLED/);
 assert.match(w,/GTH_ANDROID_SIGNER_CERT_SHA256/);
 assert.match(w,/GTH_ANDROID_KEYSTORE_B64/);
 assert.match(w,/GTH_ANDROID_STORE_PASSWORD.*secrets\./);
 assert.match(w,/GTH_ANDROID_KEY_ALIAS.*secrets\./);
 assert.match(w,/GTH_ANDROID_KEY_PASSWORD.*secrets\./);
 assert.match(w,/gh release view/);
 assert.match(w,/signer" = "\$expected"/);
 assert.match(w,/SHA256SUMS\.txt/);
 assert.match(w,/--prerelease/);
 assert.doesNotMatch(w,/androiddebugkey|storePassword ['"]android['"]|NEXT_PUBLIC_.*KEY|curl .* \| bash/);
 assert.match(w,/if: always\(\)/);
});

test("native source, global design, website booking flows and private schemas stay untouched by distribution setup",()=>{
 const pwa=read("src/app/app/page.tsx");
 const identity=read("src/lib/seo/site.ts");
 const signing=read("apps/gth-mobile/scripts/configure-release-signing.mjs");
 assert.match(pwa,/MobileAppDashboard/);
 assert.match(identity,/GTH_PUBLIC_LAUNCH_ENABLED/);
 assert.doesNotMatch(signing,/createClient\(|supabase|NEXT_PUBLIC_|fetch\(|api\.travel/);
 assert.match(read("apps/gth-mobile/app.json"),/"package": "com\.gthpro\.mobile"/);
});
