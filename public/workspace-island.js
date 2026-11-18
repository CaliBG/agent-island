// A single camera moves around the 1512-point desktop. The island itself never scales independently of the screen.
(() => {
  const stages = document.querySelectorAll('[data-workspace-island]');
  if (!stages.length) return;

  function sizeCamera(stage, width, height) {
    if (!width || !height) return;
    const hardwareRatio = 830 / 503;
    const rigWidth = Math.min(width * .94, height * .94 * hardwareRatio);
    const panelWidth = rigWidth * .72 * 448 / 1512;
    const compactCloseup = Math.min(width * .88, height * 1.21, 630);
    const openCloseup = Math.min(width * .93, height * .89 * 448 / 423, 590);
    stage.style.setProperty('--rig-width', rigWidth + 'px');
    stage.style.setProperty('--rig-rest-top', (height - rigWidth / hardwareRatio) / 2 + 'px');
    stage.style.setProperty('--compact-zoom', String(compactCloseup / panelWidth));
    stage.style.setProperty('--activity-zoom', String(openCloseup / panelWidth));
  }

  const resize = new ResizeObserver(entries => {
    for (const { target, contentRect } of entries) sizeCamera(target, contentRect.width, contentRect.height);
  });
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('wsi-in-view', entry.isIntersecting);
  });
  stages.forEach((stage, index) => {
    const activity = stage.dataset.workspaceIsland === 'activity';
    const clip = 'wsi-branch-' + index;
    const light = 'wsi-current-' + index;
    // The vector is registered to the branch in the English renderer capture (panel-layout.json).
    const openView = activity ? `
      <div class="wsi-reveal">
        <img class="wsi-panel-capture" src="./assets/island-live.png" width="896" height="846" alt="">
        <svg class="wsi-current" aria-hidden="true" viewBox="0 0 1000 148" preserveAspectRatio="none">
          <defs>
            <clipPath id="${clip}"><path d="M0 44.8 C110 44.8 140.4 0 260 0 H838 Q850 0 850 6 V82 Q850 88 838 88 H260 C140.4 88 110 80.9143 0 80.9143 Z"/></clipPath>
            <linearGradient id="${light}"><stop stop-color="#75b3ff" stop-opacity="0"/><stop offset=".5" stop-color="#a1caff" stop-opacity=".5"/><stop offset="1" stop-color="#75b3ff" stop-opacity="0"/></linearGradient>
          </defs>
          <g clip-path="url(#${clip})"><rect class="wsi-glint" x="-650" width="650" height="148" fill="url(#${light})"/></g>
        </svg>
      </div>
      <div class="wsi-head">
        <div class="wsi-brand-wing">
          <svg viewBox="0 0 264 66"><image href="./assets/island-live.png" width="896" height="846"/></svg>
        </div>
        <div class="wsi-home-wing">
          <span class="wsi-wing-orbit">
            <svg viewBox="426 0 66 66"><image href="./assets/workspace-island-collapsed.png" width="492" height="66"/></svg>
            <span class="wsi-compact-orbit"></span>
          </span>
          <svg class="wsi-home-control" viewBox="664 6 196 54"><image href="./assets/island-live.png" width="896" height="846"/></svg>
        </div>
      </div>` : '';

    stage.insertAdjacentHTML('beforeend', `
      <div class="wsi-rig" aria-hidden="true">
        <div class="wsi-display">
          <div class="wsi-panel">
            ${activity ? openView : `<div class="wsi-compact">
              <img class="wsi-compact-capture" src="./assets/workspace-island-collapsed.png" width="492" height="66" alt="">
              <span class="wsi-compact-orbit"></span>
            </div>`}
          </div>
        </div>
      </div>`);
    sizeCamera(stage, stage.clientWidth, stage.clientHeight);
    resize.observe(stage);
    visibility.observe(stage);
  });
})();
