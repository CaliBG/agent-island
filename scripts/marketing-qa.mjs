import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.SITE_URL||'http://127.0.0.1:4173/agent-island/',{waitUntil:'networkidle'});
 await page.locator('[data-enhanced=true]').first().waitFor();assert.equal(await page.locator('.interactive-hover-button').count(),3);
 assert.equal(await page.locator('#demo-island,.terminal,[data-demo-view]').count(),0);
 await page.screenshot({path:'artifacts/home-desktop.png'});
 const button=page.getByRole('link',{name:'下载 AISLAND',exact:true});await button.hover();await page.waitForTimeout(550);
 assert.equal(await button.locator('.hover-button-active').evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.screenshot({path:'artifacts/hover-desktop.png'});
 await page.locator('.focus-story').scrollIntoViewIfNeeded();await page.waitForTimeout(4000);await page.screenshot({path:'artifacts/crawl-desktop.png'});
 await page.getByRole('button',{name:/暂停动效/}).click();assert.equal(await page.locator('.crawl-copy').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
 await page.getByRole('tab',{name:'工具接入',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#product-image').complete);assert.match(await page.locator('#product-image').getAttribute('src'),/integrations/);
 for(const name of ['个人偏好','会话管理'])await page.getByRole('tab',{name,exact:true}).click();
 await page.locator('#download').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/download-desktop.png'});
 assert.equal(await page.getByRole('link',{name:'下载 Mac 版',exact:true}).getAttribute('href'),'https://github.com/CaliBG/agent-island/releases/download/v0.3.25/Agent-Island-0.3.25-mac-arm64.dmg');
 for(const width of [390,320,768]){await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);await page.screenshot({path:`artifacts/home-${width}.png`});}
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.focus-story').scrollIntoViewIfNeeded();assert.equal(await page.locator('.crawl-copy').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.goto((process.env.SITE_URL||'http://127.0.0.1:4173/agent-island/').split('?')[0]+'docs/',{waitUntil:'networkidle'});assert.equal(await page.locator('#desktop-agents').count(),1);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS: desktop/mobile layouts, React hover CTA, perspective motion/pause, reduced motion, real screenshots, current downloads and docs.');
}finally{await browser.close();}
