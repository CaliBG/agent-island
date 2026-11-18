(() => {
  const stream = document.getElementById('brand-stream');
  const run = stream?.querySelector('.brand-run');
  if (!stream || !run) return;

  // Keep one list in the accessibility tree. The visual repeat has the same
  // links so either copy still opens the right instructions on a pointer click.
  const repeat = run.cloneNode(true);
  repeat.setAttribute('aria-hidden', 'true');
  repeat.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
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
    const moving = visible && width > 0 && !reduced.matches &&
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

  function setLayout() {
    if (reduced.matches) {
      stream.removeAttribute('data-loop');
      repeat.remove();
      stream.scrollLeft = 0;
    } else {
      stream.setAttribute('data-loop', '');
      stream.append(repeat);
    }

    width = run.getBoundingClientRect().width;
    refresh();
  }

  stream.addEventListener('focusin', event => {
    refresh();
    if (reduced.matches || !event.target.matches('a:focus-visible')) return;
    const item = event.target.getBoundingClientRect();
    const viewport = stream.getBoundingClientRect();
    if (item.left < viewport.left + 6) stream.scrollLeft += item.left - viewport.left - 6;
    if (item.right > viewport.right - 6) stream.scrollLeft += item.right - viewport.right + 6;
  });
  stream.addEventListener('focusout', () => queueMicrotask(refresh));
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
