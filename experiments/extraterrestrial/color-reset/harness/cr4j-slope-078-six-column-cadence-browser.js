function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR4J PNG data URL is not base64 encoded.');
	const binary = atob(dataUrl.slice(markerIndex + marker.length));
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

async function sha256Hex(bytes) {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	const digest = await crypto.subtle.digest(
		'SHA-256',
		view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
	);
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

async function fetchVerifiedBytes(prefix, declaration, label) {
	const response = await fetch(prefix + declaration.path);
	requireCondition(response.ok, `${label} fetch failed with HTTP ${response.status}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	requireCondition(bytes.byteLength === declaration.byteLength, `${label} byte length changed.`);
	const sha256 = await sha256Hex(bytes);
	requireCondition(sha256 === declaration.sha256, `${label} SHA-256 changed.`);
	return {
		bytes,
		evidence: {
			path: declaration.path,
			byteLength: bytes.byteLength,
			sha256,
			verified: true,
		},
	};
}

function parseVerifiedJson(input, label) {
	try {
		return JSON.parse(new TextDecoder().decode(input.bytes));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${error.message}`);
	}
}

async function decodePng(bytes, expectedWidth, expectedHeight, label) {
	const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}), {
		colorSpaceConversion: 'none',
		premultiplyAlpha: 'none',
	});
	try {
		requireCondition(
			bitmap.width === expectedWidth && bitmap.height === expectedHeight,
			`${label} dimensions changed: ${bitmap.width} x ${bitmap.height}.`,
		);
		const canvas = document.createElement('canvas');
		canvas.width = expectedWidth;
		canvas.height = expectedHeight;
		const context = canvas.getContext('2d', {
			alpha: true,
			willReadFrequently: true,
			colorSpace: 'srgb',
		});
		requireCondition(context, `CR4J could not decode ${label}.`);
		context.imageSmoothingEnabled = false;
		context.drawImage(bitmap, 0, 0);
		const rgba = new Uint8ClampedArray(
			context.getImageData(0, 0, expectedWidth, expectedHeight).data,
		);
		canvas.remove();
		return {rgba, width: expectedWidth, height: expectedHeight};
	} finally {
		bitmap.close();
	}
}

