// The native window's translucent foreground is captured independently of its
// lighting. The five beams and the active branch remain live scroll layers.
class WorkspaceDesktop extends HTMLElement {
  connectedCallback() {
    if (this.querySelector('.workspace-desk-light')) return;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label',
      'AISLAND desktop. Codex is checking the mobile layout. Claude Code and WorkBuddy are also connected.');

    const light = document.createElement('div');
    light.className = 'workspace-desk-light';
    light.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 5; index++) {
      const beam = document.createElement('i');
      beam.style.setProperty('--beam-angle', (188 + index * 18) + 'deg');
      beam.style.setProperty('--beam-color', index % 3 === 0 ? '#f2f2f28c' : '#acacac8c');
      light.append(beam);
    }

    const id = 'workspace-desktop-' + ++WorkspaceDesktop.instanceCount;
    // These coordinates are the current desktop renderer's branch path in its native viewBox.
    const signal = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    signal.setAttribute('class', 'workspace-desk-signal');
    signal.setAttribute('viewBox', '0 0 1000 148');
    signal.setAttribute('preserveAspectRatio', 'none');
    signal.setAttribute('aria-hidden', 'true');
    signal.innerHTML = `
      <defs>
        <clipPath id="${id}-clip"><path d="M0 44.8 C65 44.8 97.2 0 180 0 H838 Q850 0 850 6 V82 Q850 88 838 88 H180 C97.2 88 65 80.914 0 80.914 Z"/></clipPath>
        <linearGradient id="${id}-sheen"><stop stop-color="#8ebfff" stop-opacity="0"/><stop offset=".52" stop-color="#8ebfff" stop-opacity=".27"/><stop offset="1" stop-color="#8ebfff" stop-opacity="0"/></linearGradient>
      </defs>
      <g clip-path="url(#${id}-clip)"><rect width="650" height="148" fill="url(#${id}-sheen)"/></g>`;
    this.append(light, signal);
  }
}

WorkspaceDesktop.instanceCount = 0;
customElements.define('workspace-desktop', WorkspaceDesktop);
