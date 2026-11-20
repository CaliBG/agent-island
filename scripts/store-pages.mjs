import { mkdir, writeFile } from 'node:fs/promises';

const supportEmail = 'yzs13968803946@qq.com';
const support = `<a href="mailto:${supportEmail}">${supportEmail}</a>`;

const pages = [
  {
    path: 'pricing',
    title: 'Pricing & support',
    description: 'AISLAND early-bird pricing, delivery and customer support.',
    body: `<h2>Early bird · $10 USD</h2>
      <p>Buy AISLAND once for Mac, Windows and Android. All future AISLAND updates are included.</p>
      <p>The current preview is free. Paid access opens after store approval.</p>
      <p><a href="../#download">Download the free preview ↗</a></p>
      <h2>How delivery works</h2>
      <p>At launch, Creem will process your payment as the merchant of record. Open the order link in your receipt email to download the installers. The checkout shows the final total and the payment methods available to you.</p>
      <details><summary>Try the test checkout</summary><p>This sandbox order uses test payment details and delivers a sample ZIP. No money is collected. <a href="https://www.creem.io/test/payment/prod_7SLLY1St8SpVLXLvvjizEj" rel="nofollow">Open Creem test checkout ↗</a></p></details>
      <h2 id="contact">Contact support</h2>
      <p>For installation help, order questions or feedback, email ${support}. For help with a purchase, include your order number.</p>`,
  },
  {
    path: 'privacy',
    title: 'Privacy policy',
    description: 'How AISLAND handles local agent activity, optional mobile sync, orders and support emails.',
    body: `<h2>Agent activity</h2>
      <p>AISLAND reads activity from agents you connect. The desktop app stores session information on your computer. You can manage session records in the app. <a href="../docs/#privacy">See local storage and retention details</a>.</p>
      <h2>Mobile sync</h2>
      <p>If you enable phone sync, your paired devices encrypt task summaries and instructions before sending them through the relay. The relay uses connection identifiers to deliver them. Each connected agent also operates under its own privacy policy.</p>
      <h2>Website and orders</h2>
      <p>Our website hosts receive the network information needed to serve pages and downloads, including your IP address. Creem processes checkout information, including the buyer email, payment details and order information. We use purchase records to deliver downloads, help with receipts and resolve refund requests. <a href="https://www.creem.io/privacy">Creem’s privacy policy</a>.</p>
      <h2>Contact and requests</h2>
      <p>We use your email address and the information you send to handle your request. If you choose to support the project and request follow-up, we use your email to thank you and invite feedback. You can ask us to stop contacting you, or ask about access, correction or deletion of your information, at ${support}. We may need to keep transaction records required by law.</p>`,
  },
  {
    path: 'terms',
    title: 'Terms of service',
    description: 'The terms for using AISLAND and purchasing early-bird access.',
    body: `<h2>Using AISLAND</h2>
      <p>AISLAND displays progress for connected agents and lets you continue supported tasks. Use it with devices, agents and accounts you are authorized to control. Agent subscriptions and third-party services are managed separately.</p>
      <h2>Early-bird access</h2>
      <p>The early-bird offer is a one-time purchase of $10 USD and includes all future AISLAND updates. Check the <a href="../docs/#install">installation guide</a> for supported platforms and requirements. The currently published preview is free.</p>
      <h2>Payments and delivery</h2>
      <p>When sales open, Creem will process purchases as the merchant of record. Your receipt email provides access to your order and downloads. The <a href="https://www.creem.io/buyer-terms">Creem buyer terms</a> and our <a href="../refunds/">refund policy</a> apply to purchases.</p>
      <h2>Questions</h2><p>For product or order support, contact ${support}.</p>`,
  },
  {
    path: 'refunds',
    title: 'Refund policy',
    description: 'When an AISLAND purchase qualifies for a refund and how to request one.',
    body: `<h2>Duplicate charges and delivery problems</h2>
      <p>If the same purchase was charged twice, we will refund the duplicate charge. If you paid and cannot obtain your installers, contact us so we can restore access. If we cannot deliver your purchase, we will arrange a refund.</p>
      <p>Change-of-mind purchases are generally final. This policy preserves all mandatory consumer rights, including any cancellation or refund rights that apply where you live.</p>
      <h2>Request a refund</h2>
      <p>Email ${support} with the email used at checkout, your Creem order number and a short description of what happened. Please omit payment card details.</p>
      <p>Approved refunds are processed through Creem to the original payment method. The time to appear on your statement depends on the payment provider.</p>`,
  },
];

export async function writeStorePages() {
  for (const page of pages) {
    const nav = pages.map(({ path, title }) =>
      `<a href="../${path}/"${path === page.path ? ' aria-current="page"' : ''}>${title}</a>`
    ).join('\n');
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${page.description}">
  <meta name="theme-color" content="#08090b">
  <title>${page.title} — AISLAND</title>
  <link rel="canonical" href="https://aisland.caliyang.cn/${page.path}/">
  <link rel="icon" href="../assets/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../marketing.css">
  <link rel="stylesheet" href="../docs.css">
  <link rel="stylesheet" href="../night.css">
</head>
<body class="landing">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="header"><div class="header-inner container">
    <a class="brand" href="../"><img src="../assets/wordmark.svg" width="138" height="29" alt="AISLAND home"></a>
    <a class="nav-download" href="../#download">Download preview ↗</a>
  </div></header>
  <div class="container docs-layout">
    <nav class="docs-sidebar" aria-label="Customer information">${nav}</nav>
    <main class="docs-content" id="main"><h1>${page.title}</h1>${page.body}</main>
  </div>
</body>
</html>\n`;
    await mkdir(`dist/${page.path}`, { recursive: true });
    await writeFile(`dist/${page.path}/index.html`, html);
  }
}
