import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {deflateSync} from 'node:zlib';

import {getSampleDirection, sampleHemisphericalScalar, scoreCondition} from './benchmark.js';
import {MODEL_LABELS, PUBLISHED_MODELS, PUBLISHED_RMSE_ORACLE} from './published-oracle.js';

export const FIGURE5_ASSET_ROOT = fileURLToPath(new URL('./inputs/figure5/', import.meta.url));

export const FIGURE5_SCENES = Object.freeze([
	Object.freeze({
		time: '10:15',
		fileTime: '10h15',
		roundedSolarZenithDegrees: 41,
		solarZenithDegrees: 40.84600718432722,
		fittedSolarAzimuthDegrees: 98.59994923191232,
		algorithm32RgbaSha256: '4b12ff03e8447cdcd6dde375b9c5f9d18408f70893a9a439481e1b3cead8e7d9',
		algorithm32J2RgbaSha256: 'd2cce490e10f7a5624bcfe0c9e25e814819ecee3dc2d65ccc53ed2091d90e963',
		algorithm32J3RgbaSha256: '27b0680f786cc94e79d389d79bc95b0ca4834736776c770063688578adb975db',
		algorithm32J4RgbaSha256: 'f6196c4d88eeacc75fae71e304ddd0ee3ea80ef07acb67364f23788d4438d67b',
		algorithm32J5RgbaSha256: '29c0fb58688cbd5946dea92d5b5f9e7d6526fb5aa13cdabe12242d52466dac89',
	}),
	Object.freeze({
		time: '11:15',
		fileTime: '11h15',
		roundedSolarZenithDegrees: 31,
		solarZenithDegrees: 30.886221441278117,
		fittedSolarAzimuthDegrees: 111.68270889819306,
		algorithm32RgbaSha256: '5abb431f7164f40af8660e136591abf1307f2c16184cb3a58c4f770317dd7b52',
		algorithm32J2RgbaSha256: '4b633e488d59aa53445e0963c8e6d8356c220a5ec5df285520acfda0a053acba',
		algorithm32J3RgbaSha256: '5967ea23c9871fb207b59842f26dd44c18086c19efa45de46876c237af4719d1',
		algorithm32J4RgbaSha256: '595cfbb0c9748a2f54c8c318c3fa010732bed1c4db05418347577f64a9fa9ac7',
		algorithm32J5RgbaSha256: 'c6cc42cd6da3c5ddbbe24c8cf0e884c6a931c7a9f10bf848359d97512015e594',
	}),
	Object.freeze({
		time: '13:15',
		fileTime: '13h15',
		roundedSolarZenithDegrees: 21,
		solarZenithDegrees: 21.187917283518857,
		fittedSolarAzimuthDegrees: 174.2693750288133,
		algorithm32RgbaSha256: '90bc88ea21be78d30b4d3d2d9b52e4186268a0d3f99f901b7892f91505f32230',
		algorithm32J2RgbaSha256: 'f884b8e3c05abff6d33b10fe8b5d468ef6235123156711f1ae726221e477d0f5',
		algorithm32J3RgbaSha256: '5598e4fd4d3dd5a376ac5e4ca76f757520698335e518713841b4a7eb80fc1860',
		algorithm32J4RgbaSha256: '3941537f590937d0e800b926edbf0dae69c794c9dcf0a759cac88b9fe5a39d02',
		algorithm32J5RgbaSha256: '8b16d0aaba15dbc838f02df4cec191c4560de143a0f5a15c582c993486d23607',
	}),
]);

export const FIGURE5_CANDIDATE_DEFINITIONS = Object.freeze([
	Object.freeze({
		model: 'algorithm32',
		label: 'Algorithm32',
		headerClass: 'algorithm-header',
		stroke: '#b00020',
		metadataKey: 'algorithm32Panels',
	}),
]);

