/** Interruptible spring geometry, separate from unscaled content layers. */
export function createIslandMotion({island, trigger, content, views, reducedMotion}) {
  const surface = document.createElement('div');
  surface.className = 'island-surface';
  surface.setAttribute('aria-hidden', 'true');
  island.prepend(surface);
  let currentView = views[0];
  let open = false;
  let frame = 0;
  let previousTime = 0;
  let geometry;
  let sizes;
  let ready = false;
  let generation = 0;
  const layerAnimations = new Map();
  const position = {width: 0, height: 0};
  const velocity = {width: 0, height: 0};
  const target = {width: 0, height: 0};

  content.hidden = false;
  content.inert = true;
  content.setAttribute('aria-hidden', 'true');
  views.forEach(view => {
    view.hidden = false;
    view.inert = true;
    view.setAttribute('aria-hidden', 'true');
    view.style.visibility = 'hidden';
    view.style.opacity = '0';
  });
  island.classList.add('motion-ready');

  function paint() {
    const width = Math.min(geometry.width, Math.max(geometry.closedWidth, position.width));
    const height = Math.min(geometry.maxHeight, Math.max(geometry.closedHeight, position.height));
    const openness = (width - geometry.closedWidth) / Math.max(1, geometry.width - geometry.closedWidth);
    island.style.setProperty('--cut-x', `${(geometry.width-width)/2}px`);
    island.style.setProperty('--cut-bottom', `${geometry.maxHeight-height}px`);
    island.style.setProperty('--island-curve', `${17 + 7*openness}px`);
  }
  function settle() {
    cancelAnimationFrame(frame);
    frame = 0;
    Object.assign(position, target);
    velocity.width = velocity.height = 0;
    paint();
    island.dataset.animating = 'false';
  }
  function tick(time) {
    // Substeps retain stability after frame drops; a resumed tab never jumps ahead.
    const dt = Math.min((time-previousTime)/1000 || 1/60, 1/30);
    previousTime = time;
    const steps = Math.ceil(dt/(1/120));
    const h = dt/steps;
    const stiffness = open ? 290 : 350;
    const damping = open ? 29 : 36;
    for (let step=0; step<steps; step++) {
      for (const axis of ['width','height']) {
        velocity[axis] += ((target[axis]-position[axis])*stiffness - velocity[axis]*damping)*h;
        position[axis] += velocity[axis]*h;
      }
    }
    paint();
    const settled = ['width','height'].every(axis => Math.abs(target[axis]-position[axis])<.08 && Math.abs(velocity[axis])<.8);
    if (settled) settle();
    else frame=requestAnimationFrame(tick);
  }
  function move() {
    Object.assign(target, {width:open?geometry.width:geometry.closedWidth, height:open?sizes.get(currentView):geometry.closedHeight});
    if (reducedMotion.matches || !ready) return settle();
    island.dataset.animating='true';
    if (!frame) {previousTime=performance.now();frame=requestAnimationFrame(tick);}
  }
  function measure() {
    const styles=getComputedStyle(island);
    const width=island.clientWidth;
    const header=trigger.offsetHeight;
    const top=parseFloat(styles.getPropertyValue('--island-pad-top'));
    const bottom=parseFloat(styles.getPropertyValue('--island-pad-bottom'));
    sizes=new Map(views.map(view=>[view,header+top+view.offsetHeight+bottom]));
    geometry={width,closedWidth:Math.min(width,Math.max(trigger.offsetWidth+20,width*parseFloat(styles.getPropertyValue('--island-closed-ratio')))),closedHeight:header,maxHeight:Math.max(...sizes.values())+10};
    island.style.setProperty('--island-max-height',`${geometry.maxHeight}px`);
    island.style.setProperty('--island-header-height',`${header}px`);
    if(!ready) {Object.assign(position,{width:geometry.closedWidth,height:header});}
    move();
    ready=true;
  }
  function layers(entering, opening) {
    const revision=++generation;
    views.forEach(view=>{
      const active=view===entering && open;
      const rendered=getComputedStyle(view);
      const fromOpacity=rendered.visibility==='hidden'?0:Number(rendered.opacity);
      const fromTransform=rendered.transform==='none'?'translateY(0px)':rendered.transform;
      layerAnimations.get(view)?.cancel();
      layerAnimations.delete(view);
      view.inert=!active;
      view.setAttribute('aria-hidden',String(!active));
      if(reducedMotion.matches) {
        view.style.opacity=active?'1':'0';
        view.style.transform='none';
        view.style.visibility=active?'visible':'hidden';
        return;
      }
      if(!active && fromOpacity===0) {view.style.visibility='hidden';view.style.opacity='0';return;}
      view.style.visibility='visible';
      view.style.opacity=active?'1':'0';
      view.style.transform='none';
      const animation=view.animate([
        {opacity:fromOpacity,transform:fromOpacity>0?fromTransform:`translateY(${opening?7:9}px)`},
        {opacity:active?1:0,transform:active?'translateY(0px)':'translateY(-5px)'}
      ],{duration:active?260:150,delay:active&&opening&&fromOpacity===0?65:0,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
      layerAnimations.set(view,animation);
      animation.finished.then(()=>{
        if(revision!==generation || layerAnimations.get(view)!==animation) return;
        view.style.visibility=active?'visible':'hidden';
        animation.cancel();layerAnimations.delete(view);
      }).catch(()=>{}); // A newer gesture deliberately interrupts this animation.
    });
  }
  function set(value, name=currentView.dataset.demoView) {
    const next=views.find(view=>view.dataset.demoView===name) || currentView;
    if(value===open && next===currentView) return;
    const opening=value&&!open;
    open=value;currentView=next;
    island.dataset.open=String(open);
    island.dataset.view=name;
    trigger.setAttribute('aria-expanded',String(open));
    trigger.setAttribute('aria-label',open?'收起灵动岛演示':'展开灵动岛演示');
    content.inert=!open;
    content.setAttribute('aria-hidden',String(!open));
    layers(currentView,opening);
    measure();
  }
  measure();
  const observer=new ResizeObserver(()=>measure());
  views.forEach(view=>observer.observe(view));
  observer.observe(trigger);
  window.addEventListener('resize',measure,{passive:true});
  document.fonts?.ready.then(measure);
  reducedMotion.addEventListener('change',()=>{
    if(reducedMotion.matches){settle();layers(currentView,false);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
  return {set,get isOpen(){return open;},get view(){return currentView;}};
}
