import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildStorefront, liveCheckout, windowsInstaller, ordersUrl, sandboxProduct } from './creem-store.mjs';
import { writeStorePages } from './store-pages.mjs';

test('only an explicit production checkout or product ID can switch the site to paid', () => {
  const product = 'prod_123456789AbCdEf';
  const url = `https://www.creem.io/product/${product}`;
  assert.equal(liveCheckout(), null);
  assert.equal(liveCheckout('   '), null);
  for (const value of [product, url, url.replace('www.', ''), url.replace('/product/', '/payment/')]) assert.equal(liveCheckout(value), url);
  for (const value of [
    sandboxProduct, `https://www.creem.io/payment/${sandboxProduct}`, url.replace('/product/', '/test/product/'),
    url.replace('www.', 'test.'), url.replace('https:', 'http:'), url.replace('creem.io', 'creem.io.example.com'),
    url + '?test=1', 'true', 'prod_', 'prod_abc" onfocus="',
  ]) assert.throws(() => liveCheckout(value), /must be a live Creem product/);
});

for (const storefront of ['preview', 'paid']) {
  test(`${storefront} pages deliver through the matching channel`, async t => {
    const dir = await mkdtemp(join(tmpdir(), 'aisland-store-'));
    t.after(() => rm(dir, { recursive: true, force: true }));
    await mkdir(join(dir, 'docs'));
    for (const file of ['index.html', 'docs/index.html']) await cp(join('public', file), join(dir, file));
    const checkout = storefront === 'paid' ? liveCheckout('prod_123456789AbCdEf') : null;
    await buildStorefront(dir, checkout);
    await writeStorePages(dir, checkout);
    const html = await Promise.all(['index.html', 'docs/index.html', 'pricing/index.html', 'terms/index.html',
      'privacy/index.html', 'refunds/index.html'].map(file => readFile(join(dir, file), 'utf8')));
    const [home, docs, pricing, terms] = html;
    const all = html.join('\n');
    assert.doesNotMatch(all, /<!--\/?store|workers\.dev\/(buy|library|support)|lifetime code/i);
    if (checkout) {
      for (const page of [home, docs, pricing]) {
        assert.ok(page.includes(checkout));
        assert.ok(page.includes(ordersUrl));
      }
      assert.ok(terms.includes(ordersUrl));
      assert.doesNotMatch(all, /\/test\/payment\/|preview is free|when sales open|download preview|preview release|href="[^"]*\.(dmg|apk|exe)"/i);
    } else {
      for (const extension of ['.dmg"', '.exe"', '.apk"']) assert.ok(home.includes(extension));
      assert.match(docs, /For preview release/);
      assert.match(pricing, /test\/payment/);
      assert.match(terms, /currently published preview is free/);
      assert.doesNotMatch(all, /creem\.io\/(?:payment|product)\/|creem\.io\/my-orders\/login/);
    }
  });
}

test('published Store ID routes Windows installations to Microsoft without changing paid checkout', async t => {
  assert.equal(windowsInstaller(), null);
  assert.throws(() => windowsInstaller('https://untrusted.example/setup.exe'));
  const dir = await mkdtemp(join(tmpdir(), 'aisland-msix-site-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'docs'));
  for (const file of ['index.html', 'docs/index.html']) await cp(join('public', file), join(dir, file));
  const checkout = liveCheckout('prod_123456789AbCdEf');
  await buildStorefront(dir, checkout, '9ABCDEFGHIJK');
  for (const file of ['index.html', 'docs/index.html']) {
    const html = await readFile(join(dir, file), 'utf8');
    assert.ok(html.includes(windowsInstaller('9ABCDEFGHIJK')));
    assert.ok(html.includes(checkout));
    assert.doesNotMatch(html, /href="[^"]*\.exe"/i);
  }
});
