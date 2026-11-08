import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('public');
for (const path of ['index.html','docs/index.html']) {
  const file = resolve(root,path), html = await readFile(file,'utf8');
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<meta name="description"/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,`Duplicate IDs in ${path}`);
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const link=match[1];
    if(/^(https?:|data:|mailto:)/.test(link)) continue;
    const [pathWithQuery,fragment] = link.split('#');
    const relative = pathWithQuery.split('?')[0];
    let target=relative ? resolve(dirname(file),relative) : file;
    const info=await stat(target).catch(()=>null);
    assert(info, `Broken local reference: ${path} -> ${link}`);
    if(info.isDirectory()) target=resolve(target,'index.html');
    if(fragment) {
      const content = await readFile(target,'utf8');
      assert(content.includes(`id="${fragment}"`),`Missing fragment: ${path} -> ${link}`);
    }
  }
}
for(const asset of ['island-expanded.png','island-collapsed.png','sessions.png','plan.png','settings.png','social.png']) assert((await stat(resolve(root,'assets',asset))).size>0);
console.log('PASS: page metadata, duplicate IDs, local links, fragments and required images');
