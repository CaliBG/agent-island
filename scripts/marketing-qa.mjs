import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.SITE_URL||'http://127.0.0.1:4173/agent-island/';
async function scrollExperience(fraction) {
 await page.evaluate(value => {
  const section = document.querySelector('#experience');
  const travel = section.offsetHeight - section.firstElementChild.offsetHeight;
  window.scrollTo({top: section.offsetTop + travel * value, behavior: 'instant'});
 }, fraction);
}
async function experienceProgress() {
 return page.locator('#island-preview').evaluate(el => Number(el.style.getPropertyValue('--open')));
}
async function checkBrandBand() {
 const stream = page.locator('#brand-stream');
 await stream.evaluate(el => el.scrollIntoView({behavior:'instant', block:'center'}));
 await page.mouse.move(0, 0);
 await page.waitForFunction(() => document.querySelector('#brand-stream').scrollLeft > 4);
 const pause = page.getByRole('button', {name:'暂停品牌滚动'});
 await pause.click();
 const position = await stream.evaluate(el => el.scrollLeft);
 await page.waitForTimeout(150);
 assert.equal(await stream.evaluate(el => el.scrollLeft), position);
 await page.getByRole('button', {name:'继续品牌滚动'}).click();
 await page.waitForFunction(x => document.querySelector('#brand-stream').scrollLeft !== x, position);
 const logos = stream.locator('ul:not([aria-hidden]) img');
 assert.equal(await logos.count(), 8);
 await logos.evaluateAll(images => Promise.all(images.map(image => image.decode())));
}

