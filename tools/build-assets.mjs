// Generated files are committed so GitHub Pages needs no runtime build system.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { transform } from 'esbuild';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
const files = ['css/styles.css', 'css/timesheet.css', 'js/main.js', 'js/cost-calculator.js'];
let stale = false;
for (const name of files) {
  const source = await readFile(path.join(root, name), 'utf8');
  const loader = name.endsWith('.css') ? 'css' : 'js';
  const result = await transform(source, {
    loader, minify: true, target: ['es2020'], legalComments: 'none', charset: 'utf8',
  });
  const destination = path.join(root, name.replace(/\.(css|js)$/, '.min.$1'));
  if (check) {
    if (await readFile(destination, 'utf8').catch(() => '') !== result.code) {
      console.error(`Stale generated asset: ${name}. Run npm run build.`);
      stale = true;
    }
  } else {
    await writeFile(destination, result.code);
    console.log(`${name}: ${Buffer.byteLength(source)} → ${Buffer.byteLength(result.code)} bytes`);
  }
}

// Resize existing approved logos without changing their artwork or aspect ratio.
const logos = ['Synergy', 'Rio-Tinto', 'Fortescue', 'Evolution-Mining', 'Endeavour-Mining', 'CBH-Group'];
for (const logo of logos) {
  const source = path.join(root, 'images', `${logo}.png`);
  const image = sharp(source).resize({ width: 360, withoutEnlargement: true });
  for (const format of ['webp', 'avif', 'png']) {
    const output = await image.clone().toFormat(format, { quality: 75 }).toBuffer();
    const destination = path.join(root, 'images', `${logo}-display.${format}`);
    if (check) {
      const current = await readFile(destination).catch(() => Buffer.alloc(0));
      if (!current.equals(output)) {
        console.error(`Stale logo asset: ${logo}-display.${format}`);
        stale = true;
      }
    } else {
      await writeFile(destination, output);
    }
  }
}
if (stale) process.exitCode = 1;
