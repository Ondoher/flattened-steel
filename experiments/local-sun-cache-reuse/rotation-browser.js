import {ShellFramePublication} from './shell-frame-publication.js';
import {shellApplicationImage} from './shell-application-image.js';
import * as THREE from 'three';
import {Output, Mp4OutputFormat, BufferTarget, CanvasSource} from 'mediabunny';
import {ThreeCacheBackend} from '../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {Algorithm32Bindings} from '../../src/algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {
	createOwners,
	rotate,
	unit,
	sampleField,
	cpuRays,
	viewDirections,
	residual,
	sourceChecks,
	rayCoverage,
} from './rotation-model.js';
import {gpuRays} from './rotation-gpu.js';
import {LocalSunShellFactCache} from '../../src/algorithm32/implementation/local-sun/cache/LocalSunShellFactCache.js';
import {partitionedShellIncoming} from './shell-angular.js';
import {prepareShellMiePhase} from './shell-phase.js';
import {configureShellBackend,configureShellController,prepareShellApplicationFrame} from './shell-client.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {shellNodeDirectionStencil,shellSpectralNodeWeight} from './shell-axis.js';
import {FlatEarthGeometry} from '../../src/algorithm32/implementation/index.js';
import {ShellResourceProof} from './shell-resource-proof.js';
import {rebuildShellLayout} from './shell-layout-refinement.js';
import {ShellWebGlResources} from './shell-webgl-resources.js';
import {shellResourceBounds} from './shell-resource-bounds.js';
import {shellStencil} from './shell-layout.js';

const bridge = /** @type {LocalSunRotationBridge} */ (/** @type {unknown} */ (globalThis));

/** Hash retained field content without retaining full duplicated raw arrays.
 * @param {Float32Array} values - Complete layer-major array.
 * @returns {Promise<string>} - Exact field byte identity.
 */
async function fieldHash(values) {
	const digest = await crypto.subtle.digest('SHA-256', new Float32Array(values));
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Emit small source-bound facts or binary artifact bytes to the checked host.
 * @param {string} name - New artifact name.
 * @param {unknown} value - JSON-compatible facts.
 * @returns {Promise<void>} - Host flush completion.
 */
async function emit(name, value) {
	await bridge.localSunRotationArtifact(name, JSON.stringify(value));
}

/** Resolve physical point support once without caching any field values.
 * @param {FlatEarthGeometry} geometry - Exact active query frame.
 * @param {readonly number[]} coordinates - Continuous physical meters.
 * @returns {LocalSunShellSpatialPoint} - Same node factors and weights used by sampleField.
 */
function resolveSpatialPoint(geometry,coordinates) {
	const position={coordinates:/** @type {UnitVector3} */([coordinates[0],coordinates[1],coordinates[2]]),units:/** @type {const} */('meters')};
	const stencil=geometry.resolveScatteringCachePositionStencil({position,atmosphereCoordinate:geometry.resolveAtmosphereCoordinate(position)});
	return {position,taps:stencil.indices.map((index,i)=>({index,weight:stencil.weights[i],spectral:Array.from({length:15},(_,c)=>shellSpectralNodeWeight(geometry,index,position,c))}))};
}

/** Evaluate complete measured fields with shared point/angle support and unchanged arithmetic order.
 * @param {LocalSunRotationField[]} fields - Exact fifteen-channel measured arrays.
 * @param {FlatEarthGeometry} geometry - Active physical frame.
 * @param {LocalSunShellSpatialPoint} point - Already resolved physical point.
 * @param {UnitVector3} direction - Exact outgoing direction.
 * @returns {Float64Array[]} - Each field's independently accumulated spectral packet.
 */
function spatialPackets(fields,geometry,point,direction) {
	const packets=fields.map(()=>new Float64Array(15));
	for(const tap of point.taps) {
		const angles=shellNodeDirectionStencil(geometry,tap.index,point.position,direction);
		for(let d=0;d<angles.indices.length;d++)for(let c=0;c<15;c++) {
			const weight=tap.spectral[c]*tap.weight*angles.weights[d];
			for(let f=0;f<fields.length;f++)packets[f][c]+=weight*fields[f].values[(c*fields[f].storage.height+tap.index)*fields[f].storage.width+angles.indices[d]];
		}
	}
	return packets;
}

/** Accumulate the unchanged frozen residual over one packet without retaining duplicate arrays.
 * @param {LocalSunRotationResidual} result - Running complete scalar inventory.
 * @param {Float64Array} actual - Actual packet.
 * @param {Float64Array} expected - Independently reconstructed expected packet.
 * @returns {void} - Same limits, counts and maxima as residual(actual, expected, 1e-12, 1e-4).
 */
function observeSpatial(result,actual,expected) {
	for(let c=0;c<15;c++) {
		const index=result.count++;
		if(!Number.isFinite(actual[c]) || !Number.isFinite(expected[c])){result.nonfinite++;result.failures++;continue;}
		if(actual[c]<-1e-12 || expected[c]<-1e-12)result.negative++;
		const error=Math.abs(actual[c]-expected[c]),ratio=error/(1e-12+1e-4*Math.abs(expected[c]));
		if(ratio>result.maximumRatio){result.maximumRatio=ratio;result.worstIndex=index;}
		result.maximumAbsolute=Math.max(result.maximumAbsolute,error);if(ratio>1)result.failures++;
	}
}

/** Check reconstruction around all spatial cells and angular seams.
 * @param {LocalSunRotationOwners} owners - Fresh physical frame.
 * @param {LocalSunRotationOwners} canonical - Canonical physical frame.
 * @param {LocalSunRotationField} fresh - Measured cumulative field.
 * @param {LocalSunRotationField} reused - Canonical cumulative field.
 * @param {number} degrees - Synthetic rotation.
 * @param {LocalSunShellLayout} [layout] - Optional compact candidate support, replacing inherited grid probes.
 * @param {readonly number[]} [offset] - Horizontal displacement from the canonical physical frame, meters.
 * @param {LocalSunShellSpatialFieldPair[]} [batch] - Optional complete pure/cumulative fields evaluated with identical shared support.
 * @returns {LocalSunRotationSpatialResult[]} - Direct frame and strict inverse-transform residuals for every field.
 */
function spatialChecks(owners, canonical, fresh, reused, degrees, layout,offset=[0,0],batch=[{fresh,reused}]) {
	const g = owners.geometry.configuration,
		base = canonical.geometry.configuration;
	const z = g.cacheAltitudeNodes.map((v) => v.value),
		rho = g.cacheRadialNodes.map((v) => v.value);
	const points = [];
	if(layout) {
		for(const row of layout.rows)for(let i=0;i<row.indices.length;i++) {
			const node=layout.nodes[row.indices[i]];points.push([node.rho,node.z]);
			if(i+1<row.indices.length)points.push([(node.rho+layout.nodes[row.indices[i+1]].rho)/2,node.z]);
		}
		for(let i=0;i<layout.rows.length-1;i++)for(const fraction of [0,.19,.51,.93,1])points.push([fraction*layout.maximumRho,(layout.rows[i].z+layout.rows[i+1].z)/2]);
	} else {
		for (const h of z) for (const r of rho) points.push([r, h]);
		for (let i = 0; i < z.length - 1; i++)
			for (let j = 0; j < rho.length - 1; j++) points.push([(rho[j] + rho[j + 1]) / 2, (z[i] + z[i + 1]) / 2]);
	}
	for (const h of [0, 1, 99999, 100000])
		for (const r of [0, 1, g.cacheRadialMaximum.value - 1, g.cacheRadialMaximum.value]) points.push([r, h]);
	const shell = new LocalSunShellFactCache({sourceConfiguration: owners.source.configuration});
	const eligible = Array.from(shell.boundaries)
		.map((distance) => Math.sqrt(distance ** 2 - (g.sourcePosition.coordinates[2] - 5) ** 2))
		.filter((r) => Number.isFinite(r) && r > 1 && r < g.cacheRadialMaximum.value - 1);
	for (let i = 0; i < 8 && eligible.length; i++) {
		const r = eligible[Math.floor((i * (eligible.length - 1)) / 7)];
		for (const delta of [-1, 0, 1]) points.push([r + delta, 5]);
	}
	const dirs = [
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1],
		[1, 1, 0],
		[1, 0, 1],
		[1, 1, 1],
		[-1, 2, 3],
	];
	for (const v of [
		[1, 1, 0],
		[1, 0, 1],
		[0, 1, 1],
		[1, 1, 1],
		[-1, 1, 1],
	])
		for (const axis of [0, 1, 2])
			for (const e of [-1e-5, 1e-5]) {
				const d = [...v];
				d[axis] += e;
				dirs.push(d);
			}
	const summaries=batch.map(()=>({directFrame:residual([],[],1e-12,1e-4),inverseTransformAwayFromAxis:residual([],[],1e-12,1e-4),inverseTransformAtAxis:residual([],[],1e-12,1e-4),implementationParity:residual([],[],1e-12,1e-4)}));
	let pointIndex=0;
	for (const [r, h] of points)
		for (const az of [0, 33]) {
			const radialOffset = rotate([r, 0, h], az),
				p = [g.sourceSubpoint.coordinates[0] + radialOffset[0], g.sourceSubpoint.coordinates[1] + radialOffset[1], h];
			const bp = rotate([p[0]-offset[0],p[1]-offset[1],p[2]], -degrees);
			const query=resolveSpatialPoint(owners.geometry,p),originalQuery=resolveSpatialPoint(canonical.geometry,bp);
			for (const d of dirs) {
				const direction=unit(d),expected=spatialPackets(batch.map(pair=>pair.fresh),owners.geometry,query,direction),actual=spatialPackets(batch.map(pair=>pair.reused),owners.geometry,query,direction),original=spatialPackets(batch.map(pair=>pair.reused),canonical.geometry,originalQuery,rotate(direction,-degrees));
				for(let f=0;f<batch.length;f++) {
					observeSpatial(summaries[f].directFrame,actual[f],expected[f]);
					observeSpatial(r===0 ? summaries[f].inverseTransformAtAxis : summaries[f].inverseTransformAwayFromAxis,original[f],expected[f]);
					if(d===dirs[0] && [0,1,10,111,points.length*2-1].includes(pointIndex)) {
						const legacy=sampleField(batch[f].fresh,owners.geometry,p,direction);
						if(expected[f].some((value,c)=>value!==legacy[c]))throw new Error('Shared-support proof changed reconstruction arithmetic.');
						observeSpatial(summaries[f].implementationParity,expected[f],legacy);
					}
				}
			}
			pointIndex++;
		}
	return summaries.map(summary=>({
		queries: points.length * 2 * dirs.length,
		directions: dirs.length,
		spatialPoints: points.length * 2,
		...summary,
		canonicalSource: base.sourcePosition.coordinates,
	}));
}

