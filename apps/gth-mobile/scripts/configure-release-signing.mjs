/**
 * Configure the ephemeral Expo prebuilt Android project for a STABLE,
 * owner-controlled release signing certificate. Does not persist any secret
 * value into generated files, repo, artifacts or build logs.
 *
 * The default Expo release variant can use a QA/debug key: never publish it.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";

const requiredEnvs=[
 "GTH_ANDROID_KEYSTORE_PATH",
 "GTH_ANDROID_STORE_PASSWORD",
 "GTH_ANDROID_KEY_ALIAS",
 "GTH_ANDROID_KEY_PASSWORD",
];

/** Pure transformation for CI regression tests. Fail closed on unfamiliar Expo/Gradle templates. */
export function configureReleaseSigning(source){
 if(typeof source!=="string"||source.length<200)throw Error("Android Gradle source is missing");
 if(source.includes("signingConfigs.gthProduction"))throw Error("Release signing already configured");
 const signingHead=/\bsigningConfigs\s*\{\s*debug\s*\{/g;
 const heads=[...source.matchAll(signingHead)];
 if(heads.length!==1)throw Error("Expected one unmodified Expo signingConfigs/debug block");
 const signingBlock=`gthProduction {
            // Read protected environment at build time. Never store secrets in Gradle source.
            storeFile file(System.getenv('GTH_ANDROID_KEYSTORE_PATH'))
            storePassword System.getenv('GTH_ANDROID_STORE_PASSWORD')
            keyAlias System.getenv('GTH_ANDROID_KEY_ALIAS')
            keyPassword System.getenv('GTH_ANDROID_KEY_PASSWORD')
        }
        debug {`;
 let output=source.replace(signingHead,match=>match.replace(/debug\s*\{$/,signingBlock));
 const buildTypesAt=output.indexOf("buildTypes {");
 if(buildTypesAt<0)throw Error("Expected Android buildTypes block");
 const releaseAt=output.indexOf("release {",buildTypesAt);
 if(releaseAt<0)throw Error("Expected Android release buildType");
 const releaseFragment=output.slice(releaseAt,releaseAt+2400);
 const signingLine=/\bsigningConfig\s+signingConfigs\.debug\b/g;
 const matches=[...releaseFragment.matchAll(signingLine)];
 if(matches.length!==1)throw Error("Expected one default debug signingConfig inside release");
 const substituted=releaseFragment.replace(signingLine,"signingConfig signingConfigs.gthProduction");
 output=output.slice(0,releaseAt)+substituted+output.slice(releaseAt+releaseFragment.length);
 if(!output.includes("signingConfig signingConfigs.gthProduction"))
  throw Error("Protected signing configuration was not applied");
 return output;
}

export function assertSigningEnvironment(env){
 for(const name of requiredEnvs){
  if(typeof env[name]!=="string"||!env[name].trim())
   throw Error("Missing protected Android signing input: "+name);
 }
}

const isDirect=process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href;
if(isDirect){
 assertSigningEnvironment(process.env);
 const target=resolve(process.argv[2]??"android/app/build.gradle");
 const current=readFileSync(target,"utf8");
 const signed=configureReleaseSigning(current);
 writeFileSync(target,signed,{encoding:"utf8",mode:0o600});
 console.log("Android release now uses owner-controlled signing, without writing credential values.");
}