async function checkLogoFlights() {
 const stage = page.locator('.convergence-stage');
 await stage.evaluate(el => el.scrollIntoView({behavior:'instant', block:'center'}));
 const count = stage.locator('.convergence-count');
 if ((await count.textContent()) === '8 / 8') await page.getByRole('button',{name:'重新体验'}).click();
 await page.waitForFunction(() => document.querySelectorAll('.convergence-flight img').length >= 2);
 assert(await stage.evaluate(el => {
  const origins = [...el.querySelectorAll('[data-model] img')].map(img => img.currentSrc);
  return [...el.querySelectorAll('.convergence-flight img')].every(img => img.naturalWidth && origins.includes(img.currentSrc));
 }), 'Flights use the same brand artwork as their origins');
 await page.waitForFunction(() => document.querySelectorAll('.convergence-collection img').length === 8);
 const gpt = stage.locator('[data-model="GPT"]');
 await gpt.focus();
 await page.keyboard.press('Enter');
 await stage.locator('.convergence-flight img').waitFor();
 await page.waitForFunction(() => document.querySelector('.convergence-model').textContent === 'GPT' && !document.querySelector('.convergence-flight'));
 assert.equal(await count.textContent(),'8 / 8');
 assert.equal(await stage.locator('.convergence-collection img').count(),8);
 await page.getByRole('button',{name:'重新体验'}).click();
 assert.equal(await count.textContent(),'0 / 8');
 await page.waitForFunction(() => document.querySelectorAll('.convergence-collection img').length === 8);
}

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
 await checkBrandBand();
 await checkLogoFlights();
 await scrollExperience(0);
 await page.waitForFunction(()=>document.querySelector('#preview-toggle').getAttribute('aria-expanded')==='false');
 assert.equal(await experienceProgress(),0);
 await page.screenshot({path:'artifacts/collapsed-desktop.png'});
 await scrollExperience(.48);
 await page.waitForFunction(()=>{
  const progress=Number(document.querySelector('#island-preview').style.getPropertyValue('--open'));
  return progress>.3&&progress<.7;
 });
 const progress=await experienceProgress();
 await page.waitForTimeout(160);
 assert.equal(await experienceProgress(),progress,'Animation holds when scrolling stops');
 await scrollExperience(.93);
 await page.waitForFunction(()=>document.querySelector('#island-preview').style.getPropertyValue('--open')==='1');
 await scrollExperience(.02);
 await page.waitForFunction(()=>document.querySelector('#island-preview').style.getPropertyValue('--open')==='0');
 await page.locator('#preview-toggle').click();
 assert.equal(await page.locator('#preview-toggle').getAttribute('aria-expanded'),'true');
 await page.locator('#preview-toggle').click();
 assert.equal(await page.locator('#preview-toggle').getAttribute('aria-expanded'),'false');
 await page.locator('.phone-zoom').click();await page.locator('.image-dialog[open]').waitFor();
 assert.match(await page.locator('#full-image').getAttribute('src'),/ios-native/);
 await page.keyboard.press('Escape');
 const cards = page.locator('.product-stack .product-card');
 assert.equal(await cards.count(),3);
 async function pinCard(index) {
  await page.evaluate(i => {
   const card = document.querySelectorAll('.product-card')[i];
   const stop = document.querySelectorAll('.product-stop')[i];
   window.scrollBy({top: stop.getBoundingClientRect().top - parseFloat(getComputedStyle(card).top) + 2, behavior: 'instant'});
  }, index);
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
 }
 async function checkStack() {
  await pinCard(1);
  const middleScale = await cards.first().evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
  assert(Math.abs(middleScale-.97) < .002, 'The first card scales continuously as the second card reaches its pin');
  await pinCard(2);
  const poses = await cards.evaluateAll(nodes => nodes.map(el => ({
   top: el.getBoundingClientRect().top,
   scale: new DOMMatrix(getComputedStyle(el).transform).a
  })));
  for (let i=0; i<poses.length; i++) {
   assert(Math.abs(poses[i].scale - (.94 + i * .03)) < .001, 'Each layered card recedes one scale step');
   if(i) assert(Math.abs(poses[i].top - poses[i-1].top - 28) < 1, 'Layers remain separated by 28px');
  }
  await pinCard(0);
  assert(await cards.first().evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a > .999), 'First card returns to full size when scrolling back');
 }
 await checkStack();
 for(const [i, view] of ['sessions','integrations','settings'].entries()) {
  await pinCard(i);
  const trigger = cards.nth(i).getByRole('button');
  await trigger.click();
  await page.locator('.image-dialog[open]').waitFor();
  assert.match(await page.locator('#full-image').getAttribute('src'),new RegExp(view));
  await page.locator('#image-scale').click();
  assert.equal(await page.locator('#image-scale').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.image-dialog[open]').count(),0);
  assert(await trigger.evaluate(el => el === document.activeElement),'Closing the image returns focus to its card');
 }
 await pinCard(2);
 await cards.nth(2).getByRole('button').focus();
 await page.keyboard.press('Shift+Tab');
 assert(await cards.nth(1).getByRole('button').evaluate(el => {
  const r = el.getBoundingClientRect();
  return el === document.activeElement && el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));
 }), 'Reverse keyboard navigation exposes the previous stacked card');
 const geometry=await page.locator('.hero-mac .scene-window img').evaluate(img=>{
  const scene=img.parentElement, screen=img.closest('.device-screen');
  return {
   ratio:Math.abs(img.clientWidth/img.clientHeight-img.naturalWidth/img.naturalHeight),
   inside:scene.offsetTop+scene.clientHeight<=screen.clientHeight+1&&scene.offsetLeft+scene.clientWidth<=screen.clientWidth+1
  };
 });
 assert(geometry.ratio<.01&&geometry.inside,'Actual screenshot fits the screen without distortion or cropping');
 await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});await page.mouse.move(0,0);
 await page.screenshot({path:'artifacts/home-full.png',fullPage:true});
 await page.locator('#download').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/download-desktop.png'});
 assert.equal(await page.getByRole('link',{name:'下载 Mac 版',exact:true}).getAttribute('href'),'https://github.com/CaliBG/agent-island/releases/download/v0.3.38/Agent-Island-0.3.38-mac-arm64.dmg');
 assert.equal(await page.getByRole('link',{name:'下载 Windows 版',exact:true}).getAttribute('href'),'https://github.com/CaliBG/agent-island/releases/download/v0.3.38/Agent-Island-0.3.38-win-x64.exe');
 for(const width of [320,390,768,1024,1440]) {
  await page.setViewportSize({width,height:844});await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});await page.waitForTimeout(200);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
  assert(await page.locator('.convergence-stage').evaluate(stage => {
   const boundary = stage.getBoundingClientRect();
   const center = el => { const r = el.getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]; };
   const [x,y] = center(stage.querySelector('.convergence-notch'));
   const origins = [...stage.querySelectorAll('button[data-model]')];
   const sectors = new Set(origins.map(el => { const [left,top] = center(el); return [left>x,top>y].join(); }));
   return sectors.size === 4 && origins.every(el => {
    const r = el.getBoundingClientRect();
    return r.left >= boundary.left && r.right <= boundary.right && r.top>=boundary.top && r.bottom<=boundary.bottom;
   });
  }), `All four approach directions fit at ${width}px`);
  if(width===390) {
   await checkStack();
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  }
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
   await scrollExperience(.9);
   await page.waitForFunction(()=>document.querySelector('#island-preview').style.getPropertyValue('--open')==='1');
   await scrollExperience(0);
   await page.waitForFunction(()=>document.querySelector('#island-preview').style.getPropertyValue('--open')==='0');
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>!document.querySelector('#experience').classList.contains('is-scrollable'));
 assert.equal(await experienceProgress(),1);
 assert.equal(await cards.first().evaluate(el => getComputedStyle(el).position),'relative','Reduced motion shows all three cards in normal flow');
 assert.equal(await page.locator('.preview-expanded').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 assert.equal(await page.locator('#brand-stream .brand-run').count(),1);
 await page.locator('[data-model="智谱"]').click();
 assert.equal(await page.locator('.convergence-model').textContent(),'智谱');
 assert.equal(await page.locator('.convergence-flight').count(),0);
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
 console.log('PASS: 5 viewport widths; eight real multi-directional logo flights, replay and collection; moving brand links; reversible scroll preview; screenshot fidelity; stack scaling, reversal and keyboard; modal focus; React and no-JS downloads; reduced motion; docs; no browser errors.');
} finally {await browser.close();}
