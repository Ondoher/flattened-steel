import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {parseMeasurementPacketBoundary} from '../generate-benchmark-figures.js';
import {parseSpectraTsv} from './benchmark.js';
import {
	FIGURE5_ERROR_COLORS,
	FIGURE5_CANDIDATE_DEFINITIONS,
	FIGURE5_PUBLISHED_PANELS,
	FIGURE5_SCENES,
	getFigure5ErrorColor,
	loadPublishedFigure5Panels,
	renderAlgorithm32Figure5Panel,
	renderFigure5ComparisonSvg,
} from './figure5.js';

const RESULT_DIRECTORY = fileURLToPath(
	new URL('../../../references/results/experiments/b1-directional-sky-radiance/', import.meta.url),
);

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function loadAcceptedBoundaries() {
	const measurementPath = join(RESULT_DIRECTORY, 'measurement-boundary.tsv');
	const algorithm32Path = join(RESULT_DIRECTORY, 'algorithm32-proposed.tsv');
	const algorithm32J2Path = join(RESULT_DIRECTORY, 'algorithm32-j2-proposed.tsv');
	const algorithm32J3Path = join(RESULT_DIRECTORY, 'algorithm32-j3-proposed.tsv');
	const algorithm32J4Path = join(RESULT_DIRECTORY, 'algorithm32-j4-proposed.tsv');
	const algorithm32J5Path = join(RESULT_DIRECTORY, 'algorithm32-j5-proposed.tsv');
	return Object.freeze({
		measurements: parseMeasurementPacketBoundary(readFileSync(measurementPath, 'utf8'), measurementPath),
		algorithm32: parseSpectraTsv(algorithm32Path).get('proposed'),
		algorithm32J2: parseSpectraTsv(algorithm32J2Path).get('proposed'),
		algorithm32J3: parseSpectraTsv(algorithm32J3Path).get('proposed'),
		algorithm32J4: parseSpectraTsv(algorithm32J4Path).get('proposed'),
		algorithm32J5: parseSpectraTsv(algorithm32J5Path).get('proposed'),
	});
}

test('published Figure 5 panels are the 27 pinned PDF image XObjects', () => {
	const panels = loadPublishedFigure5Panels();
	assert.equal(panels.length, 27);
	assert.equal(FIGURE5_PUBLISHED_PANELS.length, 27);
	assert.deepEqual(
		panels.map((panel) => panel.pdfXObject),
		Array.from({length: 27}, (_, index) => `Im${158 + index}`),
	);
	assert.deepEqual(
		panels.map((panel) => panel.pdfObjectNumber),
		Array.from({length: 27}, (_, index) => 663 + index),
	);
	for (const panel of panels) {
		assert.equal(panel.sha256, panel.expectedSha256);
		assert.equal(sha256(panel.png), panel.expectedSha256);
		assert.deepEqual(panel.pngIdentity, {
			width: 256,
			height: 256,
			bitDepth: 8,
			colorType: 6,
			compressionMethod: 0,
			filterMethod: 0,
			interlaceMethod: 0,
		});
	}
});

test('Figure 5 palette retains the published 41 discrete relative-error colors', () => {
	assert.equal(FIGURE5_ERROR_COLORS.length, 41);
	assert.deepEqual(getFigure5ErrorColor(-2), [8, 54, 106]);
	assert.deepEqual(getFigure5ErrorColor(0), [248, 243, 240]);
	assert.deepEqual(getFigure5ErrorColor(2), [103, 0, 31]);
	assert.deepEqual(getFigure5ErrorColor(-100), [8, 54, 106]);
	assert.deepEqual(getFigure5ErrorColor(100), [103, 0, 31]);
});

