import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/agent-island/',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  const product=document.querySelector('.hero-product').cloneNode(true);
  product.querySelector('figcaption').remove();
  const hero=document.createElement('main');hero.className='social-preview';
  hero.innerHTML='<div class="social-copy"><img src="./assets/wordmark.svg" width="160" alt="AISLAND"><h1>任务上岛。<br><span>专注，不离场。</span></h1><p>所有 Agent，一座岛。</p><span>macOS / Windows</span></div>';
  hero.append(product);document.body.replaceChildren(hero);
  const style=document.createElement('style');
  style.textContent='.social-preview{width:1200px;height:630px;display:grid;grid-template-columns:480px 1fr;align-items:center;gap:30px;padding:50px;background:white;overflow:hidden}.social-copy>img{width:160px;height:auto;margin-bottom:48px}.social-copy h1{font-size:58px;line-height:1.3;letter-spacing:-2px;margin:0 0 24px;font-weight:650}.social-copy h1 span{color:#1455ff}.social-copy p{font-size:20px;color:#626b79;margin-bottom:16px}.social-copy>span{font-size:14px;color:#626b79}.hero-product{width:100%;animation:none}.hero-stage{height:530px}.screen-closeup{top:32px;left:23px;right:23px}.island-preview{width:94%}';
  document.head.append(style);
 });
 await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode().catch(()=>{}))));
 await page.screenshot({path:'public/assets/social.png'});
} finally {await browser.close();}
