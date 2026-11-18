(() => {
  const section = document.querySelector('#converge');
  if (!section) return;

  const stage = section.querySelector('.convergence-stage');
  const receiver = section.querySelector('.native-island');
  const notch = receiver.querySelector('.native-trigger');
  const status = section.querySelector('[data-convergence-status]');
  const origins = [...section.querySelectorAll('.convergence-origins button[data-model]')];
  if (!origins.length) return;

  const canvas = section.querySelector('.convergence-air');
  const ink = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const flights = new Map();
  const landed = new Set();
  let geometry;
  let frame = 0;
  let group = false;


  function measure() {
    const bounds = stage.getBoundingClientRect();
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    function box(element) {
      const r = element.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2 - bounds.left) * scaleX,
        y: (r.top + r.height / 2 - bounds.top) * scaleY,
        size: Math.min(r.width * scaleX, r.height * scaleY)
      };
    }

    const target = box(notch);
    const paths = new Map();
    origins.forEach((origin, i) => {
      const start = box(origin);
      const art = origin.querySelector('.convergence-origin-art');
      const transform = getComputedStyle(art).transform;
      const matrix = transform === 'none' ? null : new DOMMatrixReadOnly(transform);
      start.angle = matrix ? Math.atan2(matrix.b, matrix.a) * 180 / Math.PI : 0;
      const dx = target.x - start.x;
      const dy = target.y - start.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      // Wide origins bank around the screen; foreground origins rise almost vertically.
      const direction = Math.abs(dx) < width * .09 ? (i % 2 ? -1 : 1) : Math.sign(dx);
      const bend = Math.min(length * .36, height * .28) * direction;
      const nx = dy / length * bend;
      const ny = -dx / length * bend;
      const margin = Math.min(24, start.size / 2);
      const inside = (n, max) => Math.max(margin, Math.min(max - margin, n));
      paths.set(origin, {
        start,
        first: { x: inside(start.x + dx * .14 + nx, width), y: inside(start.y + dy * .14 + ny, height) },
        second: { x: inside(start.x + dx * .73 + nx * .65, width), y: inside(start.y + dy * .73 + ny * .65, height) },
        target,
        duration: 1150 + Math.min(380, length * .56)
      });
    });
    geometry = { paths, width, height };
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    ink?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function pointOn(path, t) {
    const u = 1 - t;
    const a = u ** 3, b = 3 * u * u * t, c = 3 * u * t * t, d = t ** 3;
    return {
      x: a * path.start.x + b * path.first.x + c * path.second.x + d * path.target.x,
      y: a * path.start.y + b * path.first.y + c * path.second.y + d * path.target.y
    };
  }

  function trail(path, t) {
    if (!ink) return;
    const tail = Math.min(.33, t);
    let prev = pointOn(path, t - tail);
    ink.lineCap = 'round';
    for (let i = 1; i <= 14; i++) {
      const alpha = i / 14;
      const next = pointOn(path, t - tail + tail * alpha);
      ink.beginPath();
      ink.moveTo(prev.x, prev.y);
      ink.lineTo(next.x, next.y);
      ink.strokeStyle = 'rgba(39,113,244,' + alpha * .94 + ')';
      ink.lineWidth = (.66 + alpha * 3.65) * (1 - t * .36);
      ink.stroke();
      prev = next;
    }
  }

  function fly(origin, flight, progress) {
    const path = geometry.paths.get(origin);
    if (!flight.tile) {
      const tile = document.createElement('span');
      tile.className = 'convergence-flight';
      tile.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      image.alt = '';
      image.draggable = false;
      const source = origin.querySelector('img');
      image.src = source.currentSrc || source.src;
      tile.append(image);
      stage.append(tile);
      flight.tile = tile;
      origin.dataset.flying = '';
    }
    const t = progress * progress * (3 - 2 * progress);
    const p = pointOn(path, t);
    trail(path, t);
    const size = path.start.size;
    const scale = 1 + .08 * Math.sin(t * Math.PI) - .78 * t ** 1.4;
    const tilt = path.start.angle * (1 - t) + Math.sign(path.target.x - path.start.x) * -8 * Math.sin(Math.PI * t);
    const style = flight.tile.style;
    style.width = size + 'px';
    style.height = size + 'px';
    style.transform = 'translate3d(' + (p.x - size / 2) + 'px,' + (p.y - size / 2) + 'px,0) rotate(' + tilt + 'deg) scale(' + scale + ')';
    style.opacity = String(Math.min(1, (1 - progress) * 18));
  }

  function receive(origin) {
    flights.get(origin)?.tile?.remove();
    flights.delete(origin);
    landed.add(origin);
    delete origin.dataset.flying;
    origin.dataset.landed = '';
    receiver.dispatchEvent(new CustomEvent('arrival',{detail:{name:origin.dataset.model,source:origin.querySelector('img').src}}));
    if (!flights.size) status.textContent = landed.size + ' agents on the island.';
  }

  function tick(now) {
    ink?.clearRect(0, 0, geometry.width, geometry.height);
    const bounds=stage.getBoundingClientRect(), dest=notch.getBoundingClientRect();
    for (const path of geometry.paths.values()) {
      path.target.x=dest.x+dest.width/2-bounds.x;
      path.target.y=dest.y+dest.height/2-bounds.y;
    }
    for (const [origin, flight] of flights) {
      // The camera moves the hardware and island together during an incoming flight.
      const elapsed = now - flight.start;
      if (elapsed < 0) continue;
      if (elapsed >= flight.duration) receive(origin);
      else fly(origin, flight, elapsed / flight.duration);
    }
    frame = flights.size ? requestAnimationFrame(tick) : 0;
    if (!frame) scheduleReplay();
  }

  function queue(origin, start) {
    flights.set(origin, { start, duration: geometry.paths.get(origin).duration, tile: null });
  }

  function begin() {
    if (reduced.matches) {
      for (const origin of flights.keys()) receive(origin);
    } else if (!frame) {
      frame = requestAnimationFrame(tick);
    }
    if (!flights.size) scheduleReplay();
  }

  function reset() {
    landed.clear();
    for (const origin of origins) delete origin.dataset.landed;
  }

  function launchGroup() {
    clearTimeout(replay);
    if (!flights.size) measure();
    if (landed.size === origins.length) reset();
    group = true;
    const remaining = origins.filter(origin => !landed.has(origin) && !flights.has(origin));
    const now = performance.now();
    remaining.forEach((origin, i) => queue(origin, now + i * 205));
    begin();
  }

  for (const origin of origins) {
    origin.disabled = false;
    origin.addEventListener('click', () => {
      clearTimeout(replay);
      if (!flights.size) measure();
      if (group) {
        // Keep visible logos moving while handing control of later launches to the visitor.
        for (const [source, flight] of flights) {
          if (!flight.tile) flights.delete(source);
        }
        group = false;
      }
      if (!flights.has(origin)) queue(origin, performance.now());
      begin();
    });
  }
  let visible = false;
  let replay;
  function scheduleReplay() {
    clearTimeout(replay);
    if (visible && !document.hidden && !reduced.matches)
      replay = setTimeout(() => { if (!receiver.matches(':hover, :focus-within')) launchGroup(); else scheduleReplay(); }, 6000);
  }
  function syncPlayback() {
    clearTimeout(replay);
    if (!visible || document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const [origin, flight] of flights) {
        flight.tile?.remove();
        delete origin.dataset.flying;
      }
      flights.clear();
      reset();
      ink?.clearRect(0, 0, geometry.width, geometry.height);
      receiver.dispatchEvent(new Event('previewreset'));
      return;
    }
    if (reduced.matches || flights.size) return;
    if (!landed.size) launchGroup(); else scheduleReplay();
  }
  new ResizeObserver(measure).observe(stage);
  new IntersectionObserver(([entry]) => { visible = entry.intersectionRatio >= .45; syncPlayback(); }, {threshold:.45}).observe(stage);
  reduced.addEventListener('change', () => {
    if (reduced.matches) {cancelAnimationFrame(frame); frame=0; for(const origin of flights.keys()) receive(origin); ink?.clearRect(0,0,geometry.width,geometry.height);}
    syncPlayback();
  });
  document.addEventListener('visibilitychange',syncPlayback);
  measure();
})();
