function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function dataUrlBytes(dataUrl) {
	const marker = ';base64,';
	const markerIndex = dataUrl.indexOf(marker);
	requireCondition(markerIndex >= 0, 'CR4E PNG data URL is not base64 encoded.');
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
		requireCondition(context, `CR4E could not decode ${label}.`);
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
	requireCondition(response.ok, `CR4E artifact upload failed for ${artifactPath}: HTTP ${response.status}.`);
	return {
		artifactPath,
		byteLength: bytes.byteLength,
		sha256: await sha256Hex(bytes),
		contentType,
	};
}

function verifyManifest(parentId, declaration, manifest, manifestEvidence, selectedArtifacts) {
	requireCondition(
		manifest.runId === declaration.runId &&
			manifest.conclusion === declaration.conclusion &&
			manifest.artifactSetSha256 === declaration.artifactSetSha256,
		`CR4E ${parentId} terminal manifest identity changed.`,
	);
	requireCondition(Array.isArray(manifest.artifacts), `CR4E ${parentId} manifest artifacts are missing.`);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	for (const selected of selectedArtifacts) {
		const recorded = byPath.get(selected.path);
		requireCondition(recorded !== undefined, `CR4E ${parentId} manifest omits ${selected.path}.`);
		requireCondition(
			recorded.byteLength === selected.byteLength && recorded.sha256 === selected.sha256,
			`CR4E ${parentId} manifest identity changed for ${selected.path}.`,
		);
	}
	return {
		namespace: declaration.namespace,
		runId: declaration.runId,
		conclusion: declaration.conclusion,
		artifactSetSha256: declaration.artifactSetSha256,
		manifest: manifestEvidence,
		selectedArtifactCount: selectedArtifacts.length,
		verified: true,
	};
}

function parentPrefix(parentId) {
	if (parentId === 'brightLowSun') return '/bright/';
	if (parentId === 'twilightSequence') return '/twilight/';
	throw new Error(`CR4E unknown parent id: ${parentId}.`);
}

function selectedArtifactsForParent(configuration, parentId) {
	return configuration.scenes
		.filter((scene) => scene.parentId === parentId)
		.flatMap((scene) => [scene.newColor, scene.bruneton]);
}

function calculateLayout(configuration) {
	const panelWidth = configuration.viewport.widthPixels;
	const panelHeight = configuration.viewport.heightPixels;
	const layout = configuration.presentation.layout;
	const width =
		layout.outerPaddingPixels * 2 + panelWidth * 2 + layout.columnGapPixels;
	const height =
		layout.outerPaddingPixels * 2 +
		layout.titleHeightPixels +
		layout.columnHeaderHeightPixels +
		configuration.scenes.length * (layout.sceneLabelHeightPixels + panelHeight) +
		(configuration.scenes.length - 1) * layout.rowGapPixels;
	requireCondition(
		width === layout.expectedWidthPixels && height === layout.expectedHeightPixels,
		'CR4E declared stack dimensions disagree with the layout equation.',
	);
	return {width, height, panelWidth, panelHeight};
}

