import * as THREE from 'three';
import * as mediabunny from 'mediabunny';
import {BoundedChunkSink, DeterministicCanvasRecorder, MediabunnyCanvasOutput, WebCodecsEncoderSelector} from '../../scripts/animation-evidence/index.js';
import {TheHoursLightingSamples} from '../../scripts/flat32/the-hours/TheHoursLightingSamples.js';
import {LocalLightLevelCalculator} from '../../src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js';
import {loadBrightest2000StellarCatalogPackage} from '../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from '../../src/flat32/HumanVisionFilterPackageLoader.js';
import {StellarPointSetSource} from '../../src/algorithm32/implementation/star-field/StellarPointSetSource.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {ShaderRuntimePass} from '../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js';
import {createCelestialHumanVision} from './celestial-human-vision.js';
import {createOwners, unit} from './rotation-model.js';
import {resolveShellState} from './resolve-shell-state.js';
import {partitionedShellIncoming} from './shell-angular.js';
import {prepareShellMiePhase} from './shell-phase.js';
import {prepareShellApplicationFrame} from './shell-client.js';
import {ShellFramePublication} from './shell-frame-publication.js';
import {shellResourceBounds} from './shell-resource-bounds.js';
import {readCelestialShader} from './celestial-proof.js';
import {LocalSunFilmScene} from './film-scene.js';
import {sampleFilmClock, sampleFilmCamera} from './film-director.js';

const bridge = /** @type {LocalSunFilmBridge} */ (/** @type {unknown} */ (globalThis));

/** Encode one already bounded byte batch without argument-spread overflow.
 * @param {Uint8Array} bytes - At most the admitted chunk size.
 * @returns {string} - Base64 wire payload.
 */
function encodeBytes(bytes) {
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	return btoa(binary);
}

/** Resolve astronomical placement at one score time; synthetic rotation is never used.
 * @param {LocalSunFilmRecipe} input - Frozen host controls.
 * @param {number} seconds - Authored score position.
 * @returns {LocalSunFrozenPlacement} - Exact production physical state.
 */
function stateAt(input, seconds) {
	const clock = sampleFilmClock(seconds);
	return resolveShellState({...input.startObservation, instant: new Date(Date.parse(input.startObservation.instant) + clock.sourceProgress * 86400000).toISOString()});
}

/** Read the bound scalar/vector projection after its generation pass publishes.
 * @param {LocalSunShellPublishedFrame} frame - Complete current frame.
 * @returns {THREE.RawShaderMaterial} - Borrowed actual consumer material.
 */
function materialFor(frame) {
	if (!(frame.viewPass instanceof ShaderRuntimePass)) throw new Error('Film requires the selected shader runtime pass.');
	const material = frame.viewPass.material;
	if (!(material instanceof THREE.RawShaderMaterial)) throw new Error('Film requires the prepared raw celestial material.');
	return material;
}

/** Probe the actual coverage consumer and scene mask in a small final-raster patch.
 * @param {LocalSunShellPublishedFrame} frame - Complete rendered film state.
 * @param {THREE.WebGLRenderer} renderer - Borrowed live renderer.
 * @returns {Promise<LocalSunFilmDiscProof>} - Pixel coverage/occlusion and transmission evidence.
 */