const PUBLISHED_PANEL_SHA256 = Object.freeze([
	'2f4251b3feb153e9338eedd0a8c77e82e8b5152469babe11ca76128769ced876',
	'b95298e933176e54010afc0030e5255bc9bb78c2dc7f257dfa3a3fcf5b9b6f84',
	'bbe4eccc094bee49849349d55ee79cb1f81830060797acfe04fd39c674790268',
	'fadf1857414f6a464aeb3ff3c8be9c329090cb07f8f84ef28a090d4833e6e357',
	'b8dd725f50a49d359910ced8f3415cad09751e650e0b02df7752f3223bdf943b',
	'e5270d626cb41a1fbc099eb38f9041ecb37665fa6c3cb20c9f51d672336023ee',
	'e5270d626cb41a1fbc099eb38f9041ecb37665fa6c3cb20c9f51d672336023ee',
	'25a1f51b0c271c14d9dafc27e9c141b6886a627951c6bf0bd7d7d02992ad62ea',
	'beeb9c3a289ffd58e9fe6ae3e5a3f8ec4b0697c222a717caf849f2ce07e75ff6',
	'0c909f71af2b8917d87f9f47f690d1b90d61cb9863a379aecf7a73cee46dfda2',
	'227ea1732a44ecc6e4f2a2dc9d4d87685c85b9c0d0b01009a594ab1818332a1a',
	'3e1dad726eed0c4d53553ce08c86ec8d20b942331c9a532e0277378f8dd529c8',
	'7283d261080f4ef89c0719ff65a71d3fb6e8657c9962894727a7843cf0f3da15',
	'e191c5ca8eab0449a07a573f9c8857bf605b06c6402f7f1865382fa53c81eb30',
	'cfe42ea7f05ccbf852ab3a0833895b4bb90aa4a31edaa95ae9f398519b75336c',
	'cfe42ea7f05ccbf852ab3a0833895b4bb90aa4a31edaa95ae9f398519b75336c',
	'ab90f4dc78fa3940654631ca27074a013e9b33db8400a0990074e1819221d39b',
	'3a110957dc103dae6f6184bce02a732b08088c27bd6e524f702be985563810e7',
	'af1777c815bbfd6ccc393729265dd39d7d99bfbc3807c1c71df21307c342c70d',
	'69a6fd2cf2a2ce5625a169288ec9529582ef39d7fde1cf9b0a187ff4b82d55c1',
	'2667db056fe42b457477477ae16fa8cfc719d4cae4c8ce39fd35a5dcb175b9c5',
	'1a3a1cddc46009dbc7d150c43cc3c8eb8420eed533f19c6ad0384df1645ad6c5',
	'29ec80e36ad2c6e7954c2d4cdc905fe5435aa6175e77a0487c5ae42970a1fa3f',
	'612d6f2abdbbd91d7174d09fe0cc5a54ee802a9737790b1738d49d9a8b46104c',
	'612d6f2abdbbd91d7174d09fe0cc5a54ee802a9737790b1738d49d9a8b46104c',
	'1ba842dcf86e07125804ca81145728a6beab1ed5818967fdcda0747702dcb311',
	'daea699f1fd38131f1199bb814baa800e6bfefb719843d1db8d778dd0c5dfc24',
]);

export const FIGURE5_PUBLISHED_PANELS = Object.freeze(
	FIGURE5_SCENES.flatMap((scene, rowIndex) =>
		PUBLISHED_MODELS.map((model, columnIndex) => {
			const linearIndex = rowIndex * PUBLISHED_MODELS.length + columnIndex;
			return Object.freeze({
				model,
				time: scene.time,
				fileTime: scene.fileTime,
				roundedSolarZenithDegrees: scene.roundedSolarZenithDegrees,
				pdfXObject: `Im${158 + linearIndex}`,
				pdfObjectNumber: 663 + linearIndex,
				expectedSha256: PUBLISHED_PANEL_SHA256[linearIndex],
				filename: `figure5-${model}-${scene.fileTime}-z${scene.roundedSolarZenithDegrees}.png`,
			});
		}),
	),
);

