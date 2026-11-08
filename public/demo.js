import {createIslandMotion} from './island-motion.js';

(() => {
  const desktop = document.querySelector('.desktop-frame');
  if (!desktop) return;
  const island = document.querySelector('#demo-island');
  const trigger = document.querySelector('.island-trigger');
  const content = document.querySelector('#demo-content');
  const tabs = [...document.querySelectorAll('.scene-tabs [role=tab]')];
  const views = [...document.querySelectorAll('[data-demo-view]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const autoplayButton = document.querySelector('.autoplay-button');
  const terminalOutput = document.querySelector('#terminal-output');
  const scenes = {
    overview: ['抬眼之间，任务尽在眼前。','悬停或点击屏幕上方的小岛，查看正在推进的会话。'],
    approval: ['看清变更，再做决定。','试着允许或拒绝这次操作，看看小岛如何回应。'],
    question: ['一个问题，一次轻快回应。','直接选择发布环境，答案即刻回到当前任务。'],
    jump: ['任务结束，回到熟悉的窗口。','点击「跳回会话」，把任务窗口带回眼前。']
  };
  let scene = 'overview';
  let autoplay = !reducedMotion.matches;
  let visible = false;
  let timer;
  let autoStep = 0;
  const cycle = ['overview', 'approval', 'question', 'jump'];

  const motion = createIslandMotion({island,trigger,content,views,reducedMotion});
  let hoverTimer;
  let leaveTimer;
  let pointerOpen = false;
  function clearHover() {clearTimeout(hoverTimer);clearTimeout(leaveTimer);}
  function expand(value) {clearHover();motion.set(value);}
  function showView(name) {clearHover();motion.set(true,name);}
  function focusViewAction() {motion.view.querySelector('button')?.focus({preventScroll:true});}
  function setScene(name, {open = true, manual = false} = {}) {
    if (manual) {stopAutoplay();pointerOpen=false;}
    scene = name;
    desktop.dataset.scene = name;
    desktop.classList.remove('terminal-focused');
    tabs.forEach(tab => {const active = tab.dataset.scene === name;tab.setAttribute('aria-selected',String(active));tab.tabIndex = active ? 0 : -1;});
    document.querySelector('#demo-scene-panel').setAttribute('aria-labelledby','scene-'+name);
    document.querySelector('#scene-title').textContent = scenes[name][0];
    document.querySelector('#scene-description').textContent = scenes[name][1];
    document.querySelector('.notch-title').textContent = {overview:'检查登录模块',approval:'等待你的确认',question:'有一个问题',jump:'任务已完成'}[name];
    terminalOutput.textContent = {overview:'正在准备操作预览…',approval:'等待用户确认变更…',question:'等待选择发布环境…',jump:'✓ 检查完成，所有任务已就绪。'}[name];
    terminalOutput.classList.remove('is-denied');
    showView(name);
    if (!open) expand(false);
  }
  function updateAutoplayButton() {
    autoplayButton.setAttribute('aria-pressed',String(autoplay));
    autoplayButton.innerHTML = autoplay ? '<span aria-hidden="true">Ⅱ</span> 暂停自动演示' : '<span aria-hidden="true">▷</span> 自动演示';
  }
  function stopAutoplay() {autoplay=false;clearTimeout(timer);updateAutoplayButton();}
  function schedule() {
    clearTimeout(timer);
    if (!autoplay || !visible || document.hidden) return;
    timer=setTimeout(() => {setScene(cycle[autoStep % cycle.length]);autoStep++;schedule();}, 5200);
  }
  function result(title,detail,output) {
    stopAutoplay();pointerOpen=false;
    document.querySelector('#demo-result-title').textContent=title;
    document.querySelector('#demo-result-detail').textContent=detail;
    terminalOutput.textContent=output;
    showView('result');
    document.querySelector('.notch-title').textContent=title;
    // A user action gets one accessible confirmation; the automatic demo stays silent.
    const toast=document.querySelector('.toast');
    toast.textContent=title+'。仅为网页演示。';toast.classList.add('visible');
    setTimeout(()=>toast.classList.remove('visible'),2600);
    document.querySelector('.demo-replay').focus({preventScroll:true});
  }
  trigger.addEventListener('click', event => {
    stopAutoplay();clearHover();
    // A click immediately following hover should pin the newly opened panel.
    if(event.detail>0 && pointerOpen && motion.isOpen) {pointerOpen=false;return;}
    pointerOpen=false;
    if(motion.isOpen) expand(false);else showView(scene);
  });
  island.addEventListener('pointerenter', event => {
    if(event.pointerType!=='mouse') return;
    stopAutoplay();clearHover();
    if(scene==='overview' && !motion.isOpen) {
      hoverTimer=setTimeout(()=>{pointerOpen=true;showView('overview');},90);
    }
  });
  island.addEventListener('pointerleave', event => {
    clearHover();
    if(event.pointerType==='mouse' && pointerOpen && !island.contains(document.activeElement)) {
      leaveTimer=setTimeout(()=>{pointerOpen=false;expand(false);},220);
    }
  });
  island.addEventListener('keydown', e => {
    if(e.key==='Escape') {stopAutoplay();expand(false);trigger.focus();}
  });
  island.addEventListener('focusin',stopAutoplay);
  document.querySelector('.scene-tabs').addEventListener('focusin',stopAutoplay);
  tabs.forEach(tab=>tab.addEventListener('click',()=>setScene(tab.dataset.scene,{manual:true})));
  document.querySelectorAll('[data-open-scene]').forEach(button=>button.addEventListener('click',()=>{setScene(button.dataset.openScene,{manual:true});focusViewAction();}));
  document.querySelectorAll('[data-decision]').forEach(button=>button.addEventListener('click',()=>{
    const allow=button.dataset.decision==='allow';
    result(allow?'已允许这一次':'本次操作已拒绝',allow?'你的决定已返回给 Agent。':'Agent 会等待你的下一步指示。',allow?'✓ 已收到允许，演示流程继续。':'× 用户已拒绝，演示操作未执行。');
    terminalOutput.classList.toggle('is-denied',!allow);
  }));
  document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>result('回答已送达','已选择：'+button.dataset.answer,'✓ 已收到回答：'+button.dataset.answer)));
  document.querySelector('.jump-terminal').addEventListener('click',()=>{
    stopAutoplay();expand(false);desktop.classList.add('terminal-focused');
    terminalOutput.textContent='✓ 已回到当前任务。继续你的工作。';
    document.querySelector('#scene-title').textContent='你的工作，接着刚才那一步。';
    document.querySelector('#scene-description').textContent='网页演示已将任务窗口置于前方；桌面应用可跳转到对应项目或终端。';
    trigger.focus({preventScroll:true});
  });
  document.querySelector('.demo-replay').addEventListener('click',()=>{setScene(scene,{manual:true});focusViewAction();});
  autoplayButton.addEventListener('click',()=>{autoplay=!autoplay;updateAutoplayButton();if(autoplay){autoStep=(cycle.indexOf(scene)+1)%cycle.length;schedule();}else clearTimeout(timer);});
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();},{threshold:.15}).observe(desktop);
  document.addEventListener('visibilitychange',schedule);
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)stopAutoplay();});
  updateAutoplayButton();

  const reveals = document.querySelectorAll('.reveal');
  if(!reducedMotion.matches && 'IntersectionObserver' in window) {
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');revealObserver.unobserve(entry.target);}
    }),{threshold:.08});
    reveals.forEach(element=>{if(element.getBoundingClientRect().top>innerHeight){element.classList.add('reveal-pending');revealObserver.observe(element);}});
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)reveals.forEach(el=>el.classList.remove('reveal-pending'));});
  }
  const navLinks=[...document.querySelectorAll('.nav a[href^="#"]')];
  const activeSections=navLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting)navLinks.forEach(link=>{const active=link.getAttribute('href')==='#'+entry.target.id;if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }),{rootMargin:'-15% 0px -50% 0px'});
  activeSections.forEach(section=>navObserver.observe(section));
})();
