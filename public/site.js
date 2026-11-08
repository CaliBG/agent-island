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
const preview = $('.island-preview');
preview?.addEventListener('click', () => {
  const expanded = preview.getAttribute('aria-expanded') !== 'true';
  preview.setAttribute('aria-expanded', String(expanded));
  preview.setAttribute('aria-label', expanded ? '收起灵动岛演示' : '展开灵动岛演示');
  $('#island-image').src = expanded ? './assets/island-expanded.png' : './assets/island-collapsed.png';
  $('#island-image').alt = expanded ? 'Agent Island 灵动岛真实截图：任务进度与等待回应的请求' : 'Agent Island 收起状态真实截图';
  $('.visual-bottomline .mono').textContent = expanded ? '01 / 02' : '02 / 02';
});
const views = {
  sessions: {image:'sessions.png',text:'查看所有会话的状态，在确认前看清命令与代码变更。',alt:'会话与审批界面：左侧管理任务，右侧预览命令变更并允许或拒绝'},
  plan: {image:'plan.png',text:'先看清执行计划，再决定是继续推进，还是给出新的方向。',alt:'计划审阅真实界面：展示 Markdown 计划，并提供批准与反馈操作'},
  settings: {image:'settings.png',text:'显示器、浮动方式、透明度与通知提醒，按你的工作习惯设置。',alt:'偏好设置真实界面：显示器、浮动模式、透明度与系统通知设置'}
};
function selectView(name) {
  const view = views[name];
  $$('.product-tabs [role=tab]').forEach(tab => {tab.setAttribute('aria-selected', String(tab.dataset.view === name));tab.tabIndex = tab.dataset.view === name ? 0 : -1;});
  $('#product-image').src = './assets/' + view.image;
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