const ERROR_COLOR_BYTES = Object.freeze([
	8, 54, 106, 15, 67, 123, 23, 82, 144, 29, 95, 162, 36, 106, 174, 46, 119, 181, 54, 129, 186, 63, 142, 192, 76, 153,
	198, 95, 165, 205, 117, 178, 212, 135, 190, 218, 155, 201, 224, 169, 209, 229, 184, 216, 233, 202, 225, 238, 213,
	231, 241, 224, 236, 243, 233, 240, 244, 242, 245, 246, 248, 243, 240, 249, 237, 229, 251, 229, 216, 252, 222, 205,
	252, 213, 191, 249, 198, 172, 247, 185, 156, 245, 170, 137, 240, 156, 123, 233, 139, 110, 225, 120, 96, 218, 104,
	83, 208, 85, 72, 200, 68, 64, 191, 51, 56, 182, 31, 46, 168, 21, 41, 147, 14, 38, 129, 8, 35, 112, 3, 32, 103, 0,
	31,
]);

export const FIGURE5_ERROR_COLORS = Object.freeze(
	Array.from({length: 41}, (_, index) => Object.freeze(ERROR_COLOR_BYTES.slice(index * 3, index * 3 + 3))),
);

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function inspectRgbaPng(bytes, sourceName) {
	if (
		!Buffer.isBuffer(bytes) ||
		bytes.length < 33 ||
		!bytes.subarray(0, 8).equals(PNG_SIGNATURE) ||
		bytes.toString('ascii', 12, 16) !== 'IHDR'
	) {
		throw new Error(`${sourceName} is not a canonical PNG with a leading IHDR chunk.`);
	}
	const identity = Object.freeze({
		width: bytes.readUInt32BE(16),
		height: bytes.readUInt32BE(20),
		bitDepth: bytes[24],
		colorType: bytes[25],
		compressionMethod: bytes[26],
		filterMethod: bytes[27],
		interlaceMethod: bytes[28],
	});
	if (
		identity.width !== 256 ||
		identity.height !== 256 ||
		identity.bitDepth !== 8 ||
		identity.colorType !== 6 ||
		identity.compressionMethod !== 0 ||
		identity.filterMethod !== 0 ||
		identity.interlaceMethod !== 0
	) {
		throw new Error(`${sourceName} is not the expected 256x256 non-interlaced RGBA8 panel.`);
	}
	return identity;
}

export function loadPublishedFigure5Panels(assetRoot = FIGURE5_ASSET_ROOT) {
	return Object.freeze(
		FIGURE5_PUBLISHED_PANELS.map((identity) => {
			const path = join(assetRoot, identity.filename);
			const png = readFileSync(path);
			const actualSha256 = sha256(png);
			if (actualSha256 !== identity.expectedSha256) {
				throw new Error(
					`${identity.filename} SHA-256 ${actualSha256} does not match ${identity.expectedSha256}.`,
				);
			}
			const pngIdentity = inspectRgbaPng(png, identity.filename);
			return Object.freeze({...identity, path, png, pngIdentity, sha256: actualSha256});
		}),
	);
}

export function getFigure5ErrorColor(relativeError) {
	if (!Number.isFinite(relativeError)) throw new TypeError('Figure 5 relative error must be finite.');
	const index = Math.max(0, Math.min(40, Math.floor(relativeError * 10) + 20));
	return FIGURE5_ERROR_COLORS[index];
}

function blendPixel(pixels, width, x, y, red, green, blue, alpha) {
	if (x < 0 || x >= width || y < 0 || y >= pixels.length / (width * 4)) {
		throw new RangeError(`Figure 5 annotation left the panel at (${x},${y}).`);
	}
	const offset = (x + y * width) * 4;
	const blend = alpha / 255;
	pixels[offset] = Math.trunc(pixels[offset] * (1 - blend) + red * blend);
	pixels[offset + 1] = Math.trunc(pixels[offset + 1] * (1 - blend) + green * blend);
	pixels[offset + 2] = Math.trunc(pixels[offset + 2] * (1 - blend) + blue * blend);
	pixels[offset + 3] = 255;
}

