// Generates logo images for emails (upload them to Kit). Run with: node scripts/make-email-images.mjs
// Emails need PNGs (no SVG) at 2x size for sharp rendering on phones.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';

const nodes = JSON.parse(readFileSync(new URL('../node_modules/lucide-static/icon-nodes.json', import.meta.url)))['bug'];
const bug = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
const grad = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b4bff"/><stop offset="1" stop-color="#00b8a9"/></linearGradient>`;
const mark = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 64})">
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  <g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${bug}</g>
</g>`;
const out = (name) => new URL(`../brand/email/${name}`, import.meta.url).pathname;
mkdirSync(new URL('../brand/email/', import.meta.url), { recursive: true });

// 1. Icon only: works on light and dark backgrounds. Show it at 48-64 px.
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><defs>${grad}</defs>${mark(0, 0, 192)}</svg>`))
  .png()
  .toFile(out('bugwise-icon-192.png'));

// 2. Icon + name, for light templates (white background). Show it at 240 px wide.
const lockup = (textColor, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="128" viewBox="0 0 480 128"><defs>${grad}</defs>
  ${bg ? `<rect width="480" height="128" fill="${bg}"/>` : ''}
  ${mark(16, 16, 96)}
  <text x="132" y="83" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="54" font-weight="700" letter-spacing="-1" fill="${textColor}">Bugwise</text>
</svg>`;
await sharp(Buffer.from(lockup('#14161f', '#ffffff'))).png().toFile(out('bugwise-logo-light-480.png'));
// 3. Same for dark templates.
await sharp(Buffer.from(lockup('#eceef6', '#0a0b11'))).png().toFile(out('bugwise-logo-dark-480.png'));
console.log('ok');
