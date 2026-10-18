import {packetProof} from './packet-proof.js';
import {compileDistantSunSceneCacheWavelength as compileCandidate} from './compiler.js';
import {compileDistantSunSceneCacheWavelength as compileOriginal} from './original-compiler.js';
import {setTorontoMaterial} from '../distant-horizon/toronto-phase.js';
import {lookupProof} from './proof.js';
import {warp} from '../outgoing-focus/geometry.mjs';
import {outgoingStencil,solarCubic} from '../numerics/math.js';
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
		/** @type {any} */ const control = await (await fetch('/comparison-control')).json();
        if(control.material)setTorontoMaterial(control.material);
		const proof=await lookupProof();if(control.scene==='proof'){publish('proof-ready',proof);return;}
 requireValue(JSON.stringify(control.observation)!=='undefined','Frozen observation missing');
		await registry.start();
		const controller = new LocationTimeController();
		let selected = controller.start();
		for (let i = 0; i < 2; i++) selected = controller.nextLocation(selected);
		selected = controller.selectGlobeTime(selected, control.scene==='noon'?1:2);
 if(control.scene==='twilight'||control.scene==='twilight60')selected=controller.adjustGlobeMinuteOffset(selected,control.scene==='twilight60'?60:30);
		requireValue(
			selected.locationLabel === 'San Jose',
			'Wrong location preset.',
		);