/** Measure physical approach to the source axis independently of rotation parity.
 * @param {LocalSunRotationOwners} owners - Active frame.
 * @param {LocalSunRotationField} field - Complete measured outgoing field.
 * @returns {LocalSunRotationResidual} - Frozen-limit residual at one-millimetre approach.
 */
function axisApproach(owners, field) {
	const source = owners.geometry.configuration.sourceSubpoint.coordinates;
	const actual = [],
		expected = [];
	for (const altitude of [0, 250, 1500, 25000, 99999])
		for (const azimuth of [0, 17, 33, 90, 135, 180, 271])
			for (const direction of [
				[1, 0, 0],
				[0, 1, 0],
				[0, 0, 1],
				[1, 1, 1],
			]) {
				const offset = rotate([0.001, 0, 0], azimuth),
					d = unit(direction);
				expected.push(...sampleField(field, owners.geometry, [source[0], source[1], altitude], d));
				actual.push(
					...sampleField(field, owners.geometry, [source[0] + offset[0], source[1] + offset[1], altitude], d),
				);
			}
	return residual(actual, expected, 1e-12, 1e-4);
}

/** Execute fresh versus canonical cache comparisons and early image delivery.
 * @param {LocalSunRotationRecipe} recipe - Frozen inputs and bounded/selected profile.
 * @returns {Promise<string>} - Serialized complete matrix result.
 */
