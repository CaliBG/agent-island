import {createRoot} from 'react-dom/client';
import {InteractiveHoverButton} from './components/ui/interactive-hover-button';
import './tailwind.css';

for(const host of document.querySelectorAll<HTMLElement>('[data-hover-button]')){
 const fallback=host.querySelector<HTMLAnchorElement>('a');
 if(!fallback)continue;
 const label=fallback.textContent?.trim()||'下载';
 const href=fallback.getAttribute('href')||'#download';
 createRoot(host).render(<InteractiveHoverButton href={href} fullWidth={host.dataset.fullWidth==='true'} className={host.dataset.variant==='light'?'hover-button-light':undefined}>{label}</InteractiveHoverButton>);
 host.dataset.enhanced='true';
}