test(
	'Algorithm32 Figure 5 panels reproduce the accepted B1 scores and pinned pixels',
	{
		timeout: 30000,
	},
	() => {
		const {measurements, algorithm32} = loadAcceptedBoundaries();
		const expectedRmse = [12.205531110776187, 14.334822365884557, 15.334946666769843];
		const expectedCenters = [
			[184, 118],
			[168, 111],
			[130, 97],
		];
		for (let index = 0; index < FIGURE5_SCENES.length; index += 1) {
			const scene = FIGURE5_SCENES[index];
			const first = renderAlgorithm32Figure5Panel(
				algorithm32.get(scene.time),
				measurements.get(scene.time),
				scene,
			);
			const second = renderAlgorithm32Figure5Panel(
				algorithm32.get(scene.time),
				measurements.get(scene.time),
				scene,
			);
			assert.ok(Math.abs(first.score.rmseMilliwatt - expectedRmse[index]) < 1e-12);
			assert.equal(first.rgbaSha256, scene.algorithm32RgbaSha256);
			assert.equal(sha256(first.pixels), scene.algorithm32RgbaSha256);
			assert.deepEqual(first.annotations.sun, {
				centerX: expectedCenters[index][0],
				centerY: expectedCenters[index][1],
			});
			assert.equal(first.annotations.sampleCenters.length, 81);
			assert.ok(first.relativeErrorGrid.flat().every(Number.isFinite));
			assert.ok(first.png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
			assert.ok(first.png.equals(second.png));
			assert.equal(first.pixels[3], 0);
			assert.equal(first.pixels[(128 + 128 * 256) * 4 + 3], 255);
		}
	},
);

test(
	'Algorithm32 J2 through J5 Figure 5 panels are deterministic and match pinned pixels',
	{
		timeout: 30000,
	},
	() => {
		const {measurements, algorithm32J2, algorithm32J3, algorithm32J4, algorithm32J5} = loadAcceptedBoundaries();
		for (const candidate of [
			{boundary: algorithm32J2, hashKey: 'algorithm32J2RgbaSha256'},
			{boundary: algorithm32J3, hashKey: 'algorithm32J3RgbaSha256'},
			{boundary: algorithm32J4, hashKey: 'algorithm32J4RgbaSha256'},
			{boundary: algorithm32J5, hashKey: 'algorithm32J5RgbaSha256'},
		]) {
			for (const scene of FIGURE5_SCENES) {
				const first = renderAlgorithm32Figure5Panel(
					candidate.boundary.get(scene.time),
					measurements.get(scene.time),
					scene,
				);
				const second = renderAlgorithm32Figure5Panel(
					candidate.boundary.get(scene.time),
					measurements.get(scene.time),
					scene,
				);
				assert.ok(Number.isFinite(first.score.rmseMilliwatt));
				assert.equal(first.rgbaSha256, scene[candidate.hashKey]);
				assert.equal(sha256(first.pixels), scene[candidate.hashKey]);
				assert.equal(first.annotations.sampleCenters.length, 81);
				assert.ok(first.relativeErrorGrid.flat().every(Number.isFinite));
				assert.ok(first.png.equals(second.png));
			}
		}
	},
);

test(
	'Figure 5 comparison is self-contained and presents selected J4 as Algorithm32',
	{
		timeout: 30000,
	},
	() => {
		const {measurements, algorithm32J4} = loadAcceptedBoundaries();
		const published = loadPublishedFigure5Panels();
		const algorithm32Panels = FIGURE5_SCENES.map((scene) =>
			renderAlgorithm32Figure5Panel(algorithm32J4.get(scene.time), measurements.get(scene.time), scene),
		);
		const first = renderFigure5ComparisonSvg(published, algorithm32Panels, {
			source: '<synthetic & escaped>',
			candidateLabel: 'Algorithm32',
			selectedMaximumScatteringOrder: 4,
		});
		const second = renderFigure5ComparisonSvg(published, algorithm32Panels, {
			source: '<synthetic & escaped>',
			candidateLabel: 'Algorithm32',
			selectedMaximumScatteringOrder: 4,
		});
		assert.equal(first, second);
		assert.deepEqual(
			FIGURE5_CANDIDATE_DEFINITIONS.map(({model}) => model),
			['algorithm32'],
		);
		assert.equal((first.match(/<image /g) ?? []).length, 30);
		assert.equal((first.match(/data-model="algorithm32"/g) ?? []).length, 3);
		assert.doesNotMatch(first, /data-model="algorithm32-j[2-5]"/);
		assert.match(first, /Nishita93/);
		assert.match(first, /libRadtran/);
		assert.match(first, />Algorithm32<\/text>/);
		assert.doesNotMatch(first, />Algorithm32 \(Default\)<\/text>/);
		assert.doesNotMatch(first, />Algorithm32 J[2-5]<\/text>/);
		assert.match(first, />11\.3<\/text>/);
		assert.match(first, />12<\/text>/);
		assert.match(first, />12\.5<\/text>/);
		assert.match(first, /fill="#ffffff" stroke="#b00020"/);
		assert.doesNotMatch(first, /stroke="#b00020"[^>]*stroke-dasharray/);
		assert.doesNotMatch(first, /stroke="#005a9c"/);
		assert.doesNotMatch(first, /stroke="#137333"/);
		assert.doesNotMatch(first, /stroke="#6a1b9a"/);
		assert.doesNotMatch(first, /stroke="#ad5700"/);
		assert.match(first, /&lt;synthetic &amp; escaped&gt;/);
		assert.doesNotMatch(first, /(?:href|src)=["']https?:\/\//);
	},
);