async function runRotation(recipe) {
	if(recipe.shellLayout)recipe={...recipe,shellIncoming:partitionedShellIncoming(48,.5),shellRuntime:true,candidate:'precision',motion:false};
	if(recipe.shellApplication)return runShellApplication(recipe);
	const canvas = document.createElement('canvas');
	document.body.append(canvas);
	const gl = canvas.getContext('webgl2', {antialias: false, preserveDrawingBuffer: true});
	if (!gl?.getExtension('EXT_color_buffer_float')) throw new Error('Float WebGL2 required.');
	const renderer = new THREE.WebGLRenderer({canvas, context: gl});
	renderer.debug.onShaderError=()=>{throw new Error('Experimental rotation shader compilation failed.');};
	renderer.setSize(720, 414, false);
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	const backend = new ThreeCacheBackend({THREE, renderer});
	const compile = backend.compile.bind(backend);
	if(recipe.shellLayout) {
		const preparation=createOwners(recipe,0);
		try {configureShellBackend(backend,recipe.shellLayout,await prepareShellMiePhase(preparation.domains,'/phase-worker.js'),'column48-tail64');}
		finally {preparation.facade.dispose();}
	}
	if (recipe.candidate && recipe.candidate !== 'axis' && !recipe.shellLayout) {
		backend.compile = (shader) =>
			compile({
				...shader,
				bindings: shader.bindings.map((binding) => {
					if (
						[
							'uCacheGeometrySourceSubpoint',
							'uCacheGeometrySourcePosition',
							'uCacheLocalSunPosition',
						].includes(binding.spec.name)
					) {
						const value = /** @type {Position} */ (binding.value);
						if (
							value.units !== 'meters' ||
							!Array.isArray(value.coordinates) ||
							!Number.isFinite(value.coordinates[2])
						)
							throw new Error('Source-relative build binding must be a finite metre position.');
						return {...binding, value: {...value, coordinates: [0, 0, value.coordinates[2]]}};
					}
					if (binding.spec.name === 'uCacheGeometryRadialFallback') return {...binding, value: [1, 0, 0]};
					return binding;
				}),
			});
	}
	const black = new THREE.DataTexture(new Float32Array(4), 1, 1, THREE.RGBAFormat, THREE.FloatType);
	black.needsUpdate = true;
	const fields = new Map(),
		readbacks = [],
		captureControllers = [];
	let observedFields = fields,
		canonical = null,
		canonicalHandle = null,
		canonicalCache = null;
	/** @type {LocalSunRotationBindingCapture} */
	const bindingCapture = {current: null};
	let canonicalCamera, canonicalBindings, canonicalPass;
	const submit = backend.submitLayer.bind(backend),
		install = backend.installRuntimeBindings.bind(backend);
	backend.submitLayer = (request) => {
		submit(request);
		if (request.layer === request.output.storage.layers - 1 && request.output.id.startsWith('local-sun-')) {
			const binding = backend.createRuntimeBinding({
				field: request.output,
				valueKey: 'cache.cumulativeScatteringDensity',
			});
			readbacks.push(
				backend.readRuntimeBindingField(binding).then((field) => {
					observedFields.set(request.output.id, field);
				}),
			);
		}
	};
	backend.installRuntimeBindings = (request) => {
		if (
			!bindingCapture.current &&
			request.bindings.bindings.some((b) => b.valueKey === 'cache.cumulativeScatteringDensity')
		)
			bindingCapture.current = request;
		install(request);
	};
	let canonicalCpuRays, canonicalGpuRays;
	const results = [],
		directions = viewDirections();
	try {
		for (const pose of recipe.shellPoses ?? recipe.angles.map(degrees=>({degrees,offset:/** @type {[number,number]} */([0,0]),key:degrees}))) {
			const {degrees,offset,key}=pose;
			console.log(`${recipe.shellLayout ? 'P3 shell' : 'P2'} ${recipe.diagnostic ? 'diagnostic' : 'selected'} rotation ${degrees}, offset ${offset}: fresh build`);
			const placedRecipe={...recipe,shellPlacementOffset:offset};
			const owners = createOwners(placedRecipe, degrees),
				camera = new THREE.PerspectiveCamera(70, 720 / 414, 0.002, 500);
			camera.position.set(0, 0.005, 0);
			camera.lookAt(0, 0.005, -1);
			const createController = owners.source.createCacheController.bind(owners.source);
			owners.source.createCacheController = (request) => {
				const c = createController({...request,...(recipe.shellLayout ? {scheduler:{yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0))}} : {})});
				if(recipe.shellLayout)configureShellController(c,recipe.shellLayout);
				captureControllers.push(c);
				return c;
			};
			/** @type {ShaderRuntimeComposer} */
			const composer = {
				passes: [],
				addPass(p) {
					this.passes.push(p);
				},
				removePass(p) {
					const i = this.passes.indexOf(p);
					if (i >= 0) this.passes.splice(i, 1);
				},
			};
			const bindings = Algorithm32Bindings.create(THREE, {value: 500000, units: 'meters'});
			Algorithm32Bindings.update({
				bindingValues: bindings,
				camera,
				props: {
					config: {...owners.facade.config.config, geometry: owners.geometry},
					sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
				},
			});
			bindingCapture.current = null;
			observedFields = new Map();
			readbacks.length = 0;
			let handle;
			try {
				const tick = performance.now();
				handle = await owners.facade.setupShader({
					THREE,
					composer,
					scene: new THREE.Scene(),
					camera,
					viewportSize: {width: 720, height: 414, units: 'pixels'},
					sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
					sceneDepthMax: {value: 500000, units: 'meters'},
					bindingValues: bindings,
					cacheBackend: backend,
				});
				await Promise.all(readbacks);
				gl.finish();
				const buildMilliseconds = performance.now() - tick;
				const cache = captureControllers.at(-1).active;
				if (!cache) throw new Error('No complete fresh cache.');
				if (!canonical) {
					canonical = owners;
					canonicalHandle = handle;
					canonicalCache = cache;
					for (const [id, f] of observedFields) fields.set(id, f);
				}
				const fieldComparisons = [];
				for (const [id, f] of observedFields) {
					const absolute = id.includes('-j') ? 1e-12 : 1e-9;
					fieldComparisons.push({
						id,
						storage: f.storage,
						sha256: await fieldHash(f.values),
						reuse: residual(fields.get(id).values, f.values, absolute, 1e-4),
					});
				}
				const cumulative = observedFields.get('local-sun-j-through-4'),
					reused = fields.get('local-sun-j-through-4');
				const spatialResults=spatialChecks(owners,canonical,cumulative,reused,degrees,recipe.shellLayout,offset,[{fresh:cumulative,reused},...[1,2,3,4].map(order=>({fresh:observedFields.get(`local-sun-j${order}`),reused:fields.get(`local-sun-j${order}`)}))]);
				const spatial=spatialResults[0],orderSpatial=[1,2,3,4].map(order=>({order,...spatialResults[order]}));
				await handle.prepare(renderer);
				const receiver = await handle.measureReceiverEnvironmentLight({
					THREE,
					renderer,
					backend,
					diagnostics: true,
				});
				const pass = /** @type {LocalSunControlViewPass} */ (composer.passes.at(-1));
				pass.renderToScreen = true;
				if (handle === canonicalHandle) {
					canonicalCamera = camera;
					canonicalBindings = bindings;
					canonicalPass = pass;
				}
				pass.render(renderer, null, {texture: black});
				gl.finish();
				const freshImage = canvas.toDataURL('image/png');
				await emit(`angle-${key}-fresh.png`, {dataUrl: freshImage});
				if (!bindingCapture.current) throw new Error('No public runtime cache uniform installation.');
				install({bindings: canonicalCache.getRuntimeBindings(), uniforms: bindingCapture.current.uniforms});
				pass.render(renderer, null, {texture: black});
				gl.finish();
				await emit(`angle-${key}-reused.png`, {dataUrl: canvas.toDataURL('image/png')});
				if (degrees === 17 && !recipe.shellLayout) {
					const fresh = new Image(),
						reused = new Image();
					fresh.src = freshImage;
					reused.src = canvas.toDataURL('image/png');
					await Promise.all([fresh.decode(), reused.decode()]);
					const blink = document.createElement('canvas');
					blink.width = 720;
					blink.height = 448;
					const context = blink.getContext('2d');
					if (!context) throw new Error('Blink canvas unavailable.');
					const target = new BufferTarget(),
						output = new Output({format: new Mp4OutputFormat(), target});
					const video = new CanvasSource(blink, {codec: 'avc', bitrate: 4000000});
					output.addVideoTrack(video, {frameRate: 30});
					await output.start();
					try {
						for (let frame = 0; frame < 60; frame++) {
							const isFresh = Math.floor(frame / 15) % 2 === 0;
							context.fillStyle = '#151515';
							context.fillRect(0, 0, 720, 448);
							context.drawImage(isFresh ? fresh : reused, 0, 34);
							context.fillStyle = 'white';
							context.font = '18px sans-serif';
							context.fillText(
								`17 degrees: ${isFresh ? 'Fresh' : 'Reused'} — identical fresh adaptation`,
								12,
								23,
							);
							await video.add(frame / 30, 1 / 30);
						}
						await output.finalize();
						const bytes = new Uint8Array(target.buffer),
							chunks = [];
						for (let i = 0; i < bytes.length; i += 0x8000)
							chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
						await emit('blink-17.mp4', {base64: btoa(chunks.join(''))});
					} finally {
						video.close();
					}
				}
				const freshRays = cpuRays(owners, cumulative, directions),
					reusedRays = cpuRays(owners, reused, directions);
				const gpuFresh = await gpuRays({owners, cache, backend, renderer, directions});
				const gpuReused = await gpuRays({owners, cache: canonicalCache, backend, renderer, directions});
				if (key === 0) {
					canonicalCpuRays = freshRays;
					canonicalGpuRays = gpuFresh;
				}
				const equivalentDirections = directions.map((d) => rotate(d, degrees));
				const shifted=offset.some(value=>value!==0),equivalentOwners=shifted ? createOwners({...placedRecipe,shellObserverOffset:offset},degrees) : owners;
				let equivalentCpu,equivalentGpu;
				try {
					equivalentCpu=degrees===0 && !shifted ? freshRays : cpuRays(equivalentOwners,cumulative,equivalentDirections);
					equivalentGpu=degrees===0 && !shifted ? gpuFresh : await gpuRays({owners:equivalentOwners,cache,backend,renderer,directions:equivalentDirections});
				} finally {if(equivalentOwners!==owners)equivalentOwners.facade.dispose();}
				const equivalentCpuResidual = residual(
					equivalentCpu.flatMap((r) => r.radiance),
					canonicalCpuRays.flatMap((r) => r.radiance),
					1e-9,
					1e-4,
				);
				const equivalentGpuResidual = residual(
					equivalentGpu.flatMap((r) => r.radiance),
					canonicalGpuRays.flatMap((r) => r.radiance),
					1e-9,
					1e-4,
				);
				const coverage = rayCoverage(owners, freshRays),
					equivalentCoverage = rayCoverage(owners, equivalentCpu);
				const endpointResiduals = gpuFresh.map((r, i) =>
					Math.abs(r.end - freshRays[i].segment.endDistance.value),
				);
				const endpointMaximumMeters = Math.max(...endpointResiduals),
					endpointFailures = endpointResiduals.filter((v) => v > 0.01).length;
				const rayReuse = residual(
					reusedRays.flatMap((r) => r.radiance),
					freshRays.flatMap((r) => r.radiance),
					1e-9,
					1e-4,
				);
				const gpuReuse = residual(
					gpuReused.flatMap((r) => r.radiance),
					gpuFresh.flatMap((r) => r.radiance),
					1e-9,
					1e-4,
				);
				const cpuGpu = residual(
					gpuFresh.flatMap((r) => r.radiance),
					freshRays.flatMap((r) => r.radiance),
					1e-9,
					0.002,
				);
				const transmission = residual(
					gpuFresh.flatMap((r) => r.transmittance),
					freshRays.flatMap((r) => r.transmittance),
					1e-7,
					0.002,
				);
				const entry = {
					degrees,
					translationMeters:offset,
					artifactKey:key,
					source: owners.source.configuration.position,
					profile: {
						positions: owners.domains.positionCount,
						outgoing: owners.domains.outgoingDirectionCount,
						incoming: owners.domains.incomingDirectionCount,
						channels: 15,
						order: 4,
					},
					buildMilliseconds,
					geometry: {
						altitudeNodes: owners.geometry.configuration.cacheAltitudeNodes,
						radialNodes: owners.geometry.configuration.cacheRadialNodes,
						radialMaximumMeters: owners.geometry.configuration.cacheRadialMaximum.value,
						axisFrame: owners.geometry.configuration.cacheRadialFallbackDirection,
						logicalFieldBytes: fieldComparisons.reduce(
							(sum, f) => sum + f.storage.width * f.storage.height * f.storage.layers * 4,
							0,
						),
					},
					maximumRayRadiance: Math.max(...gpuFresh.flatMap((r) => r.radiance)),
					endpointSingleFloatFloorMeters: Math.max(
						...freshRays.map((r) =>
							Math.abs(Math.fround(r.segment.endDistance.value) - r.segment.endDistance.value),
						),
					),
					fields: fieldComparisons,
					spatial,
					orderSpatial,
					axisApproach: axisApproach(owners, cumulative),
					sourceInvariants: sourceChecks(owners, canonical, degrees,offset),
					coverage,
					equivalentCoverage,
					radiusDeltaMeters:
						owners.geometry.configuration.cacheRadialMaximum.value -
						canonical.geometry.configuration.cacheRadialMaximum.value,
					equivalentCpuResidual,
					equivalentGpuResidual,
					endpointMaximumMeters,
					endpointFailures,
					endpointResiduals,
					rayReuse,
					gpuReuse,
					cpuGpu,
					transmission,
					receiver,
					rays: {
						directions,
						cpuFresh: freshRays,
						cpuReused: reusedRays,
						gpuFresh,
						gpuReused,
						equivalentDirections,
						equivalentCpu,
						equivalentGpu,
					},
					diagnostics: owners.geometry.runtimeDiagnostics,
				};
				await emit(`angle-${key}.json`, entry);
				results.push(entry);
			} finally {
				if (handle !== canonicalHandle) {
					handle?.dispose();
					owners.facade.dispose();
				}
				observedFields.clear();
			}
		}
		if (recipe.motion) {
			console.log('P2 rotation motion: canonical cache only, fixed world camera');
			// Rotate the camera inversely in the canonical physical frame. The origin is
			// invariant, so this is the exact reused sky for the moving world source.
			const target = new BufferTarget(),
				output = new Output({format: new Mp4OutputFormat(), target});
			const video = new CanvasSource(canvas, {codec: 'avc', bitrate: 4000000});
			output.addVideoTrack(video, {frameRate: 30});
			await output.start();
			const trace = [];
			try {
				for (let slot = 0; slot < 90; slot++) {
					const degrees = (slot * 90) / 89,
						d = rotate([0, 1, 0], -degrees);
					canonicalCamera.lookAt(d[0], 0.005 + d[2], -d[1]);
					Algorithm32Bindings.update({
						bindingValues: canonicalBindings,
						camera: canonicalCamera,
						props: {
							config: {...canonical.facade.config.config, geometry: canonical.geometry},
							sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
						},
					});
					canonicalPass.renderToScreen = true;
					canonicalPass.render(renderer, null, {texture: black});
					await video.add(slot / 30, 1 / 30);
					trace.push({
						slot,
						degrees,
						source: rotate(recipe.state.geometry.sourcePosition.coordinates, degrees),
						canonicalCache: true,
					});
				}
				await output.finalize();
				const bytes = new Uint8Array(target.buffer),
					chunks = [];
				for (let i = 0; i < bytes.length; i += 0x8000)
					chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
				await emit('rotation.mp4', {base64: btoa(chunks.join(''))});
				await emit('motion.json', {
					fps: 30,
					frames: 90,
					trace,
					limitation: 'Reused path only; fresh comparisons are paired stills, not every video frame.',
				});
			} finally {
				video.close();
			}
		}
		const debug = gl.getExtension('WEBGL_debug_renderer_info');
		const errors = [];
		for (let e = gl.getError(); e !== gl.NO_ERROR; e = gl.getError()) errors.push(e);
		if (errors.length) throw new Error(`GL errors ${errors}`);
		return JSON.stringify({
			schema: recipe.shellLayout ? 'local-sun-shell-rotation-v1' : 'local-sun-p2-rotation-v1',
			diagnostic: recipe.diagnostic,
			angles: recipe.angles,
			hardware: String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)),
			results: results.map(({rays, receiver, ...summary}) => summary),
			glErrors: errors,
		});
	} finally {
		canonicalHandle?.dispose();
		canonical?.facade.dispose();
		fields.clear();
		black.dispose();
		backend.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
	}
}

