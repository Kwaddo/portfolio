import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { postFilename } from '../src/lib/journal.ts';

const dir = new URL('../src/content/journal/', import.meta.url);
mkdirSync(dir, { recursive: true });

const iso = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const name = postFilename(readdirSync(dir), iso);
const project = process.argv[2];

const front = ['---', `date: ${iso}`, 'tags: []', ...(project ? [`project: ${project}`] : []), '---', '', ''].join('\n');
writeFileSync(new URL(name, dir), front);
console.log(`Created src/content/journal/${name}`);
