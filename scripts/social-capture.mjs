import {chromium} from '../../desktop-app/node_modules/playwright/index.mjs';

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage({
    viewport: {width: 1200, height: 630},
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  await page.goto('http://127.0.0.1:4173/agent-island/', {waitUntil: 'networkidle'});
  await page.evaluate(() => {
    const hero = document.querySelector('.hero');
    hero.querySelector('.hero-get').remove();
    hero.querySelector('.hero-explore').remove();
    hero.querySelector('figcaption').remove();
    document.body.replaceChildren(hero);
  });
  await page.addStyleTag({content: `
    .hero { width: 1120px; padding: 26px 0 0; margin-inline: auto; }
    .masthead { max-width: 950px; }
    .hero-layout { grid-template-columns: 255px minmax(0, 1fr); margin-top: 12px; }
    .hero-copy { padding: 0 0 40px 12px; }
    .hero-product { width: min(100%, 650px); justify-self: center; }
    .device-composition { padding-top: 3px; }
  `});
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({path: 'public/assets/social.png'});
} finally {
  await browser.close();
}
