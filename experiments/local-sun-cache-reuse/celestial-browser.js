import * as THREE from 'three';
import {createOwners} from './rotation-model.js';
import {partitionedShellIncoming} from './shell-angular.js';
import {prepareShellMiePhase} from './shell-phase.js';
import {prepareShellApplicationFrame} from './shell-client.js';
import {ShellFramePublication} from './shell-frame-publication.js';
import {shellResourceBounds} from './shell-resource-bounds.js';
import {loadBrightest2000StellarCatalogPackage} from '../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {StellarPointSetSource} from '../../src/algorithm32/implementation/star-field/StellarPointSetSource.js';
import {flatStarDirection} from './flat-star-geometry.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {
	proveCelestialTransport,
	proveFlatStars,
	proveCelestialLifecycle,
	proveCelestialSceneOcclusion,
	stellarOccupancyImage,
} from './celestial-proof.js';
import {Output, Mp4OutputFormat, BufferTarget, CanvasSource} from 'mediabunny';
import {loadHumanVisionFilterPackage} from '../../src/flat32/HumanVisionFilterPackageLoader.js';
import {createCelestialHumanVision, proveCelestialHumanVision} from './celestial-human-vision.js';

const bridge = /** @type {LocalSunCelestialBridge} */ (/** @type {unknown} */ (globalThis));

/** Retain identities and lifecycle counts without serializing GPU texture contents.
 * @param {unknown} value - Renderer diagnostic facts.
 * @returns {unknown} - Compact detached JSON-compatible facts.
 */
function compact(value) {
	if (value instanceof THREE.Texture) return {name: value.name, format: value.format, type: value.type};
	if (Array.isArray(value)) return value.map(compact);
	if (value && typeof value === 'object')
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, compact(v)]));
	return value;
}

/** Encode only a two-second camera-motion integration preview, never the P6 orbit.
 * @param {LocalSunShellPublishedFrame} frame - Unchanged far-Sun atmospheric state.
 * @param {HTMLCanvasElement} canvas - Actual combined output.
 * @returns {Promise<readonly number[]>} - Sampled camera yaw angles.
 */
async function preview(frame, canvas) {
	if (!frame.celestial) throw new Error('Missing preview owner.');
	const camera = frame.celestial.camera,
		start = camera.quaternion.clone(),
		target = new BufferTarget(),
		output = new Output({format: new Mp4OutputFormat(), target}),
		video = new CanvasSource(canvas, {codec: 'avc', bitrate: 2000000});
	output.addVideoTrack(video, {frameRate: 12});
	await output.start();
	const yaw = [];
	try {
		for (let slot = 0; slot < 24; slot++) {
			const angle = (slot / 23 - 0.5) * 0.035;
			camera.quaternion
				.copy(start)
				.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle));
			camera.updateMatrixWorld();
			frame.celestial.render();
			await video.add(slot / 12, 1 / 12);
			yaw.push(angle);
		}
		await output.finalize();
	} catch (error) {
		await output.cancel();
		throw error;
	} finally {
		camera.quaternion.copy(start);
		camera.updateMatrixWorld();
	}
	if (!target.buffer) throw new Error('Missing preview bytes.');
	let binary = '';
	for (const byte of new Uint8Array(target.buffer)) binary += String.fromCharCode(byte);
	await bridge.localSunCelestialArtifact('preview.mp4', JSON.stringify({base64: btoa(binary)}));
	return yaw;
}

/** Capture bounded physical Sun-disc and stellar integration with one shared atmospheric field.
 * @param {LocalSunCelestialRecipe} input - Host-authenticated immutable controls.
 * @returns {Promise<string>} - Compact diagnostic result; no full film.
 */
