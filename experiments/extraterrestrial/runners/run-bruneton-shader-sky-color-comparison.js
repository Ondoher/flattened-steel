import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';

import GATE_CONTRACT from '../fixtures/bruneton-b1-sky-color-gate-v1.json' with {type: 'json'};

import {
	assertExistingRealPathContained,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual} from '../harness/lib/hashes.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {REPOSITORY_ROOT} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-bruneton-shader-sky-color-comparison.js';
requireCondition(GATE_CONTRACT.schemaId === 'bruneton-b1-sky-color-gate-v1', 'Unknown sky-color gate contract.');
const PUBLISHED_TABLE = path.join(REPOSITORY_ROOT, ...GATE_CONTRACT.oracle.source.split('/'));
const SHADER_TABLE = path.join(
	REPOSITORY_ROOT,
	'references/results/experiments/b1-directional-sky-radiance/gpu/algorithm32-current-production-gpu-j4.tsv',
);
const CIE_TABLE = path.join(REPOSITORY_ROOT, 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv');
const BRUNETON_ORACLE = Object.freeze({...GATE_CONTRACT.oracle});
const COLOR_REQUIREMENTS = Object.freeze({...GATE_CONTRACT.requirements});
const TIMES = Object.freeze(
	Array.from({length: 17}, (_, index) => {
		const minutes = 9 * 60 + 30 + index * 15;
		return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
	}),
);
const WAVELENGTHS = Object.freeze(Array.from({length: 40}, (_, index) => 360 + ((830 - 360) * index) / 40));
const SAMPLE_WIDTH_NM = (830 - 360) / 40;
const TONE_MAP_K = 1 / (5 * 683);
const XYZ_TO_LINEAR_SRGB = Object.freeze([
	Object.freeze([3.2406, -1.5372, -0.4986]),
	Object.freeze([-0.9689, 1.8758, 0.0415]),
	Object.freeze([0.0557, -0.204, 1.057]),
]);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function parseTsv(text, selectedModel) {
	const lines = text.trim().split(/\r?\n/u);
	const header = lines.shift().split('\t');
	const indices = {
		model: header.indexOf('model'),
		time: header.indexOf('time'),
		gridX: header.indexOf('grid_x'),
		gridY: header.indexOf('grid_y'),
		channels: Array.from({length: 40}, (_, index) => header.indexOf(`lambda_${index}`)),
	};
	requireCondition(
		indices.model >= 0 &&
			indices.time >= 0 &&
			indices.gridX >= 0 &&
			indices.gridY >= 0 &&
			indices.channels.every((index) => index >= 0),
		'TSV schema does not contain the complete B1 spectral record.',
	);
	const rows = [];
	for (const line of lines) {
		const fields = line.split('\t');
		if (fields[indices.model] !== selectedModel) continue;
		const spectrum = indices.channels.map((index) => Number(fields[index]));
		const gridX = Number(fields[indices.gridX]);
		const gridY = Number(fields[indices.gridY]);
		requireCondition(
			TIMES.includes(fields[indices.time]) &&
				Number.isInteger(gridX) &&
				gridX >= 0 &&
				gridX < 9 &&
				Number.isInteger(gridY) &&
				gridY >= 0 &&
				gridY < 9 &&
				spectrum.every(Number.isFinite),
			`Malformed ${selectedModel} B1 row.`,
		);
		rows.push({time: fields[indices.time], gridX, gridY, spectrum});
	}
	requireCondition(rows.length === 17 * 81, `Expected 1,377 ${selectedModel} rows; found ${rows.length}.`);
	return rows;
}

function canonicalModelTsv(text, selectedModel) {
	const lines = text.trim().split(/\r?\n/u);
	return `${[lines[0], ...lines.slice(1).filter((line) => line.startsWith(`${selectedModel}\t`))].join('\n')}\n`;
}

function parseCie(text) {
	const byWavelength = new Map();
	for (const line of text.trim().split(/\r?\n/u)) {
		const fields = line.split(',').map(Number);
		if (fields.length === 4 && fields.every(Number.isFinite)) byWavelength.set(fields[0], fields.slice(1));
	}
	return byWavelength;
}

function cieAt(cie, wavelength) {
	const lower = Math.floor(wavelength);
	const upper = Math.ceil(wavelength);
	const low = cie.get(lower);
	const high = cie.get(upper);
	requireCondition(low && high, `CIE table does not bracket ${wavelength} nm.`);
	const fraction = wavelength - lower;
	return low.map((value, index) => value + (high[index] - value) * fraction);
}

function spectrumToXyz(spectrum, cie) {
	const xyz = [0, 0, 0];
	for (let index = 0; index < spectrum.length; index += 1) {
		const matching = cieAt(cie, WAVELENGTHS[index]);
		for (let axis = 0; axis < 3; axis += 1) {
			xyz[axis] += spectrum[index] * matching[axis] * SAMPLE_WIDTH_NM * 683;
		}
	}
	return xyz;
}

function xyzToLinearSrgb(xyz) {
	return XYZ_TO_LINEAR_SRGB.map((row) => row.reduce((sum, coefficient, index) => sum + coefficient * xyz[index], 0));
}

function mapDisplay(linearSrgb, gain = 1) {
	return linearSrgb.map((value) => Math.max(0, Math.min(1, 1 - Math.exp(-Math.max(value, 0) * TONE_MAP_K * gain))));
}

function xyzToUv(xyz) {
	const denominator = xyz[0] + 15 * xyz[1] + 3 * xyz[2];
	return denominator > 0 ? [(4 * xyz[0]) / denominator, (9 * xyz[1]) / denominator] : [0, 0];
}

function vectorDistance(first, second) {
	return Math.sqrt(first.reduce((sum, value, index) => sum + (value - second[index]) ** 2, 0));
}

function percentile(values, fraction) {
	const sorted = [...values].sort((first, second) => first - second);
	return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function gridFor(rows, property) {
	const grid = Array.from({length: 9}, () => Array(9));
	for (const row of rows) grid[row.gridX][row.gridY] = row[property];
	return grid;
}

function cubic(fraction, before, start, end, after) {
	return (
		(start * 2 +
			(-before +
				end +
				(before * 2 - start * 5 + end * 4 - after + (-before + start * 3 - end * 3 + after) * fraction) *
					fraction) *
				fraction) *
		0.5
	);
}

function ringSample(grid, ringIndex, indexInRing) {
	if (ringIndex === 0) return grid[4][4];
	let index = indexInRing;
	while (index < 0) index += 8 * ringIndex;
	const dx = Math.max(
		-ringIndex,
		Math.min(ringIndex, Math.abs((index % (8 * ringIndex)) - 4 * ringIndex) - 2 * ringIndex),
	);
	const dy = Math.max(
		-ringIndex,
		Math.min(ringIndex, Math.abs(((index + 6 * ringIndex) % (8 * ringIndex)) - 4 * ringIndex) - 2 * ringIndex),
	);
	return grid[4 + dx][4 + dy];
}

function zenithDerivative(grid, azimuth) {
	const diagonal = 1 / Math.sqrt(2);
	const scale = 0.5 / (1 + 2 * diagonal);
	const derivativeX =
		(grid[5][4] - grid[3][4] + (grid[5][5] - grid[3][3]) * diagonal + (grid[5][3] - grid[3][5]) * diagonal) * scale;
	const derivativeY =
		(grid[4][5] - grid[4][3] + (grid[5][5] - grid[3][3]) * diagonal + (grid[3][5] - grid[5][3]) * diagonal) * scale;
	return derivativeX * Math.cos(azimuth) + derivativeY * Math.sin(azimuth);
}

function ringValue(grid, ringIndex, azimuth) {
	if (ringIndex === -1) return ringValue(grid, 1, azimuth) - 2 * zenithDerivative(grid, azimuth);
	if (ringIndex > 4) {
		return (
			ringValue(grid, ringIndex - 3, azimuth) -
			3 * ringValue(grid, ringIndex - 2, azimuth) +
			3 * ringValue(grid, ringIndex - 1, azimuth)
		);
	}
	let coordinate = (azimuth / Math.PI) * (4 * ringIndex);
	const index = Math.floor(coordinate);
	coordinate -= index;
	return cubic(
		coordinate,
		ringSample(grid, ringIndex, index - 1),
		ringSample(grid, ringIndex, index),
		ringSample(grid, ringIndex, index + 1),
		ringSample(grid, ringIndex, index + 2),
	);
}

function sampleScalar(grid, zenith, azimuth) {
	let coordinate = 4.5 * Math.sqrt(1 - Math.cos(zenith));
	const ringIndex = Math.floor(coordinate);
	coordinate -= ringIndex;
	return cubic(
		coordinate,
		ringValue(grid, ringIndex - 1, azimuth),
		ringValue(grid, ringIndex, azimuth),
		ringValue(grid, ringIndex + 1, azimuth),
		ringValue(grid, ringIndex + 2, azimuth),
	);
}

function renderDome(rows, property, size) {
	const channels = [0, 1, 2].map((channel) =>
		gridFor(
			rows.map((row) => ({...row, scalar: row[property][channel]})),
			'scalar',
		),
	);
	const pixels = Buffer.alloc(size * size * 4);
	for (let pixelY = 0; pixelY < size; pixelY += 1) {
		for (let pixelX = 0; pixelX < size; pixelX += 1) {
			const x = (pixelX + 0.5 - size / 2) / (size / 2);
			const y = (size / 2 - 0.5 - pixelY) / (size / 2);
			const radius = Math.sqrt(x * x + y * y);
			const offset = (pixelX + pixelY * size) * 4;
			if (radius >= 1) {
				pixels[offset + 3] = 255;
				continue;
			}
			const zenith = (radius * Math.PI) / 2;
			const azimuth = Math.atan2(x, -y);
			for (let channel = 0; channel < 3; channel += 1) {
				pixels[offset + channel] = Math.round(
					Math.max(0, Math.min(1, sampleScalar(channels[channel], zenith, azimuth))) * 255,
				);
			}
			pixels[offset + 3] = 255;
		}
	}
	return pixels;
}

function combineHorizontally(images, size) {
	const result = Buffer.alloc(size * images.length * size * 4);
	for (let y = 0; y < size; y += 1) {
		for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
			const sourceStart = y * size * 4;
			const targetStart = (y * size * images.length + imageIndex * size) * 4;
			images[imageIndex].copy(result, targetStart, sourceStart, sourceStart + size * 4);
		}
	}
	return {width: size * images.length, height: size, pixels: result};
}

function crc32(buffers) {
	let crc = 0xffffffff;
	for (const buffer of buffers) {
		for (const byte of buffer) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
	const typeBytes = Buffer.from(type, 'ascii');
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);
	const checksum = Buffer.alloc(4);
	checksum.writeUInt32BE(crc32([typeBytes, data]), 0);
	return Buffer.concat([length, typeBytes, data, checksum]);
}

function encodePng(width, height, pixels) {
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header[8] = 8;
	header[9] = 6;
	const rows = [];
	for (let y = 0; y < height; y += 1) {
		rows.push(Buffer.from([0]), pixels.subarray(y * width * 4, (y + 1) * width * 4));
	}
	return Buffer.concat([
		PNG_SIGNATURE,
		pngChunk('IHDR', header),
		pngChunk('IDAT', deflateSync(Buffer.concat(rows), {level: 9})),
		pngChunk('IEND', Buffer.alloc(0)),
	]);
}

function mean(values) {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(rows) {
	return {
		displayRgbRmse: Math.sqrt(mean(rows.flatMap((row) => row.displayDelta.map((value) => value ** 2)))),
		meanDeltaUv: mean(rows.map((row) => row.deltaUv)),
		maximumDeltaUv: Math.max(...rows.map((row) => row.deltaUv)),
		meanRelativeLuminanceError: mean(rows.map((row) => row.relativeLuminanceError)),
		maximumDisplayChannelError: Math.max(...rows.flatMap((row) => row.displayDelta)),
		meanSignedDisplayRgbBias: [0, 1, 2].map((channel) => mean(rows.map((row) => row.signedDisplayDelta[channel]))),
		productionDisplaySaturatedRayCount: rows.filter((row) => row.shaderDisplay.some((value) => value >= 0.999))
			.length,
		brunetonDisplaySaturatedRayCount: rows.filter((row) => row.brunetonDisplay.some((value) => value >= 0.999))
			.length,
	};
}

function assessRequirements(summary) {
	const checks = {
		displayRgbRmse: {
			actual: summary.displayRgbRmse,
			maximum: COLOR_REQUIREMENTS.displayRgbRmseMaximum,
		},
		maximumDisplayChannelError: {
			actual: summary.maximumDisplayChannelError,
			maximum: COLOR_REQUIREMENTS.maximumDisplayChannelError,
		},
		meanDeltaUv: {
			actual: summary.meanDeltaUv,
			maximum: COLOR_REQUIREMENTS.meanDeltaUvMaximum,
		},
		maximumDeltaUv: {
			actual: summary.maximumDeltaUv,
			maximum: COLOR_REQUIREMENTS.maximumDeltaUvMaximum,
		},
		meanRelativeLuminanceError: {
			actual: summary.meanRelativeLuminanceError,
			maximum: COLOR_REQUIREMENTS.meanRelativeLuminanceErrorMaximum,
		},
		maximumAbsoluteMeanDisplayChannelBias: {
			actual: Math.max(...summary.meanSignedDisplayRgbBias.map(Math.abs)),
			maximum: COLOR_REQUIREMENTS.maximumAbsoluteMeanDisplayChannelBias,
		},
	};
	return {
		passed: Object.values(checks).every((check) => check.actual <= check.maximum),
		checks: Object.fromEntries(
			Object.entries(checks).map(([name, check]) => [name, {...check, passed: check.actual <= check.maximum}]),
		),
	};
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'bruneton-shader-sky-color-comparison',
		command: COMMAND,
		inputs: {
			oracle: BRUNETON_ORACLE,
			requirements: COLOR_REQUIREMENTS,
			publishedModel: 'bruneton',
			shaderModel: 'proposed',
			times: TIMES,
			directionsPerTime: 81,
			sunDisk: 'excluded',
		},
		provenance: {
			paperSpectra: path.relative(REPOSITORY_ROOT, PUBLISHED_TABLE).replaceAll('\\', '/'),
			shaderSpectra: path.relative(REPOSITORY_ROOT, SHADER_TABLE).replaceAll('\\', '/'),
			cie1931: path.relative(REPOSITORY_ROOT, CIE_TABLE).replaceAll('\\', '/'),
		},
		environment: {node: process.version, platform: process.platform},
		references: {
			comparisonPaper: 'Bruneton 2017, A Qualitative and Quantitative Evaluation of 8 Clear Sky Models',
			colorBoundary: 'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js',
		},
	});
	try {
		for (const [label, inputPath] of [
			['published B1 table', PUBLISHED_TABLE],
			['production GPU B1 table', SHADER_TABLE],
			['CIE 1931 table', CIE_TABLE],
		])
			await assertExistingRealPathContained(REPOSITORY_ROOT, inputPath, label);
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		const [publishedText, shaderText, cieText] = await Promise.all([
			readFile(PUBLISHED_TABLE, 'utf8'),
			readFile(SHADER_TABLE, 'utf8'),
			readFile(CIE_TABLE, 'utf8'),
		]);
		const bruneton = parseTsv(publishedText, 'bruneton');
		const canonicalOracle = canonicalModelTsv(publishedText, BRUNETON_ORACLE.model);
		requireCondition(
			sha256(Buffer.from(canonicalOracle, 'utf8')) === BRUNETON_ORACLE.canonicalTsvSha256,
			'Bruneton sky-dome oracle identity does not match the sealed checksum.',
		);
		const shader = parseTsv(shaderText, 'proposed');
		const cie = parseCie(cieText);
		const shaderByKey = new Map(shader.map((row) => [`${row.time}/${row.gridX}/${row.gridY}`, row]));
		const physicalRows = bruneton.map((paperRow) => {
			const key = `${paperRow.time}/${paperRow.gridX}/${paperRow.gridY}`;
			const shaderRow = shaderByKey.get(key);
			requireCondition(shaderRow, `Shader table is missing ${key}.`);
			const brunetonXyz = spectrumToXyz(paperRow.spectrum, cie);
			const shaderXyz = spectrumToXyz(shaderRow.spectrum, cie);
			return {
				time: paperRow.time,
				gridX: paperRow.gridX,
				gridY: paperRow.gridY,
				brunetonXyz,
				shaderXyz,
				brunetonLinear: xyzToLinearSrgb(brunetonXyz),
				shaderLinear: xyzToLinearSrgb(shaderXyz),
			};
		});
		const referenceY95 = percentile(
			physicalRows.map((row) => row.brunetonXyz[1]),
			0.95,
		);
		const diagnosticGain = -Math.log(1 - 0.75) / (TONE_MAP_K * referenceY95);
		const comparedRows = physicalRows.map((row) => {
			const brunetonDisplay = mapDisplay(row.brunetonLinear);
			const shaderDisplay = mapDisplay(row.shaderLinear);
			const brunetonUv = xyzToUv(row.brunetonXyz);
			const shaderUv = xyzToUv(row.shaderXyz);
			return {
				...row,
				brunetonDisplay,
				shaderDisplay,
				brunetonDiagnostic: mapDisplay(row.brunetonLinear, diagnosticGain),
				shaderDiagnostic: mapDisplay(row.shaderLinear, diagnosticGain),
				signedDisplayDelta: shaderDisplay.map((value, index) => value - brunetonDisplay[index]),
				displayDelta: shaderDisplay.map((value, index) => Math.abs(value - brunetonDisplay[index])),
				deltaUv: vectorDistance(brunetonUv, shaderUv),
				relativeLuminanceError:
					Math.abs(row.shaderXyz[1] - row.brunetonXyz[1]) / Math.max(row.brunetonXyz[1], Number.EPSILON),
			};
		});
		const perTime = [];
		for (const time of TIMES) {
			const rows = comparedRows.filter((row) => row.time === time);
			const renderRows = rows.map((row) => ({
				...row,
				residual: row.displayDelta.map((value) => Math.min(1, value * 4)),
			}));
			const images = [
				renderDome(renderRows, 'brunetonDisplay', 256),
				renderDome(renderRows, 'shaderDisplay', 256),
				renderDome(renderRows, 'brunetonDiagnostic', 256),
				renderDome(renderRows, 'shaderDiagnostic', 256),
				renderDome(renderRows, 'residual', 256),
			];
			const strip = combineHorizontally(images, 256);
			const png = encodePng(strip.width, strip.height, strip.pixels);
			await run.writeArtifact(`figures/${time.replace(':', '')}-sky-color-comparison.png`, png);
			perTime.push({time, ...summarize(rows), figureSha256: sha256(png)});
			process.stdout.write(`[${perTime.length}/${TIMES.length}] ${time} complete\n`);
		}
		const aggregate = summarize(comparedRows);
		const assessment = assessRequirements(aggregate);
		const csvHeader = [
			'time',
			'grid_x',
			'grid_y',
			'bruneton_Y',
			'shader_Y',
			'relative_Y_error',
			'delta_uv',
			'bruneton_r',
			'bruneton_g',
			'bruneton_b',
			'shader_r',
			'shader_g',
			'shader_b',
		];
		const csvRows = comparedRows.map((row) =>
			[
				row.time,
				row.gridX,
				row.gridY,
				row.brunetonXyz[1],
				row.shaderXyz[1],
				row.relativeLuminanceError,
				row.deltaUv,
				...row.brunetonDisplay,
				...row.shaderDisplay,
			].join(','),
		);
		await run.writeArtifact('matched-rays.csv', `${csvHeader.join(',')}\n${csvRows.join('\n')}\n`);
		await run.writeJsonArtifact('comparison.json', {
			schemaId: 'bruneton-production-shader-sky-color-comparison-v1',
			sunDiskExcluded: true,
			wavelengthsNanometers: WAVELENGTHS,
			spectralSampleWidthNanometers: SAMPLE_WIDTH_NM,
			projection: 'CIE 1931 2-degree XYZ; 683 lm/W; XYZ to linear sRGB',
			oracle: BRUNETON_ORACLE,
			requirements: COLOR_REQUIREMENTS,
			assessment,
			productionDisplay: 'channel-wise Bruneton Figure-1 exponential K=1/(5*683), written directly',
			diagnosticDisplay: {
				purpose: 'shared exposure for visual comparison only; identical gain for Bruneton and shader',
				reference: 'Bruneton all-ray 95th-percentile Y maps directly to 0.75',
				referenceY95,
				gain: diagnosticGain,
			},
			figureColumns: [
				'Bruneton through exact production display',
				'production GPU shader through exact production display',
				'Bruneton at shared diagnostic exposure',
				'production GPU shader at shared diagnostic exposure',
				'absolute production-display RGB residual multiplied by 4',
			],
			aggregate,
			perTime,
		});
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Protected tracked-file inventory');
		const report = `# ${run.runId}: Bruneton / production shader sky-color gate

Conclusion: **${assessment.passed ? 'accepted' : 'rejected'}**. The run compares the sealed Bruneton model spectra with production GPU-shader spectra on all 1,377 matched B1 rays. The Sun disk is explicitly excluded.

## Figure columns

Every time-specific PNG contains, from left to right: Bruneton with the exact production display transform; production shader with that transform; Bruneton with one shared diagnostic exposure; production shader with that same exposure; and absolute display-RGB residual magnified 4×.

The diagnostic exposure is not a proposed renderer setting. It prevents the production mapping from hiding chromatic differences through saturation. It is derived once from the Bruneton 95th-percentile luminance and applied unchanged to both models.

## Aggregate matched-ray metrics

- Display RGB RMSE: ${aggregate.displayRgbRmse.toFixed(9)}
- Mean CIE 1976 u'v' distance: ${aggregate.meanDeltaUv.toFixed(9)}
- Maximum CIE 1976 u'v' distance: ${aggregate.maximumDeltaUv.toFixed(9)}
- Mean relative luminance error: ${(aggregate.meanRelativeLuminanceError * 100).toFixed(3)}%
- Mean signed display RGB bias: (${aggregate.meanSignedDisplayRgbBias.map((value) => value.toFixed(9)).join(', ')})
- Bruneton rays with an exact-production display channel at or above 0.999: ${aggregate.brunetonDisplaySaturatedRayCount} / 1377
- Shader rays with an exact-production display channel at or above 0.999: ${aggregate.productionDisplaySaturatedRayCount} / 1377

## Required limits

${Object.entries(assessment.checks)
	.map(([name, check]) => `- ${check.passed ? 'PASS' : 'FAIL'} ${name}: ${check.actual} <= ${check.maximum}`)
	.join('\n')}

## Method

The GPU B1 table is the shader's 40-channel radiance readback. Applying the current production CIE projection and final display function to those values is mathematically equivalent to the atmosphere-only shader output at the same rays, without framebuffer quantization. Color projection uses the official CIE 1931 2-degree table, the B1 11.75 nm sample width, 683 lm/W, and the production XYZ-to-linear-sRGB matrix.

Protected tracked files before/after: ${after.fileCount}. No Sun-disk value participates in the comparison.
`;
		const manifest = await run.finalize({
			conclusion: assessment.passed ? 'accepted' : 'rejected',
			result: {
				accepted: assessment.passed,
				oracle: BRUNETON_ORACLE,
				requirements: COLOR_REQUIREMENTS,
				assessment,
				aggregate,
				diagnosticGain,
				protectedFileCount: after.fileCount,
			},
			report,
		});
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					runDirectory: run.runDirectory,
					aggregate,
					artifactSetSha256: manifest.artifactSetSha256,
				},
				null,
				2,
			)}\n`,
		);
		if (!assessment.passed) process.exitCode = 1;
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('failure.json', detail);
			await run.finalize({
				conclusion: 'failed',
				result: {accepted: false, error: detail},
				report: `# ${run.runId}: Bruneton / production shader sky-color comparison\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
		} catch {}
		throw error;
	}
}

await main();
