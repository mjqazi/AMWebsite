// Generated files are committed so GitHub Pages needs no runtime build system.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { transform } from 'esbuild';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

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
const digest = data => createHash('sha256').update(data).digest('hex');
const manifestPath = path.join(root, 'tools/logo-assets.json');
const recipe = (await readFile(fileURLToPath(import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const manifest = { recipe: digest(recipe), logos: {} };
// AVIF encoders can produce different bytes across operating systems. Verify
// committed outputs against the build manifest instead of re-encoding in CI.
const recorded = check ? JSON.parse(await readFile(manifestPath, 'utf8')) : null;
if (check && recorded.recipe !== manifest.recipe) {
  console.error('Logo build recipe changed. Run npm run build.');
  stale = true;
}
for (const logo of logos) {
  const source = path.join(root, 'images', `${logo}.png`);
  const entry = { source: digest(await readFile(source)), files: {} };
  const image = sharp(source).resize({ width: 360, withoutEnlargement: true });
  for (const format of ['webp', 'avif', 'png']) {
    const destination = path.join(root, 'images', `${logo}-display.${format}`);
    if (check) {
      const current = await readFile(destination).catch(() => Buffer.alloc(0));
      if (recorded.logos[logo]?.source !== entry.source || recorded.logos[logo]?.files[format] !== digest(current)) {
        console.error(`Stale logo asset: ${logo}-display.${format}`);
        stale = true;
      }
    } else {
      const output = await image.clone().toFormat(format, { quality: 75 }).toBuffer();
      await writeFile(destination, output);
      entry.files[format] = digest(output);
    }
  }
  manifest.logos[logo] = entry;
}
if (!check) await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
if (stale) process.exitCode = 1;