function drawStack(configuration, decodedScenes) {
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
	requireCondition(context, 'CR4E stack requires a 2D canvas context.');
	context.imageSmoothingEnabled = false;
	context.fillStyle = layout.backgroundCss;
	context.fillRect(0, 0, canvas.width, canvas.height);

	const leftX = layout.outerPaddingPixels;
	const rightX = leftX + dimensions.panelWidth + layout.columnGapPixels;
	const titleTop = layout.outerPaddingPixels;
	context.textAlign = 'left';
	context.textBaseline = 'middle';
	context.fillStyle = layout.headingCss;
	context.font = '600 24px sans-serif';
	context.fillText(configuration.presentation.title, leftX, titleTop + 20);
	context.fillStyle = layout.secondaryCss;
	context.font = '14px sans-serif';
	context.fillText(configuration.presentation.subtitle, leftX, titleTop + 47);

	const headerTop = titleTop + layout.titleHeightPixels;
	context.fillStyle = layout.headingCss;
	context.font = '600 18px sans-serif';
	context.textAlign = 'center';
	context.fillText(
		configuration.presentation.columns[0].label,
		leftX + dimensions.panelWidth / 2,
		headerTop + layout.columnHeaderHeightPixels / 2,
	);
	context.fillText(
		configuration.presentation.columns[1].label,
		rightX + dimensions.panelWidth / 2,
		headerTop + layout.columnHeaderHeightPixels / 2,
	);

	const placements = [];
	let rowTop = headerTop + layout.columnHeaderHeightPixels;
	for (let index = 0; index < decodedScenes.length; index += 1) {
		const decoded = decodedScenes[index];
		const scene = decoded.scene;
		context.textAlign = 'left';
		context.fillStyle = layout.headingCss;
		context.font = '600 16px sans-serif';
		context.fillText(
			`${index + 1}. ${scene.label}`,
			leftX,
			rowTop + layout.sceneLabelHeightPixels / 2,
		);
		context.textAlign = 'right';
		context.fillStyle = layout.secondaryCss;
		context.font = '13px monospace';
		context.fillText(
			scene.timeIso,
			dimensions.width - layout.outerPaddingPixels,
			rowTop + layout.sceneLabelHeightPixels / 2,
		);

		const panelY = rowTop + layout.sceneLabelHeightPixels;
		context.strokeStyle = layout.borderCss;
		context.lineWidth = 1;
		context.strokeRect(leftX - 1, panelY - 1, dimensions.panelWidth + 2, dimensions.panelHeight + 2);
		context.strokeRect(rightX - 1, panelY - 1, dimensions.panelWidth + 2, dimensions.panelHeight + 2);
		context.putImageData(
			new ImageData(decoded.newColor.decoded.rgba, dimensions.panelWidth, dimensions.panelHeight),
			leftX,
			panelY,
		);
		context.putImageData(
			new ImageData(decoded.bruneton.decoded.rgba, dimensions.panelWidth, dimensions.panelHeight),
			rightX,
			panelY,
		);
		placements.push({
			sceneId: scene.id,
			newColor: {columnId: 'new-color', side: 'left', x: leftX, y: panelY},
			bruneton: {columnId: 'bruneton', side: 'right', x: rightX, y: panelY},
		});
		rowTop = panelY + dimensions.panelHeight + layout.rowGapPixels;
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

/** Compose the accepted six-scene owner-review stack and upload it before reporting integrity. */
export async function runCr4eSixSceneNewColorBrunetonStackBrowser() {
	const configurationResponse = await fetch('/browser/configuration.json');
	requireCondition(configurationResponse.ok, 'CR4E browser configuration fetch failed.');
	const configuration = await configurationResponse.json();
	await window.colorResetProgress('render-started');

	const parentEntries = await Promise.all(
		Object.entries(configuration.parents).map(async ([parentId, declaration]) => {
			const prefix = parentPrefix(parentId);
			const manifestInput = await fetchVerifiedBytes(
				prefix,
				declaration.manifest,
				`CR4E ${parentId} manifest`,
			);
			const manifest = parseVerifiedJson(manifestInput, `CR4E ${parentId} manifest`);
			return [
				parentId,
				verifyManifest(
					parentId,
					declaration,
					manifest,
					manifestInput.evidence,
					selectedArtifactsForParent(configuration, parentId),
				),
			];
		}),
	);
	const parents = Object.fromEntries(parentEntries);

	const decodedScenes = await Promise.all(
		configuration.scenes.map(async (scene) => {
			const prefix = parentPrefix(scene.parentId);
			const [newColorInput, brunetonInput] = await Promise.all([
				fetchVerifiedBytes(prefix, scene.newColor, `CR4E ${scene.id} new color`),
				fetchVerifiedBytes(prefix, scene.bruneton, `CR4E ${scene.id} Bruneton`),
			]);
			const [newColorDecoded, brunetonDecoded] = await Promise.all([
				decodePng(
					newColorInput.bytes,
					configuration.viewport.widthPixels,
					configuration.viewport.heightPixels,
					`CR4E ${scene.id} new color`,
				),
				decodePng(
					brunetonInput.bytes,
					configuration.viewport.widthPixels,
					configuration.viewport.heightPixels,
					`CR4E ${scene.id} Bruneton`,
				),
			]);
			return {
				scene,
				newColor: {input: newColorInput.evidence, decoded: newColorDecoded},
				bruneton: {input: brunetonInput.evidence, decoded: brunetonDecoded},
			};
		}),
	);

	const stack = drawStack(configuration, decodedScenes);
	const stackBytes = dataUrlBytes(stack.canvas.toDataURL('image/png'));
	const upload = await uploadBytes(configuration.outputs.stack, stackBytes, 'image/png');
	await window.colorResetProgress('first-image');
	await window.colorResetProgress('decision-plate-complete');

	const decodedStack = await decodePng(
		stackBytes,
		stack.dimensions.width,
		stack.dimensions.height,
		'CR4E composed stack',
	);
	const scenes = decodedScenes.map((decoded, index) => {
		const placement = stack.placements[index];
		const newColorEmbedding = compareEmbeddedRegion(
			decodedStack.rgba,
			stack.dimensions.width,
			decoded.newColor.decoded.rgba,
			stack.dimensions.panelWidth,
			stack.dimensions.panelHeight,
			placement.newColor.x,
			placement.newColor.y,
		);
		const brunetonEmbedding = compareEmbeddedRegion(
			decodedStack.rgba,
			stack.dimensions.width,
			decoded.bruneton.decoded.rgba,
			stack.dimensions.panelWidth,
			stack.dimensions.panelHeight,
			placement.bruneton.x,
			placement.bruneton.y,
		);
		requireCondition(
			newColorEmbedding.exact && brunetonEmbedding.exact,
			`CR4E ${decoded.scene.id} source pixels changed in the composed stack.`,
		);
		return {
			sceneId: decoded.scene.id,
			label: decoded.scene.label,
			timeIso: decoded.scene.timeIso,
			parentId: decoded.scene.parentId,
			newColor: {
				columnId: placement.newColor.columnId,
				side: placement.newColor.side,
				placement: {x: placement.newColor.x, y: placement.newColor.y},
				source: decoded.newColor.input,
				embedding: newColorEmbedding,
			},
			bruneton: {
				columnId: placement.bruneton.columnId,
				side: placement.bruneton.side,
				placement: {x: placement.bruneton.x, y: placement.bruneton.y},
				source: decoded.bruneton.input,
				embedding: brunetonEmbedding,
			},
		};
	});
	stack.canvas.remove();
	await window.colorResetProgress('render-complete');

	const panelIdentities = scenes.flatMap((scene) => [
		{
			artifactPath: configuration.outputs.stack,
			sceneId: scene.sceneId,
			columnId: scene.newColor.columnId,
			side: scene.newColor.side,
			placement: scene.newColor.placement,
			sourceParentId: scene.parentId,
			source: scene.newColor.source,
		},
		{
			artifactPath: configuration.outputs.stack,
			sceneId: scene.sceneId,
			columnId: scene.bruneton.columnId,
			side: scene.bruneton.side,
			placement: scene.bruneton.placement,
			sourceParentId: scene.parentId,
			source: scene.bruneton.source,
		},
	]);
	const imageDerivations = [
		{
			artifactPath: configuration.outputs.stack,
			operation:
				'Losslessly decode twelve authenticated parent PNGs, place their RGBA pixels without scaling in six chronological rows, add labels outside panel bounds, and encode one derived PNG.',
			inputs: panelIdentities.map((panel) => ({
				parentId: panel.sourceParentId,
				path: panel.source.path,
				byteLength: panel.source.byteLength,
				sha256: panel.source.sha256,
			})),
			parameters: {
				viewport: configuration.viewport,
				presentation: configuration.presentation,
			},
			result: upload,
		},
	];

	return {
		schemaId: 'algorithm32-color-reset-cr4e-six-scene-new-color-bruneton-stack-browser-result-v1',
		software: {
			browserUserAgent: navigator.userAgent,
			compositor: 'Canvas2D putImageData plus PNG encode/decode verification',
		},
		presentationOnly: true,
		appearanceAccepted: false,
		ownerAppearanceReviewRequired: true,
		physicalTransportReexecuted: false,
		colorResponseReexecuted: false,
		renderComplete: true,
		integrityGateEvaluated: false,
		allDeclaredImagesUploaded: true,
		parents,
		layout: {
			width: stack.dimensions.width,
			height: stack.dimensions.height,
			panelWidth: stack.dimensions.panelWidth,
			panelHeight: stack.dimensions.panelHeight,
			columns: configuration.presentation.columns,
			sceneOrder: configuration.scenes.map(({id}) => id),
		},
		scenes,
		panelIdentities,
		imageDerivations,
		uploadedImages: [
			{
				artifactPath: configuration.outputs.stack,
				width: stack.dimensions.width,
				height: stack.dimensions.height,
				contentType: 'image/png',
			},
		],
		imageUploadOrder: [configuration.outputs.stack],
		outputIdentity: upload,
	};
}
