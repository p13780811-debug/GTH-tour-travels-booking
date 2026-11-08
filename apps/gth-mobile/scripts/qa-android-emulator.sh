#!/usr/bin/env bash
# Read-only, non-production Android QA for the isolated GTH PRO native app.
set -euo pipefail

apk="${1:?Path to the standalone QA APK is required}"
test -s "$apk"
evidence="/tmp/gth-native-android-emulator"
mkdir -p "$evidence"
qa_stage="install"
report_failure() {
  result=$?
  if [ "$result" -ne 0 ]; then
    echo "::error::Android acceptance failed during: $qa_stage (exit $result)"
    adb logcat -d -t 150 -s AndroidRuntime:E ReactNativeJS:E > "$evidence/error-log.txt" 2>/dev/null || true
    python3 - "$evidence" <<'PY'
import pathlib,re,sys,xml.etree.ElementTree as ET
root=pathlib.Path(sys.argv[1])
lines=(root/'error-log.txt').read_text(errors='replace').splitlines()[-35:]
safe=' | '.join(re.sub(r'https?://\S+','[URL]',line) for line in lines)
if safe:print('::error::Android runtime diagnostics: '+safe.replace('%','%25').replace('\r','%0D').replace('\n','%0A'))
home=root/'home.xml'
if home.exists():
 try:
  tree=ET.fromstring(home.read_text())
  labels=[n.get('content-desc') or n.get('text') for n in tree.iter('node') if n.get('content-desc') or n.get('text')]
  print('::notice::Observed emulator Home labels: '+' | '.join(labels[:25]).replace('%','%25').replace('\r','%0D').replace('\n','%0A'))
 except ET.ParseError:pass
PY
  fi
}
trap report_failure EXIT

adb wait-for-device
adb install -r "$apk"
adb shell pm path com.gthpro.mobile | tee "$evidence/package.txt"
adb shell am force-stop com.gthpro.mobile || true
qa_stage="native launch"
adb shell am start -W -n com.gthpro.mobile/.MainActivity > "$evidence/launch.txt"

launched=0
for attempt in $(seq 1 25); do
  if adb shell pidof com.gthpro.mobile >/dev/null 2>&1; then
    launched=1
    break
  fi
  sleep 2
done
if [ "$launched" -ne 1 ]; then
  adb logcat -d -t 250 -s AndroidRuntime:E ReactNativeJS:E > "$evidence/error-log.txt" || true
  echo "GTH PRO did not start on the Android emulator" >&2
  exit 1
fi

# The home screen must render native accessible text; merely starting a process is not enough.
qa_stage="native Home accessibility"
visible=0
for attempt in $(seq 1 12); do
  adb shell uiautomator dump /sdcard/gth-pro-home.xml > /dev/null 2>&1 || true
  adb pull /sdcard/gth-pro-home.xml "$evidence/home.xml" > /dev/null 2>&1 || true
  if [ -s "$evidence/home.xml" ] && grep -Eq 'Your world|One brilliant app|THE GLOBAL EXPERIENCE' "$evidence/home.xml"; then
    visible=1
    break
  fi
  sleep 2
done
adb exec-out screencap -p > "$evidence/native-home.png" || true
if [ "$visible" -ne 1 ]; then
  adb logcat -d -t 250 -s AndroidRuntime:E ReactNativeJS:E > "$evidence/error-log.txt" || true
  echo "Native home content was not visible in Android accessibility UI" >&2
  exit 1
fi
if ! adb shell pidof com.gthpro.mobile >/dev/null 2>&1; then
  echo "App crashed after rendering its home screen" >&2
  exit 1
fi

echo "PASS: standalone QA APK installed and rendered the native home screen on Android emulator"
qa_stage="native navigation and enlarged-font acceptance"
python3 apps/gth-mobile/scripts/qa-native-navigation.py