async function proveDisc(frame, renderer) {
	const material = materialFor(frame), center = material.uniforms.uSunScreenCenterPixels.value;
	const c = Array.isArray(center) ? center : [center.x, center.y];
	const radius = Number(material.uniforms.uSunRadiusPixels.value), side = 2 * Math.ceil(radius + 3);
	const origin = [Math.floor(c[0] - side / 2), Math.floor(c[1] - side / 2)];
	const prefix = material.fragmentShader.slice(0, material.fragmentShader.lastIndexOf('void main()'));
	const values = await readCelestialShader(renderer, `${prefix}void main(){
 vec2 pixel=vec2(${origin[0]}.0,${origin[1]}.0)+gl_FragCoord.xy;
 ShaderState state=createInitialShaderState(pixel/uViewportSizePixels);
 float coverage=sampleSunCoverageTile(state);
 state.ray=reconstructViewRay(state.textureCoordinates);
 state.bounds=resolveAtmospherePath(state.ray,0.0,false);evaluatePathRadiance(state);
 outColor=vec4(coverage,state.sceneHitMask,state.transmittance.channels[7],1.0);}`, material.uniforms, side, side);
	let covered = 0, area = 0, occluded = 0, maximum = 0;
	let minX = side, maxX = -1, minY = side, maxY = -1;
	for (let pixel = 0; pixel < side * side; pixel++) {
		const coverage = values[pixel * 4];
		if (coverage < -1e-6 || coverage > 1 + 1e-6) throw new Error('Film Sun coverage is outside [0,1].');
		area += coverage; maximum = Math.max(maximum, coverage);
		if (coverage > 0.01) {
			covered++; occluded += values[pixel * 4 + 1] > 0.5 ? 1 : 0;
			minX = Math.min(minX, pixel % side); maxX = Math.max(maxX, pixel % side);
			minY = Math.min(minY, Math.floor(pixel / side)); maxY = Math.max(maxY, Math.floor(pixel / side));
		}
	}
	// At a pixel-grid corner a subpixel circle splits its area into four equal
	// quadrants. A fixed half-pixel coverage requirement therefore rejects valid
	// reduced-raster bookends. Retain the half-pixel gate for resolved discs and
	// allow five percent below the quarter-area bound for the 16x filtered tile.
	const minimumCoverage = Math.min(0.5, 0.95 * Math.PI * radius * radius / 4);
	if (!covered || maximum < minimumCoverage || occluded) throw new Error('Film Sun support failed: ' + JSON.stringify({radius, maximum, minimum: minimumCoverage, covered, occluded}));
	return {radiusPixels: radius, centerPixels: c, coveredPixels: covered, areaPixels: area, diameterFromAreaPixels: 2 * Math.sqrt(area / Math.PI), occupiedWidthPixels: maxX - minX + 1, occupiedHeightPixels: maxY - minY + 1, occludedPixels: occluded, maximumCoverage: maximum};
}

/** Validate the exact bounded recording contract before allocating rendering resources.
 * @param {LocalSunFilmRecipe} input - Host recipe.
 * @returns {void} - Throws for incomplete or incompatible controls.
 */
function validateRecipe(input) {
	if (!['stills', 'motion', 'preview', 'final'].includes(input.stage) || input.durationSeconds !== 90 || !Number.isFinite(Date.parse(input.startObservation.instant))) throw new Error('Invalid film stage, duration or start instant.');
	if (input.viewportSize.units !== 'pixels' || !Number.isSafeInteger(input.viewportSize.width) || !Number.isSafeInteger(input.viewportSize.height) || input.viewportSize.width < 1 || input.viewportSize.height < 1 || input.viewportSize.width > 1920 || input.viewportSize.height > 1080 || input.viewportSize.width * 9 !== input.viewportSize.height * 16) throw new Error('Film raster must be bounded 16:9.');
	if (!Number.isSafeInteger(input.framesPerSecond) || input.framesPerSecond < 1 || input.framesPerSecond > 30 || !Number.isSafeInteger(input.segmentDurationSeconds * input.framesPerSecond) || input.segmentDurationSeconds <= 0 || input.segmentStartSeconds < 0 || input.segmentStartSeconds + input.segmentDurationSeconds > 90) throw new Error('Invalid film segment cadence.');
	if (!Number.isSafeInteger(input.bitrate) || input.bitrate < 100000 || input.bitrate > 40000000 || !Number.isSafeInteger(input.seed) || !input.implementationIdentity || !input.base.shellLayout) throw new Error('Incomplete film construction controls.');
	if (input.stage === 'final' && (input.framesPerSecond !== 30 || input.segmentStartSeconds !== 0 || input.segmentDurationSeconds !== 90 || input.viewportSize.width !== 1920 || input.viewportSize.height !== 1080)) throw new Error('Final film must preserve the frozen native recipe.');
}

/** Render exact astronomical states through one persistent scene and streamed recorder.
 * @param {LocalSunFilmRecipe} input - Complete host-authenticated film recipe.
 * @returns {Promise<string>} - Compact execution receipt; media and traces use bounded host bridges.
 */
