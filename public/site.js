const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const menu = $('.menu-toggle');
menu?.closest('.header').classList.add('has-navigation');
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
  if(index < 0 || !['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
  e.preventDefault();
  const next = e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+tabs.length)%tabs.length;
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
document.querySelector('#close-image')?.addEventListener('click',()=>imageDialog.close());
imageDialog?.addEventListener('click',event=>{if(event.target===imageDialog){const r=imageDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)imageDialog.close();}});
imageDialog?.addEventListener('close',()=>{document.body.style.overflow='';imageTrigger?.focus({preventScroll:true});});

document.querySelector('#image-scale')?.addEventListener('click',event=>{const full=imageDialog.classList.toggle('is-fullsize');event.currentTarget.setAttribute('aria-pressed',String(full));});

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

// Give each device a small, independent travel so the two real screen images stay legible.
const deviceComposition = $('.device-composition');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
deviceComposition?.addEventListener('pointermove', event => {
  if (!finePointer.matches || motionPreference.matches || event.pointerType === 'touch') return;
  const rect = deviceComposition.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - .5;
  const y = (event.clientY - rect.top) / rect.height - .5;
  deviceComposition.style.setProperty('--mac-x', `${x * 18}px`);
  deviceComposition.style.setProperty('--mac-y', `${y * 12}px`);
  deviceComposition.style.setProperty('--phone-x', `${x * -25}px`);
  deviceComposition.style.setProperty('--phone-y', `${y * -18}px`);
});
function resetDevicePosition() {
  for (const name of ['--mac-x', '--mac-y', '--phone-x', '--phone-y']) {
    deviceComposition?.style.removeProperty(name);
  }
}
deviceComposition?.addEventListener('pointerleave', resetDevicePosition);
motionPreference.addEventListener('change', resetDevicePosition);

const experience = $('#experience');
if (experience) {
  const sticky = $('.experience-sticky');
  const preview = $('#island-preview');
  const toggle = $('#preview-toggle');
  const openCapture = $('.preview-expanded');
  const closedCapture = $('.preview-collapsed');
  let scheduledFrame = 0;
  let lastProgress = 1;
  let manualPosition = null;

  function setProgress(progress, scrubbing) {
    lastProgress = progress;
    preview.classList.toggle('is-scrubbing', scrubbing);
    preview.style.setProperty('--open', String(progress));
    const expanded = progress >= .5;

    if (toggle.getAttribute('aria-expanded') !== String(expanded)) {
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.firstChild.nodeValue = expanded ? '收起小岛 ' : '展开小岛 ';
      openCapture.setAttribute('aria-hidden', String(!expanded));
      closedCapture.setAttribute('aria-hidden', String(expanded));
    }
  }

  function updateFromScroll() {
    scheduledFrame = 0;
    if (!experience.classList.contains('is-scrollable') || manualPosition === window.scrollY) return;
    manualPosition = null;
    const rect = experience.getBoundingClientRect();
    const travel = rect.height - sticky.offsetHeight;
    // Hold the start and end briefly so both captures can be read at normal scroll speed.
    const position = -rect.top / Math.max(1, travel);
    const progress = Math.min(1, Math.max(0, (position - .09) / .76));
    setProgress(progress * progress * (3 - 2 * progress), true);
  }

  function scheduleScrollUpdate() {
    if (!scheduledFrame) scheduledFrame = requestAnimationFrame(updateFromScroll);
  }

  function applyMotionPreference() {
    manualPosition = null;
    experience.classList.toggle('is-scrollable', !motionPreference.matches);
    if (motionPreference.matches) setProgress(1, false);
    else scheduleScrollUpdate();
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    manualPosition = window.scrollY;
    setProgress(lastProgress >= .5 ? 0 : 1, false);
  });
  window.addEventListener('scroll', scheduleScrollUpdate, {passive: true});
  window.addEventListener('resize', scheduleScrollUpdate, {passive: true});
  motionPreference.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
}
