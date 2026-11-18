import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1,reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4173/agent-island/',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  const hero=document.querySelector('.hero');
  hero.querySelector('.hero-actions').remove();hero.querySelector('.hero-meta').remove();hero.querySelector('#ambient-toggle').remove();
  hero.querySelector('figcaption').remove();const symbols=document.querySelector('.symbol-library');document.body.replaceChildren(symbols,hero);
  const style=document.createElement('style');
  style.textContent='.hero{width:1200px;height:630px;padding:45px 35px;display:grid;grid-template-columns:430px 1fr;align-items:center;gap:20px;text-align:left}.hero-copy{width:100%;padding-left:15px}.hero-kicker{justify-content:start}.hero h1{font-size:58px;letter-spacing:-3px}.headline-pill{padding:0 18px 3px;gap:8px}.headline-pill svg{width:30px;height:30px}.hero-description{font-size:18px}.hero-product{width:100%;margin:0;animation:none}.hero-mac{margin-left:-5%}.hero-phone{width:24%;bottom:5%}.ambient i{animation:none}';
  document.head.append(style);
 });
 await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode().catch(()=>{}))));
 await page.screenshot({path:'public/assets/social.png'});
} finally {await browser.close();}
