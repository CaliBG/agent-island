const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const menu = $('.menu-toggle');
menu?.closest('.header').classList.add('has-navigation');
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  menu.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  $('#navigation').classList.toggle('open', expanded);
});
$$('.nav a').forEach(link => link.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', 'Open navigation');
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

// Match the desktop spring. The content stays at its final scale behind a moving mask.
for (const island of document.querySelectorAll('.native-island')) {
  const trigger = island.querySelector('.native-trigger');
  const home = island.querySelector('.native-home');
  const scrollDriven = island.dataset.island === 'explore';
  const groups = document.createElement('div');
  groups.className='group-switcher';
  const agents = new Map([['Codex','./assets/agents/codex.png'],['Claude Code','./assets/agents/claude.png'],['WorkBuddy','./assets/agents/workbuddy.png']]);
  island.querySelector('.island-mask').append(groups);
  function showAgent(name, source) {
    agents.set(name,source);
    island.querySelector('.native-source').src=source;
    groups.replaceChildren();
    for(const [agent,icon] of agents){
      if(agent===name)continue;
      const button=document.createElement('button');
      button.type='button';button.setAttribute('aria-label','Show '+agent+' sessions');
      const mark=document.createElement('img');mark.src=icon;mark.alt='';
      const arrow=document.createElement('span');arrow.textContent='⌄';
      button.append(mark,agent,arrow);
      button.addEventListener('click',()=>{showAgent(agent,icon);(scrollDriven ? groups.querySelector('button') : trigger)?.focus({preventScroll:true});});
      groups.append(button);
    }
  }
  showAgent('Codex',agents.get('Codex'));
  const stage = island.closest('.experience-stage,.convergence-stage');
  let cameraScale=1;
  function setCameraScale(){
    const width=island.offsetWidth, height=island.offsetHeight;
    if (!width || !height) return;
    const availableHeight=stage.clientHeight*(stage.classList.contains('convergence-stage') ? .64 : .76);
    cameraScale=Math.max(1,Math.min(4.8,availableHeight/height,stage.clientWidth*.79/width));
    stage.style.setProperty('--camera-scale',String(cameraScale));
  }
  if (scrollDriven) {
    let scheduled=0;
    const smooth=value=>{
      const t=Math.max(0,Math.min(1,value));
      return t*t*(3-2*t);
    };
    function renderScroll() {
      scheduled=0;
      const bounds=stage.getBoundingClientRect();
      const rest=Math.min(64,innerHeight*.075);
      const start=Math.min(innerHeight-bounds.height-rest,innerHeight*.75);
      const travel=Math.max(110,(start-64)*.86);
      const progress=motionPreference.matches ? 1 : (start-bounds.top)/travel;
      const reveal=smooth((progress-.26)/.60);
      stage.style.setProperty('--scroll-scale',String(1+(cameraScale-1)*smooth(progress/.88)));
      island.style.setProperty('--reveal',String(reveal));
      const interactive=reveal>=.98;
      island.dataset.open=String(interactive);
      home.tabIndex=interactive?0:-1;
      groups.inert=!interactive;
    }
    const schedule=()=>{if(!scheduled)scheduled=requestAnimationFrame(renderScroll);};
    new ResizeObserver(()=>{setCameraScale();schedule();}).observe(stage);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    window.addEventListener('pageshow',schedule);
    motionPreference.addEventListener('change',schedule);
    setCameraScale();
    renderScroll();
    continue;
  }
  new ResizeObserver(setCameraScale).observe(stage);
  let open = false, value = 0, speed = 0, frame = 0, previous = 0, hold;
  function draw(now) {
    const dt = Math.min((now - (previous || now - 16)) / 1000, .032);
    previous = now;
    speed += ((open ? 650 : 850) * (Number(open) - value) - (open ? 45 : 54) * speed) * dt;
    value += speed * dt;
    const done = motionPreference.matches || (Math.abs(Number(open) - value) < .001 && Math.abs(speed) < .005);
    if (done) { value = Number(open); speed = 0; }
    island.style.setProperty('--reveal', String(Math.min(1, Math.max(0,value))));
    if (done) { frame = 0; previous = 0; } else frame = requestAnimationFrame(draw);
  }
  function setOpen(next) {
    open = next;
    stage.dataset.closeup=String(next);
    island.dataset.open = String(open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Close island preview' : 'Open island preview');
    home.tabIndex = open ? 0 : -1;
    if (!frame) frame = requestAnimationFrame(draw);
  }
  home.tabIndex = -1;
  island.addEventListener('pointerenter', e => { if(e.pointerType==='mouse') setOpen(true); });
  island.addEventListener('pointerleave', e => { if(e.pointerType==='mouse' && !hold) setOpen(false); });
  trigger.addEventListener('click', () => setOpen(!open));
  island.addEventListener('keydown', e => { if(e.key==='Escape') setOpen(false); });
  document.addEventListener('pointerdown', e => { if(!island.contains(e.target)) setOpen(false); });
  island.addEventListener('previewreset', () => {
    clearTimeout(hold);
    hold = 0;
    setOpen(false);
  });
  island.addEventListener('arrival', event => {
    showAgent(event.detail.name,event.detail.source);
    setOpen(true); clearTimeout(hold);
    hold=setTimeout(()=>{hold=0;if(!island.matches(':hover, :focus-within'))setOpen(false);},3400);
  });
}
