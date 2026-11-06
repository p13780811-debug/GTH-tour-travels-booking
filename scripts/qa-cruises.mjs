import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const root='/tmp/gth-cruises-qa';await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [360,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600});
  let clickedAffiliate=null;
  // Verify the real server's first-hop response. Route interception does not
  // re-run for each URL in an HTTP redirect chain; receive the popup at the
  // first-party route instead of following a partner checkout in this test.
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin==='http://127.0.0.1:3000'&&url.pathname.startsWith('/go/cruises/')&&route.request().isNavigationRequest()){
    const response=await route.fetch({maxRedirects:0});assert.equal(response.status(),302);
    clickedAffiliate=new URL(response.headers().location);
    assert.equal(clickedAffiliate.origin,'https://tp.media');
    return route.fulfill({status:200,contentType:'text/html',body:'<h1>QA referral receiver</h1>'});
   }
   if(url.origin==='http://127.0.0.1:3000')return route.continue();
   return route.abort();
  });
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:3000/cruises',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'A different way to see the world.'}).waitFor();
  assert.equal(await page.locator('[data-cruise]').count(),7);
  assert.equal(await page.locator('[data-india-cruise]').count(),4);
  const goaHref=await page.locator('[data-india-cruise="goa-mandovi-dinner"] a').getAttribute('href');
  const keralaHref=await page.locator('[data-india-cruise="kerala-alleppey-houseboat"] a').getAttribute('href');
  assert.equal(new URL(new URL(goaHref).searchParams.get('u')).pathname,'/en-IN/activity/185166-goa-lexicon-dinner-cruise/');
  assert.equal(new URL(new URL(keralaHref).searchParams.get('u')).pathname,'/en-IN/activity/6620-alleppey-backwater-cruise-by-houseboat-cochin/');
  for(const slug of ['mumbai-harbour','lakshadweep-cruises']){
   const href=await page.locator('[data-india-cruise="'+slug+'"] a').getAttribute('href');
   assert.ok(href.startsWith('/api/travel/partner-search?'),href);
  }

  await page.getByRole('navigation',{name:'Browse GTH PRO travel categories'}).getByRole('link',{name:'Cruises',exact:true}).waitFor();
  assert.ok(await page.locator('html').evaluate(e=>e.scrollWidth)<=width+1);
  const links=await page.locator('[data-cruise] a').evaluateAll(elements=>elements.map(e=>e.getAttribute('href')));
  for(const link of links){
   const res=await context.request.get('http://127.0.0.1:3000'+link,{maxRedirects:0});assert.equal(res.status(),302);
   const target=new URL(res.headers().location);assert.equal(target.origin,'https://tp.media');assert.match(new URL(target.searchParams.get('u')).pathname,/\/activity\/\d+-/);
  }
  for(const img of await page.locator('[data-cruise] img').all()){
   await img.scrollIntoViewIfNeeded();await img.evaluate(element=>element.decode());
   assert.ok(await img.evaluate(element=>element.naturalWidth>0));
  }
  await page.getByRole('heading',{name:'A different way to see the world.'}).scrollIntoViewIfNeeded();
  await page.screenshot({path:`${root}/cruises-${width}-night.png`,fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Switch to day theme',exact:true}).click();
  await page.screenshot({path:`${root}/cruises-${width}-day.png`,fullPage:true,animations:'disabled'});
  // Capture the actual one-click redirect in a test-only receiver, without
  // visiting partner checkout or recording a fake supplier booking.
  const opened=context.waitForEvent('page');
  await page.locator('[data-cruise] a').first().click();
  const popup=await opened;await popup.getByRole('heading',{name:'QA referral receiver'}).waitFor();
  assert.equal(new URL(popup.url()).pathname,'/go/cruises/disney-adventure-3-nights');
  assert.equal(clickedAffiliate?.searchParams.get('u'),'https://www.klook.com/en-IN/activity/142451-3-night-disney-adventure-cruise-from-singapore/');
  await popup.close();
  await page.getByRole('searchbox',{name:'Destination or cruise name'}).fill('Singapore');
  await page.getByLabel('Cruise type',{exact:true}).selectOption('holiday');
  await page.getByRole('button',{name:'Show cruises',exact:true}).click();
  await page.waitForURL(/destination=Singapore/);
  await page.getByRole('status').filter({hasText:'3 cruise options'}).waitFor();
  assert.equal(await page.locator('[data-cruise]').count(),3);
  await page.getByRole('link',{name:'Clear filters',exact:true}).click();
  await page.getByRole('status').filter({hasText:'7 cruise options'}).waitFor();
  assert.equal(await page.locator('[data-cruise]').count(),7);
  assert.equal(await page.getByRole('searchbox',{name:'Destination or cruise name'}).inputValue(),'');
  assert.equal(await page.getByLabel('Cruise type',{exact:true}).inputValue(),'');
  await page.getByRole('searchbox',{name:'Destination or cruise name'}).fill('Mumbai');
  await page.getByRole('button',{name:'Show cruises',exact:true}).click();
  await page.getByRole('heading',{name:'No matching cruises in this collection'}).waitFor();
  const more=await page.getByRole('link',{name:'Explore Mumbai cruise options'}).getAttribute('href');
  const res=await context.request.get('http://127.0.0.1:3000'+more,{maxRedirects:0});assert.equal(res.status(),302);
  const target=new URL(new URL(res.headers().location).searchParams.get('u'));assert.equal(target.searchParams.get('query'),'Mumbai cruise');
  // The directory is server-rendered before React attaches the filter handlers.
  await page.goto('http://127.0.0.1:3000/mega-aggregator', { waitUntil: 'networkidle' });
  const directory = page.locator('#ecosystem-directory');
  await directory.getByRole('heading', { name: 'Everything GTH PRO, in one place.' }).waitFor();
  const cruisesTile = directory.getByRole('link', { name: 'Cruises', exact: true });
  await directory.getByRole('button', { name: 'Real Estate', exact: true }).click();
  await cruisesTile.waitFor({ state: 'hidden' });
  await directory.getByRole('button', { name: 'Travel', exact: true }).click();
  await cruisesTile.waitFor();
  assert.ok(await page.locator('html').evaluate(element => element.scrollWidth) <= width + 1);
  await cruisesTile.click();
  await page.waitForURL('**/cruises');
  await page.locator('[data-cruise]').first().waitFor();
  await context.close();
 }
 console.log('PASS: seven cruise cards, exact product redirects, destination/type filters and empty-state search at mobile and desktop widths');
}finally{await browser.close();}
