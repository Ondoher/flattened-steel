import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { loadKiderDataset } from './benchmark.js';

const dataset = loadKiderDataset();
const lines = [
  ['time', 'grid_x', 'grid_y', ...Array.from({ length: 40 }, (_, i) => `lambda_${i}`)].join('\t')
];
for (const condition of dataset.conditions) {
  for (let x = 0; x < 9; x += 1) {
    for (let y = 0; y < 9; y += 1) {
      lines.push([condition.time, x, y, ...Array.from(condition.grid[x][y], (value) => value.toPrecision(17))].join('\t'));
    }
  }
}
const text = `${lines.join('\n')}\n`;
const resultDirectoryUrl = new URL('../../../references/results/experiments/b1-directional-sky-radiance/', import.meta.url);
const resultDirectory = fileURLToPath(resultDirectoryUrl);
const outputPath = fileURLToPath(new URL('measurement-boundary.tsv', resultDirectoryUrl));
const hashPath = fileURLToPath(new URL('measurement-boundary.sha256', resultDirectoryUrl));
mkdirSync(resultDirectory, { recursive: true });
writeFileSync(outputPath, text, 'utf8');
const sha256 = createHash('sha256').update(text).digest('hex');
writeFileSync(hashPath, `${sha256}  measurement-boundary.tsv\n`, 'ascii');
console.log(`Wrote ${dataset.spectrumCount} repaired 40-sample spectra to ${outputPath}`);
console.log(`SHA-256: ${sha256}`);
