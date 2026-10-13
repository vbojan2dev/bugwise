// Generates the favicon, Apple touch icon and default social share image.
// Run with: node scripts/make-brand-images.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const nodes = JSON.parse(readFileSync(new URL('../node_modules/lucide-static/icon-nodes.json', import.meta.url)))['bug'];
const bugPaths = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');

const icon = (size, radius) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b4bff"/><stop offset="1" stop-color="#00b8a9"/></linearGradient></defs>
  <rect width="64" height="64" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${bugPaths}</g>
</svg>`;

writeFileSync(new URL('../public/favicon.svg', import.meta.url), icon(64, 16));
await sharp(Buffer.from(icon(180, 0))).png().toFile(new URL('../public/apple-touch-icon.png', import.meta.url).pathname);
await sharp(Buffer.from(icon(48, 12))).resize(32, 32).png().toFile(new URL('../public/favicon-32.png', import.meta.url).pathname);

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b4bff"/><stop offset="1" stop-color="#00b8a9"/></linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.8"><stop offset="0" stop-color="#5b4bff" stop-opacity="0.45"/><stop offset="1" stop-color="#0a0b11" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0a0b11"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(80 80)">
    <rect width="88" height="88" rx="22" fill="url(#g)"/>
    <g transform="translate(20 20) scale(2)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${bugPaths}</g>
    <text x="112" y="62" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="#eceef6">Bugwise</text>
  </g>
  <text x="80" y="300" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="#eceef6">Learn manual QA testing</text>
  <text x="80" y="385" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="68" font-weight="800" fill="url(#g)">for mobile apps and websites</text>
  <text x="80" y="480" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" fill="#a3a8ba">Interactive lessons · Bug hunts · Glossary · Interview prep</text>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="24" font-weight="600">
    <rect x="80" y="530" width="150" height="44" rx="22" fill="#1a1d29" stroke="#323748"/><text x="155" y="560" text-anchor="middle" fill="#eceef6">Free</text>
    <rect x="246" y="530" width="210" height="44" rx="22" fill="#1a1d29" stroke="#323748"/><text x="351" y="560" text-anchor="middle" fill="#eceef6">No sign-up</text>
    <rect x="472" y="530" width="250" height="44" rx="22" fill="#1a1d29" stroke="#323748"/><text x="597" y="560" text-anchor="middle" fill="#eceef6">For beginners</text>
  </g>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(new URL('../public/og-default.png', import.meta.url).pathname);
console.log('ok');
