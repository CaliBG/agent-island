import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.SITE_URL||'http://127.0.0.1:4173/agent-island/';
try {
 await page.goto(base,{waitUntil:'networkidle'});
 await page.locator('.interactive-hover-button').first().waitFor();
 assert.equal(await page.locator('.interactive-hover-button').count(),4);
 assert.equal(await page.locator('#demo-island,.terminal,[data-demo-view]').count(),0);
 await page.waitForTimeout(1000);
 await page.screenshot({path:'artifacts/home-desktop.png'});
 const download=page.getByRole('link',{name:'下载 macOS',exact:true});
 await download.hover();await page.waitForTimeout(550);
 assert.equal(await download.locator('.hover-button-active').evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.locator('#preview-toggle').click();await page.waitForTimeout(600);
 assert.equal(await page.locator('#preview-toggle').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('.preview-expanded').getAttribute('aria-hidden'),'true');
 await page.screenshot({path:'artifacts/collapsed-desktop.png'});
 await page.locator('#preview-toggle').click();await page.waitForTimeout(600);
 assert.equal(await page.locator('#preview-toggle').getAttribute('aria-expanded'),'true');
 await page.locator('.phone-zoom').click();await page.locator('.image-dialog[open]').waitFor();
 assert.match(await page.locator('#full-image').getAttribute('src'),/ios-native/);
 await page.keyboard.press('Escape');
 await page.locator('#zoom-current').click();await page.locator('.image-dialog[open]').waitFor();
 await page.locator('#image-scale').click();assert.equal(await page.locator('#image-scale').getAttribute('aria-pressed'),'true');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.image-dialog[open]').count(),0);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'zoom-current');
 for(const view of ['integrations','settings','sessions']) {
  await page.locator(`[data-view=${view}]`).click();
  await page.waitForFunction(name=>document.querySelector('#product-panel').getAttribute('aria-labelledby')==='tab-'+name,view);
  assert.match(await page.locator('#product-image').getAttribute('src'),new RegExp(view));
 }
 await page.locator('#tab-sessions').focus();await page.keyboard.press('ArrowDown');
 await page.waitForFunction(()=>document.querySelector('#tab-integrations').getAttribute('aria-selected')==='true');
 await page.locator('#tab-sessions').click();await page.waitForFunction(()=>document.querySelector('#tab-sessions').getAttribute('aria-selected')==='true');
 const geometry=await page.locator('.hero-mac .scene-window img').evaluate(img=>{
  const image=img.getBoundingClientRect(),screen=img.closest('.device-screen').getBoundingClientRect();
  return {ratio:Math.abs(image.width/image.height-img.naturalWidth/img.naturalHeight),inside:image.bottom<=screen.bottom+1&&image.top>=screen.top};
 });
 assert(geometry.ratio<.01&&geometry.inside,'Actual screenshot fits the screen without distortion or cropping');
 await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});await page.mouse.move(0,0);
 await page.screenshot({path:'artifacts/home-full.png',fullPage:true});
 await page.locator('#ambient-toggle').click();
 assert.equal(await page.locator('.ambient i').first().evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
 await page.locator('#download').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/download-desktop.png'});
 assert.equal(await page.getByRole('link',{name:'下载 Mac 版',exact:true}).getAttribute('href'),'https://github.com/CaliBG/agent-island/releases/download/v0.3.38/Agent-Island-0.3.38-mac-arm64.dmg');
 assert.equal(await page.getByRole('link',{name:'下载 Windows 版',exact:true}).getAttribute('href'),'https://github.com/CaliBG/agent-island/releases/download/v0.3.38/Agent-Island-0.3.38-win-x64.exe');
 for(const width of [320,390,768,1024,1440]) {
  await page.setViewportSize({width,height:844});await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});await page.waitForTimeout(200);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
  assert.equal(await page.locator('.product-tabs').getAttribute('aria-orientation'),'horizontal');
  const fit=await page.locator('.hero-phone .phone-screen').evaluate(screen=>{
   const img=screen.querySelector('img');
   return {width:Math.abs(img.clientWidth-screen.clientWidth),height:Math.abs(img.clientHeight-screen.clientHeight),ratio:Math.abs(img.clientWidth/img.clientHeight-img.naturalWidth/img.naturalHeight)};
  });
  assert(fit.width<=1&&fit.height<=1&&fit.ratio<.01,`Phone capture fit at ${width}`);
  await page.screenshot({path:`artifacts/home-${width}.png`});
  if(width===390) {
   await page.screenshot({path:'artifacts/mobile-full.png',fullPage:true});
   await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.ambient i').first().evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.equal(await page.locator('.preview-expanded').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.goto(base+'docs/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#desktop-agents').count(),1);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 // Main download routes remain useful without the React enhancement or JavaScript.
 const plain=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await plain.goto(base);
 assert(await plain.getByRole('link',{name:'下载 macOS',exact:true}).isVisible());
 assert.equal(await plain.locator('img').evaluateAll(images=>images.filter(i=>i.getAttribute('src')&&i.complete&&!i.naturalWidth).length),0);
 await plain.close();
 console.log('PASS: 5 viewport widths; preview states; screenshot fidelity; gallery and keyboard; modal focus; React and no-JS downloads; reduced motion; docs; no browser errors.');
} finally {await browser.close();}
