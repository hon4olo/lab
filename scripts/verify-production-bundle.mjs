import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDirectory = new URL('../dist/assets/', import.meta.url);
const files = await readdir(outputDirectory);
const bundles = await Promise.all(
  files.filter((file) => file.endsWith('.js'))
    .map((file) => readFile(join(outputDirectory.pathname, file), 'utf8')),
);

if (bundles.length === 0) throw new Error('Production build did not emit a JavaScript bundle.');

const productionJavaScript = bundles.join('\n');
const developmentMarkers = [
  'window.SNACK_LAB',
  'installDebugBridge',
  'Open development asset preview',
  'data-snack-lab-qa-control',
];
const leakedMarkers = developmentMarkers.filter((marker) => productionJavaScript.includes(marker));
if (leakedMarkers.length > 0) {
  throw new Error(`Development tooling leaked into production JavaScript: ${leakedMarkers.join(', ')}`);
}

console.log('Verified: development diagnostics and asset QA controls are absent from production JavaScript.');
