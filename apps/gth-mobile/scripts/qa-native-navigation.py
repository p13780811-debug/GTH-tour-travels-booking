"""Test only: exercise native Android accessibility controls without production writes."""
import pathlib,re,subprocess,time,xml.etree.ElementTree as ET
root=pathlib.Path('/tmp/gth-native-android-emulator')
def adb(*args):return subprocess.check_output(['adb',*args],text=True)
def snapshot():
 adb('shell','uiautomator','dump','/sdcard/gth-native-nav.xml')
 return ET.fromstring(adb('shell','cat','/sdcard/gth-native-nav.xml'))
def wait_text(text):
 for _ in range(15):
  tree=snapshot()
  if any(text in (n.get('text','')+' '+n.get('content-desc','')) for n in tree.iter('node')):return tree
  time.sleep(1)
 raise AssertionError('Native screen missing: '+text)
def tap(label):
 tree=wait_text(label)
 for node in tree.iter('node'):
  desc=node.get('content-desc','');text=node.get('text','')
  if desc==label or desc.startswith(label+' ') or text==label:
   values=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
   if len(values)==4:
    x1,y1,x2,y2=values
    if x2>x1 and y2>y1:adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));return
 raise AssertionError('Native button unavailable: '+label)
# Match the reported phone failure: larger Android fonts, populated single-line input,
# and primary services visible without scrolling. No supplier request is submitted.
adb('shell','settings','put','system','font_scale','1.3')
adb('shell','am','force-stop','com.gthpro.mobile')
adb('shell','monkey','-p','com.gthpro.mobile','-c','android.intent.category.LAUNCHER','1')
wait_text('Your world')
for label in ['Open Flights','Open Hotels','Open Tours & activities','Open Bus journeys','Open Train journeys','Open Ferry journeys','Open Real Estate','Open Public tenders','Explore all services']:
 tree=wait_text(label)
 assert any(n.get('content-desc')==label and n.get('clickable')=='true' for n in tree.iter('node')), 'Primary service not visible: '+label
with (root/'native-home-large-font.png').open('wb') as output:subprocess.run(['adb','exec-out','screencap','-p'],stdout=output,check=True)
tap('Universal search');adb('shell','input','text','Mumbai%stender%shospital%sconstruction')
filled=wait_text('Mumbai tender hospital construction')
(root/'home-search-large-font.xml').write_bytes(ET.tostring(filled))
with (root/'native-search-large-font.png').open('wb') as output:subprocess.run(['adb','exec-out','screencap','-p'],stdout=output,check=True)
adb('shell','input','keyevent','4')
adb('shell','settings','put','system','font_scale','1.0')
adb('shell','am','force-stop','com.gthpro.mobile')
adb('shell','monkey','-p','com.gthpro.mobile','-c','android.intent.category.LAUNCHER','1')
wait_text('Your world')
for label,heading in [('Discover tab','Discover what matters'),('Saved tab','My Research Desk'),('Services tab','Explore every service')]:
 tap(label);tree=wait_text(heading);(root/(label.split()[0].lower()+'.xml')).write_bytes(ET.tostring(tree))
tap('Bus journeys');wait_text('Continue to GTH PRO');tap('Close');wait_text('Explore every service')
tap('Ferry journeys');wait_text('Continue to GTH PRO');tap('Close');wait_text('Explore every service')
tap('Open app settings');wait_text('App settings');tap('Night theme')
adb('shell','input','keyevent','4');wait_text('Explore every service')
tap('Home tab');wait_text('Your world')
adb('shell','am','force-stop','com.gthpro.mobile')
adb('shell','monkey','-p','com.gthpro.mobile','-c','android.intent.category.LAUNCHER','1')
wait_text('Your world');tap('Open app settings');wait_text('App settings')
restored=snapshot()
assert any(n.get('content-desc')=='Night theme' and n.get('checked')=='true' for n in restored.iter('node')), 'Native night-theme selection did not persist after relaunch'
(root/'settings-after-relaunch.xml').write_bytes(ET.tostring(restored))
with (root/'native-settings.png').open('wb') as output:subprocess.run(['adb','exec-out','screencap','-p'],stdout=output,check=True)
print('PASS: native tabs, cancelled bus/ferry handoffs, settings, Android Back and force-stop/relaunch')
