import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const base = process.env.SITE_URL || 'http://127.0.0.1:4173/agent-island/';
const browser = await chromium.launch({channel:'chrome'});
const errors = [];
try {
  const page = await browser.newPage({viewport:{width:1440,height:960}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(await page.locator('.interactive-hover-button').count(),4);
  assert.equal(await page.locator('.product-card').count(),3);
  assert.equal(await page.locator('.product-zoom,.brand-band-toggle,.converge-all').count(),0);
  const stream=page.locator('#brand-stream');
  await stream.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#brand-stream').scrollLeft>4);
  await page.locator('.convergence-stage').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelectorAll('.convergence-flight img').length>1);
  await page.waitForFunction(()=>document.querySelectorAll('[data-landed]').length===8);
  await page.waitForFunction(()=>document.querySelector('.convergence-flight img'),{},{timeout:12000});
  const panel=page.locator('[data-island="explore"]');
  const stage=page.locator('.experience-stage');
  const moveStage=top=>stage.evaluate((el,y)=>window.scrollBy({top:el.getBoundingClientRect().top-y,behavior:'instant'}),top);
  await moveStage(650);
  await page.waitForFunction(()=>document.querySelector('[data-island="explore"]').style.getPropertyValue('--reveal')==='0');
  await moveStage(75);
  await page.waitForFunction(()=>document.querySelector('[data-island="explore"]').dataset.open==='true');
  const ratios=await panel.evaluate(el=>{
    const w=e=>e.getBoundingClientRect().width;
    return [w(el)/w(el.parentElement),w(el.querySelector('.native-trigger'))/w(el.parentElement),w(el)/el.offsetWidth];
  });
  assert(Math.abs(ratios[0]-448/1512)<.001 && Math.abs(ratios[1]-245/1512)<.001 && ratios[2]>1.1);
  await panel.getByRole('button',{name:'Show WorkBuddy sessions'}).click();
  assert.match(await panel.locator('.native-source').getAttribute('src'),/workbuddy/);
  await moveStage(650);
  await page.waitForFunction(()=>document.querySelector('[data-island="explore"]').dataset.open==='false');
  // Start each scene only after its card pins, and finish before the next card overlaps it.
  const workspaceCards = page.locator('.product-card');
  async function scrubCard(index, fraction) {
    await workspaceCards.nth(index).evaluate((card, fraction) => {
      const marker = card.previousElementSibling.getBoundingClientRect().top;
      const next = card.nextElementSibling.getBoundingClientRect().top;
      const runway = next - marker - card.offsetHeight;
      const pin = parseFloat(getComputedStyle(card).top);
      window.scrollBy({top: marker - pin + runway * fraction, behavior: 'instant'});
    }, fraction);
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    return workspaceCards.nth(index).evaluate(card => Number(card.style.getPropertyValue('--workspace-progress')));
  }
  for (let index = 0; index < 3; index++) {
    assert.equal(await scrubCard(index, -.02), 0);
    const midway = await scrubCard(index, .45);
    assert(midway > .4 && midway < .65);
    assert.equal(await scrubCard(index, .96), 1);
    assert.equal(await scrubCard(index, -.02), 0);
  }
  const card=workspaceCards.last();
  await card.scrollIntoViewIfNeeded();
  assert.equal(await card.evaluate(el=>getComputedStyle(el).position),'sticky');
  await page.locator('.phone-zoom').click(); await page.locator('.image-dialog[open]').waitFor();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#download a[href$=".exe"]').count(),1);
  for(const width of [320,390,768,1024,1440]){
    await page.setViewportSize({width,height:844});
    await page.evaluate(() => {
      window.scrollTo({top: 0, behavior: 'instant'});
      // Device sizing is updated by ResizeObserver after layout.
      return new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
    });
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow at '+width);
    const inside=await page.locator('.hero-mac .scene-window img').evaluate(img=>{
      const box=img.parentElement,screen=img.closest('.device-screen');
      return box.offsetTop+box.offsetHeight<=screen.clientHeight+1 && Math.abs(img.clientWidth/img.clientHeight-img.naturalWidth/img.naturalHeight)<.015;
    });
    assert(inside,'Real capture fits the display at '+width);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => [...document.querySelectorAll('.product-card')].every(card =>
    card.style.getPropertyValue('--workspace-progress') === '1' && getComputedStyle(card).position !== 'sticky'));
  await page.locator('[data-model="GPT"]').click();
  assert.equal(await page.locator('.convergence-flight').count(),0);
  for(const path of ['', 'docs/', '404.html', 'mobile/']){
    await page.goto(new URL(path,base).href,{waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert(!/\p{Script=Han}/u.test(await page.locator('body').innerText()),'Non-English UI in '+path);
  }
  const plain=await browser.newPage({javaScriptEnabled:false});
  await plain.goto(base);
  assert(await plain.getByRole('link',{name:'Download for Mac',exact:true}).isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS: device fit at five widths, camera and native proportions, scroll reveal, live branches, continuous logo flights, accessible downloads, English routes and reduced motion.');
} finally {await browser.close();}
