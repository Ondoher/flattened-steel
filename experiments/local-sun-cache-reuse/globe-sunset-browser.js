import {Flat32Application} from '../../src/flat32/Flat32Application.js';
import {registry} from '@polylith/core';
import {LocationTimeController} from '../../src/flat32/LocationTimeController.js';
import {createDistantSunSceneState} from '../../src/flat32/DistantSunSceneState.js';
import {createDistantSunSceneCacheHttpResolver} from '../../src/flat32/DistantSunSceneCacheResolver.js';
import {loadBrightest2000StellarCatalogPackage} from '../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from '../../src/flat32/HumanVisionFilterPackageLoader.js';
import {ATMOSPHERE_OBSERVER_HEIGHT, ATMOSPHERE_OBSERVER_UP_DIRECTION} from '../../src/flat32/consts.js';

/** Capture ordinary spherical/distant sunset through existing application controls.
 * @returns {Promise<void>} - Publish measured facts in a hidden result element; dispose on page exit.
 */
async function main() {
	const result = document.getElementById('capture-result'), root = document.getElementById('main-content');
	if (!root || !result) throw new Error('Capture host elements are missing.');
	let application;
	try {
		await registry.start();
		const controller = new LocationTimeController();
		let selected = controller.start();
		for (let index = 0; index < 2; index++) selected = controller.nextLocation(selected);
		selected = controller.selectGlobeTime(controller.toggleTimeBasis(selected), 2);
		if (selected.locationLabel !== 'San Jose' || selected.timeLabel !== 'Sunset') throw new Error('Wrong sunset preset.');
		const placement = createDistantSunSceneState({observation: selected.observation, observerHeight: ATMOSPHERE_OBSERVER_HEIGHT, observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION});
		const sunDirection = placement.geometry.expressCelestialDirectionInScene(placement.directionToSourceModel);
		const horizontalLength = Math.hypot(sunDirection[0], sunDirection[2]), elevation = 5 * Math.PI / 180;
		const cameraDirection = /** @type {UnitVector3} */ ([sunDirection[0] / horizontalLength * Math.cos(elevation), Math.sin(elevation), sunDirection[2] / horizontalLength * Math.cos(elevation)]);
		const catalog = await loadBrightest2000StellarCatalogPackage(), humanVision = await loadHumanVisionFilterPackage();
		const vertical = 2 * Math.atan(Math.tan(Math.PI / 6) / (4 / 3)) * 180 / Math.PI;
		application = new Flat32Application(root, {
			initialModeKind: 'spherical-distant', cameraFieldOfViewDegrees: vertical, cameraDirectionScene: cameraDirection,
			reviewObjectsEnabled: true, colorDisplayModelConfiguration: {model: 'color-reset-slope-078-p2'},
			stellarCatalog: 'brightest-2000', brightest2000StellarCatalogDefinition: catalog,
			scotopicLuminanceWeights: humanVision.scotopicLuminanceWeights,
			presentationFilters: [
				{id: 'human-mesopic-luminance-v1', stage: 'source-linear', target: 'stellar', enabled: true, parameters: {maximumRodContribution: 0.5}},
				{id: 'human-low-light-chroma-v1', stage: 'source-linear', target: 'stellar', enabled: true, parameters: {maximumChromaRetention: 0.65}},
			],
			resolveDistantSunSceneCacheAsset: createDistantSunSceneCacheHttpResolver(),
		});
		window.addEventListener('beforeunload', () => application.dispose(), {once: true});
		application.start();
		/** Wait for one bounded ordinary application publication.
		 * @param {boolean} sunset - Require the selected sunset when true.
		 * @returns {Promise<void>} - Resolve only with complete celestial generation and the right pairing.
		 */
		async function ready(sunset) {
			const deadline = performance.now() + 240000;
			while (performance.now() < deadline) {
				const shell = document.querySelector('.flat32-shell'), canvas = document.getElementById('flat32-canvas');
				if (!(shell instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) throw new Error('Application elements missing.');
				if (['failed', 'atmosphere-failed'].includes(shell.dataset.flat32State)) throw new Error(shell.textContent);
				if (shell.dataset.flat32State === 'ready' && canvas.dataset.flat32StellarGenerationCompletion === 'complete' && (!sunset || (shell.dataset.flat32Location === 'San Jose' && shell.dataset.flat32Time === 'Sunset' && application._publishedState?.observation.instant === selected.observation.instant))) return;
				await new Promise((resolve) => setTimeout(resolve, 250));
			}
			throw new Error('Application publication exceeded four minutes.');
		}
		await ready(false);
		/** Use an ordinary application button, preserving its state owner.
		 * @param {string} selector - Exact button selector.
		 * @returns {void} - Dispatch the existing handler.
		 */
		function click(selector) {
			const button = document.querySelector(selector);
			if (!(button instanceof HTMLButtonElement)) throw new Error('Missing capture control: ' + selector);
			button.click();
		}
		click('#flat32-location-control'); click('#flat32-location-control');
		click('#flat32-time-basis-control'); click('button[data-flat32-globe-time="2"]');
		await ready(true);
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const runtime = application._sceneRuntime, published = application._publishedState;
		if (!runtime || !published || published.observation.instant !== selected.observation.instant || published.modeKind !== 'spherical-distant') throw new Error('Published observation differs from requested sunset.');
		const camera = runtime.camera, shell = document.querySelector('.flat32-shell'), canvas = runtime.canvas;
		if (!(shell instanceof HTMLElement)) throw new Error('Missing application shell.');
		const horizontal = 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect) * 180 / Math.PI;
		const gl = canvas.getContext('webgl2'), webglError = gl?.getError();
		if (Math.abs(horizontal - 60) > 1e-8 || camera.aspect !== 4 / 3 || canvas.width !== 1024 || canvas.height !== 768 || webglError !== 0 || canvas.dataset.flat32RenderPath !== 'algorithm32' || shell.dataset.flat32ColorModel !== 'color-reset-slope-078-p2' || shell.dataset.flat32AtmospherePairing !== 'spherical/distant') throw new Error('Actual render facts failed the requested capture contract.');
		result.textContent = JSON.stringify({accepted: true, observation: published.observation, camera: {horizontalDegrees: horizontal, verticalDegrees: camera.fov, aspect: camera.aspect, direction: cameraDirection, elevationDegrees: 5}, source: {directionScene: sunDirection, elevationDegrees: 90 - placement.solarZenithDegrees}, viewport: {width: canvas.width, height: canvas.height}, webglError, shell: {...shell.dataset}, canvas: {...canvas.dataset}});
		result.dataset.state = 'complete';
	} catch (error) {
		application?.dispose();
		result.textContent = JSON.stringify({accepted: false, failure: String(error)});
		result.dataset.state = 'failed';
	}
}
void main();