function drawCross(pixels, width, height, zenithRadians, azimuthRadians, size, red, green, blue, alpha) {
	const radius = zenithRadians / (Math.PI / 2);
	const diskX = radius * Math.sin(azimuthRadians);
	const diskY = radius * Math.cos(azimuthRadians);
	const centerX = Math.trunc(diskX * (width / 2) + width / 2 - 0.5);
	const centerY = Math.trunc(diskY * (height / 2) + height / 2 - 0.5);
	for (let offset = -size; offset <= size; offset += 1) {
		blendPixel(pixels, width, centerX + offset, centerY, red, green, blue, alpha);
	}
	for (let offset = -size; offset <= size; offset += 1) {
		if (offset !== 0) {
			blendPixel(pixels, width, centerX, centerY + offset, red, green, blue, alpha);
		}
	}
	return Object.freeze({centerX, centerY});
}

function drawFigure5Annotations(pixels, width, height, scene) {
	const sun = drawCross(
		pixels,
		width,
		height,
		(scene.solarZenithDegrees * Math.PI) / 180,
		(scene.fittedSolarAzimuthDegrees * Math.PI) / 180,
		5,
		255,
		0,
		0,
		255,
	);
	const sampleCenters = [];
	for (let gridX = 0; gridX < 9; gridX += 1) {
		for (let gridY = 0; gridY < 9; gridY += 1) {
			const direction = getSampleDirection(gridX, gridY);
			sampleCenters.push(
				drawCross(pixels, width, height, direction.zenithRadians, direction.azimuthRadians, 0, 0, 0, 0, 0x40),
			);
		}
	}
	return Object.freeze({sun, sampleCenters: Object.freeze(sampleCenters)});
}

