(() => {
  const stream = document.getElementById('brand-stream');
  const run = stream?.querySelector('.brand-run');
  const toggle = document.querySelector('.brand-band-toggle');
  if (!stream || !run || !toggle) return;

  // Keep one list in the accessibility tree. The visual repeat has the same
  // links so either copy still opens the right instructions on a pointer click.
  const repeat = run.cloneNode(true);
  repeat.setAttribute('aria-hidden', 'true');
  repeat.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let hovered = false;
  let paused = false;
  let width = 0;
  let position = 0;
  let frame = 0;
  let lastTime = 0;
  const pixelsPerSecond = 39;

  function advance(time) {
    if (lastTime) {
      position = (position + pixelsPerSecond * Math.min(time - lastTime, 64) / 1000) % width;
      stream.scrollLeft = position;
    }
    lastTime = time;
    frame = requestAnimationFrame(advance);
  }

  function refresh() {
    const moving = visible && width > 0 && !reduced.matches && !paused && !hovered &&
      !document.hidden && !stream.contains(document.activeElement);
    if (moving && !frame) {
      position = stream.scrollLeft % width;
      lastTime = 0;
      frame = requestAnimationFrame(advance);
    } else if (!moving && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function setPaused(value) {
    paused = value;
    toggle.dataset.paused = String(value);
    const label = value ? '继续品牌滚动' : '暂停品牌滚动';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    refresh();
  }

  function setLayout() {
    if (reduced.matches) {
      stream.removeAttribute('data-loop');
      repeat.remove();
      stream.scrollLeft = 0;
    } else {
      stream.setAttribute('data-loop', '');
      stream.append(repeat);
    }
    toggle.hidden = reduced.matches;
    width = run.getBoundingClientRect().width;
    refresh();
  }

  stream.addEventListener('pointerenter', event => {
    hovered = event.pointerType === 'mouse';
    refresh();
  });
  stream.addEventListener('pointerleave', () => { hovered = false; refresh(); });
  stream.addEventListener('focusin', event => {
    refresh();
    if (reduced.matches || !event.target.matches('a:focus-visible')) return;
    const item = event.target.getBoundingClientRect();
    const viewport = stream.getBoundingClientRect();
    if (item.left < viewport.left + 6) stream.scrollLeft += item.left - viewport.left - 6;
    if (item.right > viewport.right - 6) stream.scrollLeft += item.right - viewport.right + 6;
  });
  stream.addEventListener('focusout', () => queueMicrotask(refresh));
  // Hand a horizontal swipe or trackpad gesture over to native scrolling.
  let touchX = 0, touchY = 0;
  stream.addEventListener('touchstart', event => {
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, {passive: true});
  stream.addEventListener('touchmove', event => {
    const dx = Math.abs(event.touches[0].clientX - touchX);
    const dy = Math.abs(event.touches[0].clientY - touchY);
    if (!paused && dx > 6 && dx > dy) setPaused(true);
  }, {passive: true});
  stream.addEventListener('wheel', event => {
    if (!paused && Math.abs(event.deltaX) > Math.abs(event.deltaY)) setPaused(true);
  }, {passive: true});
  toggle.addEventListener('click', () => setPaused(!paused));
  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', setLayout);
  new ResizeObserver(() => {
    width = run.getBoundingClientRect().width;
    refresh();
  }).observe(run);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    refresh();
  }).observe(stream);
  setLayout();
})();
