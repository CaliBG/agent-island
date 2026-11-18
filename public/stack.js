// The markers stay in document flow while the cards pin to their individual offsets.
(() => {
  const stack = document.querySelector('.product-stack');
  if (!stack) return;
  const cards = [...stack.querySelectorAll('.product-card')];
  const markers = [...stack.querySelectorAll('.product-stop')];
  const allowMotion = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 460px)');
  let frame = 0;
  let visible = true;

  function distancesToPin() {
    return markers.map((marker, i) => marker.getBoundingClientRect().top - parseFloat(getComputedStyle(cards[i]).top));
  }

  function paint() {
    frame = 0;
    if (!visible || !allowMotion.matches) return;
    const distances = distancesToPin();
    const last = cards.length - 1;
    for (let i = 0; i < last; i++) {
      const travel = distances[last] - distances[i];
      const progress = Math.max(0, Math.min(1, -distances[i] / Math.max(1, travel)));
      const scale = 1 - .03 * (last - i) * progress;
      cards[i].style.setProperty('--card-scale', scale.toFixed(4));
    }
  }

  function schedule() {
    if (visible && allowMotion.matches && !frame) frame = requestAnimationFrame(paint);
  }

  function configure() {
    stack.classList.toggle('is-stacking', allowMotion.matches);
    for (const card of cards) card.style.removeProperty('--card-scale');
    schedule();
  }

  // Shift-Tab can return to a card whose controls are currently under the next card.
  stack.addEventListener('focusin', event => {
    if (!allowMotion.matches || !event.target.matches(':focus-visible')) return;
    const index = cards.indexOf(event.target.closest('.product-card'));
    if (index < 0) return;
    const rect = event.target.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (topElement?.closest('.product-card') !== cards[index]) {
      window.scrollBy({top: distancesToPin()[index], behavior: 'instant'});
    }
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, {rootMargin: '80px'}).observe(stack);
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  allowMotion.addEventListener('change', configure);
  configure();
})();
