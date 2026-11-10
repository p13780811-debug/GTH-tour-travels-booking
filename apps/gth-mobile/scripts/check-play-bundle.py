import argparse
import json
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile


APP_DIR = Path(__file__).resolve().parents[1]
ANDROID = "{http://schemas.android.com/apk/res/android}"


def version_code(value):
    if not re.fullmatch(r"[1-9][0-9]{0,9}", value) or int(value) > 2_100_000_000:
        raise argparse.ArgumentTypeError("Expected a Play version code from 1 to 2100000000")
    return value


def require(condition, message):
    if not condition:
        raise SystemExit(message)


def prepare(version):
    gradle_path = APP_DIR / "android/app/build.gradle"
    gradle = gradle_path.read_text()
    # Match Expo's generated release block and leave the debug build type intact.
    release_signing = r"(?m)^( *release *\{\n(?: *//[^\n]*\n)*) *signingConfig signingConfigs\.debug *\n"
    gradle, signing_count = re.subn(release_signing, r"\1", gradle)
    gradle, version_count = re.subn(r"(?m)^( +versionCode )[0-9]+ *$", rf"\g<1>{version}", gradle)
    require(signing_count == version_count == 1, "Expo Android template changed. Review release signing and version code.")
    gradle_path.write_text(gradle)


def verify(version, bundletool, bundle):
    def run_bundletool(*args):
        return subprocess.check_output(
            ["java", "-jar", bundletool, *args, f"--bundle={bundle}"], text=True
        )

    android_config = json.loads((APP_DIR / "app.json").read_text())["expo"]["android"]
    run_bundletool("validate")
    manifest = ET.fromstring(run_bundletool("dump", "manifest"))
    require(manifest.get("package") == android_config["package"], "Wrong Android application ID")
    require(manifest.get(ANDROID + "versionCode") == version, "Wrong Android version code")
    sdk = manifest.find("uses-sdk")
    require(sdk is not None and int(sdk.get(ANDROID + "targetSdkVersion", "0")) >= 36, "Android API 36 or newer required")
    app = manifest.find("application")
    require(app is not None and app.get(ANDROID + "allowBackup") == "false", "Android cloud backup must be disabled")
    require(app.get(ANDROID + "debuggable", "false") == "false", "Release bundle is debuggable")
    permissions = {element.get(ANDROID + "name") for element in manifest if element.tag.startswith("uses-permission")}
    require(not permissions.intersection(android_config["blockedPermissions"]), "Release bundle contains blocked permissions")
    require("PAGE_ALIGNMENT_16K" in run_bundletool("dump", "config"), "Bundle must request 16 KB page alignment")

    with ZipFile(bundle) as archive, tempfile.TemporaryDirectory() as scratch:
        entries = archive.namelist()
        signature = r"META-INF/(?:[^/]+\.(?:SF|RSA|DSA|EC)|SIG-[^/]+)"
        require(not any(re.fullmatch(signature, entry, re.I) for entry in entries), "Expected an unsigned bundle")
        require("base/assets/index.android.bundle" in entries, "Android JavaScript bundle is missing")
        for abi in ("arm64-v8a", "x86_64"):
            libraries = [entry for entry in entries if re.fullmatch(rf"[^/]+/lib/{abi}/[^/]+\.so", entry)]
            require(libraries, f"Native libraries are missing for {abi}")
            for library in libraries:
                elf_path = Path(scratch) / "library.so"
                elf_path.write_bytes(archive.read(library))
                headers = subprocess.check_output(["readelf", "-lW", elf_path], text=True)
                alignments = re.findall(r"(?m)^\s*LOAD\s+[^\n]+\s+(0x[0-9a-f]+)\s*$", headers)
                require(alignments and all(int(value, 16) >= 16_384 for value in alignments),
                        f"Native library lacks 16 KB LOAD alignment: {library}")

    print(f"Verified unsigned {manifest.get('package')} v{version}, Android API {sdk.get(ANDROID + 'targetSdkVersion')} and 16 KB alignment.")
    print("Packaged Android permissions:", ", ".join(sorted(permissions)))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("prepare").add_argument("version", type=version_code)
    check = commands.add_parser("verify")
    check.add_argument("version", type=version_code)
    check.add_argument("bundletool")
    check.add_argument("bundle")
    args = parser.parse_args()
    if args.command == "prepare":
        prepare(args.version)
    else:
        verify(args.version, args.bundletool, args.bundle)
