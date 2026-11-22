import { appendFile, cp, mkdir, readFile, rm } from 'node:fs/promises';
import { buildStorefront, liveCheckout } from './creem-store.mjs';
import { writeStorePages } from './store-pages.mjs';

const checkout = liveCheckout(process.env.AISLAND_CREEM_LIVE_CHECKOUT);
await rm('dist', {recursive:true, force:true});
await mkdir('dist', {recursive:true});
await cp('public', 'dist', {recursive:true});
if (checkout) {
  const checksums = await readFile(new URL('./paid-download-checksums.txt', import.meta.url), 'utf8');
  await appendFile('dist/download-checksums.txt', '\n' + checksums);
}
await buildStorefront('dist', checkout, process.env.AISLAND_WINDOWS_STORE_ID);
await writeStorePages('dist', checkout);
console.log(`Built static site → dist/ (${checkout ? 'Creem checkout' : 'free preview'})`);
