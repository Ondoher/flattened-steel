const INPUT_SCHEMA_ID = 'algorithm32-color-reset-cr6b-brightest-2000-catalog-input-v1';
const ROSTER_SCHEMA_ID = 'algorithm32-color-reset-cr6b-brightest-2000-catalog-roster-v1';
const RESULT_SCHEMA_ID = 'algorithm32-color-reset-cr6b-brightest-2000-catalog-browser-result-v1';
const CONTRACT_ID = 'color-reset-cr6b-brightest-2000-catalog-v1';
const ROSTER_URL = '/run/data/cr6b-brightest-2000-roster.json';
const MEMBER_COUNT = 2000;
const PREFIX_COUNT = 500;
const PNG_TYPE = 'image/png';
const COLOR = Object.freeze({
	background: '#080d18',
	panel: '#0d1728',
	panel2: '#101c30',
	border: '#2b3e5c',
	grid: '#283b57',
	text: '#f0f5ff',
	secondary: '#aab9d0',
	prefix: '#ffd171',
	added: '#63bee9',
	positive: '#75d5b2',
	warning: '#ffca78',
});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

async function sha256Hex(bytes) {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
	);
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const offset = dataUrl.indexOf(marker);
	requireCondition(offset >= 0, 'CR6B PNG data URL is not base64 encoded.');
	const binary = atob(dataUrl.slice(offset + marker.length));
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

function createCanvas(dimensions, label) {
	const {widthPixels: width, heightPixels: height} = dimensions;
	requireCondition(Number.isSafeInteger(width) && width > 0, `${label} width is invalid.`);
	requireCondition(Number.isSafeInteger(height) && height > 0, `${label} height is invalid.`);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true, colorSpace: 'srgb'});
	requireCondition(context, `CR6B could not allocate the ${label} canvas.`);
	return {canvas, context};
}

async function uploadPng(artifactPath, canvas, kind, facts) {
	const bytes = dataUrlBytes(canvas.toDataURL(PNG_TYPE));
	const bitmap = await createImageBitmap(new Blob([bytes], {type: PNG_TYPE}), {
		colorSpaceConversion: 'none',
		premultiplyAlpha: 'none',
	});
	const decodedWidthPixels = bitmap.width;
	const decodedHeightPixels = bitmap.height;
	bitmap.close();
	requireCondition(
		decodedWidthPixels === canvas.width && decodedHeightPixels === canvas.height,
		`CR6B ${kind} PNG dimensions changed during encoding.`,
	);
	const response = await fetch(`/artifact/${artifactPath}`, {
		method: 'POST',
		headers: {'content-type': PNG_TYPE},
		body: bytes,
	});
	requireCondition(response.ok, `CR6B upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return {
		artifactPath,
		kind,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType: PNG_TYPE,
		decodablePng: true,
		decodedWidthPixels,
		decodedHeightPixels,
		...facts,
	};
}

function validateConfiguration(configuration) {
	requireCondition(configuration?.schemaId === INPUT_SCHEMA_ID, 'CR6B fixture schema changed.');
	const artifact = configuration.browserInput?.rosterArtifact;
	requireCondition(
		artifact?.path === configuration.outputs?.roster
			&& artifact.url === ROSTER_URL
			&& artifact.schemaId === ROSTER_SCHEMA_ID
			&& configuration.browserInput.rosterUrl === ROSTER_URL,
		'CR6B roster browser input changed.',
	);
	requireCondition(
		Number.isSafeInteger(artifact.byteLength) && artifact.byteLength > 0
			&& /^[0-9a-f]{64}$/u.test(artifact.sha256),
		'CR6B roster identity is invalid.',
	);
	for (const [name, dimensions] of Object.entries(configuration.presentation ?? {})) {
		if (!dimensions || typeof dimensions !== 'object' || !('widthPixels' in dimensions)) continue;
		requireCondition(
			Number.isSafeInteger(dimensions.widthPixels) && dimensions.widthPixels > 0
				&& Number.isSafeInteger(dimensions.heightPixels) && dimensions.heightPixels > 0,
			`CR6B ${name} dimensions are invalid.`,
		);
	}
	const figures = configuration.outputs?.figures;
	const expectedOrder = [
		figures?.first500AllSky,
		figures?.brightest2000AllSky,
		figures?.magnitudeByRank,
		figures?.summary,
	];
	requireCondition(
		exactJson(expectedOrder, configuration.outputs?.requestedImageUploadOrder)
			&& expectedOrder.every((path) => typeof path === 'string' && path.endsWith('.png')),
		'CR6B image paths or upload order changed.',
	);
	requireCondition(
		configuration.selection?.memberCount === MEMBER_COUNT
			&& configuration.productionPrefix?.memberCount === PREFIX_COUNT,
		'CR6B catalog or prefix size changed.',
	);
	return configuration;
}

async function fetchVerifiedRoster(declaration) {
	const response = await fetch(declaration.url);
	requireCondition(response.ok, `CR6B roster fetch failed with HTTP ${response.status}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === declaration.byteLength, 'CR6B roster byte length changed.');
	const sha256 = await sha256Hex(bytes);
	requireCondition(sha256 === declaration.sha256, 'CR6B roster SHA-256 changed.');
	let value;
	try {
		value = JSON.parse(new TextDecoder().decode(bytes));
	} catch (error) {
		throw new Error(`CR6B roster JSON decoding failed: ${error.message}`);
	}
	return {value, byteLength: bytes.byteLength, sha256};
}

