// Run on macOS after capturing the real renderer. Never modifies the source images.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const file=path=>fileURLToPath(new URL('../'+path,import.meta.url));
mkdirSync(file('public/assets/agents'),{recursive:true});
for(const name of ['codex','claude','workbuddy','antigravity']) {
 execFileSync('sips',['-Z','96',file(`public/mobile/agents/${name}.png`),'--out',file(`public/assets/agents/${name}.png`)],{stdio:'ignore'});
}
for(const name of ['sessions','integrations','settings']) {
 for(const width of [560,1120]) execFileSync('sips',['-Z',String(width),file(`public/assets/${name}.png`),'--out',file(`public/assets/${name}-${width}.png`)],{stdio:'ignore'});
}
const css=readFileSync(file('public/vendor/devices.css'),'utf8');
// Retain upstream base geometry, the selected MacBook, and the MIT header.
const subset=css.slice(0,css.indexOf('.device-iphone-14-pro'))+css.slice(css.indexOf('.device-macbook-pro {'),css.indexOf('.device-macbook-pro-2018 {'));
writeFileSync(file('public/vendor/devices-macbook.css'),subset.replace(/\s*([{}:;,])\s*/g,'$1').replace(/\s+/g,' '));
console.log('Prepared responsive captures, small Agent logos and the licensed device subset.');
