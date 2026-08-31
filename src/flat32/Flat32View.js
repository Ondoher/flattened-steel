export class Flat32View {
	/**
	 * @param {HTMLElement} root - Hosts the application shell.
	 */
	constructor(root) {
		this._root = root;
		/** @type {HTMLElement | null} */
		this._shell = null;
		/** @type {HTMLCanvasElement | null} */
		this._canvas = null;
		/** @type {HTMLElement | null} */
		this._status = null;
		/** @type {HTMLElement | null} */
		this._progress = null;
		/** @type {HTMLElement | null} */
		this._error = null;
		/** @type {HTMLElement | null} */
		this._lighting = null;
		/** @type {HTMLElement | null} */
		this._atmosphere = null;
		/** @type {HTMLElement | null} */
		this._pairing = null;
	}

	/**
	 * Create the application shell.
	 *
	 * @returns {HTMLElement} Return the new shell.
	 */
	_createShell() {
		const shell = document.createElement('main');

		shell.className = 'flat32-shell';
		shell.dataset.flat32State = 'setting-up';
		shell.innerHTML = `
			<div class="flat32-viewport">
				<canvas
					id="flat32-canvas"
					class="flat32-canvas"
					aria-label="Flat32 solid Three.js scene"
				></canvas>
			</div>
			<nav class="flat32-scene-controls" aria-label="Scene controls">
				<button id="flat32-mode-control" type="button">Switch to Flat</button>
				<button id="flat32-location-control" type="button">Location</button>
			</nav>
			<section class="flat32-time-panel" aria-label="Time controls">
				<div id="flat32-time-value" class="flat32-time-value">Flat 0</div>
				<button id="flat32-time-basis-control" type="button">Globe time</button>
				<div id="flat32-flat-time-controls" class="flat32-time-buttons">
					<button type="button" data-flat32-time="0">0</button>
					<button type="button" data-flat32-time="1">45</button>
					<button type="button" data-flat32-time="2">90</button>
					<button type="button" data-flat32-time="3">135</button>
					<button type="button" data-flat32-time="4">180</button>
				</div>
				<div id="flat32-globe-time-controls" class="flat32-time-buttons" hidden>
					<button type="button" data-flat32-globe-time="0">Sunrise</button>
					<button type="button" data-flat32-globe-time="1">Solar Noon</button>
					<button type="button" data-flat32-globe-time="2">Sunset</button>
					<button type="button" data-flat32-hour-offset="1">Hour +</button>
					<button type="button" data-flat32-hour-offset="-1">Hour -</button>
					<button type="button" data-flat32-minute-offset="10">10 Min +</button>
					<button type="button" data-flat32-minute-offset="-10">10 Min -</button>
				</div>
			</section>
			<section class="flat32-panel" aria-labelledby="flat32-heading">
				<p class="flat32-stage">Algorithm32 &middot; Stage 11.5</p>
				<h1 id="flat32-heading" class="flat32-heading">Flat32</h1>
				<p id="flat32-pairing" class="flat32-pairing">
					Spherical geometry &middot; distant Sun
				</p>
				<p
					id="flat32-status"
					class="flat32-status"
					role="status"
					aria-live="polite"
				>Building the solid scene…</p>
				<div
					id="flat32-progress"
					class="flat32-progress"
					role="progressbar"
					aria-label="Scene setup"
				></div>
				<p class="flat32-atmosphere-state">
					Atmosphere shader:
					<strong id="flat32-atmosphere">not installed</strong>
				</p>
				<p id="flat32-lighting" class="flat32-lighting-state">
					Source lights: installing…
				</p>
				<p id="flat32-error" class="flat32-error" role="alert" hidden></p>
			</section>
		`;

		return shell;
	}

	/** Bind compact location/time control actions. */
	installLocationTimeControls(onLocation, onTime, onBasis, onGlobeTime, onHourOffset, onMinuteOffset) {
		const shell = this._requireElement(this._shell, 'shell');
		shell.querySelector('#flat32-location-control')?.addEventListener('click', onLocation);
		shell.querySelectorAll('button[data-flat32-time]').forEach((button) => {
			const timeButton = /** @type {HTMLButtonElement} */ (button);
			timeButton.addEventListener('click', () => onTime(Number(timeButton.dataset.flat32Time)));
		});
		shell.querySelector('#flat32-time-basis-control')?.addEventListener('click', onBasis);
		shell.querySelectorAll('button[data-flat32-globe-time]').forEach((button) => {
			const timeButton = /** @type {HTMLButtonElement} */ (button);
			timeButton.addEventListener('click', () => onGlobeTime(Number(timeButton.dataset.flat32GlobeTime)));
		});
		shell.querySelectorAll('button[data-flat32-hour-offset]').forEach((button) => {
			const offsetButton = /** @type {HTMLButtonElement} */ (button);
			offsetButton.addEventListener('click', () => onHourOffset(Number(offsetButton.dataset.flat32HourOffset)));
		});
		shell.querySelectorAll('button[data-flat32-minute-offset]').forEach((button) => {
			const offsetButton = /** @type {HTMLButtonElement} */ (button);
			offsetButton.addEventListener('click', () =>
				onMinuteOffset(Number(offsetButton.dataset.flat32MinuteOffset)),
			);
		});
	}

	/** Bind supported-pair mode switching. */
	installModeControl(onMode) {
		const shell = this._requireElement(this._shell, 'shell');
		shell.querySelector('#flat32-mode-control')?.addEventListener('click', onMode);
	}

	/**
	 * Return the visible geometry/source description for one pairing.
	 *
	 * @param {'spherical/distant' | 'flat/local'} pairing - Supplies the pairing.
	 * @returns {string} Return its visible description.
	 */
	_pairingLabel(pairing) {
		return pairing === 'spherical/distant'
			? 'Spherical geometry \u00b7 distant Sun'
			: 'Flat geometry \u00b7 local Sun';
	}

	/**
	 * Return the source application's resolved date/time display.
	 *
	 * @param {Flat32LocationTimeState} state - Supplies the resolved time state.
	 * @returns {string} Return the visible date/time value.
	 */
	_timeDisplay(state) {
		const date = new Date(state.observation.instant);

		return `${date.toISOString().slice(0, 16).replace('T', ' ')}Z / ${state.timeLabel}`;
	}

	/** Present the currently requested supported pairing. */
	showMode(pairing) {
		const shell = this._requireElement(this._shell, 'shell');
		const button = shell.querySelector('#flat32-mode-control');
		const pairingLabel = this._requireElement(this._pairing, 'pairing');

		if (button instanceof HTMLButtonElement) {
			button.textContent = pairing === 'spherical/distant' ? 'Switch to Flat' : 'Switch to Globe';
		}
		pairingLabel.textContent = this._pairingLabel(pairing);
		shell.dataset.flat32Mode = pairing;
	}

	/** Publish the source app's date/time display and selected time controls. */
	showLocationTimeState(state) {
		const shell = this._requireElement(this._shell, 'shell');
		const location = shell.querySelector('#flat32-location-control');

		if (location instanceof HTMLButtonElement) {
			location.textContent = state.locationLabel;
		}
		const basis = shell.querySelector('#flat32-time-basis-control');
		if (basis instanceof HTMLButtonElement) {
			basis.textContent = state.timeBasis === 'flat' ? 'Use Globe Time' : 'Use Flat Time';
		}
		const timeValue = shell.querySelector('#flat32-time-value');
		if (timeValue instanceof HTMLElement) {
			timeValue.textContent = this._timeDisplay(state);
		}
		const flatTimeControls = shell.querySelector('#flat32-flat-time-controls');
		const globeTimeControls = shell.querySelector('#flat32-globe-time-controls');
		if (flatTimeControls instanceof HTMLElement) flatTimeControls.hidden = state.timeBasis !== 'flat';
		if (globeTimeControls instanceof HTMLElement) globeTimeControls.hidden = state.timeBasis === 'flat';
		shell.querySelectorAll('button[data-flat32-time]').forEach((button) => {
			button.classList.toggle(
				'is-active',
				state.timeBasis === 'flat' && button.textContent === state.timeLabel.replace('Flat ', ''),
			);
		});
		shell.dataset.flat32Location = state.locationLabel;
		shell.dataset.flat32Time = state.timeLabel;
	}

	/** Render all controls from one authoritative application-state snapshot. */
	showApplicationState(state) {
		this.showMode(state.modeKind === 'spherical-distant' ? 'spherical/distant' : 'flat/local');
		this.showLocationTimeState(state);
	}

	/**
	 * Require an initialized view element.
	 *
	 * @template {HTMLElement} T
	 * @param {T | null} element - Supplies the possibly absent element.
	 * @param {string} name - Identifies the required element.
	 * @returns {T} Return the initialized element.
	 */
	_requireElement(element, name) {
		if (element === null) {
			throw new Error(`Flat32 view element is unavailable: ${name}.`);
		}

		return element;
	}

	/**
	 * Return the scene canvas.
	 *
	 * @returns {HTMLCanvasElement} Return the initialized canvas.
	 */
	get canvas() {
		return this._requireElement(this._canvas, 'canvas');
	}

	/**
	 * Install the application shell.
	 *
	 * @returns {void}
	 */
	start() {
		if (this._shell !== null) {
			return;
		}

		this._shell = this._createShell();
		this._root.replaceChildren(this._shell);
		this._canvas = /** @type {HTMLCanvasElement | null} */ (this._shell.querySelector('#flat32-canvas'));
		this._status = this._shell.querySelector('#flat32-status');
		this._progress = this._shell.querySelector('#flat32-progress');
		this._error = this._shell.querySelector('#flat32-error');
		this._lighting = this._shell.querySelector('#flat32-lighting');
		this._atmosphere = this._shell.querySelector('#flat32-atmosphere');
		this._pairing = this._shell.querySelector('#flat32-pairing');
		this._requireElement(this._canvas, 'canvas');
		this._requireElement(this._status, 'status');
		this._requireElement(this._progress, 'progress');
		this._requireElement(this._error, 'error');
		this._requireElement(this._lighting, 'lighting');
		this._requireElement(this._atmosphere, 'atmosphere');
		this._requireElement(this._pairing, 'pairing');
	}

	/**
	 * Publish ordinary scene and lighting facts.
	 *
	 * @param {Flat32SceneSummary} sceneSummary - Supplies installed scene facts.
	 * @returns {void}
	 */
	_publishSceneSummary(sceneSummary) {
		const shell = this._requireElement(this._shell, 'shell');
		const lighting = this._requireElement(this._lighting, 'lighting');

		shell.dataset.flat32SourceLightCount = String(sceneSummary.sourceLightCount);
		shell.dataset.flat32AmbientLightCount = String(sceneSummary.ambientLightCount);
		shell.dataset.flat32DirectionalLightCount = String(sceneSummary.directionalLightCount);
		shell.dataset.flat32LightTargetCount = String(sceneSummary.targetCount);
		shell.dataset.flat32AmbientIntensity = String(sceneSummary.ambientIntensity);
		shell.dataset.flat32DirectionalIntensity = String(sceneSummary.directionalIntensity);
		shell.dataset.flat32ShadowMapsInstalled = String(sceneSummary.shadowMapsInstalled);
		shell.dataset.flat32ShadowMapCount = String(sceneSummary.shadowMapCount);
		shell.dataset.flat32ShadowMapWidth = String(sceneSummary.shadowMapWidth);
		shell.dataset.flat32ShadowMapHeight = String(sceneSummary.shadowMapHeight);
		shell.dataset.flat32ShadowLayerCount = String(sceneSummary.shadowLayerCount);
		shell.dataset.flat32ShadowCasterCount = String(sceneSummary.shadowCasterCount);
		shell.dataset.flat32ShadowReceiverCount = String(sceneSummary.shadowReceiverCount);
		lighting.textContent =
			`Source lights: ${sceneSummary.sourceLightCount} active ` +
			`(${sceneSummary.ambientLightCount} ambient + ` +
			`${sceneSummary.directionalLightCount} local-Sun directionals; ` +
			`${sceneSummary.targetCount} targets; ` +
			`${sceneSummary.shadowMapCount} shadow maps at ` +
			`${sceneSummary.shadowMapWidth} x ` +
			`${sceneSummary.shadowMapHeight}, generated once).`;
	}

	/**
	 * Present the working direct scene while the atmosphere builds.
	 *
	 * @param {Flat32SceneSummary} sceneSummary - Supplies installed scene facts.
	 * @param {Flat32ApplicationState} state - Supplies the exact requested state.
	 * @returns {void}
	 */
	showAtmosphereSetup(sceneSummary, state) {
		const shell = this._requireElement(this._shell, 'shell');
		const status = this._requireElement(this._status, 'status');
		const progress = this._requireElement(this._progress, 'progress');
		const error = this._requireElement(this._error, 'error');
		const atmosphere = this._requireElement(this._atmosphere, 'atmosphere');
		const pairing = state.modeKind === 'spherical-distant' ? 'spherical/distant' : 'flat/local';
		const timeDisplay = this._timeDisplay(state);
		const setupDescription = `${pairing} atmosphere for ${state.locationLabel} at ${timeDisplay}`;

		this._publishSceneSummary(sceneSummary);
		shell.dataset.flat32State = 'setting-up-atmosphere';
		status.textContent = `Scene ready. Building the full-domain production ${setupDescription}.`;
		atmosphere.textContent = 'building';
		progress.setAttribute('aria-label', `Setting up the ${setupDescription}`);
		progress.setAttribute('aria-valuetext', setupDescription);
		progress.hidden = false;
		error.hidden = true;
		error.textContent = '';
	}

	/** Present one distant-Sun cache-resolution phase through the existing status surface. */
	showDistantSunCacheState(sceneSummary, cacheState, solarZenithDegrees) {
		const shell = this._requireElement(this._shell, 'shell');
		const status = this._requireElement(this._status, 'status');
		const atmosphere = this._requireElement(this._atmosphere, 'atmosphere');
		this._publishSceneSummary(sceneSummary);
		shell.dataset.flat32DistantSunCacheState = cacheState;
		shell.dataset.flat32SolarZenithDegrees = String(solarZenithDegrees);
		if (cacheState === 'resolving') {
			status.textContent = `Resolving the offline distant-Sun cache for solar zenith ${solarZenithDegrees.toFixed(6)} degrees.`;
			atmosphere.textContent = 'resolving cache';
		} else if (cacheState === 'loading') {
			status.textContent = 'Loading and validating the selected offline distant-Sun cache.';
			atmosphere.textContent = 'loading cache';
		} else if (cacheState === 'dark') {
			status.textContent = 'The selected distant-Sun state is beyond the configured non-dark cache range.';
			atmosphere.textContent = 'dark';
		}
	}

	/**
	 * Present the installed production atmosphere.
	 *
	 * @param {Flat32SceneSummary} sceneSummary - Supplies installed scene facts.
	 * @param {Flat32AtmosphereSummary} atmosphereSummary - Supplies runtime facts.
	 * @returns {void}
	 */
	showAtmosphereReady(sceneSummary, atmosphereSummary) {
		const shell = this._requireElement(this._shell, 'shell');
		const status = this._requireElement(this._status, 'status');
		const progress = this._requireElement(this._progress, 'progress');
		const error = this._requireElement(this._error, 'error');
		const atmosphere = this._requireElement(this._atmosphere, 'atmosphere');

		this._publishSceneSummary(sceneSummary);
		shell.dataset.flat32State = 'ready';
		if (atmosphereSummary.pairing === 'spherical/distant') {
			shell.dataset.flat32DistantSunCacheState = atmosphereSummary.distantSunCacheState;
		} else {
			delete shell.dataset.flat32DistantSunCacheState;
			delete shell.dataset.flat32SolarZenithDegrees;
		}
		shell.dataset.flat32AtmospherePairing = atmosphereSummary.pairing;
		shell.dataset.flat32AtmosphereMaximumOrder = String(atmosphereSummary.maximumScatteringOrder);
		shell.dataset.flat32AtmospherePositionCount = String(atmosphereSummary.positionCount);
		shell.dataset.flat32AtmosphereIncomingDirectionCount = String(atmosphereSummary.incomingDirectionCount);
		shell.dataset.flat32AtmosphereOutgoingDirectionCount = String(atmosphereSummary.outgoingDirectionCount);
		shell.dataset.flat32AtmosphereSpectralChannelCount = String(atmosphereSummary.spectralChannelCount);
		shell.dataset.flat32AtmosphereRenderErrorCount = String(atmosphereSummary.renderErrorCount);
		shell.dataset.flat32AtmosphereSceneDepthMax = String(atmosphereSummary.sceneDepthMax.value);
		shell.dataset.flat32AtmosphereSetupDurationMilliseconds = String(atmosphereSummary.setupDurationMilliseconds);
		shell.dataset.flat32AtmosphereObserverDome = String(atmosphereSummary.observerDomeEnabled === true);
		shell.dataset.flat32AtmosphereOutputPixel = atmosphereSummary.outputPixel.join(',');
		shell.dataset.flat32AtmosphereSceneInputPixel = atmosphereSummary.sceneInputPixel.join(',');
		status.textContent =
			atmosphereSummary.pairing === 'spherical/distant' && atmosphereSummary.distantSunCacheState === 'dark'
				? 'Atmosphere ready. Rendering the production spherical/distant path with the shared dark scattering state.'
				: `Atmosphere ready. Rendering the production ${atmosphereSummary.pairing} path.`;
		atmosphere.textContent = 'installed';
		progress.hidden = true;
		error.hidden = true;
		error.textContent = '';
	}

	/**
	 * Preserve the direct scene and present an atmosphere-only failure.
	 *
	 * @param {Flat32SceneSummary} sceneSummary - Supplies retained scene facts.
	 * @param {string} message - Describes the atmosphere failure.
	 * @returns {void}
	 */
	showAtmosphereFailure(sceneSummary, message) {
		const shell = this._requireElement(this._shell, 'shell');
		const status = this._requireElement(this._status, 'status');
		const progress = this._requireElement(this._progress, 'progress');
		const error = this._requireElement(this._error, 'error');
		const atmosphere = this._requireElement(this._atmosphere, 'atmosphere');

		this._publishSceneSummary(sceneSummary);
		shell.dataset.flat32State = 'atmosphere-failed';
		if (shell.dataset.flat32DistantSunCacheState !== 'dark') {
			shell.dataset.flat32DistantSunCacheState = 'failure';
		}
		status.textContent = 'The direct scene remains active; atmosphere setup failed.';
		atmosphere.textContent = 'failed';
		progress.hidden = true;
		error.textContent = message;
		error.hidden = false;
	}

	/**
	 * Present the current pointer-look affordance without changing atmosphere state.
	 *
	 * @param {boolean} locked - Reports whether pointer look owns the mouse.
	 * @returns {void}
	 */
	showPointerLookState(locked) {
		const shell = this._requireElement(this._shell, 'shell');

		shell.dataset.flat32PointerLook = locked ? 'locked' : 'ready';
		this._canvas?.setAttribute(
			'aria-label',
			locked ? 'Flat32 scene; mouse look active, press Escape to release' : 'Flat32 scene; click to look around',
		);
	}

	/**
	 * Present a visible runtime failure.
	 *
	 * @param {string} message - Describes the failure.
	 * @returns {void}
	 */
	showFailure(message) {
		const shell = this._requireElement(this._shell, 'shell');
		const status = this._requireElement(this._status, 'status');
		const progress = this._requireElement(this._progress, 'progress');
		const error = this._requireElement(this._error, 'error');
		const lighting = this._requireElement(this._lighting, 'lighting');
		const atmosphere = this._requireElement(this._atmosphere, 'atmosphere');

		shell.dataset.flat32State = 'failed';
		status.textContent = 'The solid scene could not be rendered.';
		lighting.textContent = 'Source lights: unavailable.';
		atmosphere.textContent = 'unavailable';
		progress.hidden = true;
		error.textContent = message;
		error.hidden = false;
	}

	/**
	 * Mark the local application as stopped.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._shell === null) {
			return;
		}

		this._shell.dataset.flat32State = 'disposed';
		this._requireElement(this._status, 'status').textContent = 'Scene stopped.';
		this._requireElement(this._progress, 'progress').hidden = true;
	}
}
