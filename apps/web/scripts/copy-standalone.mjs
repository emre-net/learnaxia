import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const staticSrc = path.join(webRoot, '.next', 'static');
const publicSrc = path.join(webRoot, 'public');

console.log('[copy-standalone] Source static:', staticSrc);
console.log('[copy-standalone] Source public:', publicSrc);

const targets = [
  path.join(webRoot, '.next', 'standalone', 'apps', 'web'),
  path.join(webRoot, '.next', 'standalone')
];

for (const target of targets) {
  if (!fs.existsSync(target)) {
    console.warn(`[copy-standalone] Target dir ${target} does not exist yet. Creating...`);
    fs.mkdirSync(target, { recursive: true });
  }

  // Copy .next/static
  if (fs.existsSync(staticSrc)) {
    const staticDest = path.join(target, '.next', 'static');
    fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
    console.log(`[copy-standalone] Copied .next/static -> ${staticDest}`);
  } else {
    console.warn(`[copy-standalone] Warning: staticSrc does not exist: ${staticSrc}`);
  }

  // Copy public
  if (fs.existsSync(publicSrc)) {
    const publicDest = path.join(target, 'public');
    fs.mkdirSync(path.dirname(publicDest), { recursive: true });
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log(`[copy-standalone] Copied public -> ${publicDest}`);
  } else {
    console.warn(`[copy-standalone] Warning: publicSrc does not exist: ${publicSrc}`);
  }
}

console.log('[copy-standalone] Asset copying completed.');