function validateRoster(roster, configuration) {
	requireCondition(roster?.schemaId === ROSTER_SCHEMA_ID, 'CR6B roster schema changed.');
	requireCondition(roster.contract?.id === CONTRACT_ID, 'CR6B roster contract changed.');
	requireCondition(
		Array.isArray(roster.members) && roster.members.length > 0,
		'CR6B roster has no renderable members.',
	);
	for (let index = 0; index < roster.members.length; index += 1) {
		const member = roster.members[index];
		requireCondition(
			Number.isFinite(member.rightAscensionJ2000Hours)
				&& member.rightAscensionJ2000Hours >= 0
				&& member.rightAscensionJ2000Hours < 24
				&& Number.isFinite(member.declinationJ2000Degrees)
				&& member.declinationJ2000Degrees >= -90
				&& member.declinationJ2000Degrees <= 90,
			`CR6B J2000 coordinate at row ${index + 1} is not renderable.`,
		);
		requireCondition(
			Number.isFinite(member.visualMagnitude),
			`CR6B visual magnitude at row ${index + 1} is not renderable.`,
		);
	}
	return roster;
}

function fillBackground(context, canvas) {
	context.fillStyle = COLOR.background;
	context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHeader(context, canvas, title, subtitle) {
	context.textBaseline = 'top';
	context.fillStyle = COLOR.text;
	context.font = '700 23px system-ui, sans-serif';
	context.fillText(title, 30, 20);
	context.fillStyle = COLOR.secondary;
	context.font = '13px system-ui, sans-serif';
	context.fillText(subtitle, 30, 54);
	context.strokeStyle = COLOR.border;
	context.beginPath();
	context.moveTo(30, 82.5);
	context.lineTo(canvas.width - 30, 82.5);
	context.stroke();
}

function drawLegend(context, x, y, color, label, radius) {
	context.beginPath();
	context.arc(x, y + 7, radius, 0, Math.PI * 2);
	context.fillStyle = color;
	context.fill();
	context.fillStyle = COLOR.text;
	context.font = '600 13px system-ui, sans-serif';
	context.textBaseline = 'top';
	context.textAlign = 'left';
	context.fillText(label, x + 14, y);
}

function project(member, plot) {
	return {
		x: plot.left + (1 - member.rightAscensionJ2000Hours / 24) * plot.width,
		y: plot.top + (90 - member.declinationJ2000Degrees) / 180 * plot.height,
	};
}

function drawSkyGrid(context, plot) {
	context.fillStyle = COLOR.panel;
	context.fillRect(plot.left, plot.top, plot.width, plot.height);
	context.font = '11px ui-monospace, monospace';
	context.textBaseline = 'middle';
	context.textAlign = 'center';
	for (let rightAscension = 0; rightAscension <= 24; rightAscension += 3) {
		const x = plot.left + (1 - rightAscension / 24) * plot.width;
		context.strokeStyle = COLOR.grid;
		context.beginPath();
		context.moveTo(x + 0.5, plot.top);
		context.lineTo(x + 0.5, plot.top + plot.height);
		context.stroke();
		context.fillStyle = '#879bb8';
		context.fillText(rightAscension === 24 ? '0h' : `${rightAscension}h`, x, plot.top - 14);
	}
	context.textAlign = 'right';
	for (let declination = -90; declination <= 90; declination += 30) {
		const y = plot.top + (90 - declination) / 180 * plot.height;
		context.strokeStyle = COLOR.grid;
		context.beginPath();
		context.moveTo(plot.left, y + 0.5);
		context.lineTo(plot.left + plot.width, y + 0.5);
		context.stroke();
		context.fillStyle = '#879bb8';
		context.fillText(`${declination > 0 ? '+' : ''}${declination}°`, plot.left - 8, y);
	}
	context.strokeStyle = '#486282';
	context.strokeRect(plot.left + 0.5, plot.top + 0.5, plot.width - 1, plot.height - 1);
	context.textAlign = 'start';
}

function markerRadius(member, brightestMagnitude) {
	const relativeFlux = Number.isFinite(member.relativeVBandFlux)
		? member.relativeVBandFlux
		: 10 ** (-0.4 * (member.visualMagnitude - brightestMagnitude));
	const displayArea = 4.5 + 82 * clamp(relativeFlux, 0, 1) ** 0.55;
	return Math.sqrt(displayArea / Math.PI);
}

function drawMembers(context, members, plot, start, end, color) {
	context.save();
	context.beginPath();
	context.rect(plot.left, plot.top, plot.width, plot.height);
	context.clip();
	context.fillStyle = color;
	context.globalAlpha = 0.9;
	for (let index = end - 1; index >= start; index -= 1) {
		const member = members[index];
		const point = project(member, plot);
		context.beginPath();
		context.arc(point.x, point.y, markerRadius(member, members[0].visualMagnitude), 0, Math.PI * 2);
		context.fill();
	}
	context.restore();
}

function makeAllSky(configuration, roster, count) {
	const prefixOnly = count === PREFIX_COUNT;
	const renderedCount = Math.min(count, roster.members.length);
	const renderedPrefixCount = Math.min(PREFIX_COUNT, renderedCount);
	const dimensions = prefixOnly
		? configuration.presentation.first500AllSky
		: configuration.presentation.brightest2000AllSky;
	const {canvas, context} = createCanvas(dimensions, prefixOnly ? 'first-500 map' : 'brightest-2000 map');
	fillBackground(context, canvas);
	drawHeader(
		context,
		canvas,
		prefixOnly ? 'CR6B retained brightest-500 catalog prefix' : 'CR6B exact brightest-2,000 catalog roster',
		'BSC V/50 • J2000 equirectangular all-sky • right ascension increases leftward',
	);
	const plot = {left: 66, top: 116, width: canvas.width - 98, height: canvas.height - 216};
	drawSkyGrid(context, plot);
	if (!prefixOnly) {
		drawMembers(
			context,
			roster.members,
			plot,
			renderedPrefixCount,
			renderedCount,
			COLOR.added,
		);
	}
	drawMembers(context, roster.members, plot, 0, renderedPrefixCount, COLOR.prefix);
	if (prefixOnly) {
		drawLegend(context, 72, canvas.height - 66, COLOR.prefix, 'ranks 1–500 (exact retained prefix)', 4.5);
	} else {
		drawLegend(context, 72, canvas.height - 66, COLOR.prefix, 'ranks 1–500', 4.5);
		drawLegend(context, 260, canvas.height - 66, COLOR.added, 'ranks 501–2,000', 3.5);
	}
	context.fillStyle = '#7f93b0';
	context.font = '11px system-ui, sans-serif';
	context.textBaseline = 'top';
	context.fillText(
		'Marker area is a monotonic display encoding of relative V-band flux; positions and ranks are catalog values.',
		72,
		canvas.height - 34,
	);
	return {
		canvas,
		facts: {
			projection: 'J2000 equirectangular',
			rightAscensionDirection: 'increases-leftward',
			plottedMemberCount: renderedCount,
			retainedPrefixCount: renderedPrefixCount,
			addedMemberCount: Math.max(0, renderedCount - renderedPrefixCount),
			pointAreaDisplayWeightedBy: 'relative V-band flux',
		},
	};
}

function makeMagnitudePlot(configuration, roster) {
	const {canvas, context} = createCanvas(configuration.presentation.magnitudeByRank, 'magnitude plot');
	fillBackground(context, canvas);
	drawHeader(
		context,
		canvas,
		'CR6B visual magnitude by catalog rank',
		'Exact ascending V-magnitude order; ascending HR is the deterministic tie-break',
	);
	const plot = {left: 78, top: 112, right: canvas.width - 38, bottom: canvas.height - 100};
	const width = plot.right - plot.left;
	const height = plot.bottom - plot.top;
	const minimum = Math.floor(roster.members[0].visualMagnitude * 2) / 2;
	const maximum = Math.ceil(roster.members.at(-1).visualMagnitude * 2) / 2;
	const memberCount = roster.members.length;
	const prefixCount = Math.min(PREFIX_COUNT, memberCount);
	const x = (rank) => plot.left + (rank - 1) / Math.max(1, memberCount - 1) * width;
	const y = (magnitude) => plot.top + (magnitude - minimum) / (maximum - minimum) * height;
	context.fillStyle = COLOR.panel;
	context.fillRect(plot.left, plot.top, width, height);
	context.font = '11px ui-monospace, monospace';
	context.textBaseline = 'middle';
	context.textAlign = 'right';
	for (let magnitude = minimum; magnitude <= maximum + 1e-9; magnitude += 0.5) {
		const row = y(magnitude);
		context.strokeStyle = COLOR.grid;
		context.beginPath();
		context.moveTo(plot.left, row + 0.5);
		context.lineTo(plot.right, row + 0.5);
		context.stroke();
		context.fillStyle = '#879bb8';
		context.fillText(magnitude.toFixed(1), plot.left - 10, row);
	}
	context.textAlign = 'center';
	for (const rank of [1, 250, 500, 750, 1000, 1250, 1500, 1750, 2000]) {
		const column = x(rank);
		context.strokeStyle = COLOR.grid;
		context.beginPath();
		context.moveTo(column + 0.5, plot.top);
		context.lineTo(column + 0.5, plot.bottom);
		context.stroke();
		context.fillStyle = '#879bb8';
		context.fillText(String(rank), column, plot.bottom + 18);
	}
	function drawRange(start, end, color) {
		context.strokeStyle = color;
		context.lineWidth = 2;
		context.beginPath();
		for (let index = start; index < end; index += 1) {
			const column = x(index + 1);
			const row = y(roster.members[index].visualMagnitude);
			if (index === start) context.moveTo(column, row);
			else context.lineTo(column, row);
		}
		context.stroke();
	}
	drawRange(0, prefixCount, COLOR.prefix);
	if (memberCount > prefixCount) drawRange(Math.max(0, prefixCount - 1), memberCount, COLOR.added);
	const boundary = x(prefixCount);
	context.save();
	context.setLineDash([7, 5]);
	context.strokeStyle = COLOR.prefix;
	context.beginPath();
	context.moveTo(boundary, plot.top);
	context.lineTo(boundary, plot.bottom);
	context.stroke();
	context.restore();
	context.fillStyle = COLOR.prefix;
	context.font = '600 12px system-ui, sans-serif';
	context.textAlign = 'left';
	context.fillText('retained-prefix boundary', boundary + 8, plot.top + 14);
	context.strokeStyle = '#486282';
	context.strokeRect(plot.left + 0.5, plot.top + 0.5, width - 1, height - 1);
	context.fillStyle = COLOR.text;
	context.textAlign = 'center';
	context.fillText('catalog rank (1 = brightest)', (plot.left + plot.right) / 2, canvas.height - 50);
	drawLegend(context, canvas.width - 360, canvas.height - 54, COLOR.prefix, 'ranks 1–500', 4.5);
	drawLegend(context, canvas.width - 180, canvas.height - 54, COLOR.added, 'ranks 501–2,000', 3.5);
	return {
		canvas,
		facts: {
			rankMinimum: 1,
			rankMaximum: memberCount,
			visualMagnitudeMinimum: roster.members[0].visualMagnitude,
			visualMagnitudeMaximum: roster.members.at(-1).visualMagnitude,
			retainedPrefixBoundaryRank: prefixCount,
			rankOrder: 'ascending visualMagnitude; ascending hr tie-break',
		},
	};
}

function makeSummary(configuration, roster, canvases) {
	const {canvas, context} = createCanvas(configuration.presentation.summary, 'summary');
	fillBackground(context, canvas);
	const positions = [24, 628, 1232];
	context.imageSmoothingEnabled = false;
	for (let index = 0; index < canvases.length; index += 1) {
		context.drawImage(canvases[index], 24, positions[index]);
		context.strokeStyle = COLOR.border;
		context.strokeRect(24.5, positions[index] + 0.5, canvases[index].width - 1, canvases[index].height - 1);
	}
	context.fillStyle = COLOR.panel2;
	context.fillRect(24, 1848, 1200, 108);
	context.fillStyle = COLOR.positive;
	context.font = '700 13px system-ui, sans-serif';
	context.textBaseline = 'top';
	context.fillText('CATALOG-ONLY RESULT', 44, 1865);
	context.fillStyle = COLOR.text;
	context.font = '13px system-ui, sans-serif';
	context.fillText(
		`${Math.min(PREFIX_COUNT, roster.members.length)} prefix members + ${Math.max(0, roster.members.length - PREFIX_COUNT)} added members = ${roster.members.length} catalog rows.`,
		44,
		1890,
	);
	context.fillStyle = COLOR.warning;
	context.fillText(
		`${roster.photometryCoverage.unsupportedMemberCount} red photometry exceptions remain; spectral handling and runtime appearance are separate.`,
		44,
		1917,
	);
	return {
		canvas,
		facts: {
			panelCount: 3,
			panelPlacement: 'native 1200x600 pixels, no scaling',
			memberCount: roster.members.length,
			retainedPrefixCount: Math.min(PREFIX_COUNT, roster.members.length),
			addedMemberCount: Math.max(0, roster.members.length - PREFIX_COUNT),
			claimBoundary: 'catalog-only',
		},
	};
}

/** Render and upload every CR6B catalog image before returning browser evidence. */
export async function runCr6bBrightest2000CatalogBrowser() {
	const rawConfiguration = await fetch('/browser/config.json').then((response) => {
		requireCondition(response.ok, `CR6B configuration failed with HTTP ${response.status}.`);
		return response.json();
	});
	const configuration = validateConfiguration(rawConfiguration);
	await window.colorResetProgress('catalog-input-started');
	const fetched = await fetchVerifiedRoster(configuration.browserInput.rosterArtifact);
	const roster = validateRoster(fetched.value, configuration);
	await window.colorResetProgress('catalog-input-verified');

	const first500 = makeAllSky(configuration, roster, PREFIX_COUNT);
	const full = makeAllSky(configuration, roster, MEMBER_COUNT);
	const magnitude = makeMagnitudePlot(configuration, roster);
	const images = [];
	const uploadOrder = [];
	try {
		const entries = [
			[configuration.outputs.figures.first500AllSky, first500, 'first-500-all-sky'],
			[configuration.outputs.figures.brightest2000AllSky, full, 'brightest-2000-all-sky'],
			[configuration.outputs.figures.magnitudeByRank, magnitude, 'magnitude-by-rank'],
		];
		for (let index = 0; index < entries.length; index += 1) {
			const [artifactPath, image, kind] = entries[index];
			images.push(await uploadPng(artifactPath, image.canvas, kind, image.facts));
			uploadOrder.push(artifactPath);
			await window.colorResetProgress(`image-${index + 1}-complete`);
		}
		const summary = makeSummary(configuration, roster, [first500.canvas, full.canvas, magnitude.canvas]);
		try {
			images.push(await uploadPng(
				configuration.outputs.figures.summary,
				summary.canvas,
				'brightest-2000-catalog-summary',
				summary.facts,
			));
			uploadOrder.push(configuration.outputs.figures.summary);
		} finally {
			summary.canvas.remove();
		}
		requireCondition(
			exactJson(uploadOrder, configuration.outputs.requestedImageUploadOrder),
			'CR6B complete image upload order changed.',
		);
		await window.colorResetProgress('catalog-images-complete');
		return {
			schemaId: RESULT_SCHEMA_ID,
			renderComplete: true,
			allDeclaredImagesUploaded: true,
			uploadOrder,
			images,
			input: {
				artifactPath: configuration.browserInput.rosterArtifact.path,
				byteLength: fetched.byteLength,
				sha256: fetched.sha256,
				schemaId: roster.schemaId,
				parsedRecordCount: roster.parsedRecordCount,
				selectedMemberCount: roster.members.length,
			},
			roster: {
				memberCount: roster.members.length,
				retainedPrefixCount: Math.min(PREFIX_COUNT, roster.members.length),
				addedMemberCount: Math.max(0, roster.members.length - PREFIX_COUNT),
				brightest: {
					canonicalRank: 1,
					memberId: roster.members[0].memberId,
					hr: roster.members[0].hr,
					visualMagnitude: roster.members[0].visualMagnitude,
				},
				faintest: {
					canonicalRank: roster.members.length,
					memberId: roster.members.at(-1).memberId,
					hr: roster.members.at(-1).hr,
					visualMagnitude: roster.members.at(-1).visualMagnitude,
				},
			},
			claimBoundary: {
				catalogRosterOnly: true,
				catalogRowsVisualized: true,
				exactCatalogRosterEvaluatedByRunner: true,
				spectralPacketsMaterialized: false,
				runtimeIntegrated: false,
				displayedAppearanceAccepted: false,
			},
		};
	} finally {
		first500.canvas.remove();
		full.canvas.remove();
		magnitude.canvas.remove();
	}
}