function crc32(buffers) {
	let crc = 0xffffffff;
	for (const buffer of buffers) {
		for (const byte of buffer) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit += 1) {
				crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
			}
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

export function encodeRgbaPng(width, height, pixels) {
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0 ||
		!Buffer.isBuffer(pixels) ||
		pixels.length !== width * height * 4
	) {
		throw new TypeError('RGBA PNG encoding requires positive dimensions and one RGBA8 byte buffer.');
	}
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

export function renderAlgorithm32Figure5Panel(modelGrid, measuredGrid, scene) {
	if (!FIGURE5_SCENES.some((candidate) => candidate.time === scene?.time)) {
		throw new TypeError('Algorithm32 Figure 5 rendering requires one declared Figure 5 scene.');
	}
	const score = scoreCondition(modelGrid, measuredGrid);
	const relativeErrorGrid = Array.from({length: 9}, () => Array(9));
	for (const sample of score.relativeErrors) {
		if (!Number.isFinite(sample.relativeError)) {
			throw new Error(`${scene.time} (${sample.gridX},${sample.gridY}) has a non-finite relative error.`);
		}
		relativeErrorGrid[sample.gridX][sample.gridY] = sample.relativeError;
	}

	const width = 256;
	const height = 256;
	const pixels = Buffer.alloc(width * height * 4);
	for (let pixelY = 0; pixelY < height; pixelY += 1) {
		for (let pixelX = 0; pixelX < width; pixelX += 1) {
			const x = (pixelX + 0.5 - width / 2) / (width / 2);
			const y = (height / 2 - 0.5 - pixelY) / (height / 2);
			const radius = Math.sqrt(x * x + y * y);
			if (radius >= 1) continue;
			const zenithRadians = (radius * Math.PI) / 2;
			const azimuthRadians = Math.atan2(x, -y);
			const relativeError = sampleHemisphericalScalar(relativeErrorGrid, zenithRadians, azimuthRadians);
			const [red, green, blue] = getFigure5ErrorColor(relativeError);
			const offset = (pixelX + pixelY * width) * 4;
			pixels[offset] = red;
			pixels[offset + 1] = green;
			pixels[offset + 2] = blue;
			pixels[offset + 3] = 255;
		}
	}
	const annotations = drawFigure5Annotations(pixels, width, height, scene);
	const png = encodeRgbaPng(width, height, pixels);
	return Object.freeze({
		time: scene.time,
		scene,
		width,
		height,
		pixels,
		rgbaSha256: sha256(pixels),
		png,
		pngSha256: sha256(png),
		score,
		relativeErrorGrid: Object.freeze(relativeErrorGrid.map((row) => Object.freeze(row))),
		annotations,
	});
}

function xml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function formatRmse(value) {
	return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function panelKey(model, time) {
	return `${model}\0${time}`;
}

function normalizeCandidatePanelArguments(args) {
	const values = [...args];
	const provenance = values.length > 0 && !Array.isArray(values.at(-1)) ? values.pop() : {};
	if (
		values.length !== FIGURE5_CANDIDATE_DEFINITIONS.length ||
		values.some((panels) => !Array.isArray(panels) || panels.length !== 3)
	) {
		throw new TypeError(
			'Figure 5 comparison requires 27 published panels and the active order-4 Algorithm32 panel set.',
		);
	}
	const definitions = FIGURE5_CANDIDATE_DEFINITIONS.map((definition) => ({
		...definition,
		label: provenance.candidateLabel ?? definition.label,
	}));
	return Object.freeze({
		provenance,
		candidates: Object.freeze(
			definitions.map((definition, index) =>
				Object.freeze({
					...definition,
					panels: values[index],
					byTime: new Map(values[index].map((panel) => [panel.time, panel])),
				}),
			),
		),
	});
}

export function renderFigure5ComparisonSvg(publishedPanels, ...candidatePanelArguments) {
	if (!Array.isArray(publishedPanels) || publishedPanels.length !== 27) {
		throw new TypeError('Figure 5 comparison requires exactly 27 published panels.');
	}
	const {candidates, provenance} = normalizeCandidatePanelArguments(candidatePanelArguments);
	const publishedByKey = new Map(publishedPanels.map((panel) => [panelKey(panel.model, panel.time), panel]));
	const candidateByModel = new Map(candidates.map((candidate) => [candidate.model, candidate]));
	const models = [...PUBLISHED_MODELS, ...candidates.map(({model}) => model)];
	const labels = Object.freeze({
		...MODEL_LABELS,
		...Object.fromEntries(candidates.map(({model, label}) => [model, label])),
	});
	const height = 730;
	const panelSize = 128;
	const left = 140;
	const top = 116;
	const columnPitch = 139;
	const rowPitch = 170;
	const width = left + (models.length - 1) * columnPitch + panelSize + 24;
	const pieces = [];
	const candidateNames = candidates.map(({label}) => label).join(', ');
	const candidateMetadata = Object.fromEntries(
		candidates.map((candidate) => [
			candidate.metadataKey,
			candidate.panels.map((panel) => ({
				time: panel.time,
				rmseMilliwatt: panel.score.rmseMilliwatt,
				rgbaSha256: panel.rgbaSha256,
				pngSha256: panel.pngSha256,
			})),
		]),
	);

	pieces.push(
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">`,
		`<title id="title">B1 Figure 5 relative-error sky domes with ${xml(candidateNames)}</title>`,
		'<desc id="description">The twenty-seven published Figure 5 relative-error panels followed by three Algorithm32 panels generated from the selected J4 B1 boundary with the same published transformation.</desc>',
		`<metadata id="provenance">${xml(
			JSON.stringify({
				...provenance,
				figure: `Bruneton Figure 5 relative-error sky domes extended with ${candidateNames}`,
				publishedPanels: publishedPanels.map((panel) => ({
					model: panel.model,
					time: panel.time,
					pdfXObject: panel.pdfXObject,
					sha256: panel.sha256,
				})),
				...candidateMetadata,
			}),
		)}</metadata>`,
		'<style>',
		'text{font-family:Arial,Helvetica,sans-serif;fill:#202124}',
		'.title{font-size:24px;font-weight:700}',
		'.subtitle{font-size:14px;fill:#4d5156}',
		'.header{font-size:15px;font-weight:700}',
		'.algorithm-header{fill:#9b0018}',
		'.row{font-size:14px;font-weight:700}',
		'.rmse{font-size:13px}',
		'.tick{font-size:11px;fill:#3c4043}',
		'.note{font-size:11px;fill:#5f6368}',
		'</style>',
		'<rect width="100%" height="100%" fill="#ffffff"/>',
		`<text class="title" x="24" y="35">B1 — Figure 5 relative-error sky domes with ${xml(candidateNames)}</text>`,
		'<text class="subtitle" x="24" y="61">Color: 360–720 nm band-integrated directional relative error. Number below each dome: spectral-radiance RMSE (mW m⁻² sr⁻¹ nm⁻¹).</text>',
	);

	candidates.forEach((candidate, candidateIndex) => {
		const columnIndex = PUBLISHED_MODELS.length + candidateIndex;
		const columnX = left + columnIndex * columnPitch;
		pieces.push(
			`<rect x="${columnX - 5}" y="76" width="${panelSize + 10}" height="526" rx="5" fill="#ffffff" stroke="${candidate.stroke}" stroke-width="1"/>`,
		);
	});

	models.forEach((model, columnIndex) => {
		const centerX = left + columnIndex * columnPitch + panelSize / 2;
		pieces.push(
			`<text class="header${candidateByModel.has(model) ? ` ${candidateByModel.get(model).headerClass}` : ''}" x="${centerX}" y="99" text-anchor="middle">${xml(labels[model])}</text>`,
		);
	});

	FIGURE5_SCENES.forEach((scene, rowIndex) => {
		const y = top + rowIndex * rowPitch;
		pieces.push(
			`<text class="row" x="124" y="${y + 55}" text-anchor="end">${xml(scene.fileTime)}</text>`,
			`<text class="row" x="124" y="${y + 76}" text-anchor="end">${scene.roundedSolarZenithDegrees}°</text>`,
		);
		models.forEach((model, columnIndex) => {
			const x = left + columnIndex * columnPitch;
			const candidate = candidateByModel.get(model);
			const panel = candidate
				? candidate.byTime.get(scene.time)
				: publishedByKey.get(panelKey(model, scene.time));
			if (!panel || !Buffer.isBuffer(panel.png)) {
				throw new Error(`Figure 5 is missing ${model}/${scene.time}.`);
			}
			const rmse = candidate
				? panel.score.paperRoundedRmseMilliwatt
				: PUBLISHED_RMSE_ORACLE.perTime[scene.time][model];
			pieces.push(
				`<image data-model="${xml(model)}" data-time="${scene.time}" x="${x}" y="${y}" width="${panelSize}" height="${panelSize}" href="data:image/png;base64,${panel.png.toString('base64')}"/>`,
				`<text class="rmse" x="${x + panelSize / 2}" y="${y + panelSize + 17}" text-anchor="middle">${formatRmse(rmse)}</text>`,
			);
		});
	});

	const barX = 430;
	const barY = 630;
	const cellWidth = 20;
	FIGURE5_ERROR_COLORS.forEach(([red, green, blue], index) => {
		pieces.push(
			`<rect x="${barX + index * cellWidth}" y="${barY}" width="${cellWidth}" height="16" fill="rgb(${red},${green},${blue})"/>`,
		);
	});
	pieces.push(
		`<rect x="${barX}" y="${barY}" width="820" height="16" fill="none" stroke="#333" stroke-width="0.75"/>`,
	);
	for (let percent = -200; percent <= 200; percent += 50) {
		const x = barX + ((percent + 200) / 400) * 820;
		pieces.push(
			`<line x1="${x}" y1="${barY + 16}" x2="${x}" y2="${barY + 21}" stroke="#333"/>`,
			`<text class="tick" x="${x}" y="${barY + 35}" text-anchor="middle">${percent}</text>`,
		);
	}
	pieces.push(
		`<text class="tick" x="${barX + 410}" y="${barY + 51}" text-anchor="middle">band-integrated relative error (%)</text>`,
		'<text class="note" x="24" y="708">Published-model domes are the unchanged image XObjects embedded in Bruneton Figure 5; they are not locally rerendered model outputs.</text>',
		'<text class="note" x="24" y="724">Algorithm32 is the selected cumulative-through-order-4 boundary and uses the same B1 9×9 inputs, spherical interpolation, percentage palette, Sun marker, and sample markers.</text>',
		'</svg>',
		'',
	);
	return pieces.join('\n');
}
