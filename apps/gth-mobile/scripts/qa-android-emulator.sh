#!/usr/bin/env bash
# Read-only, non-production Android QA for the isolated GTH PRO native app.
set -euo pipefail

apk="${1:?Path to the standalone QA APK is required}"
test -s "$apk"
evidence="/tmp/gth-native-android-emulator"
mkdir -p "$evidence"

adb wait-for-device
adb install -r "$apk"
adb shell pm path com.gthpro.mobile | tee "$evidence/package.txt"
adb shell am force-stop com.gthpro.mobile || true
adb shell monkey -p com.gthpro.mobile -c android.intent.category.LAUNCHER 1 > "$evidence/launch.txt"

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
python3 apps/gth-mobile/scripts/qa-native-navigation.py