async function run(input) {
	validateRecipe(input);
	const started = performance.now(), canvas = document.createElement('canvas');
	document.body.append(canvas);
	const gl = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
	if (!gl?.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 is required for film capture.');
	const renderer = new THREE.WebGLRenderer({canvas, context: gl});
	renderer.setSize(input.viewportSize.width, input.viewportSize.height, false);
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.debug.onShaderError = (context, program, vertex, fragment) => {throw new Error('Film shader failure: ' + context.getProgramInfoLog(program) + context.getShaderInfoLog(vertex) + context.getShaderInfoLog(fragment));};
	const publisher = new ShellFramePublication(1600000000), samples = new TheHoursLightingSamples();
	/** @type {LocalSunFilmScene|null} */ let scene = null;
	/** @type {LocalSunShellFrameLease|null} */ let recordingLease = null;
	/** @type {LocalSunFilmTraceRow[]} */ const rows = [];
	/** @type {LocalSunFilmMilestone[]} */ const milestones = [];
	/** @type {GpuScatteringCache|null} */ let firstCache = null;
	let recording = null, encoderSelection = null, sinkDiagnostics = null, preparedCount = 0;
	let resources = null, lightingIdentity = '', maximumGlError = 0;
	const retirement = {frames: 0, createdTargets: 0, disposedTargets: 0};
	/** Check retired generation resources without retaining frame or texture objects.
	 * @param {LocalSunCelestialGenerationOwner|undefined} generation - Just-retired coordinator.
	 * @returns {void} - Accumulated scalar cleanup counts; any leak rejects capture.
	 */
	function verifyRetired(generation) {
		if (!generation) return;
		const diagnostic = /** @type {LocalSunFilmGenerationRetirement} */ (generation.getDiagnostics());
		if (diagnostic.status !== 'disposed') throw new Error('Film celestial coordinator did not retire.');
		for (const child of [diagnostic.sun, diagnostic.stellar]) {
			if (!child) continue;
			if (child.status !== 'disposed' || !Number.isSafeInteger(child.createdTargetCount) || child.createdTargetCount !== child.disposedTargetCount || child.failedGenerationCount !== 0) throw new Error('Film celestial target cleanup or generation failed.');
			retirement.createdTargets += child.createdTargetCount; retirement.disposedTargets += child.disposedTargetCount;
		}
		retirement.frames++;
	}
	try {
		await bridge.localSunFilmProgress('prepare', 'Loading authenticated stellar and human-vision inputs.');
		const catalog = await loadBrightest2000StellarCatalogPackage('/catalog/manifest.json'), vision = await loadHumanVisionFilterPackage('/human-vision/manifest.json');
		const initial = stateAt(input, 0), incoming = partitionedShellIncoming(48, 0.5);
		const starPolicy = {epochMilliseconds: 0, periodMilliseconds: 86164090.5, projectionRadiusMeters: initial.geometry.projectionRadius.value, domeHeightMeters: Math.PI * initial.geometry.projectionRadius.value};
		/** @type {LocalSunRotationRecipe} */ const base = {...input.base, state: initial, diagnostic: false, angles: [0], motion: false, shellIncoming: incoming, shellRuntime: true, shellScene: true, currentApplication: true, shellImplementationIdentity: input.implementationIdentity,
			celestial: {sunFacing: false, stars: new StellarPointSetSource({catalogDefinition: catalog}), starPolicy, presentationFilterRegistry: createCelestialHumanVision(vision.scotopicLuminanceWeights)}};
		delete base.horizontalFieldOfViewDegrees;
		const skylineSamples = Array.from({length: 91}, (_, seconds) => {
			const state = stateAt(input, seconds), direction = unit(state.source.position.coordinates.map((value, axis) => value - state.geometry.observerPosition.coordinates[axis]));
			const pose = sampleFilmCamera(seconds, direction);
			return {azimuthDegrees: pose.sunAzimuthDegrees, elevationDegrees: pose.sunElevationDegrees};
		});
		scene = new LocalSunFilmScene({width: input.viewportSize.width, height: input.viewportSize.height, seed: input.seed, skylineSamples});
		const persistent = scene;
		const preliminary = createOwners(base, 0);
		let phases;
		try {await bridge.localSunFilmProgress('prepare', 'Preparing the invariant Mie phase matrix.'); phases = await prepareShellMiePhase(preliminary.domains, '/phase-worker.js');}
		finally {preliminary.facade.dispose();}
		const ordinaryBounds = shellResourceBounds(base, phases, input.viewportSize);
		const bounds = {...ordinaryBounds, otherPersistentBytes: ordinaryBounds.otherPersistentBytes + persistent.resourceBounds()};
		resources = {shell: ordinaryBounds, filmPersistentBytes: persistent.resourceBounds(), combined: bounds};
		const cacheIdentity = CanonicalValueHash.sha256Value({schema: 'local-sun-p6-cache-v1', layout: base.shellLayout, spectrum: initial.source.sourceIrradiance.contentHash, source: {...initial.source, position: null}, height: base.shellLayout.height, execution: initial.execution, phase: phases.contentHash, incoming: incoming.id, implementation: input.implementationIdentity, runtime: base.shellRuntime, mieAlbedo: base.shellMieAlbedo ?? null, candidate: base.candidate ?? null});

		/** Publish one complete exact physical frame, retaining the single canonical field.
		 * @param {number} seconds - Authored score time.
		 * @returns {Promise<LocalSunShellPublishedFrame>} - Current complete frame.
		 */
		async function prepare(seconds) {
			const state = stateAt(input, seconds), identity = {identity: `p6:${input.stage}:${preparedCount++}:${seconds}:${state.observation.instant}`, cacheIdentity};
			const previousGeneration = publisher.active?.celestial?.generation;
			const frame = await publisher.request({...identity, ...bounds, prepare: context => prepareShellApplicationFrame({...base, state}, 0, renderer, phases, context, identity, undefined, owners => persistent.borrow(owners))});
			verifyRetired(previousGeneration);
			if (!frame.celestial || !frame.borrowedScene) throw new Error('Film frame has no borrowed scene or celestial owner.');
			if (firstCache && frame.cache !== firstCache) throw new Error('Film trajectory replaced a compatible canonical cache.');
			firstCache ??= frame.cache;
			return frame;
		}

		await bridge.localSunFilmProgress('lighting', 'Measuring 91 exact one-second diffuse and adaptation endpoints.', 0, 91);
		for (let second = 0; second <= 90; second++) {
			const frame = await prepare(second); samples.add(second, frame.receiver);
			if (second % 5 === 0 || second === 90) await bridge.localSunFilmProgress('lighting', 'Measured exact receiver endpoint.', second + 1, 91);
		}
		lightingIdentity = CanonicalValueHash.sha256Value(samples.describe());
		await bridge.localSunFilmArtifact('lighting.json', JSON.stringify({schema: 'local-sun-p6-lighting-v1', identity: lightingIdentity, interpolationIdentity: 'TheHoursLightingSamples/DistantSunSolarInterpolation-monotone-cubic', endpoints: samples.describe(), directPolicy: 'exact current frame; excluded from interpolation'}));

		/** Draw one exact source/camera state, keeping the frame leased through encoding.
		 * @param {number} seconds - Authored score position.
		 * @param {number} slot - Contiguous media slot or sparse control index.
		 * @returns {Promise<void>} - Presented pixels and compact trace are complete.
		 */
		async function render(seconds, slot) {
			if (recordingLease) throw new Error('Previous film frame was not released after encoding.');
			const preparationStarted = performance.now(), frame = await prepare(seconds);
			recordingLease = publisher.acquireFrame();
			const environment = samples.sample(seconds), exact = frame.receiver;
			const receiver = new LocalLightLevelCalculator({lightSource: frame.owners.source}).combineReceiverLight({identity: CanonicalValueHash.sha256Value({schema: 'p6-exact-direct-cubic-environment-v1', exact: exact.identity, lightingIdentity, seconds, diffuse: environment.diffuseHorizontal.contentHash, adaptation: environment.stellarAdaptationLuminance}), directNormal: exact.directNormal, directHorizontal: exact.directHorizontal, ...environment});
			frame.celestial.handle.publishReceiverEnvironmentLight(receiver, frame.observation);
			frame.borrowedScene.setLighting(frame.owners, receiver, frame.directionToSource);
			const pose = sampleFilmCamera(seconds, frame.directionToSource); persistent.applyCamera(pose);
			frame.celestial.render();
			const camera = frame.celestial.camera, material = materialFor(frame), source = frame.source.position.coordinates, observer = frame.owners.geometry.configuration.observerPosition.coordinates;
			const cameraMeters = camera.position.toArray().map(value => value * 1000);
			const sourceDistance = Math.hypot(source[0] - observer[0] - cameraMeters[0], source[1] - observer[1] + cameraMeters[2], source[2] - observer[2] - cameraMeters[1]);
			const sourceRadius = frame.owners.source.celestialSourceDefinition.radius.value, radius = Number(material.uniforms.uSunRadiusPixels.value);
			const expectedRadius = Math.tan(Math.asin(sourceRadius / sourceDistance)) * Math.abs(camera.projectionMatrix.elements[5]) * input.viewportSize.height / 2;
			const center = material.uniforms.uSunScreenCenterPixels.value, c = Array.isArray(center) ? [...center] : [center.x, center.y];
			if (sourceRadius !== 16 * 1609.344 || Math.abs(radius - expectedRadius) > 1e-6 || c[0] - radius < 0 || c[0] + radius >= input.viewportSize.width || c[1] - radius < 0 || c[1] + radius >= input.viewportSize.height) throw new Error('Film physical radius, projected size or visibility failed.');
			const glError = gl.getError(); maximumGlError = Math.max(maximumGlError, glError);
			if (glError) throw new Error('Film draw returned GL error ' + glError);
			rows.push({slot, timestampMicroseconds: Math.round(slot * 1000000 / input.framesPerSecond), filmSeconds: seconds, sourceProgress: pose.sourceProgress, sourcePhaseDegrees: pose.sourcePhaseDegrees, observation: frame.observation, frameIdentity: frame.identity, cacheIdentity, cacheReused: frame.cache === firstCache, cameraMeters, cameraDirection: camera.getWorldDirection(new THREE.Vector3()).toArray(), verticalFieldOfViewDegrees: camera.fov, sourcePositionMeters: [...source], sunAzimuthDegrees: pose.sunAzimuthDegrees, sunElevationDegrees: pose.sunElevationDegrees, sourceDistanceMeters: sourceDistance, sourceRadiusMeters: sourceRadius, sunRadiusPixels: radius, expectedSunRadiusPixels: expectedRadius, sunCenterPixels: c, exactReceiverIdentity: exact.identity, presentationReceiverIdentity: receiver.identity, directNormalIdentity: receiver.directNormal.contentHash, diffuseIdentity: receiver.diffuseHorizontal.contentHash, adaptationLuminanceCdM2: receiver.stellarAdaptationLuminance.value, preparedMilliseconds: performance.now() - preparationStarted, glError});
		}

		/** Retain one sparse lossless image and actual final-raster disc support proof.
		 * @param {string} name - Host-whitelisted unique PNG name.
		 * @returns {Promise<string>} - Retained artifact name; no PNG remains in recorder memory.
		 */
		async function capture(name) {
			if (!recordingLease) throw new Error('Capture requires a leased presented frame.');
			const frame = recordingLease.frame, disc = await proveDisc(frame, renderer);
			frame.celestial.render();
			await bridge.localSunFilmArtifact(name, JSON.stringify({dataUrl: canvas.toDataURL('image/png')}));
			const filmSeconds = rows.at(-1).filmSeconds;
			milestones.push({name, filmSeconds, disc, exactReceiver: frame.receiver, presentationEnvironment: samples.sample(filmSeconds)});
			return name;
		}

		const milestoneSeconds = [0, 10, 27.5, 45, 62.5, 80];
		if (input.stage === 'stills') {
			for (const [slot, seconds] of [...milestoneSeconds, 90].entries()) {
				try {await render(seconds, slot); await capture(seconds === 90 ? 'endpoint90.png' : `milestone-${slot}.png`);}
				finally {recordingLease?.release(); recordingLease = null;}
				await bridge.localSunFilmProgress('stills', 'Rendered composition control.', slot + 1, 7);
			}
		} else {
			const encoderConfig = {width: input.viewportSize.width, height: input.viewportSize.height, framerate: input.framesPerSecond, bitrate: input.bitrate, bitrateMode: /** @type {const} */ ('variable'), latencyMode: /** @type {const} */ ('quality'), avc: {format: /** @type {const} */ ('avc')}};
			encoderSelection = await WebCodecsEncoderSelector.select([{id: 'avc-high-5.2-hardware', config: {...encoderConfig, codec: 'avc1.640034', hardwareAcceleration: 'prefer-hardware'}}, {id: 'avc-high-5.2-auto', config: {...encoderConfig, codec: 'avc1.640034', hardwareAcceleration: 'no-preference'}}]);
			const sink = new BoundedChunkSink({maximumBatchBytes: 4 * 1024 * 1024, publishBatch: (bytes, index) => bridge.localSunFilmVideoChunk(index, encodeBytes(bytes)), finalize: () => bridge.localSunFilmVideoFinalize()});
			const output = new MediabunnyCanvasOutput({mediabunny: /** @type {AnimationEvidenceMediabunnyModule} */ (/** @type {unknown} */ (mediabunny)), canvas, writable: sink.writable(), framesPerSecond: input.framesPerSecond, codec: 'avc', fullCodecString: 'avc1.640034', hardwareAcceleration: String(encoderSelection.selectedConfig.hardwareAcceleration), bitrate: input.bitrate, metadata: {title: 'A circuit of the local Sun', comment: 'Hypothetical flat/local geometry. Deterministic offline cinematic rendering; physical emitter radius unchanged.'}});
			const mapping = Array.from({length: input.segmentDurationSeconds * input.framesPerSecond}, (_, slotIndex) => ({slotIndex, mappingKind: 'ideal-choreography', timestampMicroseconds: Math.round(slotIndex * 1000000 / input.framesPerSecond), mappingEquationId: 'local-sun-p6-ideal-clock-v1', sourceFrameId: slotIndex, sourceAnimationCallbackMicroseconds: Math.round(slotIndex * 1000000 / input.framesPerSecond), heldFromPreviousSlot: false, measuredFrameAdvance: slotIndex === 0 ? 0 : 1, state: {animationSeconds: input.segmentStartSeconds + slotIndex / input.framesPerSecond}}));
			const captureSlots = new Set(milestoneSeconds.map(seconds => Math.round((seconds - input.segmentStartSeconds) * input.framesPerSecond)).filter(slot => slot >= 0 && slot < mapping.length));
			/** Release the leased frame only after the awaited encoder accepts its pixels. @type {AnimationEvidenceVideoOutput} */
			const leasedOutput = {start: () => output.start(), addFrame: async (image, timestamp, duration, options) => {try {await output.addFrame(image, timestamp, duration, options);} finally {recordingLease?.release(); recordingLease = null;}}, finalize: () => output.finalize(), abort: () => output.abort(), getResult: () => output.getResult()};
			recording = await new DeterministicCanvasRecorder({mapping, framesPerSecond: input.framesPerSecond, presentationCanvas: canvas, videoOutput: leasedOutput, render: entry => render(/** @type {TheHoursReplayState} */ (entry.state).animationSeconds, entry.slotIndex), captureSlots, capture: entry => capture(`milestone-${entry.slotIndex}.png`), reportProgress: (completed, total) => bridge.localSunFilmProgress('record', 'Rendered and encoded distinct ideal states.', completed, total)}).record();
			sinkDiagnostics = sink.diagnostics();
			if (input.stage !== 'motion') {
				try {await render(90, mapping.length); await capture('endpoint90.png');}
				finally {recordingLease?.release(); recordingLease = null;}
			}
		}
		const sceneDescription = persistent.describe(), cacheCount = publisher.resources.size, peakAdmittedBytes = publisher.peakAdmittedBytes;
		await bridge.localSunFilmArtifact('trace.json', JSON.stringify({schema: 'local-sun-p6-trace-v1', rows, endpointIsSeparate: input.stage !== 'motion' && input.stage !== 'stills'}));
		await bridge.localSunFilmArtifact('milestones.json', JSON.stringify({schema: 'local-sun-p6-milestones-v1', milestones}));
		const finalGeneration = publisher.active?.celestial?.generation;
		publisher.dispose(); await publisher.tail; verifyRetired(finalGeneration);
		persistent.dispose(); scene = null;
		if (publisher.cleanupErrors.length || publisher.resources.size) throw new Error('Film frame/cache cleanup failed: ' + publisher.cleanupErrors.join('; '));
		return JSON.stringify({schema: 'local-sun-p6-film-v1', stage: input.stage, frames: recording?.frameCount ?? rows.length, fps: input.framesPerSecond, duration: input.stage === 'stills' ? 0 : input.segmentDurationSeconds, viewportSize: input.viewportSize, glError: maximumGlError, cacheCount, cleanup: {resources: publisher.resources.size, errors: publisher.cleanupErrors, persistentSceneDisposed: true, ...retirement}, elapsedMilliseconds: performance.now() - started, preparedCount, peakAdmittedBytes, resources, scene: sceneDescription, lightingIdentity, milestones, recording, encoderSelection, sinkDiagnostics});
	} finally {
		recordingLease?.release(); publisher.dispose(); await publisher.tail; scene?.dispose();
		renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
	}
}

bridge.localSunFilm = {run};
