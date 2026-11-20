import { writeStorePages } from './store-pages.mjs';
import { cp, rm, mkdir } from 'node:fs/promises';
await rm('dist', {recursive:true, force:true});
await mkdir('dist', {recursive:true});
await cp('public', 'dist', {recursive:true});
await writeStorePages();
console.log('Built static site → dist/');