requireValue(selected.observation.instant===control.observation.instant,'Scene instant differs from frozen manifest');
		const placement = createDistantSunSceneState({
			observation: selected.observation,
			observerHeight: ATMOSPHERE_OBSERVER_HEIGHT,
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
		const sun = placement.geometry.expressCelestialDirectionInScene(placement.directionToSourceModel);
		const horizontal = Math.hypot(sun[0], sun[2]),
			pitch = (5 * Math.PI) / 180;
		// Away-Sun heading matches the horizon-probe direction.
		const direction = /** @type {UnitVector3} */ ([
			(-sun[0] / horizontal) * Math.cos(pitch),
			Math.sin(pitch),
			(-sun[2] / horizontal) * Math.cos(pitch),
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
app._commitLocationTimeState(selected);
		await ready(true);
		await frames();
		const runtime = /** @type {Algorithm32Runtime} */ (app._modeController._activeRuntime);
		const attachment = /** @type {SphericalDistantMode} */ (runtime._mode).lightSource.sharedCacheAttachment;
		requireValue(
			attachment?._active && attachment._controller._published?.atlas,
			'Production shared atlas missing.',
		);
		const facade = /** @type {any} */(attachment._active),
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
 buildTimings:[],uploadTimings:[],
			proof,scene:control.scene,
			observation: selected.observation,
			solarZenithDegrees: placement.solarZenithDegrees,
			camera: {
				horizontalFovDegrees: 60,
				pitchDegrees: 5,
				headingFromSunDegrees: 180,
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
				'Same scene, physical controls, Q30, lighting and display; Corrected60 versus Focused60 changes outgoing construction and lookup together.',
		};
        /** Capture a fixed camera and warmed GPU timing; host owns screenshots.
         * @param {number} heading @returns {Promise<any>}
         */
        async function view(heading){
          const angle=heading*Math.PI/180,x=sun[0]/horizontal,z=sun[2]/horizontal;
          const d=[(x*Math.cos(angle)+z*Math.sin(angle))*Math.cos(pitch),Math.sin(pitch),(z*Math.cos(angle)-x*Math.sin(angle))*Math.cos(pitch)];
          scene.camera.lookAt(scene.camera.position.x+d[0],scene.camera.position.y+d[1],scene.camera.position.z+d[2]);
          const owned=/** @type {any} */(scene);cancelAnimationFrame(owned._frameRequest);owned._frameRequest=null;owned._frameCadence='manual';
          for(let i=0;i<5;i++){owned._renderFrame();await frames();}
          let extension=gl.getExtension('EXT_disjoint_timer_query_webgl2');const gpu=[],cpu=[];let timerUnavailable=null;
          for(let i=0;i<12;i++){
            const q=extension?gl.createQuery():null;if(q)gl.beginQuery(extension.TIME_ELAPSED_EXT,q);
            const t=performance.now();owned._renderFrame();cpu.push(performance.now()-t);if(q){gl.endQuery(extension.TIME_ELAPSED_EXT);gl.flush();}
            if(q){const deadline=performance.now()+1000;while(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&performance.now()<deadline)await new Promise(r=>setTimeout(r,10));if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)||gl.getParameter(extension.GPU_DISJOINT_EXT)){timerUnavailable='GPU query unavailable/disjoint within1second; CPU submit time is not GPU time.';extension=null;}else gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
            await frames();
          }
          owned._renderFrame();await frames();
          requireValue(gl.getError()===gl.NO_ERROR&&canvas.dataset.flat32RenderPath==='algorithm32','Invalid render.');
          const points=[[512,100],[512,400],[512,445],[100,445],[900,445]],pixels=[];
          // Screen pixels are captured by the host; these coordinates register report photometry.
          for(const [x,y]of points)pixels.push({x,y});
          return {heading,direction:d,observation:selected.observation,solarZenithDegrees:placement.solarZenithDegrees,viewport:{width:1024,height:768},horizontalFovDegrees:60,pitchDegrees:5,display:canvas.dataset.flat32ColorDisplay,gpuMilliseconds:gpu,cpuSubmitMilliseconds:cpu,timerUnavailable,pixelCoordinates:pixels};
        }
        globalThis['__h62View']=view;
		publish('production-ready', facts);
cancelAnimationFrame(/** @type {any} */(scene)._frameRequest);/** @type {any} */(scene)._frameCadence='manual';
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
			const rowOffsets = [];
			let rowOffset = 0;
			for (const slot of slots) {
				rowOffsets.push(rowOffset);
				rowOffset += slot.block.rowCount;
			}
			/** Write one spectral channel into the existing packet layout. @param {Float32Array} total @param {number} channel @returns {void} */
			function pack(total,channel){
					let cursor = 0;
					for (let b = 0; b < slots.length; b++)
						for (let row = 0; row < slots[b].block.rowCount; row++) {
							for (let logical = 0; logical < domain.directionCount; logical++) {
								const value = total[cursor + domain.logicalToUniqueDirectionIndices[logical]],
									address = layout.resolveDestination(channel, row, logical, 0);
								requireValue(Number.isFinite(value) && value >= 0, 'Invalid candidate density.');
								packets[b][(address.y * 648 + address.x) * 4 + address.component] = value;
							}
							cursor += domain.uniqueDirectionCount;
						}
			}
            /** Observer-level source-density spectra; these are not integrated pixel radiances.
             * @param {number} k @returns {any}
             */
            function densitySpectra(k){
              const zc=Math.max(0,Math.min(179,placement.solarZenithDegrees-.5)),lower=Math.min(Math.floor(zc),178),fraction=zc-lower;
              const theta=placement.solarZenithDegrees*Math.PI/180;
              const probes=[{id:'source-direction',d:[Math.sin(theta),0,Math.cos(theta)]},{id:'horizon-toward',d:[Math.cos(.05*Math.PI/180),0,Math.sin(.05*Math.PI/180)]},{id:'horizon-away',d:[-Math.cos(.05*Math.PI/180),0,Math.sin(.05*Math.PI/180)]}];
              return probes.map(probe=>{const spectrum=[];for(let c=0;c<15;c++){const knots=[];for(let tap=0;tap<4;tap++){
                const z=Math.max(0,Math.min(179,lower+tap-1)),t=(z+.5)*Math.PI/180,d=warp(probe.d,[Math.sin(t),0,Math.cos(t)],1/k),stencil=outgoingStencil([d[0],d[1],d[2]],27);
                let found=null;for(let b=0;b<slots.length;b++){const row=slots[b].block.coordinates.findIndex(([alt,zenith])=>alt===0&&zenith===z);if(row>=0){found={b,row};break;}}
                if(!found){knots.push(null);continue;}
                knots.push(stencil.indices.reduce((sum,index,j)=>{const address=layout.resolveDestination(c,found.row,index,0);return sum+stencil.weights[j]*packets[found.b][(address.y*648+address.x)*4+address.component];},0));
              }spectrum.push(knots.some(v=>v===null)?null:solarCubic(lower===0?undefined:knots[0],knots[1],knots[2],lower===178?undefined:knots[3],fraction));}
              return {...probe,spectrum,altitudeIndex:0,solarCoordinate:zc,quantity:'Cumulative scattering source density, not integrated view radiance; channel order Native15.'};});
            }
			/** Publish a separately owned atlas using unchanged address metadata. @returns {Promise<any>} */
			async function publishPackets(/** @type {number} */k){
 const uploadStart=performance.now();
			 const previous=candidateArray;
			 const array=attachment._backend.allocatePersistentArray({id:'attribution-scene-'+performance.now(),valueKey:'cache.sharedPacketAtlas',storage:atlas.array.storage,maximumBytes:atlas.array.byteLength});
			 const reports=[];
			 for(let b=0;b<slots.length;b++){
			  const hash=await digest(new Uint8Array(packets[b].buffer));
			  attachment._backend.uploadPersistentArrayLayer({array,layer:slots[b].index,identity:hash,values:packets[b]});
			  reports.push({slot:slots[b].index,sha256:hash});
			 }
			 facade.publish({...originalFrame,h62Mapping:{schema:'h62-receiver-w27-sun-warp-v1',k},atlas:undefined,snapshot:{...originalFrame.snapshot,generation:originalFrame.snapshot.generation+1000000+Math.floor(performance.now())},bindings:[array.runtimeBinding,...originalFrame.bindings.slice(1)]});
			 candidateArray=array;/** @type {any} */(scene)._renderFrame();await frames();previous?.dispose();const uploadMilliseconds=performance.now()-uploadStart;facts.uploadTimings.push({k,milliseconds:uploadMilliseconds});const actualLookup=await packetProof(packets,slots,k,placement.solarZenithDegrees);return {reports,densitySpectra:densitySpectra(k),uploadMilliseconds,actualLookup};
			}
			const orderProbes = [];
			const samples = slots.flatMap((slot, b) =>
				slot.block.coordinates.map((_, row) => ({
					b,
					row,
					unique: domain.logicalToUniqueDirectionIndices[
						domain.unitVectors.findIndex((v) => v[0] === 0 && v[1] === 0 && v[2] === 1)
					],
				})),
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
					body: JSON.stringify({message, completed, total: control.material?45:30}),
				});
				requireValue(response.ok, 'Capture host rejected progress.');
			}
			/** Compile one complete N4 channel with exact ordered Float32 accumulation. @param {DistantSunSceneCacheCompilerBuildRequest} request @param {number} channel @param {readonly DistantSunSceneCacheCompilerProbeCoordinate[]} points @param {'original'|'corrected'|'focused'} variant @returns {Promise<any>} */
			async function compile(request, channel, points, variant) {
				const compileStart=performance.now();
 const total = new Float32Array(points.length);
				let order = 0;
				const orders = [];
				await (variant==='original'?compileOriginal:variant==='focused'?compileCandidate:compileDistantSunSceneCacheWavelength)({
					gl: compute,
					buildRequest: control.material ? {...request,transportSpec:{...request.transportSpec,atmosphere:{...request.transportSpec.atmosphere,mieSingleScatteringAlbedo:control.material.albedos[channel]}}}:request,
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
						orders.push(
							samples.map(
								(s, index) =>
									values[
										points.length === coordinates.length
											? (rowOffsets[s.b] + s.row) * domain.uniqueDirectionCount + s.unique
											: index
									].value,
							),
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
						// Continue monitored progress beyond the guidance duration; do not impose the old H53 total-time stop.
						await progress(stage, channel + 1);
					},
				});
				requireValue(order === 4, 'Incomplete N4 compile.');
				facts.buildTimings.push({channel,variant,milliseconds:performance.now()-compileStart});return {total, orders};
			}
			try {
                const originalOrders=[];
                if(control.material){
                  for(let channel=0;channel<15;channel++){
                    await progress(`Toronto Original15 spectrum ${channel+1}/15`,channel);
                    const original=await compile(control.original,channel,coordinates,'original');
                    originalOrders[channel]=original.orders;pack(original.total,channel);
                  }
                  const originalPackets=await publishPackets(1);
                  publish('original-ready',{...facts,profile:control.profile,renderer,packetReports:originalPackets});
                  await new Promise(resolve=>trigger.addEventListener('click',()=>resolve(undefined),{once:true}));
                  packets.forEach(p=>p.fill(0));
                }
				const baseChannels = [];
				let maximumRelative = 0,
					maximumAbsolute = 0;
				for (const channel of (control.probeOnly?[7]:Array.from({length:15},(_,i)=>i))) {
					await progress(`Baseline spectrum ${channel + 1}/15`, channel);
					const base = await compile(control.baseline, channel, coordinates, 'corrected');
                    if(control.material)requireValue(base.orders[0].every((v,i)=>v===originalOrders[channel][0][i]),'Original15/Corrected60 changed Toronto J1 witnesses');
					pack(base.total,channel);
					baseChannels[channel]={orders:base.orders};
					if (channel === 7) {
						for (let i = 0; i < samples.length; i++) {
							const s = samples[i],
								address = layout.resolveDestination(7, s.row, first[s.unique], 0);
							const expected = baselines[s.b][(address.y * 648 + address.x) * 4 + address.component];
							maximumAbsolute = Math.max(maximumAbsolute, Math.abs(base.total[(rowOffsets[s.b]+s.row)*domain.uniqueDirectionCount+s.unique] - expected));
							maximumRelative = Math.max(
								maximumRelative,
								Math.abs(base.total[(rowOffsets[s.b]+s.row)*domain.uniqueDirectionCount+s.unique] - expected) / Math.max(1e-12, Math.abs(expected)),
							);
						}
						// Corrected60 intentionally differs from deployed Original15; retain measured difference.
					}
				}
				const baselinePackets=await publishPackets(1);
				globalThis['__h62Identity']=async()=>{facade.publish({...originalFrame,h62Mapping:{schema:'h62-receiver-w27-sun-warp-v1',k:1},atlas:undefined,snapshot:{...originalFrame.snapshot,generation:originalFrame.snapshot.generation+2000000},bindings:[candidateArray.runtimeBinding,...originalFrame.bindings.slice(1)]});return view(180);};
				publish('baseline-ready',{...facts,profile:control.profile,renderer,originalCorrectedFirstOrderWitnesses:control.material?true:null,parity:{maximumRelative,maximumAbsolute,applicable:!control.material},packetReports:baselinePackets,elapsedMilliseconds:performance.now()-started});
				await new Promise(resolve=>trigger.addEventListener('click',()=>resolve(undefined),{once:true}));
				packets.forEach(p=>p.fill(0));
				const channelReports = [];
				for (const channel of (control.probeOnly?[7]:Array.from({length:15},(_,i)=>i))) {
					const {total, orders} = await compile(control.candidate, channel, coordinates, 'focused');
					orderProbes.push({channel, baseline: baseChannels[channel].orders, candidate: orders});
					pack(total,channel);
					channelReports.push({channel, sha256: await digest(new Uint8Array(total.buffer))});
					await progress(`Candidate spectrum ${channel + 1}/15 completed.`, channel + (control.material?31:16));
				}
				const packetReports=await publishPackets(.35);
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
					orderProbes,
					samples: samples.map((s) => ({...s, coordinate: sampleCoordinates[samples.indexOf(s)]})),
					unchangedFirstOrder: false,
					packetReports,
					logicalCandidateAtlasBytes: candidateArray.byteLength,
					candidateProfile:
						'Native48/Native15/F68; normalized transport60, H61 k=.35 outgoing construction and lookup',
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
