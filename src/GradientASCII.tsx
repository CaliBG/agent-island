import {useEffect, useRef} from 'react';

type GradientASCIIProps = {
  colors: readonly string[];
  shape: 'horizon';
  characters: string;
  cellSize: number;
  density: number;
};

export default function GradientASCII({colors, shape, characters, cellSize, density}: GradientASCIIProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !characters.length || !colors.length || cellSize <= 0) return;

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const glyphs = Array.from(characters);
    const grid = document.createElement('canvas');
    const brush = grid.getContext('2d');
    if (!brush) return;
    let pixels = 1;
    let width = 0, height = 0, tile = 0;
    let visible = false, frame = 0, last = 0, elapsed = 0;

    function paint() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const t = elapsed / 1000;
      const columns = Math.ceil(width / cellSize);
      const band = Math.min(136, height * .22);
      for (let column = 0; column < columns; column++) {
        const u = column / columns;
        const center = height * .46 + band * (.34 * Math.sin(u * 8 - t * .25) + .23 * Math.sin(u * 15 + t * .19));
        const start = Math.max(0, Math.floor((center - band) / cellSize));
        const end = Math.min(Math.ceil(height / cellSize), Math.ceil((center + band) / cellSize));
        for (let row = start; row < end; row++) {
          // A fixed cell mask keeps the field open without flickering between frames.
          const seed = Math.imul(column + 1, 73856093) ^ Math.imul(row + 1, 19349663);
          if ((seed >>> 0) % 997 / 997 >= density) continue;
          const v = (row * cellSize - center) / band;
          const light = Math.pow(Math.max(0, 1 - Math.abs(v)), 1.35);
          const ripple = .5 + .5 * Math.sin(u * 19 + v * 5 - t * .65);
          const intensity = Math.min(1, light * (.58 + .42 * ripple));
          const glyph = Math.round(intensity * (glyphs.length - 1));
          const color = Math.min(colors.length - 1, Math.floor((u * .58 + ripple * .42) * colors.length));
          ctx.globalAlpha = light * .83;
          ctx.drawImage(grid, glyph * tile, color * tile, tile, tile, column * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
      ctx.globalAlpha = 1;
    }
    function resize() {
      if (!canvas || !ctx || !brush) return;
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      pixels = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixels);
      canvas.height = Math.round(height * pixels);
      ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
      tile = Math.ceil(cellSize * pixels);
      grid.width = tile * glyphs.length;
      grid.height = tile * colors.length;
      brush.font = '500 ' + Math.round(tile * .82) + 'px ui-monospace, monospace';
      brush.textAlign = 'center';
      brush.textBaseline = 'middle';
      colors.forEach((color, y) => {
        brush.fillStyle = color;
        glyphs.forEach((glyph, x) => brush.fillText(glyph, (x + .5) * tile, (y + .52) * tile));
      });
      paint();
    }
    function tick(now: number) {
      if (!last || now - last >= 1000 / 24) {
        elapsed += last ? Math.min(now - last, 100) : 0;
        last = now;
        paint();
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      last = 0;
      if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
    }
    const sizes = new ResizeObserver(resize);
    const visibility = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();});
    resize();
    sizes.observe(canvas);
    visibility.observe(canvas);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      cancelAnimationFrame(frame);
      sizes.disconnect();
      visibility.disconnect();
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [colors, characters, cellSize, density]);

  return <canvas ref={ref} data-shape={shape} aria-hidden="true"/>;
}
