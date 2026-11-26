import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const ordersUrl = 'https://www.creem.io/my-orders/login';
export const sandboxProduct = 'prod_7SLLY1St8SpVLXLvvjizEj';

export function liveCheckout(value = '') {
  const input = value.trim();
  if (!input) return null;
  const match = /^(?:https:\/\/(?:www\.)?creem\.io\/(?:product|payment)\/)?(prod_[A-Za-z0-9]+)\/?$/.exec(input);
  if (!match || match[1] === sandboxProduct) {
    throw new Error('AISLAND_CREEM_LIVE_CHECKOUT must be a live Creem product ID or its official Creem product link. Sandbox links cannot enable sales.');
  }
  return `https://www.creem.io/product/${match[1]}`;
}

export function windowsInstaller(storeId = '') {
  const id = storeId.trim().toUpperCase();
  if (!id) return null;
  if (!/^[A-Z0-9]{12}$/.test(id)) throw Error('Expected the 12-character Partner Center Store ID.');
  return 'https://get.microsoft.com/installer/download/' + id + '?referrer=appbadge&amp;source=aisland.caliyang.cn';
}

export async function buildStorefront(directory, checkout, storeId = '') {
  const installer = windowsInstaller(storeId);
  const sections = {
    hero: `<div class="hero-actions"><span data-hover-button data-variant="light"><a class="button-fallback" href="${checkout}">Get AISLAND · $10</a></span><span data-hover-button><a class="button-fallback secondary" href="${ordersUrl}">My downloads</a></span></div>`,
    downloads: `<div class="desktop-downloads">
          <article class="download-row"><img src="./assets/icon.svg" width="26" height="26" alt=""><div><h3>Lifetime access</h3><p>Mac, Windows and Android. Pay once for all future updates.</p></div><span data-hover-button data-variant="light"><a class="button-fallback" href="${checkout}">Buy AISLAND · $10</a></span></article>
          <nav class="download-help" aria-label="Customer links"><a href="./docs/#install">Installation guide</a><a href="./updates/">Release notes</a><a href="./pricing/#contact">Order support</a></nav>
        </div>
        <aside class="mobile-download"><h3>Already purchased?</h3><div class="mobile-links"><a href="${ordersUrl}">Open my Creem order <span aria-hidden="true">↗</span></a><a href="./mobile/">Open mobile web <span aria-hidden="true">↗</span></a></div></aside>`,
    docsIntro: `After <a href="${checkout}">purchasing lifetime access</a>, open the order in your Creem receipt email and download the file for your platform.`,
    macInstall: `Sign in to <a href="${ordersUrl}">your Creem orders</a> with your checkout email. Download the Apple silicon Mac installer, open it and move AISLAND to Applications.`,
    windowsInstall: `From <a href="${ordersUrl}">your Creem order</a>, download the Windows x64 installer and follow the prompts.`,
    verify: 'The Mac installer is Developer ID signed and notarized by Apple. The Windows x64 installer is unsigned and may trigger a SmartScreen warning. On first launch, connect to the internet and activate with your purchase email and the code sent to it. After activation, you can use AISLAND offline on this computer. A fresh installation can be activated again using the same purchase.',
    androidInstall: `or install the Android APK from <a href="${ordersUrl}">your Creem order</a>.`,
    docsFooter: `AISLAND · <a href="../">Back to website</a> · <a href="../pricing/#contact">Contact support</a> · <a href="${ordersUrl}">My downloads</a>`,
  };
  if (installer && checkout) {
    const button = `<span data-hover-button><a class="button-fallback secondary" href="${installer}">Install for Windows</a></span>`;
    sections.hero = `<div class="hero-actions"><span data-hover-button data-variant="light"><a class="button-fallback" href="${checkout}">Get AISLAND · $10</a></span>${button}</div>`;
    sections.downloads = sections.downloads.replace('<nav class="download-help"', `<article class="download-row"><img src="./assets/icon.svg" width="26" height="26" alt=""><div><h3>Windows</h3><p>Install from Microsoft, then activate with your purchase email.</p></div>${button}</article><nav class="download-help"`);
    sections.windowsInstall = `<a href="${installer}">Install AISLAND from Microsoft</a>. Open the app and enter your Creem checkout email and the code sent to it. Your lifetime purchase works offline after activation.`;
    sections.verify = 'Use the Microsoft Store installer linked here for Windows. For Mac, use the installer in your Creem order.';
  }
  for (const filename of ['index.html', 'docs/index.html']) {
    const path = join(directory, filename);
    const source = await readFile(path, 'utf8');
    const html = source.replace(/<!--store:(\w+)-->([\s\S]*?)<!--\/store-->/g, (_, name, preview) => {
      if (!Object.hasOwn(sections, name)) throw new Error(`Unknown store section: ${name}`);
      return checkout ? sections[name] : preview;
    });
    await writeFile(path, html);
  }
}
