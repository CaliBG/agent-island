// A marker records each card's natural position while the card itself is pinned.
(() => {
  const stack = document.querySelector('.product-stack');
  if (!stack) return;
  const cards = [...stack.querySelectorAll('.product-card')];
  const markers = [...stack.querySelectorAll('.product-stop, .product-end')];
  const canPin = matchMedia('(prefers-reduced-motion: no-preference)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let visible = true;
  let frame = 0;

  function paint() {
    frame = 0;
    const tops = markers.map(marker => marker.getBoundingClientRect().top);
    const geometry = cards.map(card => ({
      pin: parseFloat(getComputedStyle(card).top),
      height: card.offsetHeight
    }));

    cards.forEach((card, index) => {
      const {pin, height} = geometry[index];
      const travel = pin - tops[index];
      const runway = Math.max(1, tops[index + 1] - tops[index] - height);
      // Finish the scene before the next card starts to cover it.
      const progress = clamp(travel / (runway * .86));
      const overlap = index < cards.length - 1 ? clamp((travel - runway) / height) : 0;
      card.style.setProperty('--workspace-progress', progress.toFixed(5));
      card.style.setProperty('--card-scale', (1 - .025 * overlap).toFixed(5));
    });
  }

  function schedule() {
    if (visible && canPin.matches && !frame) frame = requestAnimationFrame(paint);
  }

  function configure() {
    cancelAnimationFrame(frame);
    frame = 0;
    stack.classList.toggle('is-stacking', canPin.matches);
    if (!canPin.matches) {
      for (const card of cards) {
        card.style.setProperty('--workspace-progress', '1');
        card.style.removeProperty('--card-scale');
      }
    } else {
      paint();
    }
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, {rootMargin: '150px'}).observe(stack);
  new ResizeObserver(schedule).observe(stack);
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('pageshow', schedule);
  canPin.addEventListener('change', configure);
  configure();
})();
