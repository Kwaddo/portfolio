import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const port = 4322;
const base = `http://127.0.0.1:${port}`;
const server = spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', String(port), '--ignore-lock'], { stdio: 'ignore' });

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(`${base}/resume/`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start (run `npm run build` first)');
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${base}/resume/`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: new URL('../public/Ali-Khalaf-CV.pdf', import.meta.url).pathname,
    format: 'A4',
    printBackground: false,
    preferCSSPageSize: true,
  });
  await browser.close();
  console.log('Wrote public/Ali-Khalaf-CV.pdf');
} finally {
  server.kill();
}