/** Exercise complete prepared GPU frames through the publication owner, without recording.
 * @param {LocalSunRotationRecipe} recipe - Authenticated selected shell application controls.
 * @param {LocalSunShellApplicationCanvas} [providedCanvas] - Optional transferred application canvas owned by a worker.
 * @returns {Promise<string>} - Actual GPU application happy-path evidence; accuracy/lifecycle matrix stays separate.
 */
export async function runShellApplication(recipe,providedCanvas) {
	if(!recipe.shellLayout || !recipe.shellIncoming || !recipe.shellImplementationIdentity)throw new Error('Complete application identity required.');
	const canvas=providedCanvas ?? document.createElement('canvas');if(!providedCanvas)document.body.append(/** @type {HTMLCanvasElement} */(canvas));
	const gl=canvas.getContext('webgl2',{antialias:false,preserveDrawingBuffer:true});
	if(!gl?.getExtension('EXT_color_buffer_float'))throw new Error('Float WebGL2 required.');
	const webglResources=new ShellWebGlResources();webglResources.attach(gl);
	const renderer=new THREE.WebGLRenderer({canvas,context:gl});
	renderer.debug.onShaderError=()=>{throw new Error('Shell application shader compilation failed.');};
	renderer.setSize(720,414,false);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
	if(recipe.shellScene){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;}
	const black=new THREE.DataTexture(new Float32Array(4),1,1,THREE.RGBAFormat,THREE.FloatType);black.needsUpdate=true;
	const publication=new ShellFramePublication(1200000000),preparation=createOwners(recipe,0);
	const resourceProof=new ShellResourceProof();
	/** @type {LocalSunRotationField|null} */ let canonicalField=null;
	let readbackIdentity='';
	const results=[],directions=viewDirections();
	let displayedImage='';
	/** @type {number[][]|null} */ let baselineRadiances=null;
	let phaseGapMilliseconds=0,phaseLastPulse=performance.now();
	const phasePulse=setInterval(()=>{const now=performance.now();phaseGapMilliseconds=Math.max(phaseGapMilliseconds,now-phaseLastPulse);phaseLastPulse=now;},8);
	try {
		/** @type {CacheData} */ let phases;
		try {phases=await prepareShellMiePhase(preparation.domains,'/phase-worker.js');}
		finally {phaseGapMilliseconds=Math.max(phaseGapMilliseconds,performance.now()-phaseLastPulse);clearInterval(phasePulse);}
		const capabilityBackend=new ThreeCacheBackend({THREE,renderer}),capabilities=capabilityBackend.capabilities;capabilityBackend.dispose();
		/** Derive a developmental complete construction identity from actual prepared owners.
		 * @param {LocalSunRotationRecipe} placed - Complete physical replacement controls.
		 * @returns {string} - Canonical identity, with horizontal placement excluded only developmentally.
		 */
		const identify=placed=>{
			const identityOwners=createOwners(placed,0),source=identityOwners.source.configuration;
			try {return 'developmental-shell:'+CanonicalValueHash.sha256Value({schema:'shell-application-field-identity-v1',source:{...source,position:{...source.position,coordinates:[0,0,source.position.coordinates[2]]}},
				atmosphere:{...CANONICAL_ATMOSPHERE_CONSTANTS,mieSingleScatteringAlbedo:placed.shellMieAlbedo ?? CANONICAL_ATMOSPHERE_CONSTANTS.mieSingleScatteringAlbedo},ground:'black-flat-vacuum-cylinder-v1',layout:placed.shellLayout,execution:placed.state.execution,
				incoming:placed.shellIncoming,outgoing:identityOwners.domains.outgoingDirectionDomain.id,phase:phases.contentHash,transport:'column48-tail64',runtime:'analytic-columns-positive-column15-v1',format:'R32F',units:'meters-Native15',capabilities,implementation:placed.shellImplementationIdentity});}
			finally {identityOwners.facade.dispose();}
		};
		const cacheIdentity=identify(recipe);
		const initialBounds=shellResourceBounds(recipe,phases);
		const {retainedCacheBytes,peakBuildBytes}=initialBounds;
		const poses=recipe.shellPoses ?? recipe.angles.map(degrees=>({degrees,offset:/** @type {[number,number]} */([0,0]),key:degrees}));
		/** @type {{pose:{degrees:number,offset:readonly [number,number],key:number},placed:LocalSunRotationRecipe,label:string}[]} */
		const requests=poses.map(pose=>({pose,placed:{...recipe,shellPlacementOffset:pose.offset},label:'horizontal-placement'}));
		if(recipe.shellTemporalStates) {
			if(!recipe.shellTemporalMode || recipe.shellLifecycle || recipe.shellReplacements || recipe.shellCoverageExit)throw new Error('Temporal execution has a separate exact-state inventory.');
			requests.splice(0,requests.length,...recipe.shellTemporalStates.map(sample=>({pose:{degrees:0,offset:/** @type {[number,number]} */([0,0]),key:sample.slot},placed:{...recipe,state:sample.state},label:`exact-time-slot-${sample.slot}`})));
		}
		if(recipe.shellReplacements) {
			const height=recipe.shellLayout.height+10000,coordinates=recipe.state.geometry.sourcePosition.coordinates;
			const elevated={...recipe,shellLayout:rebuildShellLayout(recipe.state,recipe.shellLayout,height,recipe.shellLayout.maximumRho),
				state:{...recipe.state,geometry:{...recipe.state.geometry,localLightSourceHeight:{value:height,units:/** @type {const} */('meters')},sourcePosition:{...recipe.state.geometry.sourcePosition,coordinates:/** @type {UnitVector3} */([coordinates[0],coordinates[1],height])}}}};
			const atmosphere={...recipe,shellMieAlbedo:CANONICAL_ATMOSPHERE_CONSTANTS.mieSingleScatteringAlbedo*.9};
			const power={...recipe,state:{...recipe.state,source:{...recipe.state.source,referenceSpectralIncidentScale:recipe.state.source.referenceSpectralIncidentScale*1.1}}};
			for(const [index,item] of [{placed:elevated,label:'source-height-plus-10000m'},{placed:atmosphere,label:'mie-albedo-times-0.9'},{placed:power,label:'source-power-times-1.1'}].entries())requests.push({...item,pose:{degrees:0,offset:[0,0],key:2000+index}});
		}
		let coverageExit=null;
		if(recipe.shellCoverageExit) {
			if(recipe.shellReplacements || recipe.shellLifecycle)throw new Error('Coverage-exit proof owns a separate replacement inventory.');
			requests.push({pose:{degrees:0,offset:[0,0],key:3000},placed:{...recipe,shellObserverOffset:[100,-50]},label:'observer-movement-within-coverage'});
			const source=recipe.state.geometry.sourcePosition.coordinates,observer=recipe.state.geometry.observerPosition.coordinates;
			const outside=recipe.shellLayout.maximumRho+1000;
			let oldQueryRejected='';try {shellStencil(recipe.shellLayout,outside,observer[2]);}catch(error){oldQueryRejected=String(error);}
			if(!oldQueryRejected)throw new Error('Coverage exit did not reject the old compact stencil.');
			const offset=/** @type {[number,number]} */([source[0]+outside-observer[0],source[1]-observer[1]]);
			const maximumRho=Math.ceil((outside+recipe.state.geometry.sceneSkyRayLimit.value+1000)/1000)*1000;
			const replacementLayout=rebuildShellLayout(recipe.state,recipe.shellLayout,recipe.shellLayout.height,maximumRho);
			coverageExit={oldMaximumRho:recipe.shellLayout.maximumRho,observerRho:outside,newMaximumRho:maximumRho,oldQueryRejected,omittedBands:replacementLayout.omittedBands,
				claim:'Complete viewing reach is admitted by a new physical cylinder and compact field layout; independent accuracy of this larger domain remains a separate gate.'};
			requests.push({pose:{degrees:0,offset:[0,0],key:3001},placed:{...recipe,shellObserverOffset:offset,shellLayout:replacementLayout},label:'observer-coverage-exit-fresh-domain'});
		}
		for(const {pose,placed,label} of requests) {
			console.log(`P4 shell exact-state publication ${pose.key}: rotation ${pose.degrees}, XY +${pose.offset}`);
			const physicalCacheIdentity=identify(placed);
			const requestedCacheIdentity=physicalCacheIdentity+(recipe.shellTemporalMode==='fresh' ? `:forced-fresh-instance-${pose.key}` : ''),identity=requestedCacheIdentity+':frame:'+CanonicalValueHash.sha256Value({pose,observation:placed.state.observation});
			const requestedBounds=shellResourceBounds(placed,phases);
			const requestedRetained=requestedBounds.retainedCacheBytes,requestedPeak=requestedBounds.peakBuildBytes;
			const prior=publication.active,started=performance.now();
			const preserved=publication.acquireFrame.bind(publication),oldLease=prior ? preserved() : null;
			if(prior?.scene)prior.scene.suspend();
			let stayedComplete=true;
			let lastPulse=started,maximumResponsivenessGapMilliseconds=0;
			const pulse=setInterval(()=>{const now=performance.now();maximumResponsivenessGapMilliseconds=Math.max(maximumResponsivenessGapMilliseconds,now-lastPulse);lastPulse=now;if(publication.active!==prior)stayedComplete=false;},8);
			/** @type {LocalSunShellPublishedFrame|null} */ let frame=null;
			try {frame=await publication.request({identity,cacheIdentity:requestedCacheIdentity,retainedCacheBytes:requestedRetained,peakBuildBytes:requestedPeak,otherPersistentBytes:requestedBounds.otherPersistentBytes,
				prepare:context=>prepareShellApplicationFrame(placed,pose.degrees,renderer,phases,context,{identity,cacheIdentity:requestedCacheIdentity},backend=>resourceProof.attach(backend))});}
			finally {maximumResponsivenessGapMilliseconds=Math.max(maximumResponsivenessGapMilliseconds,performance.now()-lastPulse);clearInterval(pulse);if(!frame){prior?.scene?.resume();oldLease?.release();}}
			const preparedMilliseconds=performance.now()-started;
			if(!stayedComplete)throw new Error('Staging changed the previous published frame before complete preparation.');
			let preservedPixelsBitIdentical=null;
			if(oldLease) {if(oldLease.frame.renderScene){oldLease.frame.renderScene();gl.finish();preservedPixelsBitIdentical=await shellApplicationImage(canvas)===displayedImage;if(!preservedPixelsBitIdentical)throw new Error('Suspended scene changed the previous complete displayed pixels.');}else oldLease.frame.viewPass.render(renderer,null,{texture:black});gl.finish();oldLease.release();}
			if(!(frame.backend instanceof ThreeCacheBackend))throw new Error('Unexpected application backend.');
			const binding=frame.cache.getRuntimeBindings().bindings.find(binding=>binding.valueKey==='cache.cumulativeScatteringDensity');
			if(!binding)throw new Error('Missing complete field binding.');
			if(readbackIdentity!==requestedCacheIdentity) {canonicalField=null;canonicalField=await frame.backend.readRuntimeBindingField(binding);readbackIdentity=requestedCacheIdentity;}
			const rays=cpuRays(frame.owners,canonicalField,directions),gpu=await gpuRays({owners:frame.owners,cache:frame.cache,backend:frame.backend,renderer,directions});
			if(pose.key===0)baselineRadiances=gpu.map(ray=>[...ray.radiance]);
			const powerLinearity=label==='source-power-times-1.1' && baselineRadiances ? residual(gpu.flatMap(ray=>ray.radiance),baselineRadiances.flat().map(value=>value*1.1),1e-9,.0001) : null;
			if(powerLinearity?.failures)throw new Error('Source-power replacement failed the independent linearity invariant.');
			if(frame.renderScene){renderer.shadowMap.needsUpdate=true;frame.renderScene();}else{frame.viewPass.renderToScreen=true;frame.viewPass.render(renderer,null,{texture:black});}gl.finish();
			const warmFrameMilliseconds=[];
			if(recipe.shellTemporalStates && (pose.key===60 || recipe.shellTemporalStates.length===2 && pose.key===0)) {
				for(let repetition=0;repetition<8;repetition++) {
					const tick=performance.now();
					if(frame.renderScene)frame.renderScene();else frame.viewPass.render(renderer,null,{texture:black});
					gl.finish();if(repetition>0)warmFrameMilliseconds.push(performance.now()-tick);
				}
			}
			const image=await shellApplicationImage(canvas);displayedImage=image;await emit(`angle-${pose.key}-application.png`,{dataUrl:image});
			const entry={degrees:pose.degrees,artifactKey:pose.key,translationMeters:pose.offset,label,identity,cacheIdentity:requestedCacheIdentity,physicalCacheIdentity,observation:placed.state.observation,source:frame.source,receiver:frame.receiver,directionToSource:frame.directionToSource,
				preparedMilliseconds,stageMilliseconds:frame.stageMilliseconds,warmFrameMilliseconds,maximumResponsivenessGapMilliseconds,powerLinearity,preservedPixelsBitIdentical,resourceBounds:requestedBounds,scene:frame.scene?.describe(),webglResources:webglResources.snapshot(false),measuredGpuPackets:gpu.map(ray=>({radiance:ray.radiance,transmittance:ray.transmittance})),shaderIdentities:frame.shaderIdentities,reused:prior?.cache===frame.cache,previousCompleteDuringPreparation:stayedComplete,resources:publication.resources.size,retainedCacheBytes:requestedRetained,peakAdmittedBytes:publication.peakAdmittedBytes,
				cpuGpu:residual(gpu.flatMap(ray=>ray.radiance),rays.flatMap(ray=>ray.radiance),1e-9,.002),transmission:residual(gpu.flatMap(ray=>ray.transmittance),rays.flatMap(ray=>ray.transmittance),1e-7,.002),
				coverage:rayCoverage(frame.owners,rays),endpointMaximumMeters:Math.max(...gpu.map((ray,index)=>Math.abs(ray.end-rays[index].segment.endDistance.value))),
				claim:'Actual GPU prepared publication and exact-state CPU/GPU checks. Developmental placement identity, no independent physical or resource/negative-lifecycle qualification. PNG shows the one published application frame.'};
			await emit(`angle-${pose.key}.json`,entry);results.push(entry);
		}
		const lifecycle=[];
		if(recipe.shellLifecycle) {
			if(recipe.shellReplacements)throw new Error('Replacement and negative lifecycle proofs use separate resource inventories.');
			const snapshot=publication.acquireFrame(),previous=snapshot.frame;
			if(previous.scene)previous.scene.suspend();
			const renderSnapshot=async()=>{if(previous.renderScene)previous.renderScene();else{previous.viewPass.renderToScreen=true;previous.viewPass.render(renderer,null,{texture:black});}gl.finish();if(previous.renderScene && await shellApplicationImage(canvas)!==displayedImage)throw new Error('Lifecycle changed the renderer-leased complete scene pixels.');};
			/** @type {{mode:string,observed:string,preserved:boolean,resources:number}[]} */ const cases=[];
			for(const mode of ['compile-failure','caller-cancel','resource-reject']) {
				console.log(`P4 shell lifecycle: ${mode}`);
				const cancellation=new AbortController(),nextKey=cacheIdentity+':deliberate-'+mode;
				let observed='',hookCalled=false;
				try {
					await publication.request({identity:nextKey+':frame',cacheIdentity:nextKey,retainedCacheBytes,peakBuildBytes:mode==='resource-reject' ? 1200000001 : peakBuildBytes,otherPersistentBytes:initialBounds.otherPersistentBytes,signal:cancellation.signal,
						prepare:context=>prepareShellApplicationFrame(recipe,0,renderer,phases,context,{identity:nextKey+':frame',cacheIdentity:nextKey},backend=>{
							resourceProof.attach(backend);
							hookCalled=true;
							if(mode==='compile-failure')backend.compile=()=>{throw new Error('Deliberate experiment GPU compile failure.');};
							else {const submit=backend.submitLayer.bind(backend);backend.submitLayer=request=>{submit(request);cancellation.abort(new DOMException('Deliberate caller cancellation after GPU submission.','AbortError'));};}
						})});
				} catch(error){observed=String(error);}
				const preserved=publication.active===previous && publication.resources.size===1 && (mode!=='resource-reject' ? hookCalled : !hookCalled);
				if(!observed || !preserved)throw new Error(`Shell lifecycle ${mode} did not preserve the prior complete frame.`);
				await renderSnapshot();cases.push({mode,observed,preserved,resources:publication.resources.size});
			}
			lifecycle.push(...cases);
			console.log('P4 shell lifecycle: superseded GPU build');
			const staleKey=cacheIdentity+':deliberate-supersession',replacementIdentity=cacheIdentity+':newer-frame';
			/** @type {Promise<LocalSunShellPublishedFrame>|null} */ let replacement=null;
			let superseded='',priorStayedComplete=false;
			try {
				await publication.request({identity:staleKey+':frame',cacheIdentity:staleKey,retainedCacheBytes,peakBuildBytes,otherPersistentBytes:initialBounds.otherPersistentBytes,
					prepare:context=>prepareShellApplicationFrame(recipe,0,renderer,phases,context,{identity:staleKey+':frame',cacheIdentity:staleKey},backend=>{
						resourceProof.attach(backend);
						const submit=backend.submitLayer.bind(backend);let requested=false;
						backend.submitLayer=request=>{
							submit(request);
							if(!requested) {
								requested=true;priorStayedComplete=publication.active===previous;
									replacement=publication.request({identity:replacementIdentity,cacheIdentity,retainedCacheBytes,peakBuildBytes,otherPersistentBytes:initialBounds.otherPersistentBytes,
									prepare:next=>prepareShellApplicationFrame(recipe,17,renderer,phases,next,{identity:replacementIdentity,cacheIdentity})});
								void replacement.catch(()=>{});
							}
						};
					})});
			} catch(error){superseded=String(error);}
			if(!replacement || !superseded || !priorStayedComplete)throw new Error('Supersession did not cancel staging while preserving the previous complete frame.');
			const newest=await replacement;
			if(publication.active!==newest || newest.identity!==replacementIdentity || newest.cache!==previous.cache || publication.resources.size!==1)throw new Error('Supersession failed to publish the compatible newest complete frame.');
			await renderSnapshot();
			lifecycle.push({mode:'superseded-GPU-build',observed:superseded,preserved:true,resources:publication.resources.size});
			publication.dispose();await publication.tail;
			if(publication.active!==null || publication.resources.size!==1)throw new Error('Disposal retired a renderer-leased frame too early.');
			await renderSnapshot();snapshot.release();snapshot.release();
			if(Array.from(publication.resources.keys()).length!==0 || publication.cleanupErrors.length)throw new Error('Final application resource cleanup failed.');
			lifecycle.push({mode:'disposal-with-live-frame-lease',preserved:true,resources:0,observed:'Renderer snapshot survived owner disposal; final idempotent release retired the fields.'});
		}
		const debug=gl.getExtension('WEBGL_debug_renderer_info'),errors=[];
		for(let error=gl.getError();error!==gl.NO_ERROR;error=gl.getError())errors.push(error);
		if(errors.length)throw new Error(`Shell application GL errors ${errors}`);
		const resourceInventoryBeforeDisposal=resourceProof.snapshot();
		publication.dispose();await publication.tail;
		const resourceInventory=resourceProof.snapshot();
		if(resourceInventory.fields!==0 || resourceInventory.data!==0)throw new Error('Observed backend resources survived final frame release.');
		if(!(phases.values instanceof Float32Array))throw new Error('Transferred phase allocation identity changed.');
		const glInventory=webglResources.snapshot(),maximumNodes=Math.max(...requests.map(request=>request.placed.shellLayout.nodes.length));
		const applicationPayloadUpperBytes=glInventory.peak+Math.max(...resourceInventory.events.map(event=>event.data))+phases.values.byteLength+2*maximumNodes*320+3000000;
		if(applicationPayloadUpperBytes>1200000000)throw new Error('Observed GL plus conservative host application payload exceeded the unchanged logical ceiling.');
		return JSON.stringify({schema:'local-sun-shell-application-v1',results,lifecycle,coverageExit,phaseGapMilliseconds,resourceInventory,resourceInventoryBeforeDisposal,webglResources:glInventory,sharedHostPhaseBytes:phases.values.byteLength,
			applicationPayload:{upperBytes:applicationPayloadUpperBytes,maximumBytes:1200000000,qualified:applicationPayloadUpperBytes<=1200000000,operation:'Sum independent GL peak, maximum transient backend host program-data copy, one shared host phase, two conservatively bounded cache-support host payloads and 3 MB geometry/global numeric payload. Separate maxima overestimate concurrency.',limitations:'Logical numeric application payload; full diagnostic field readbacks, JS object overhead, compiled driver programs and physical VRAM are excluded and not claimed below this ceiling.'},hardware:String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)),glErrors:errors,cleanupErrors:publication.cleanupErrors,
			claim:'Actual GPU application publication, exact-state ray parity and the explicitly listed lifecycle cases. Physical selection, successful physical replacement, full resource admission and temporal qualification remain open.'});
	} finally {clearInterval(phasePulse);publication.dispose();await publication.tail;preparation.facade.dispose();black.dispose();renderer.dispose();renderer.forceContextLoss();}
}

bridge.localSunRotation = runRotation;