async function uploadBytes(artifactPath, bytes, contentType) {
	const response = await fetch('/artifact/' + artifactPath, {
		method: 'POST',
		headers: {'content-type': contentType},
		body: bytes,
	});
	requireCondition(response.ok, `CR4J artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return {
		artifactPath,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType,
	};
}

function verifyParent(configuration, manifest, manifestEvidence) {
	const declaration = configuration.parent;
	requireCondition(
		manifest.runId === declaration.runId &&
			manifest.conclusion === declaration.conclusion &&
			manifest.artifactSetSha256 === declaration.artifactSetSha256,
		'CR4J parent terminal manifest identity changed.',
	);
	requireCondition(Array.isArray(manifest.artifacts), 'CR4J parent manifest artifacts are missing.');
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	for (const scene of configuration.scenes) {
		const recorded = byPath.get(scene.source.path);
		requireCondition(recorded !== undefined, `CR4J parent manifest omits ${scene.source.path}.`);
		requireCondition(
			recorded.byteLength === scene.source.byteLength && recorded.sha256 === scene.source.sha256,
			`CR4J parent manifest identity changed for ${scene.source.path}.`,
		);
	}
	return {
		namespace: declaration.namespace,
		runId: declaration.runId,
		conclusion: declaration.conclusion,
		artifactSetSha256: declaration.artifactSetSha256,
		manifest: manifestEvidence,
		selectedArtifactCount: configuration.scenes.length,
		verified: true,
	};
}

function calculateLayout(configuration) {
	const panelWidth = configuration.viewport.widthPixels;
	const panelHeight = configuration.viewport.heightPixels;
	const layout = configuration.presentation.layout;
	const width =
		layout.outerPaddingPixels * 2 +
		layout.columnCount * panelWidth +
		(layout.columnCount - 1) * layout.columnGapPixels;
	const height =
		layout.outerPaddingPixels * 2 +
		layout.titleHeightPixels +
		layout.rowCount * (layout.panelLabelHeightPixels + panelHeight) +
		(layout.rowCount - 1) * layout.rowGapPixels;
	requireCondition(
		width === layout.expectedWidthPixels && height === layout.expectedHeightPixels,
		'CR4J declared cadence dimensions disagree with the layout equation.',
	);
	return {width, height, panelWidth, panelHeight};
}

function formatReceiverIlluminance(illuminance) {
	const value = illuminance.value;
	requireCondition(illuminance.units === 'lux' && Number.isFinite(value) && value >= 0, 'CR4J scene receiver illuminance is invalid.');
	if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)} klux`;
	if (value >= 10) return `${value.toFixed(value >= 100 ? 0 : 1)} lux`;
	return `${value.toFixed(value >= 1 ? 2 : 3)} lux`;
}

function formatSceneLabel(scene) {
	requireCondition(Number.isFinite(scene.solarElevationDegrees), `CR4J ${scene.id} solar elevation is invalid.`);
	const elevation = `${scene.solarElevationDegrees >= 0 ? '+' : ''}${scene.solarElevationDegrees.toFixed(2)}°`;
	return `${scene.label}  |  Sun ${elevation}  |  ${formatReceiverIlluminance(scene.totalHorizontalIlluminance)}`;
}

function drawCadence(configuration, decodedScenes) {
	const dimensions = calculateLayout(configuration);
	const layout = configuration.presentation.layout;
	const canvas = document.createElement('canvas');
	canvas.width = dimensions.width;
	canvas.height = dimensions.height;
	const context = canvas.getContext('2d', {
		alpha: true,
		willReadFrequently: true,
		colorSpace: 'srgb',
	});
	requireCondition(context, 'CR4J cadence requires a 2D canvas context.');
	context.imageSmoothingEnabled = false;
	context.fillStyle = layout.backgroundCss;
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.textAlign = 'left';
	context.textBaseline = 'middle';
	context.fillStyle = layout.headingCss;
	context.font = '600 24px sans-serif';
	context.fillText(
		configuration.presentation.title,
		layout.outerPaddingPixels,
		layout.outerPaddingPixels + 20,
	);
	context.fillStyle = layout.secondaryCss;
	context.font = '14px sans-serif';
	context.fillText(
		configuration.presentation.subtitle,
		layout.outerPaddingPixels,
		layout.outerPaddingPixels + 47,
	);

	const placements = [];
	for (const decoded of decodedScenes) {
		const {scene} = decoded;
		const cellX =
			layout.outerPaddingPixels +
			scene.column * (dimensions.panelWidth + layout.columnGapPixels);
		const cellY =
			layout.outerPaddingPixels +
			layout.titleHeightPixels +
			scene.row *
				(layout.panelLabelHeightPixels + dimensions.panelHeight + layout.rowGapPixels);
		const panelY = cellY + layout.panelLabelHeightPixels;

		context.textAlign = 'center';
		context.fillStyle = layout.headingCss;
		context.font = '600 16px sans-serif';
		context.fillText(
			formatSceneLabel(scene),
			cellX + dimensions.panelWidth / 2,
			cellY + layout.panelLabelHeightPixels / 2,
		);
		context.strokeStyle = layout.borderCss;
		context.lineWidth = 1;
		context.strokeRect(
			cellX - 1,
			panelY - 1,
			dimensions.panelWidth + 2,
			dimensions.panelHeight + 2,
		);
		context.putImageData(
			new ImageData(decoded.decoded.rgba, dimensions.panelWidth, dimensions.panelHeight),
			cellX,
			panelY,
		);
		placements.push({sceneId: scene.id, row: scene.row, column: scene.column, x: cellX, y: panelY});
	}
	return {canvas, dimensions, placements};
}

function compareEmbeddedRegion(outputRgba, outputWidth, sourceRgba, sourceWidth, sourceHeight, x, y) {
	let differingChannelCount = 0;
	let maximumAbsoluteChannelDifference = 0;
	for (let sourceY = 0; sourceY < sourceHeight; sourceY += 1) {
		for (let sourceX = 0; sourceX < sourceWidth; sourceX += 1) {
			const sourceOffset = (sourceY * sourceWidth + sourceX) * 4;
			const outputOffset = ((y + sourceY) * outputWidth + x + sourceX) * 4;
			for (let channel = 0; channel < 4; channel += 1) {
				const difference = Math.abs(outputRgba[outputOffset + channel] - sourceRgba[sourceOffset + channel]);
				if (difference > 0) differingChannelCount += 1;
				maximumAbsoluteChannelDifference = Math.max(maximumAbsoluteChannelDifference, difference);
			}
		}
	}
	return {
		exact: differingChannelCount === 0,
		differingChannelCount,
		maximumAbsoluteChannelDifference,
		comparedChannelCount: sourceWidth * sourceHeight * 4,
	};
}

/** Compose and upload the presentation-only slope-078 cadence before evaluating pixel gates. */
export async function runCr4jSlope078SixColumnCadenceBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, 'CR4J browser configuration fetch failed.');
	const configuration = await configurationResponse.json();
	await window.colorResetProgress('render-started');

	const manifestInput = await fetchVerifiedBytes(
		'/parent/',
		configuration.parent.manifest,
		'CR4J parent manifest',
	);
	const manifest = parseVerifiedJson(manifestInput, 'CR4J parent manifest');
	const parent = verifyParent(configuration, manifest, manifestInput.evidence);
	const decodedScenes = await Promise.all(
		configuration.scenes.map(async (scene) => {
			const input = await fetchVerifiedBytes('/parent/', scene.source, `CR4J ${scene.id}`);
			const decoded = await decodePng(
				input.bytes,
				configuration.viewport.widthPixels,
				configuration.viewport.heightPixels,
				`CR4J ${scene.id}`,
			);
			return {scene, input: input.evidence, decoded};
		}),
	);

	const cadence = drawCadence(configuration, decodedScenes);
	const cadenceBytes = dataUrlBytes(cadence.canvas.toDataURL('image/png'));
	const upload = await uploadBytes(configuration.outputs.cadence, cadenceBytes, 'image/png');
	await window.colorResetProgress('first-image');
	await window.colorResetProgress('decision-plate-complete');

	const decodedCadence = await decodePng(
		cadenceBytes,
		cadence.dimensions.width,
		cadence.dimensions.height,
		'CR4J composed cadence',
	);
	const scenes = decodedScenes.map((decoded, index) => {
		const placement = cadence.placements[index];
		const embedding = compareEmbeddedRegion(
			decodedCadence.rgba,
			cadence.dimensions.width,
			decoded.decoded.rgba,
			cadence.dimensions.panelWidth,
			cadence.dimensions.panelHeight,
			placement.x,
			placement.y,
		);
		requireCondition(embedding.exact, `CR4J ${decoded.scene.id} pixels changed in the cadence.`);
		return {
			sceneId: decoded.scene.id,
			label: decoded.scene.label,
			timeIso: decoded.scene.timeIso,
			solarElevationDegrees: decoded.scene.solarElevationDegrees,
			totalHorizontalIlluminance: decoded.scene.totalHorizontalIlluminance,
			row: placement.row,
			column: placement.column,
			placement: {x: placement.x, y: placement.y},
			source: decoded.input,
			embedding,
		};
	});
	cadence.canvas.remove();

	return {
		schemaId: 'algorithm32-color-reset-cr4j-slope-078-six-column-cadence-browser-result-v1',
		presentationOnly: true,
		appearanceAccepted: false,
		ownerAppearanceReviewRequired: true,
		physicalTransportReexecuted: false,
		colorResponseReexecuted: false,
		scientificClaimAdded: false,
		parent,
		layout: {
			width: cadence.dimensions.width,
			height: cadence.dimensions.height,
			panelWidth: cadence.dimensions.panelWidth,
			panelHeight: cadence.dimensions.panelHeight,
			columnCount: configuration.presentation.layout.columnCount,
			rowCount: configuration.presentation.layout.rowCount,
		},
		scenes,
		panelIdentities: scenes.map((scene) => ({
			artifactPath: configuration.outputs.cadence,
			sceneId: scene.sceneId,
			source: scene.source,
			row: scene.row,
			column: scene.column,
			placement: scene.placement,
			embedding: scene.embedding,
		})),
		imageDerivations: [
			{
				artifactPath: configuration.outputs.cadence,
				operation: 'Decode twelve authenticated CR4I slope-078 PNGs and copy their RGBA pixels 1:1 into the declared 6-column by 2-row presentation grid.',
				parents: scenes.map((scene) => scene.source),
				parameters: {
					imageSmoothingEnabled: false,
					panelWidth: cadence.dimensions.panelWidth,
					panelHeight: cadence.dimensions.panelHeight,
					columnCount: configuration.presentation.layout.columnCount,
					rowCount: configuration.presentation.layout.rowCount,
				},
			},
		],
		uploadedImages: [
			{
				artifactPath: upload.artifactPath,
				width: cadence.dimensions.width,
				height: cadence.dimensions.height,
				byteLength: upload.byteLength,
				sha256: upload.sha256,
				contentType: upload.contentType,
			},
		],
		outputIdentity: upload,
		imageUploadOrder: [upload.artifactPath],
		allDeclaredImagesUploaded: true,
		renderComplete: true,
		integrityGateEvaluated: false,
	};
}
