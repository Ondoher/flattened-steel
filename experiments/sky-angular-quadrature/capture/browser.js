import {Flat32Application} from '../../../src/flat32/Flat32Application.js';
import {Algorithm32Runtime} from '../../../src/flat32/Algorithm32Runtime.js';
import {SphericalDistantMode} from '../../../src/flat32/SphericalDistantMode.js';
import {LocationTimeController} from '../../../src/flat32/LocationTimeController.js';
import {createDistantSunSceneState} from '../../../src/flat32/DistantSunSceneState.js';
import {createDistantSunSceneCacheHttpResolver} from '../../../src/flat32/DistantSunSceneCacheResolver.js';
import {loadBrightest2000StellarCatalogPackage} from '../../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from '../../../src/flat32/HumanVisionFilterPackageLoader.js';
import {ATMOSPHERE_OBSERVER_HEIGHT, ATMOSPHERE_OBSERVER_UP_DIRECTION} from '../../../src/flat32/consts.js';
import {registry} from '@polylith/core';
import {compileDistantSunSceneCacheWavelength} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as domain} from '../../../src/algorithm32/sampling-domains/index.js';
import PacketLayout from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePacketLayout.js';

/** Reject a missing capture requirement. @param {unknown} value @param {string} message @returns {asserts value} */
function requireValue(value, message) {
	if (!value) throw new Error(message);
}

/** Identify exact browser bytes. @param {Uint8Array} bytes @returns {Promise<string>} */
async function digest(bytes) {
	const copy = Uint8Array.from(bytes);
	return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', copy.buffer)), (x) =>
		x.toString(16).padStart(2, '0'),
	).join('');
}

