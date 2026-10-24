import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const out = new URL('../public/og/', import.meta.url);
mkdirSync(out, { recursive: true });

const svg = ({ title, sub, invert }) => {
  const bg = invert ? '#0a0a0a' : '#fafafa';
  const fg = invert ? '#fafafa' : '#0a0a0a';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.6" fill="${fg}" fill-opacity="0.14"/></pattern></defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="${fg}" stroke-width="8"/>
  <polygon points="${W - 380},${H - 38} ${W - 38},${H - 38} ${W - 38},${H - 330}" fill="${fg}"/>
  <text x="90" y="${H / 2 + 10}" font-family="Impact, 'Arial Narrow', sans-serif" font-size="150" fill="${fg}" letter-spacing="2">${title}</text>
  <text x="94" y="${H / 2 + 90}" font-family="Helvetica, Arial, sans-serif" font-size="44" fill="${fg}" fill-opacity="0.85">${sub}</text>
</svg>`;
};

const cards = {
  landing: { title: 'ALI KHALAF', sub: 'Software Engineer', invert: false },
  work: { title: 'WORK', sub: 'Roles and the systems behind them', invert: false },
  personal: { title: 'PERSONAL', sub: 'Games, experiments and their stories', invert: true },
  journal: { title: 'JOURNAL', sub: 'Short daily notes', invert: false },
  about: { title: 'ABOUT', sub: 'A software engineer from Bahrain', invert: true },
};

for (const [name, card] of Object.entries(cards)) {
  await sharp(Buffer.from(svg(card))).png().toFile(new URL(`${name}.png`, out).pathname);
  console.log(`public/og/${name}.png`);
}
