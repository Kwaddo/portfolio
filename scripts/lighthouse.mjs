import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const result = spawnSync('npx', ['lhci', 'autorun'], {
  stdio: 'inherit',
  env: { ...process.env, CHROME_PATH: chromium.executablePath() },
});
process.exit(result.status ?? 1);
