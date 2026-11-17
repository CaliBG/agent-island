const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const menu = $('.menu-toggle');
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  menu.setAttribute('aria-label', expanded ? '收起导航' : '展开导航');
  $('#navigation').classList.toggle('open', expanded);
});
$$('.nav a').forEach(link => link.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', '展开导航');
  $('#navigation')?.classList.remove('open');
}));
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {menu.click();menu.focus();}
});
const views = {
 sessions:{image:'sessions.png',text:'每个 Agent 一个位置，展开查看会话分支。',alt:'AISLAND 软件界面（示例会话）'},
 integrations:{image:'integrations.png',text:'每个 Agent，清晰连接。',alt:'AISLAND 工具接入界面'},
 settings:{image:'settings.png',text:'你的习惯，你来设置。',alt:'AISLAND 偏好设置软件界面'}
};
function selectView(name) {
  const view = views[name];
  $$('.product-tabs [role=tab]').forEach(tab => {tab.setAttribute('aria-selected', String(tab.dataset.view === name));tab.tabIndex = tab.dataset.view === name ? 0 : -1;});
  $('#product-image').src = './assets/' + view.image + '?v=download-20261118';
  $('#product-image').alt = view.alt;
  $('#product-description').textContent = view.text;
  $('#product-panel').setAttribute('aria-labelledby','tab-'+name);
}
$$('[data-view]').forEach(tab => tab.addEventListener('click', () => selectView(tab.dataset.view)));
$('.settings-jump')?.addEventListener('click', () => {selectView('settings');$('#tab-settings').focus({preventScroll:true});$('.product-tabs').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
const examples = {
node: `import { AgentIsland } from './agent-island.mjs';

const island = new AgentIsland({
  agent: 'My Agent', title: '整理项目文档'
});

await island.start('正在读取项目…');
await island.tool('Read', '检查 README.md');
await island.complete('文档整理完成');`,
python: `from agent_island import AgentIsland

island = AgentIsland(
    agent="My Agent", title="整理项目文档"
)

island.start("正在读取项目…")
island.send("tool.start", tool="Read",
            content="检查 README.md")
island.complete("文档整理完成")`
};
let language = 'node';
function setLanguage(name) {
  language = name;
  $$('.code-tabs [role=tab]').forEach(tab => {tab.setAttribute('aria-selected',String(tab.dataset.language===name));tab.tabIndex = tab.dataset.language===name ? 0 : -1;});
  $('#code-panel').setAttribute('aria-labelledby','code-tab-'+name);
  const code = $('#sample-code');
  code.replaceChildren();
  // Tokenize plain source without injecting HTML.
  const expression = /('[^'\n]*'|"[^"\n]*"|\b(?:import|from|const|await|new)\b)/g;
  let last = 0;
  for (const match of examples[name].matchAll(expression)) {
    code.append(document.createTextNode(examples[name].slice(last, match.index)));
    const span = document.createElement('span');
    span.className = /^["']/.test(match[0]) ? 'token-string' : 'token-keyword';
    span.textContent = match[0];code.append(span);last = match.index + match[0].length;
  }
  code.append(document.createTextNode(examples[name].slice(last)));
}
$$('[data-language]').forEach(tab => tab.addEventListener('click', () => setLanguage(tab.dataset.language)));
if ($('#sample-code')) setLanguage('node');
$$('[role=tablist]').forEach(list => list.addEventListener('keydown', e => {
  const tabs = [...list.querySelectorAll('[role=tab]')];
  const index = tabs.indexOf(document.activeElement);
  if(index < 0 || !['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
  e.preventDefault();
  const next = e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[next].focus();tabs[next].click();
}));
let toastTimeout;
function notify(text) {
  const toast = $('.toast');toast.textContent = text;toast.classList.add('visible');
  clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toast.classList.remove('visible'),2500);
}
$('.copy-button')?.addEventListener('click', async () => {
  try {await navigator.clipboard.writeText(examples[language]);notify('代码已复制');}
  catch {const range=document.createRange();range.selectNodeContents($('#sample-code'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);notify('已选中代码，请按 Ctrl / ⌘ + C 复制');}
});

const story=document.querySelector('.focus-story');
const crawlButton=document.querySelector('#crawl-toggle');
if(story&&crawlButton){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)story.classList.toggle('is-visible',entry.isIntersecting);},{threshold:.15});observer.observe(story);
 crawlButton.addEventListener('click',()=>{const paused=story.classList.toggle('is-paused');crawlButton.setAttribute('aria-pressed',String(paused));crawlButton.textContent=paused?'继续动效 ▷':'暂停动效 Ⅱ';});
 document.addEventListener('visibilitychange',()=>{story.classList.toggle('is-visible',!document.hidden&&story.getBoundingClientRect().bottom>0&&story.getBoundingClientRect().top<innerHeight);});
}

// Keep the licensed device geometry intact at every viewport width.
for(const stage of document.querySelectorAll('[data-device-stage]')){
 const fit=()=>stage.style.setProperty('--device-scale',String(stage.clientWidth/740));
 new ResizeObserver(fit).observe(stage);fit();
}
const imageDialog=document.querySelector('.image-dialog');
let imageTrigger=null;
function openImage(src,caption,trigger){
 if(!imageDialog)return;imageTrigger=trigger;
 document.querySelector('#full-image').src=src;
 document.querySelector('#full-image').alt=caption;
 document.querySelector('#image-caption').textContent=caption;
 imageDialog.classList.remove('is-fullsize');document.querySelector('#image-scale').setAttribute('aria-pressed','false');imageDialog.showModal();document.body.style.overflow='hidden';
 document.querySelector('#close-image').focus();
}
for(const trigger of document.querySelectorAll('[data-zoom]'))trigger.addEventListener('click',()=>openImage(trigger.dataset.zoom,trigger.dataset.caption,trigger));
document.querySelector('#zoom-current')?.addEventListener('click',event=>openImage(document.querySelector('#product-image').src,document.querySelector('#product-image').alt,event.currentTarget));
document.querySelector('#close-image')?.addEventListener('click',()=>imageDialog.close());
imageDialog?.addEventListener('click',event=>{if(event.target===imageDialog){const r=imageDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)imageDialog.close();}});
imageDialog?.addEventListener('close',()=>{document.body.style.overflow='';imageTrigger?.focus({preventScroll:true});});

document.querySelector('#image-scale')?.addEventListener('click',event=>{const full=imageDialog.classList.toggle('is-fullsize');event.currentTarget.setAttribute('aria-pressed',String(full));});
