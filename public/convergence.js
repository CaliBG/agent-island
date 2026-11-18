(() => {
  const section = document.querySelector('#converge');
  if (!section) return;

  const stage = section.querySelector('.convergence-stage');
  const receiver = section.querySelector('.convergence-receiver');
  const notch = receiver.querySelector('.convergence-notch');
  const collection = receiver.querySelector('.convergence-collection');
  const lastImage = section.querySelector('.convergence-last');
  const label = section.querySelector('.convergence-model');
  const count = section.querySelector('.convergence-count');
  const status = section.querySelector('[data-convergence-status]');
  const all = section.querySelector('.converge-all');
  const actionText = all.querySelector('span');
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
  let visibilityObserver;

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

  function updateControl() {
    if (!flights.size) group = false;
    all.disabled = group;
    actionText.textContent = group ? '正在汇入' : landed.size === origins.length ? '重新体验' : '全部上岛';
  }

  const work = section.querySelector('.island-work');
  const diagram = work.querySelector('svg');
  const detail = section.querySelector('.work-detail');
  const examples = {
    MiniMax: ['整理素材', '检查文件'],
    Gemini: ['分析图表', '读取数据'],
    Claude: ['审阅文稿', '整理提纲'],
    Grok: ['汇总动态', '提取关键词'],
    智谱: ['生成摘要', '梳理目录'],
    通义千问: ['校对译文', '提取术语'],
    GPT: ['检查代码', '读取项目'],
    DeepSeek: ['分析日志', '筛选记录']
  };
  work.addEventListener('click', () => {
    detail.querySelector('.work-detail-stage').append(diagram);
    detail.showModal();
  });
  detail.querySelector('button').addEventListener('click', () => detail.close());
  detail.addEventListener('close', () => {
    work.append(diagram);
    work.focus({preventScroll:true});
  });

  function receive(origin) {
    flights.get(origin)?.tile?.remove();
    flights.delete(origin);
    delete origin.dataset.flying;
    origin.dataset.landed = '';
    const name = origin.dataset.model;
    const image = origin.querySelector('img');
    const source = image.currentSrc || image.src;
    if (!landed.has(origin)) {
      const logo = document.createElement('img');
      logo.alt = '';
      logo.src = source;
      collection.append(logo);
      landed.add(origin);
    }
    section.querySelector('.work-agent').setAttribute('href', source);
    const [running, done] = examples[name] || ['整理资料', '检查清单'];
    diagram.querySelector('.work-title').textContent = running;
    diagram.querySelector('.done-title').textContent = done;
    detail.querySelector('strong').textContent = name + ' · 示例任务';
    work.setAttribute('aria-label', name + '，' + running + '进行中。放大示例任务分支');
    lastImage.src = source;
    lastImage.hidden = false;
    label.textContent = name;
    count.textContent = landed.size + ' / ' + origins.length;
    origin.setAttribute('aria-label', name + ' 已上岛，再次汇入');
    if (!group || !flights.size) {
      status.textContent = landed.size === origins.length
        ? '全部 ' + origins.length + ' 个模型已上岛'
        : name + ' 已上岛，当前共 ' + landed.size + ' 个模型';
    }
    if (!reduced.matches) {
      receiver.classList.remove('is-receiving');
      void receiver.offsetWidth;
      receiver.classList.add('is-receiving');
    }
  }

  function tick(now) {
    ink?.clearRect(0, 0, geometry.width, geometry.height);
    for (const [origin, flight] of flights) {
      const elapsed = now - flight.start;
      if (elapsed < 0) continue;
      if (elapsed >= flight.duration) receive(origin);
      else fly(origin, flight, elapsed / flight.duration);
    }
    frame = flights.size ? requestAnimationFrame(tick) : 0;
    if (!frame) updateControl();
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
    updateControl();
  }

  function reset() {
    landed.clear();
    collection.replaceChildren();
    count.textContent = '0 / ' + origins.length;
    label.textContent = '';
    lastImage.hidden = true;
    for (const origin of origins) {
      delete origin.dataset.landed;
      origin.setAttribute('aria-label', '将 ' + origin.dataset.model + ' 汇入灵动岛');
    }
  }

  function launchGroup() {
    visibilityObserver?.disconnect();
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
      visibilityObserver?.disconnect();
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
  all.addEventListener('click', launchGroup);
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    visibilityObserver?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    ink?.clearRect(0, 0, geometry.width, geometry.height);
    for (const origin of flights.keys()) receive(origin);
    updateControl();
  });

  new ResizeObserver(measure).observe(stage);
  measure();
  reset();
  all.hidden = false;
  if (!reduced.matches) {
    visibilityObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .36)) launchGroup();
    }, { threshold: .36 });
    visibilityObserver.observe(stage);
  }
})();
