// Capture the real desktop renderer with isolated, non-user example data. Run from desktop-app.
import {preview} from 'vite';import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';import assert from 'node:assert/strict';import {DEFAULT_SETTINGS} from '../../desktop-app/electron/store.mjs';
const server=await preview({preview:{host:'127.0.0.1',port:0}}),browser=await chromium.launch({channel:'chrome',headless:true});
const now=Date.now();const session={id:'codex:qa-design',agent:'Codex',title:'Codex',conversationName:'检查页面布局',latestReply:'正在检查移动端的布局与键盘交互。',status:'working',model:'gpt-5',activityPhase:'thinking',reasoningEffort:'high',pending:[],history:[],cwd:'/dev/design',terminal:'Desktop',updatedAt:now,createdAt:now,archived:false,demo:false};
try{
 const page=await browser.newPage({viewport:{width:1120,height:740},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({settings,session})=>{
  let state={settings,sessions:[session,{...session,id:'codex:qa-docs',conversationName:'整理产品文档',latestReply:'使用说明已整理完成。',status:'done',updatedAt:session.updatedAt-60000},{...session,id:'workbuddy:qa-notes',agent:'WorkBuddy',conversationName:'整理会议纪要',latestReply:'纪要已整理，可以继续补充后续任务。',status:'done'},{...session,id:'claude:qa-code',agent:'Claude Code',conversationName:'检查组件',latestReply:'组件检查已完成。',status:'done'}],expanded:true,page:'sessions',platform:'darwin',appearance:'light',version:settings.__captureVersion,layout:{edge:true,topInset:32,cutoutWidth:179,compactWidth:245,compactHeight:33,bounds:{x:0,y:0,width:468,height:720}},setup:{checking:false,checkedAt:1,python:true,codex:true,trust:{status:'ready',message:'Hooks verified'}},login:{supported:true,enabled:false},hapticStatus:{at:0,count:0},mobile:{configured:false,serviceReady:true,serviceEndpoint:'https://sync.example.workers.dev',paired:false,online:false,awake:false},integrations:{codex:{installed:true,lastEventAt:0},antigravity:{installed:true,lastEventAt:0},workbuddy:{installed:true,lastEventAt:0}},claudeCode:{installed:true},displays:[{id:'1',label:'Built-in display',primary:true}],bridge:{connected:true,endpoint:''}};
  const listeners=new Set();window.__update=patch=>{state={...state,...patch};for(const f of listeners)f(state);};
  window.island={getState:async()=>state,subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)},settings:async patch=>{window.__update({settings:{...state.settings,...patch},appearance:patch.theme?(patch.theme==='system'?'light':patch.theme):state.appearance});return state;},previewHaptic:async()=>true,dashboard:async page=>window.__update({page}),subscribeSound:()=>()=>{},editing:async()=>{},geometry:()=>{},beginInput:async()=>true,focus:()=>{},entered:()=>{},expand:async()=>{},collapse:async()=>{}};
 },{settings:{...DEFAULT_SETTINGS,__captureVersion:JSON.parse((await import('node:fs')).readFileSync('package.json','utf8')).version},session});
 const url='http://127.0.0.1:'+server.httpServer.address().port;

 const out='../website/public/assets/';
 await page.goto(url+'/?window=dashboard');await page.locator('.aisland-wordmark').first().waitFor();await page.waitForTimeout(350);
 await page.screenshot({path:out+'sessions.png'});
 await page.evaluate(()=>window.__update({page:'integrations'}));await page.waitForTimeout(350);await page.screenshot({path:out+'integrations.png'});
 await page.evaluate(()=>window.__update({page:'settings'}));await page.waitForTimeout(350);await page.screenshot({path:out+'settings.png'});
 await page.setViewportSize({width:468,height:650});await page.goto(url+'/?window=island');await page.locator('.island-surface').waitFor();await page.waitForTimeout(650);
 const surface=await page.locator('.island-surface').boundingBox();const footer=await page.locator('.island-footer').boundingBox();const clip={x:surface.x,y:surface.y,width:surface.width,height:Math.ceil(footer.y+footer.height-surface.y)};
 await page.screenshot({path:out+'island-live.png',clip,omitBackground:true});
 await page.screenshot({path:out+'island-expanded.png',clip,omitBackground:true});
 await page.evaluate(()=>window.__update({expanded:false}));await page.waitForTimeout(650);await page.locator('.pill').screenshot({path:out+'island-collapsed.png',omitBackground:true});
 assert.deepEqual(errors,[]);console.log('Current renderer brand screenshots captured with isolated example data.');
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}

await import('./prepare-marketing-assets.mjs');
