import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {loadKiderDataset} from '../b1-directional-sky-radiance/benchmark.js';
import {FIGURE5_SCENES, renderAlgorithm32Figure5Panel} from '../b1-directional-sky-radiance/figure5.js';

function parseArguments(argv) {
	const options = {values: []};
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === '--values') {
			options.values.push(resolve(argv[++index]));
		} else if (argv[index] === '--output') {
			options.output = resolve(argv[++index]);
		} else {
			throw new Error(`Unknown argument: ${argv[index]}`);
		}
	}
	if (options.values.length === 0 || !options.output) throw new Error('--values and --output are required.');
	return options;
}

function loadRows(paths) {
	return paths.flatMap((path) => JSON.parse(readFileSync(path, 'utf8')));
}

function createGrid(rows, time) {
	const grid = Array.from({length: 9}, () => Array(9));
	for (const row of rows.filter((candidate) => candidate.time === time)) grid[row.gridX][row.gridY] = row.values;
	if (grid.some((column) => column.some((values) => values === undefined))) {
		throw new Error(`Incomplete value grid for ${time}.`);
	}
	return grid;
}

function renderDomeSetSvg(panels) {
	const panelSize = 256;
	const gap = 32;
	const margin = 24;
	const headerHeight = 72;
	const footerHeight = 48;
	const width = margin * 2 + panelSize * panels.length + gap * (panels.length - 1);
	const height = headerHeight + panelSize + footerHeight;
	const pieces = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
		'<rect width="100%" height="100%" fill="#ffffff"/>',
		'<text x="24" y="30" font-family="Arial,sans-serif" font-size="22" font-weight="700">Algorithm32 retained-frame J2 — Figure 5 dome times</text>',
		'<text x="24" y="53" font-family="Arial,sans-serif" font-size="13" fill="#4d5156">Band-integrated relative error; score is spectral RMSE in mW m⁻² sr⁻¹ nm⁻¹.</text>',
	];
	for (let index = 0; index < panels.length; index += 1) {
		const panel = panels[index];
		const x = margin + index * (panelSize + gap);
		pieces.push(
			`<image x="${x}" y="${headerHeight}" width="${panelSize}" height="${panelSize}" href="data:image/png;base64,${panel.png.toString('base64')}"/>`,
			`<text x="${x + panelSize / 2}" y="${headerHeight + panelSize + 22}" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="700">${panel.time}</text>`,
			`<text x="${x + panelSize / 2}" y="${headerHeight + panelSize + 42}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13">RMSE ${panel.score.rmseMilliwatt.toFixed(6)}</text>`,
		);
	}
	pieces.push('</svg>', '');
	return pieces.join('\n');
}

const options = parseArguments(process.argv.slice(2));
const rows = loadRows(options.values);
const dataset = loadKiderDataset();
const panels = FIGURE5_SCENES.map((scene) => {
	const condition = dataset.conditions.find((candidate) => candidate.time === scene.time);
	if (!condition) throw new Error(`Missing measurement condition ${scene.time}.`);
	return renderAlgorithm32Figure5Panel(createGrid(rows, scene.time), condition.grid, scene);
});
mkdirSync(options.output, {recursive: true});
for (const panel of panels) {
	writeFileSync(resolve(options.output, `retained-frame-j2-${panel.scene.fileTime}.png`), panel.png);
}
writeFileSync(resolve(options.output, 'retained-frame-j2-domes.svg'), renderDomeSetSvg(panels), 'utf8');
writeFileSync(
	resolve(options.output, 'result.json'),
	`${JSON.stringify(
		{
			configuration: 'retained-z-up-j2',
			panels: panels.map((panel) => ({
				time: panel.time,
				rmseMilliwatt: panel.score.rmseMilliwatt,
				paperRoundedRmseMilliwatt: panel.score.paperRoundedRmseMilliwatt,
				rgbaSha256: panel.rgbaSha256,
				pngSha256: panel.pngSha256,
			})),
		},
		null,
		2,
	)}\n`,
	'utf8',
);
process.stdout.write(`${options.output}\n`);
