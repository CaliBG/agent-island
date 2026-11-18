// Enhance semantic paragraphs in place so the copy also works without JavaScript.
export function scrollReveal(paragraph: HTMLElement) {
  const original = paragraph.textContent?.trim();
  if (!original) return;
  const readable = document.createElement('span');
  readable.className = 'visually-hidden';
  readable.textContent = original;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  const words = original.split(/\s+/).map((word, index) => {
    const span = document.createElement('span');
    span.className = 'focus-word';
    span.textContent = word;
    if (index) visual.append(' ');
    visual.append(span);
    return span;
  });
  paragraph.replaceChildren(readable, visual);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  function draw() {
    frame = 0;
    const bounds = paragraph.getBoundingClientRect();
    const progress = reduced.matches ? 1 : Math.max(0, Math.min(1,
      (innerHeight * .91 - bounds.top) / (innerHeight * .39 + bounds.height * .45)));
    const time = progress * (.8 + (words.length - 1) * .05);
    words.forEach((word, index) => {
      const remaining = 1 - Math.max(0, Math.min(1, (time - index * .05) / .8));
      word.style.opacity = String(1 - .9 * remaining);
      word.style.filter = remaining ? 'blur(' + 4 * remaining + 'px)' : 'none';
      word.style.transform = remaining ? 'rotate(' + 3 * remaining + 'deg)' : 'none';
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) window.addEventListener('scroll', schedule, {passive:true});
    else window.removeEventListener('scroll', schedule);
    schedule();
  }).observe(paragraph);
  window.addEventListener('resize', schedule);
  reduced.addEventListener('change', schedule);
  draw();
}
