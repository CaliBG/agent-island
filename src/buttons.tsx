import {createRoot} from 'react-dom/client';
import {InteractiveHoverButton} from './components/ui/interactive-hover-button';
import './tailwind.css';
import GradientASCII from './GradientASCII';

for(const host of document.querySelectorAll<HTMLElement>('[data-hover-button]')){
 const fallback=host.querySelector<HTMLAnchorElement>('a');
 if(!fallback)continue;
 const label=fallback.textContent?.trim()||'下载';
 const href=fallback.getAttribute('href')||'#download';
 createRoot(host).render(<InteractiveHoverButton href={href} fullWidth={host.dataset.fullWidth==='true'} className={host.dataset.variant==='light'?'hover-button-light':undefined}>{label}</InteractiveHoverButton>);
 host.dataset.enhanced='true';
}

const background = document.querySelector('.hero-ascii');
if (background) {
  createRoot(background).render(<GradientASCII colors={['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8']} shape="horizon" characters=" =+xX0S8#@" cellSize={18} density={0.8}/>);
}