async function run(input) {
	const start = performance.now(),
		canvas = document.createElement('canvas');
	document.body.append(canvas);
	const gl = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
	if (!gl?.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 required.');
	const renderer = new THREE.WebGLRenderer({canvas, context: gl});
	if (input.viewportSize.units !== 'pixels' || !Number.isSafeInteger(input.viewportSize.width) || !Number.isSafeInteger(input.viewportSize.height) || input.viewportSize.width < 1 || input.viewportSize.height < 1)
		throw new Error('Positive integer capture viewport required.');
	renderer.setSize(input.viewportSize.width, input.viewportSize.height, false);
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	if (input.shellScene) {
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}
	renderer.debug.onShaderError = (context, program, vertex, fragment) => {
		throw new Error(
			'Celestial shader compilation failed: ' +
				context.getProgramInfoLog(program) +
				'; vertex: ' +
				context.getShaderInfoLog(vertex) +
				'; fragment: ' +
				context.getShaderInfoLog(fragment),
		);
	};
	const publisher = new ShellFramePublication(1200000000),
		incoming = partitionedShellIncoming(48, 0.5);
	const stars =
		input.stage === 'combined'
			? new StellarPointSetSource({
					catalogDefinition: await loadBrightest2000StellarCatalogPackage('/catalog/manifest.json'),
				})
			: null;
	const first = input.states.find((s) => s.id === 'flat-0');
	const humanVisionPackage = input.humanVision ? await loadHumanVisionFilterPackage('/human-vision/manifest.json') : null;
	const presentationFilterRegistry = humanVisionPackage ? createCelestialHumanVision(humanVisionPackage.scotopicLuminanceWeights) : null;
	if (!first) throw new Error('Missing Flat0 control.');
	const starPolicy = {
		epochMilliseconds: 0,
		periodMilliseconds: 86164090.5,
		projectionRadiusMeters: first.geometry.projectionRadius.value,
		domeHeightMeters: Math.PI * first.geometry.projectionRadius.value,
	};
	/** @type {LocalSunRotationRecipe} */ const base = {
		state: first,
		diagnostic: false,
		angles: [0],
		motion: false,
		shellLayout: input.layout,
		shellRuntime: true,
		shellIncoming: incoming,
		currentApplication: true,
		horizontalFieldOfViewDegrees: input.horizontalFieldOfViewDegrees,
		shellScene: input.shellScene,
		shellImplementationIdentity: input.implementationIdentity,
		celestial: {sunFacing: true, ...(stars ? {stars, starPolicy} : {}), ...(presentationFilterRegistry ? {presentationFilterRegistry} : {})},
	};
	const preliminary = createOwners(base, 0),
		rows = [],
		retired = [];
	let previewResult = null;
	let lifecycle = null;
	let sceneOcclusion = false;
	let cancellationVerified = false;
	let firstCache = null;
	let phases;
	try {
		console.log('P5-Celestial invariant phase preparation');
		phases = await prepareShellMiePhase(preliminary.domains, '/phase-worker.js');
	} finally {
		preliminary.facade.dispose();
	}
	const bounds = shellResourceBounds(base, phases, input.viewportSize),
		cacheIdentity = CanonicalValueHash.sha256Value({
			layout: input.layout,
			spectrum: first.source.sourceIrradiance.contentHash,
			height: input.layout.height,
			execution: first.execution,
			phase: phases.contentHash,
			incoming: incoming.id,
			implementation: input.implementationIdentity,
		});
	try {
		for (const id of ['flat-0', 'flat-90', 'flat-180']) {
			const state = input.states.find((s) => s.id === id);
			if (!state) throw new Error('Missing control ' + id);
			console.log('P5-Celestial prepare ' + id);
			const recipe = {...base, state},
				identity = {identity: 'celestial:' + id, cacheIdentity};
			const frame = await publisher.request({
				...identity,
				...bounds,
				prepare: (context) => prepareShellApplicationFrame(recipe, 0, renderer, phases, context, identity),
			});
			if (!frame.celestial) throw new Error('Missing celestial frame owner.');
			frame.celestial.render();
			const passDiagnostic = /** @type {LocalSunCelestialRenderDiagnostic} */ (
				/** @type {import('../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js').ShaderRuntimePass} */ (
					frame.viewPass
				).getDiagnostics()
			);
			if (passDiagnostic.renderErrorCount)
				throw new Error('Runtime draw failed: ' + passDiagnostic.lastRenderError);
			const pixels = new Uint8Array(input.viewportSize.width * input.viewportSize.height * 4);
			gl.readPixels(0, 0, input.viewportSize.width, input.viewportSize.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			let litPixels = 0;
			for (let p = 0; p < pixels.length; p += 4) if (pixels[p] || pixels[p + 1] || pixels[p + 2]) litPixels++;
			if (litPixels === 0) throw new Error('Celestial delivery is entirely black.');
			const transport = await proveCelestialTransport(frame, renderer);
			if (id === 'flat-0') sceneOcclusion = await proveCelestialSceneOcclusion(frame, renderer);
			const starProof = stars ? await proveFlatStars(frame, renderer, stars, starPolicy) : null;
			const presentationProof = presentationFilterRegistry && starProof ? await proveCelestialHumanVision(frame, renderer, presentationFilterRegistry, starProof) : null;
			frame.celestial.render();
			const diagnostics = compact(frame.celestial.diagnostics());
			await bridge.localSunCelestialArtifact(
				id + '-' + input.stage + '.png',
				JSON.stringify({dataUrl: canvas.toDataURL('image/png')}),
			);
			const distance = Math.hypot(
				...state.geometry.sourcePosition.coordinates.map(
					(v, i) => v - state.geometry.observerPosition.coordinates[i],
				),
			);
			if (!firstCache) firstCache = frame.cache;
			else if (frame.cache !== firstCache)
				throw new Error('Horizontal celestial placement rebuilt the atmospheric cache.');
			/** @type {LocalSunCelestialCameraFieldOfView} */
			const cameraFieldOfView = {
				verticalDegrees: frame.celestial.camera.fov,
				horizontalDegrees: 2 * Math.atan(Math.tan(frame.celestial.camera.fov * Math.PI / 360) * frame.celestial.camera.aspect) * 180 / Math.PI,
				aspect: frame.celestial.camera.aspect,
			};
			rows.push({
				id,
				cameraFieldOfView,
				observation: state.observation,
				sourcePosition: state.geometry.sourcePosition,
				observer: state.geometry.observerPosition,
				sunAngularDiameterRadians: 2 * Math.asin(state.source.radius.value / distance),
				cacheReused: rows.length > 0 && frame.cache === firstCache,
				litPixels,
				transport,
				starProof,
				presentationProof,
				...(input.shellScene ? {scene: frame.scene?.describe(), receiver: compact(frame.receiver)} : {}),
				stages: frame.stageMilliseconds,
				diagnostics,
			});
			retired.push(frame.celestial.generation);
			if (stars) {
				const sample = flatStarDirection(
					stars.celestialSourceDefinition.members[0].direction,
					state.observation,
					starPolicy,
					state.geometry.observerPosition.coordinates,
				);
				console.log('P5-Celestial star direction ' + JSON.stringify(sample));
				if (id === 'flat-180') {
					await bridge.localSunCelestialArtifact(
						id + '-star-index.png',
						JSON.stringify({dataUrl: stellarOccupancyImage(frame, renderer)}),
					);
					const material = /** @type {THREE.RawShaderMaterial} */ (
							/** @type {import('../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js').ShaderRuntimePass} */ (
								frame.viewPass
							).material
						),
						original = material.fragmentShader;
					try {
						material.fragmentShader = original
							.replace('float sunCoverage = sampleSunCoverageTile(state);', 'float sunCoverage = 0.0;')
							.replace(
								'composeSpectralRadiance(state.pathRadiance, celestialRadiance)',
								'composeSpectralRadiance(zeroSpectral(), celestialRadiance)',
							);
						material.needsUpdate = true;
						frame.celestial.render();
						await bridge.localSunCelestialArtifact(
							id + '-stars.png',
							JSON.stringify({dataUrl: canvas.toDataURL('image/png')}),
						);
					} finally {
						material.fragmentShader = original;
						material.needsUpdate = true;
					}
					const yaw = await preview(frame, canvas);
					previewResult = {
						frames: yaw.length,
						frameRate: 12,
						yawRadians: yaw,
						scope: 'two-second camera pan, fixed physical state and atmospheric cache',
					};
					lifecycle = compact(proveCelestialLifecycle(frame, renderer));
					console.log('P5-Celestial complete-frame cancellation proof');
					const cancelled = new AbortController(),
						cancelIdentity = {identity: 'celestial:cancel-proof', cacheIdentity};
					try {
						await publisher.request({
							...cancelIdentity,
							...bounds,
							signal: cancelled.signal,
							prepare: async (context) => {
								const prepared = await prepareShellApplicationFrame(
									recipe,
									0,
									renderer,
									phases,
									context,
									cancelIdentity,
								);
								if (!prepared.celestial) throw new Error('Missing cancelled celestial owner.');
								retired.push(prepared.celestial.generation);
								cancelled.abort(
									new DOMException(
										'Selected cancellation after complete staging, before publication.',
										'AbortError',
									),
								);
								return prepared;
							},
						});
						throw new Error('Cancelled complete frame was published.');
					} catch (error) {
						if (!(error instanceof DOMException) || error.name !== 'AbortError') throw error;
					}
					if (publisher.active !== frame || publisher.resources.size !== 1)
						throw new Error('Cancelled staging disturbed the old frame/cache.');
					cancellationVerified = true;
				}
			}
		}
		const cacheCount = publisher.resources.size,
			peakAdmittedBytes = publisher.peakAdmittedBytes;
		publisher.dispose();
		await publisher.tail;
		for (const g of retired) {
			const sun =
					/** @type {import('../../src/algorithm32/rendering-runtime/three/SunDiskTileGenerationPass.js').SunDiskTileGenerationPass} */ (
						g._sun
					).getDiagnostics(),
				stellar =
					/** @type {import('../../src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js').StellarScreenPaletteGenerationPass|null} */ (
						g._stellar
					)?.getDiagnostics();
			if (
				sun.status !== 'disposed' ||
				sun.createdTargetCount !== sun.disposedTargetCount ||
				(stellar &&
					(stellar.status !== 'disposed' || stellar.createdTargetCount !== stellar.disposedTargetCount))
			)
				throw new Error('Celestial resource cleanup incomplete.');
		}
		const cleanup = retired.map((g) => compact(g.getDiagnostics()));
		return JSON.stringify({
			schema: 'local-sun-p5-celestial-delivery-v2',
			stage: input.stage,
			viewportSize: input.viewportSize,
			starPolicy: stars ? starPolicy : null,
			humanVisionPackageIdentity: humanVisionPackage?.identity ?? null,
			rows,
			preview: previewResult,
			lifecycle,
			sceneOcclusion,
			cancellationVerified,
			cacheCount,
			peakAdmittedBytes,
			cleanup,
			elapsedMilliseconds: performance.now() - start,
			glError: gl.getError(),
			completion: 'focused-geometry-transmission-palette-images-preview',
		});
	} finally {
		publisher.dispose();
		await publisher.tail;
		renderer.dispose();
		renderer.forceContextLoss();
		if (publisher.cleanupErrors.length)
			throw new Error('Celestial cleanup failed: ' + publisher.cleanupErrors.join('; '));
	}
}
bridge.localSunCelestial = run;
