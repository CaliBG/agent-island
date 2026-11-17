import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4173/agent-island/',{waitUntil:'networkidle'});
 await page.evaluate(()=>{
  const product=document.querySelector('.hero-product').cloneNode(true);product.querySelector('figcaption').remove();
  const hero=document.createElement('main');hero.className='social-preview';
  hero.innerHTML='<div class="social-copy"><img src="./assets/wordmark.svg" width="150" alt="AISLAND"><h1>所有 Agent，<br><em>一座岛。</em></h1><p>少一点切换，多一点专注。</p><span>macOS · Windows</span></div>';
  hero.append(product);document.body.replaceChildren(hero);
  const style=document.createElement('style');style.textContent='.social-preview{width:1200px;height:630px;overflow:hidden;display:grid;grid-template-columns:440px 1fr;align-items:center;gap:24px;padding:60px;background:radial-gradient(ellipse at 85% 60%,#e8f0ff,transparent 70%),white}.social-copy>img{width:150px;height:auto;margin-bottom:45px}.social-copy h1{font-size:64px;line-height:1.2;letter-spacing:-2px;margin:0 0 24px;font-weight:650}.social-copy em{font-style:normal;color:#1671ff}.social-copy p{font-size:20px;color:#667284}.social-copy>span{font-size:13px;color:#667284}.hero-product{width:700px;margin:0;transform:translateX(-38px)}';document.head.append(style);
  product.querySelector('.device-stage').style.setProperty('--device-scale',String(700/740));
 });
 await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode().catch(()=>{}))));
 await page.screenshot({path:'public/assets/social.png'});
}finally{await browser.close();}
