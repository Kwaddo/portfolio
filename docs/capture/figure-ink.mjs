// Manga inking: photo + foreground mask -> flat black/paper PNG with alpha.
import sharp from 'sharp';
const [,, src, maskSrc, out, optJson = '{}'] = process.argv;
const o = Object.assign({ H: 1200, period: 8, dark: 70, light: 195, edgeT: 10, sobelT: 110, gain: 1.25, lift: 0, median: 9, lin: 1.15, off: -10, s1: 1.4, s2: 4, hatchLo: 0, hatchHi: 0, halo: 7, line: 4, crop: null, thick: 1, open: 0, hatch: 0, hp: 7, hw: 2, hmin: 0.15 }, JSON.parse(optJson));
const PAPER = 250, INK = 10;

let base = sharp(src).rotate();
if (o.crop) base = base.extract(o.crop);
const meta = await base.clone().metadata();
const H = o.H, W = Math.round(meta.width * H / meta.height);
const gray0 = await base.clone().resize(W, H).removeAlpha().greyscale().linear(o.lin, o.off).raw().toBuffer();
const gray = gray0;
const g = (b) => sharp(b, { raw: { width: W, height: H, channels: 1 } });
const b1 = await g(gray).blur(o.s1).toColourspace("b-w").raw().toBuffer();
const b2 = await g(gray).blur(o.s2).toColourspace("b-w").raw().toBuffer();
const sm = await g(gray).median(o.median).blur(1.2).toColourspace("b-w").raw().toBuffer();
let maskImg = sharp(maskSrc); if (o.crop) maskImg = maskImg.extract(o.crop);
const mask = await maskImg.clone().resize(W, H).removeAlpha().greyscale().raw().toBuffer();
// morphological opening (blur + threshold twice) detaches thin strips such as ropes before the component filter
if (o.open) {
  const er = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(o.open).toColourspace('b-w').raw().toBuffer();
  const erb = Buffer.alloc(W * H); for (let i = 0; i < W * H; i++) erb[i] = er[i] > 215 ? 255 : 0;
  const di = await sharp(erb, { raw: { width: W, height: H, channels: 1 } }).blur(o.open).toColourspace('b-w').raw().toBuffer();
  for (let i = 0; i < W * H; i++) if (di[i] < 40) mask[i] = 0;
}
// keep the largest connected component of the mask (drops ropes, stray blobs)
{
  const seen = new Uint8Array(W * H); let best = null;
  for (let i0 = 0; i0 < W * H; i0++) {
    if (mask[i0] <= 110 || seen[i0]) continue;
    const stack = [i0]; const comp = []; seen[i0] = 1;
    while (stack.length) { const i = stack.pop(); comp.push(i); const x = i % W, y = (i - x) / W;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (!seen[j] && mask[j] > 110) { seen[j] = 1; stack.push(j); } } }
    if (!best || comp.length > best.length) best = comp;
  }
  const keep = new Uint8Array(W * H); for (const i of best) keep[i] = 1;
  for (let i = 0; i < W * H; i++) if (!keep[i]) mask[i] = 0;
}
const maskHalo = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(o.halo).toColourspace("b-w").raw().toBuffer();
const maskLine = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(o.halo + o.line).toColourspace("b-w").raw().toBuffer();

const edge = new Uint8Array(W * H);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const i = y * W + x;
  if (b2[i] - b1[i] > o.edgeT) { edge[i] = 1; continue; }
  const gx = -b1[i-W-1] - 2*b1[i-1] - b1[i+W-1] + b1[i-W+1] + 2*b1[i+1] + b1[i+W+1];
  const gy = -b1[i-W-1] - 2*b1[i-W] - b1[i-W+1] + b1[i+W-1] + 2*b1[i+W] + b1[i+W+1];
  if (Math.hypot(gx, gy) > o.sobelT) edge[i] = 1;
}
for (let t = 0; t < o.thick; t++) { const e2 = new Uint8Array(edge); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (edge[i]) { e2[i+1] = 1; e2[i+W] = 1; e2[i+W+1] = 1; e2[i-1] = 1; } } edge.set(e2); }
const outBuf = Buffer.alloc(W * H * 4);
const P = o.period, R = P / 2, s2 = Math.SQRT1_2;
const idx = (x, y) => y * W + x;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = idx(x, y), m = mask[i];
  let a = 0, v = PAPER;
  if (m > 110) {
    a = 255;
    // tone
    let L = (sm[i] - 128) * o.gain + 128 + o.lift; L = L < 0 ? 0 : L > 255 ? 255 : L;
    let ink = false;
    if (L <= o.dark) ink = true;
    else if (L < o.light) {
      // rotated halftone grid
      const u = (x + y) * s2, w = (x - y) * s2;
      const du = u - (Math.floor(u / P) + 0.5) * P, dw = w - (Math.floor(w / P) + 0.5) * P;
      const darkness = (o.light - L) / (o.light - o.dark);
      if (o.hatch) {
        const hp = o.hp, hw = o.hw;
        const h1 = (((x - y) % hp) + hp) % hp < hw;
        const h2 = (((x + y) % hp) + hp) % hp < hw;
        const h3 = (x % hp) < hw;
        if (darkness > 0.72) ink = h1 || h2 || h3; else if (darkness > 0.42) ink = h1 || h2; else if (darkness > o.hmin) ink = h1;
      } else {
        const r = R * 1.2 * Math.sqrt(darkness);
        if (du * du + dw * dw < r * r) ink = true;
      }
      if (o.hatchHi > o.hatchLo && L > o.hatchLo && L < o.hatchHi && (((x - y) % 7) + 7) % 7 < 2) ink = true;
    }
    if (edge[i]) ink = true;
    v = ink ? INK : PAPER;
  } else if (maskHalo[i] > 28) { a = 255; v = PAPER; }
  else if (maskLine[i] > 22) { a = 255; v = INK; }
  const p = i * 4; outBuf[p] = outBuf[p+1] = outBuf[p+2] = v; outBuf[p+3] = a;
}
const png = await sharp(outBuf, { raw: { width: W, height: H, channels: 4 } }).trim().png({ palette: true, colours: 4, compressionLevel: 9 }).toBuffer();
await sharp(png).toFile(out);
const m2 = await sharp(png).metadata();
console.log(out, m2.width + 'x' + m2.height, Math.round(png.length / 1024) + ' KB');
