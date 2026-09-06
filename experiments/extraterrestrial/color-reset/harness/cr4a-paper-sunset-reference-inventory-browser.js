const EXPECTED_FIGURE9_MODEL_IDS = Object.freeze([
	'nishita93',
	'nishita96',
	'preetham',
	'oneal',
	'haber',
	'bruneton',
	'elek',
	'hosek',
]);
const EXPECTED_FIGURE1_MODEL_IDS = Object.freeze([
	...EXPECTED_FIGURE9_MODEL_IDS,
	'libradtran',
]);
const PNG_CONTENT_TYPE = 'image/png';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR4a PNG data URL is not base64 encoded.');
	const binary = atob(dataUrl.slice(markerIndex + marker.length));
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

async function sha256Hex(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	const digest = await crypto.subtle.digest(
		'SHA-256',
		view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
	);
	return Array.from(
		new Uint8Array(digest),
		(value) => value.toString(16).padStart(2, '0'),
	).join('');
}

async function fetchVerifiedSource(declaration, label) {
	const response = await fetch(`/run/${declaration.artifactPath}`);
	requireCondition(response.ok, `${label} fetch failed with HTTP ${response.status}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === declaration.byteLength, `${label} byte length changed.`);
	const sha256 = await sha256Hex(bytes);
	requireCondition(sha256 === declaration.sha256, `${label} SHA-256 changed.`);
	const bitmap = await createImageBitmap(new Blob([bytes], {type: PNG_CONTENT_TYPE}));
	requireCondition(
		bitmap.width === declaration.widthPixels && bitmap.height === declaration.heightPixels,
		`${label} dimensions changed.`,
	);
	return {
		...declaration,
		bitmap,
		verifiedByteLength: bytes.byteLength,
		verifiedSha256: sha256,
	};
}

async function uploadBytes(artifactPath, bytes) {
	const decoded = await createImageBitmap(new Blob([bytes], {type: PNG_CONTENT_TYPE}));
	const decodedWidthPixels = decoded.width;
	const decodedHeightPixels = decoded.height;
	decoded.close();
	const response = await fetch(`/artifact/${artifactPath}`, {
		method: 'POST',
		headers: {'content-type': PNG_CONTENT_TYPE},
		body: bytes,
	});
	requireCondition(
		response.ok,
		`CR4a artifact upload failed for ${artifactPath}: HTTP ${response.status}.`,
	);
	return {
		artifactPath,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType: PNG_CONTENT_TYPE,
		decodablePng: true,
		decodedWidthPixels,
		decodedHeightPixels,
	};
}

function canvasPngBytes(canvas) {
	return dataUrlBytes(canvas.toDataURL(PNG_CONTENT_TYPE));
}

function createCanvas(width, height, label) {
	requireCondition(Number.isSafeInteger(width) && width > 0, `${label} width is invalid.`);
	requireCondition(Number.isSafeInteger(height) && height > 0, `${label} height is invalid.`);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
	requireCondition(context, `CR4a could not create the ${label} canvas.`);
	context.imageSmoothingEnabled = false;
	return {canvas, context};
}

function decodedPixels(panel) {
	const {canvas, context} = createCanvas(
		panel.widthPixels,
		panel.heightPixels,
		`${panel.modelId} decode audit`,
	);
	context.drawImage(panel.bitmap, 0, 0);
	const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
	canvas.remove();
	return pixels;
}

function compareRgbaCodes(left, right) {
	requireCondition(left.length === right.length, 'CR4a RGBA comparison lengths differ.');
	let differingCodeCount = 0;
	let maximumAbsoluteCodeDifference = 0;
	for (let index = 0; index < left.length; index += 1) {
		const difference = Math.abs(left[index] - right[index]);
		if (difference !== 0) differingCodeCount += 1;
		if (difference > maximumAbsoluteCodeDifference) {
			maximumAbsoluteCodeDifference = difference;
		}
	}
	return {
		comparedCodeCount: left.length,
		differingCodeCount,
		maximumAbsoluteCodeDifference,
		exact: differingCodeCount === 0,
	};
}

function fillBackground(context, width, height) {
	context.fillStyle = '#0b1020';
	context.fillRect(0, 0, width, height);
}

function drawHeader(context, {title, subtitle, width, headerHeight}) {
	context.fillStyle = '#f4f7ff';
	context.font = '700 26px sans-serif';
	context.textBaseline = 'top';
	context.fillText(title, 24, 20);
	context.fillStyle = '#aebbd4';
	context.font = '15px sans-serif';
	context.fillText(subtitle, 24, 57);
	context.strokeStyle = '#31405f';
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(24, headerHeight - 12.5);
	context.lineTo(width - 24, headerHeight - 12.5);
	context.stroke();
}

function makeVerticalColumn({title, subtitle, panels, kind}) {
	requireCondition(panels.length > 0, `CR4a ${kind} column has no panels.`);
	const imageWidth = panels[0].widthPixels;
	const imageHeight = panels[0].heightPixels;
	requireCondition(
		panels.every((panel) => panel.widthPixels === imageWidth && panel.heightPixels === imageHeight),
		`CR4a ${kind} panel dimensions are inconsistent.`,
	);
	const padding = 24;
	const labelWidth = 224;
	const headerHeight = 96;
	const rowGap = 8;
	const width = padding * 2 + labelWidth + imageWidth;
	const height = headerHeight + panels.length * imageHeight + (panels.length - 1) * rowGap + padding;
	const {canvas, context} = createCanvas(width, height, `${kind} column`);
	fillBackground(context, width, height);
	drawHeader(context, {title, subtitle, width, headerHeight});

	const pixelAudits = [];
	for (let index = 0; index < panels.length; index += 1) {
		const panel = panels[index];
		const y = headerHeight + index * (imageHeight + rowGap);
		context.fillStyle = index % 2 === 0 ? '#111a2d' : '#0f1728';
		context.fillRect(padding, y, labelWidth + imageWidth, imageHeight);
		context.fillStyle = '#f4f7ff';
		context.font = '700 18px sans-serif';
		context.textBaseline = 'top';
		context.fillText(panel.modelLabel, padding + 16, y + 18);
		context.fillStyle = '#9dafcc';
		context.font = '13px monospace';
		context.fillText(panel.modelId, padding + 16, y + 48);
		context.fillText(panel.sourceLabel, padding + 16, y + 70);
		const imageX = padding + labelWidth;
		context.drawImage(panel.bitmap, imageX, y);

		const sourcePixels = decodedPixels(panel);
		const composedPixels = context.getImageData(imageX, y, imageWidth, imageHeight).data;
		pixelAudits.push({
			modelId: panel.modelId,
			artifactPath: panel.artifactPath,
			drawX: imageX,
			drawY: y,
			widthPixels: imageWidth,
			heightPixels: imageHeight,
			imageSmoothingEnabled: false,
			scale: 1,
			crop: null,
			decodedRgbaParity: compareRgbaCodes(sourcePixels, composedPixels),
		});
	}
	return {
		canvas,
		facts: {
			kind,
			widthPixels: width,
			heightPixels: height,
			panelCount: panels.length,
			modelOrder: panels.map(({modelId}) => modelId),
			panelDimensions: {widthPixels: imageWidth, heightPixels: imageHeight},
			pixelAudits,
		},
	};
}

function wrapLines(context, text, maximumWidth) {
	const words = text.split(/\s+/u).filter(Boolean);
	const lines = [];
	let current = '';
	for (const word of words) {
		const candidate = current.length === 0 ? word : `${current} ${word}`;
		if (current.length > 0 && context.measureText(candidate).width > maximumWidth) {
			lines.push(current);
			current = word;
		} else {
			current = candidate;
		}
	}
	if (current.length > 0) lines.push(current);
	return lines;
}

function makeMethodsPlate(config) {
	const width = 1280;
	const height = 900;
	const {canvas, context} = createCanvas(width, height, 'methods and claim-boundary plate');
	fillBackground(context, width, height);
	context.fillStyle = '#f4f7ff';
	context.font = '700 31px sans-serif';
	context.textBaseline = 'top';
	context.fillText('CR4a paper sunset-reference inventory', 42, 36);
	context.fillStyle = '#aebbd4';
	context.font = '14px sans-serif';
	context.fillText(`${config.paper.author} - ${config.paper.title}`, 42, 76);
	context.fillStyle = '#68d7b4';
	context.font = '700 17px sans-serif';
	context.fillText('METHOD', 42, 108);

	let y = 142;
	context.font = '16px sans-serif';
	for (const line of config.methods.methodLines) {
		context.fillStyle = '#c8d4e8';
		context.fillRect(46, y + 7, 6, 6);
		for (const wrapped of wrapLines(context, line, width - 118)) {
			context.fillText(wrapped, 68, y);
			y += 24;
		}
		y += 6;
	}

	y += 8;
	context.fillStyle = '#ffcf70';
	context.font = '700 17px sans-serif';
	context.fillText('CLAIM BOUNDARY', 42, y);
	y += 34;
	context.font = '16px sans-serif';
	for (const line of config.methods.claimBoundaryLines) {
		context.fillStyle = '#c8d4e8';
		context.fillRect(46, y + 7, 6, 6);
		for (const wrapped of wrapLines(context, line, width - 118)) {
			context.fillText(wrapped, 68, y);
			y += 24;
		}
		y += 6;
	}

	context.fillStyle = '#25324c';
	context.fillRect(42, height - 90, width - 84, 48);
	context.fillStyle = '#aebbd4';
	context.font = '13px monospace';
	context.fillText(`PDF SHA-256  ${config.paper.pdfSha256}`, 58, height - 76);
	context.fillText(`Fixture SHA-256  ${config.fixtureSha256}`, 58, height - 57);
	return {
		canvas,
		facts: {
			kind: 'methods-and-claim-boundary',
			widthPixels: width,
			heightPixels: height,
			methodLines: [...config.methods.methodLines],
			claimBoundaryLines: [...config.methods.claimBoundaryLines],
		},
	};
}

function validateConfiguration(config) {
	requireCondition(
		config?.schemaId === 'algorithm32-color-reset-cr4a-paper-reference-browser-config-v1',
		'CR4a browser configuration schema changed.',
	);
	requireCondition(
		exactJson(config.sources.figure9.map(({modelId}) => modelId), EXPECTED_FIGURE9_MODEL_IDS),
		'CR4a Figure 9 model order changed.',
	);
	requireCondition(
		exactJson(config.sources.figure1.map(({modelId}) => modelId), EXPECTED_FIGURE1_MODEL_IDS),
		'CR4a Figure 1 model order changed.',
	);
	const outputPaths = [
		config.outputs.swatchColumn,
		config.outputs.domeColumn,
		config.outputs.methodsClaimBoundaryPlate,
	];
	requireCondition(
		outputPaths.every((value) => typeof value === 'string' && value.endsWith('.png')) &&
			new Set(outputPaths).size === outputPaths.length,
		'CR4a output paths are invalid or duplicated.',
	);
	requireCondition(
		Array.isArray(config.methods.methodLines) && config.methods.methodLines.length > 0 &&
		Array.isArray(config.methods.claimBoundaryLines) && config.methods.claimBoundaryLines.length > 0,
		'CR4a methods plate text is incomplete.',
	);
	return config;
}

/** Compose the paper-only CR4a inventory and upload every declared image before returning. */
export async function runCr4aPaperSunsetReferenceInventoryBrowser() {
	const browserConfiguration = await fetch('/browser/config.json').then((response) => {
		requireCondition(
			response.ok,
			`CR4a browser configuration failed with HTTP ${response.status}.`,
		);
		return response.json();
	});
	const config = validateConfiguration(browserConfiguration);
	await window.colorResetProgress('paper-inputs-started');
	const [figure9Panels, figure1Panels] = await Promise.all([
		Promise.all(config.sources.figure9.map((panel) =>
			fetchVerifiedSource(panel, `CR4a Figure 9 ${panel.modelId}`),
		)),
		Promise.all(config.sources.figure1.map((panel) =>
			fetchVerifiedSource(panel, `CR4a Figure 1 ${panel.modelId}`),
		)),
	]);
	await window.colorResetProgress('paper-inputs-verified');

	const images = [];
	const uploadOrder = [];
	try {
		const swatchColumn = makeVerticalColumn({
			title: 'Figure 9 sunrise paper-model swatches',
			subtitle: 'Original-paper wavelength implementations; per-model 36 W/m^2 normalization; native 1:1 pixels',
			panels: figure9Panels,
			kind: 'figure9-sunrise-swatch-column',
		});
		const swatchUpload = await uploadBytes(
			config.outputs.swatchColumn,
			canvasPngBytes(swatchColumn.canvas),
		);
		images.push({...swatchUpload, ...swatchColumn.facts});
		uploadOrder.push(config.outputs.swatchColumn);
		swatchColumn.canvas.remove();
		await window.colorResetProgress('first-image-complete');

		const domeColumn = makeVerticalColumn({
			title: 'Figure 1 z87 full-spectral paper sky domes',
			subtitle: 'Paper full-spectral 06h00 sources; exact retained PNGs placed at native 256 x 256 size',
			panels: figure1Panels,
			kind: 'figure1-z87-dome-column',
		});
		const domeUpload = await uploadBytes(
			config.outputs.domeColumn,
			canvasPngBytes(domeColumn.canvas),
		);
		images.push({...domeUpload, ...domeColumn.facts});
		uploadOrder.push(config.outputs.domeColumn);
		domeColumn.canvas.remove();

		const methodsPlate = makeMethodsPlate(config);
		const methodsUpload = await uploadBytes(
			config.outputs.methodsClaimBoundaryPlate,
			canvasPngBytes(methodsPlate.canvas),
		);
		images.push({...methodsUpload, ...methodsPlate.facts});
		uploadOrder.push(config.outputs.methodsClaimBoundaryPlate);
		methodsPlate.canvas.remove();
		await window.colorResetProgress('decision-plate-complete');

		const expectedUploadOrder = [
			config.outputs.swatchColumn,
			config.outputs.domeColumn,
			config.outputs.methodsClaimBoundaryPlate,
		];
		requireCondition(
			exactJson(uploadOrder, expectedUploadOrder),
			'CR4a complete image upload order changed.',
		);
		return {
			schemaId: 'algorithm32-color-reset-cr4a-paper-reference-browser-result-v1',
			paperOnly: true,
			allDeclaredImagesUploaded: true,
			uploadOrder,
			sources: {
				figure9: figure9Panels.map((panel) => ({
					artifactPath: panel.artifactPath,
					modelId: panel.modelId,
					objectName: panel.objectName,
					byteLength: panel.verifiedByteLength,
					sha256: panel.verifiedSha256,
					widthPixels: panel.widthPixels,
					heightPixels: panel.heightPixels,
				})),
				figure1: figure1Panels.map((panel) => ({
					artifactPath: panel.artifactPath,
					modelId: panel.modelId,
					byteLength: panel.verifiedByteLength,
					sha256: panel.verifiedSha256,
					widthPixels: panel.widthPixels,
					heightPixels: panel.heightPixels,
				})),
			},
			images,
			composition: {
				implementation: 'browser Canvas2D',
				imageSmoothingEnabled: false,
				sourceScale: 1,
				sourceCrop: null,
				appearanceOperation: 'none; labels and layout only',
			},
			claimBoundary: {
				qualitativePaperReferenceOnly: true,
				absoluteRadianceComparison: false,
				rmseComparison: false,
				timeOrLocationEquivalence: false,
				candidateAcceptance: false,
			},
		};
	} finally {
		for (const panel of [...figure9Panels, ...figure1Panels]) panel.bitmap.close();
	}
}