/** Wait for two complete ordinary animation frames. @returns {Promise<void>} */
async function frames() {
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/** Publish capture diagnostics through the contained host element. @param {string} state @param {unknown} facts */
function publish(state, facts) {
	const element = document.getElementById('capture-result');
	requireValue(element instanceof HTMLElement, 'Capture result element is missing.');
	element.textContent = JSON.stringify(facts);
	element.dataset.state = state;
}

/** Exercise unchanged production rendering and a separate candidate atlas, never replace deployed assets.
 * @returns {Promise<void>} Published failure or matched noon images; owned candidate resources retire on unload.
 */
async function main() {
	/** @type {Flat32Application | undefined} */ let application;
	/** @type {CachePersistentArray | undefined} */ let candidateArray;
	try {
		/** @type {AngularHorizonControl} */ const control = await (await fetch('/comparison-control')).json();
		await registry.start();
		const controller = new LocationTimeController();
		let selected = controller.start();
		for (let i = 0; i < 2; i++) selected = controller.nextLocation(selected);
		selected = controller.selectGlobeTime(selected, 1);
		requireValue(
			selected.locationLabel === 'San Jose' && selected.timeLabel === 'Solar noon',
			'Wrong noon preset.',
		);
		const placement = createDistantSunSceneState({
			observation: selected.observation,
			observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
		const sun = placement.geometry.expressCelestialDirectionInScene(placement.directionToSourceModel);
		const horizontal = Math.hypot(sun[0], sun[2]),
			pitch = (5 * Math.PI) / 180;
		// Cross-Sun heading keeps the finite Sun out of the horizon diagnostic.
		const direction = /** @type {UnitVector3} */ ([
			(-sun[2] / horizontal) * Math.cos(pitch),
			Math.sin(pitch),
			(sun[0] / horizontal) * Math.cos(pitch),
		]);
		const catalog = await loadBrightest2000StellarCatalogPackage(),
			vision = await loadHumanVisionFilterPackage();
		const root = document.getElementById('main-content');
		requireValue(root, 'Capture host root missing.');
		application = new Flat32Application(root, {
			initialModeKind: 'spherical-distant',
			cameraFieldOfViewDegrees: (2 * Math.atan(Math.tan(Math.PI / 6) / (4 / 3)) * 180) / Math.PI,
			cameraDirectionScene: direction,
			reviewObjectsEnabled: true,
			stellarCatalog: 'brightest-2000',
			brightest2000StellarCatalogDefinition: catalog,
			scotopicLuminanceWeights: vision.scotopicLuminanceWeights,
			presentationFilters: [
				{
					id: 'human-mesopic-luminance-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumRodContribution: 0.5},
				},
				{
					id: 'human-low-light-chroma-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumChromaRetention: 0.65},
				},
			],
			resolveDistantSunSceneCacheAsset: createDistantSunSceneCacheHttpResolver(),
		});
		const app = application;
		window.addEventListener(
			'beforeunload',
			() => {
				app.dispose();
				candidateArray?.dispose();
			},
			{once: true},
		);
		application.start();
		/** Await the exact complete production publication. @param {boolean} exact @returns {Promise<void>} */
		async function ready(exact) {
			const deadline = performance.now() + 180000;
			while (performance.now() < deadline) {
				const shell = document.querySelector('.flat32-shell'),
					canvas = document.getElementById('flat32-canvas');
				requireValue(
					shell instanceof HTMLElement && canvas instanceof HTMLCanvasElement,
					'Application elements missing.',
				);
				requireValue(!['failed', 'atmosphere-failed'].includes(shell.dataset.flat32State), shell.textContent);
				if (
					shell.dataset.flat32State === 'ready' &&
					canvas.dataset.flat32StellarGenerationCompletion === 'complete' &&
					(!exact || app._publishedState?.observation.instant === selected.observation.instant)
				)
					return;
				await new Promise((resolve) => setTimeout(resolve, 250));
			}
			throw new Error('Production publication exceeded its three-minute allocation.');
		}
		/** Dispatch a normal production UI handler. @param {string} selector */
		function click(selector) {
			const button = document.querySelector(selector);
			requireValue(button instanceof HTMLButtonElement, 'Missing UI control.');
			button.click();
		}
		await ready(false);
		click('#flat32-location-control');
		click('#flat32-location-control');
		click('button[data-flat32-globe-time="1"]');
		await ready(true);
		await frames();
		const runtime = /** @type {Algorithm32Runtime} */ (app._modeController._activeRuntime);
		const attachment = /** @type {SphericalDistantMode} */ (runtime._mode).lightSource.sharedCacheAttachment;
		requireValue(
			attachment?._active && attachment._controller._published?.atlas,
			'Production shared atlas missing.',
		);
		const facade = attachment._active,
			originalFrame = attachment._controller._published,
			atlas = originalFrame.atlas;
		const required = new Set(originalFrame.snapshot.requiredBlockIds);
		const slots = atlas.getSlots().filter((slot) => required.has(slot.block.id));
		requireValue(
			slots.length === required.size && slots.every((s) => s.lease),
			'Incomplete required production atlas.',
		);
		const scene = app._sceneRuntime,
			canvas = scene.canvas,
			gl = canvas.getContext('webgl2');
		requireValue(
			gl && gl.getError() === gl.NO_ERROR && canvas.width === 1024 && canvas.height === 768,
			'Production render facts failed.',
		);
		const shell = document.querySelector('.flat32-shell');
		requireValue(shell instanceof HTMLElement, 'Application shell missing.');
		const facts = {
			observation: selected.observation,
			solarZenithDegrees: placement.solarZenithDegrees,
			camera: {
				horizontalFovDegrees: 60,
				pitchDegrees: 5,
				headingFromSunDegrees: 90,
				direction,
				verticalFovDegrees: scene.camera.fov,
				aspect: scene.camera.aspect,
			},
			viewport: {width: canvas.width, height: canvas.height},
			shell: {...shell.dataset},
			canvas: {...canvas.dataset},
			requiredBlocks: slots.map((s) => ({
				id: s.block.id,
				slot: s.index,
				rows: s.block.rowCount,
				decodedSha256: s.block.decoded.sha256,
			})),
			comparison:
				'Same production renderer, geometry, Q30 lookup, receiver lighting and P2 display state; only atmospheric cache values change.',
		};
		publish('production-ready', facts);
		const trigger = document.getElementById('candidate-trigger');
		requireValue(trigger instanceof HTMLButtonElement, 'Candidate trigger missing.');
		trigger.addEventListener(
			'click',
			() => {
				void candidate().catch((error) => publish('failed', {failure: String(error)}));
			},
			{once: true},
		);

		/** Compile the adapted rule on production Native15/Native48 controls and render its own atlas.
		 * @returns {Promise<void>} Complete candidate or preserved failed evidence; no production atlas overwrite.
		 */
		async function candidate() {
			const started = performance.now();
			const computeCanvas = document.createElement('canvas'),
				compute = computeCanvas.getContext('webgl2', {powerPreference: 'high-performance'});
			requireValue(compute, 'WebGL2 compiler unavailable.');
			const debug = compute.getExtension('WEBGL_debug_renderer_info');
			const renderer = String(compute.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : compute.RENDERER));
			requireValue(
				!/swiftshader|llvmpipe|software rasterizer/i.test(renderer),
				'Hardware GPU required for this capture.',
			);
			const layout = new PacketLayout();
			const first = new Uint16Array(domain.uniqueDirectionCount).fill(65535);
			domain.logicalToUniqueDirectionIndices.forEach((unique, logical) => {
				if (first[unique] === 65535) first[unique] = logical;
			});
			const coordinates = slots.flatMap((slot) =>
				slot.block.coordinates.flatMap(([altitude, zenith]) =>
					Array.from(first, (x) => ({x, y: zenith * 48 + altitude})),
				),
			);
			const packets = slots.map(() => new Float32Array(648 * 1728 * 4));
			const baselines = slots.map((slot) => slot.lease.packet.values);
			const samples = slots.flatMap((slot, b) =>
				slot.block.coordinates.map((_, row) => ({b, row, unique: Math.floor(domain.uniqueDirectionCount / 2)})),
			);
			const sampleCoordinates = samples.map(({b, row, unique}) => ({
				x: first[unique],
				y: slots[b].block.coordinates[row][1] * 48 + slots[b].block.coordinates[row][0],
			}));
			/** Send monitorable compute progress. @param {string} message @param {number} completed */
			async function progress(message, completed) {
				const response = await fetch('/progress', {
					method: 'POST',
					headers: {'content-type': 'application/json'},
					body: JSON.stringify({message, completed, total: 16}),
				});
				requireValue(response.ok, 'Capture host rejected progress.');
			}
			/** Compile one complete N4 channel with exact ordered Float32 accumulation. @param {DistantSunSceneCacheCompilerBuildRequest} request @param {number} channel @param {readonly DistantSunSceneCacheCompilerProbeCoordinate[]} points @returns {Promise<Float32Array>} */
			async function compile(request, channel, points) {
				const total = new Float32Array(points.length);
				let order = 0;
				await compileDistantSunSceneCacheWavelength({
					gl: compute,
					buildRequest: request,
					wavelengthIndex: channel,
					fieldProbeCoordinates: Object.fromEntries(['J1', 'J2', 'J3', 'J4'].map((id) => [id, points])),
					onFieldProbes: async ({fieldId, values}) => {
						if (fieldId.startsWith('L')) {
							requireValue(values.length === 0, 'Unexpected transport probes.');
							return;
						}
						requireValue(
							fieldId === `J${++order}` && values.length === points.length,
							'Changed pure-order callback.',
						);
						for (let i = 0; i < values.length; i++) {
							requireValue(
								values[i].x === points[i].x && values[i].y === points[i].y,
								'Probe order changed.',
							);
							total[i] = Math.fround(total[i] + values[i].value);
						}
					},
					reportProgress: async (stage) => {
						requireValue(performance.now() - started < 600000, 'GPU comparison exceeded ten minutes.');
						await progress(stage, channel + 1);
					},
				});
				requireValue(order === 4, 'Incomplete N4 compile.');
				return total;
			}
			try {
				await progress('Verify a fresh F68 channel against deployed production values.', 0);
				const base = await compile(control.baseline, 7, sampleCoordinates);
				let maximumRelative = 0,
					maximumAbsolute = 0;
				for (let i = 0; i < samples.length; i++) {
					const s = samples[i],
						address = layout.resolveDestination(7, s.row, first[s.unique], 0),
						expected = baselines[s.b][(address.y * 648 + address.x) * 4 + address.component];
					maximumAbsolute = Math.max(maximumAbsolute, Math.abs(base[i] - expected));
					maximumRelative = Math.max(
						maximumRelative,
						Math.abs(base[i] - expected) / Math.max(1e-12, Math.abs(expected)),
					);
				}
				requireValue(
					maximumRelative <= 0.0001,
					'Fresh F68 compiler differs from deployed cache beyond the registered parity allowance.',
				);
				const channelReports = [];
				for (let channel = 0; channel < 15; channel++) {
					const total = await compile(control.candidate, channel, coordinates);
					let cursor = 0;
					for (let b = 0; b < slots.length; b++)
						for (let row = 0; row < slots[b].block.rowCount; row++) {
							for (let logical = 0; logical < domain.directionCount; logical++) {
								const value = total[cursor + domain.logicalToUniqueDirectionIndices[logical]],
									address = layout.resolveDestination(channel, row, logical, 0);
								requireValue(
									Number.isFinite(value) && value >= 0,
									'Candidate cache contains invalid radiance density.',
								);
								packets[b][(address.y * 648 + address.x) * 4 + address.component] = value;
							}
							cursor += domain.uniqueDirectionCount;
						}
					channelReports.push({channel, sha256: await digest(new Uint8Array(total.buffer))});
					await progress(`Candidate spectrum ${channel + 1}/15 completed.`, channel + 2);
				}
				const backend = attachment._backend;
				candidateArray = backend.allocatePersistentArray({
					id: 'angular-noon-candidate',
					valueKey: 'cache.sharedPacketAtlas',
					storage: atlas.array.storage,
					maximumBytes: atlas.array.byteLength,
				});
				const packetReports = [];
				for (let b = 0; b < slots.length; b++) {
					const hash = await digest(new Uint8Array(packets[b].buffer));
					backend.uploadPersistentArrayLayer({
						array: candidateArray,
						layer: slots[b].index,
						identity: hash,
						values: packets[b],
					});
					packetReports.push({slot: slots[b].index, sha256: hash});
				}
				// The contained caller borrows unchanged row/address metadata and publishes only its separately owned array.
				facade.publish({
					...originalFrame,
					atlas: undefined,
					snapshot: {...originalFrame.snapshot, generation: originalFrame.snapshot.generation + 1000000},
					bindings: [candidateArray.runtimeBinding, ...originalFrame.bindings.slice(1)],
				});
				await frames();
				requireValue(
					gl.getError() === gl.NO_ERROR && canvas.dataset.flat32RenderPath === 'algorithm32',
					'Candidate production render failed.',
				);
				publish('candidate-ready', {
					...facts,
					renderer,
					elapsedMilliseconds: performance.now() - started,
					parity: {samples: samples.length, channel: 7, maximumRelative, maximumAbsolute},
					channelReports,
					packetReports,
					logicalCandidateAtlasBytes: candidateArray.byteLength,
					candidateProfile:
						'production Native48/Native15/15 transport intervals, horizon2048 incoming only; distinct from paper Native51/Direct40 score profile',
				});
			} finally {
				compute.getExtension('WEBGL_lose_context')?.loseContext();
			}
		}
	} catch (error) {
		application?.dispose();
		candidateArray?.dispose();
		publish('failed', {failure: String(error)});
	}
}
void main();
