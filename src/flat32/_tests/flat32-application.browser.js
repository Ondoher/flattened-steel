/**
 * Load one built Flat32 application in an isolated browser document.
 *
 * @param {HTMLIFrameElement} frame - Receives the application.
 * @returns {Promise<void>} Resolve after the built document loads.
 */
function loadApplication(frame) {
	return new Promise((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			reject(new Error('Timed out loading the built Flat32 application.'));
		}, 30000);

		frame.addEventListener(
			'load',
			() => {
				window.clearTimeout(timeout);
				resolve();
			},
			{once: true},
		);
		frame.src = `/base/dist/flat32/index.html?browser-spec=${Date.now()}`;
		document.body.append(frame);
	});
}

/**
 * Wait for an observable condition without blocking the browser event loop.
 *
 * @param {Window} targetWindow - Supplies animation frames.
 * @param {() => boolean} condition - Reports completion.
 * @param {string} description - Describes the awaited state.
 * @param {number} [timeoutMilliseconds] - Bounds the wait.
 * @returns {Promise<void>} Resolve when the condition passes.
 */
function waitForCondition(targetWindow, condition, description, timeoutMilliseconds = 20000) {
	return new Promise((resolve, reject) => {
		const deadline = performance.now() + timeoutMilliseconds;

		function inspect() {
			if (condition()) {
				resolve();
				return;
			}
			if (performance.now() >= deadline) {
				reject(new Error(`Timed out waiting for ${description}.`));
				return;
			}
			targetWindow.requestAnimationFrame(inspect);
		}

		inspect();
	});
}

/**
 * Wait for two browser frame opportunities.
 *
 * @param {Window} targetWindow - Supplies animation frames.
 * @returns {Promise<void>} Resolve after two frames.
 */
async function waitForTwoFrames(targetWindow) {
	await new Promise((resolve) => targetWindow.requestAnimationFrame(resolve));
	await new Promise((resolve) => targetWindow.requestAnimationFrame(resolve));
}

const describeFullCache = window.__karma__?.config?.args?.includes('full-cache') === true ? describe : xdescribe;

describeFullCache('Flat32 scene application (full production cache)', () => {
	/** @type {HTMLIFrameElement} */
	let frame;
	/** @type {Document} */
	let applicationDocument;

	beforeEach(async () => {
		frame = document.createElement('iframe');
		frame.style.width = '320px';
		frame.style.height = '320px';
		frame.style.border = '0';
		await loadApplication(frame);
		applicationDocument = frame.contentDocument;
		await waitForCondition(
			frame.contentWindow,
			() => {
				const state = applicationDocument.querySelector('.flat32-shell')?.dataset.flat32State;

				return state === 'setting-up-atmosphere' || state === 'ready' || state === 'atmosphere-failed';
			},
			'the direct scene and atmosphere setup state',
			30000,
		);
	});

	afterEach(() => {
		frame.contentWindow.__flat32Cleanup?.();
		frame.remove();
	});

	it('renders at the host viewport size, resizes, and disposes', async () => {
		const shell = applicationDocument.querySelector('.flat32-shell');
		const canvas = applicationDocument.querySelector('#flat32-canvas');
		const status = applicationDocument.querySelector('#flat32-status');
		const progress = applicationDocument.querySelector('#flat32-progress');
		const atmosphereState = applicationDocument.querySelector('.flat32-atmosphere-state');
		const lightingState = applicationDocument.querySelector('.flat32-lighting-state');
		const pairingState = applicationDocument.querySelector('#flat32-pairing');
		const error = applicationDocument.querySelector('#flat32-error');
		const setupFrameCount = Number(canvas.dataset.flat32FrameCount);
		const initialViewportWidth = Math.round(canvas.getBoundingClientRect().width);
		const initialViewportHeight = Math.round(canvas.getBoundingClientRect().height);
		const initialPixelRatio = Number(canvas.dataset.flat32PixelRatio);

		expect(['setting-up-atmosphere', 'ready']).toContain(shell.dataset.flat32State);
		expect(shell.dataset.flat32ColorModel).toBe('color-reset-slope-078-p9');
		expect(shell.dataset.flat32StellarCatalog).toBe('brightest-2000');
		expect(shell.dataset.flat32PresentationFilters).toBe(
			'human-mesopic-luminance-v1,human-low-light-chroma-v1',
		);
		expect(pairingState.textContent.trim()).toBe('Spherical geometry \u00b7 distant Sun');
		expect(shell.dataset.flat32SourceLightCount).toBe('7');
		expect(shell.dataset.flat32AmbientLightCount).toBe('1');
		expect(shell.dataset.flat32DirectionalLightCount).toBe('6');
		expect(shell.dataset.flat32LightTargetCount).toBe('6');
		expect(Number(shell.dataset.flat32AmbientIntensity)).toBeCloseTo(0.37943331351924703, 12);
		expect(Number(shell.dataset.flat32DirectionalIntensity)).toBeCloseTo(1.4677190896762844, 12);
		expect(lightingState.textContent).toContain('1 ambient');
		expect(lightingState.textContent).toContain('6 local-Sun directionals');
		expect(lightingState.textContent).toContain('6 shadow maps');
		expect(lightingState.textContent).toContain('4096 x 4096');
		expect(error.hidden).toBeTrue();
		expect(initialViewportWidth).toBe(320);
		expect(initialViewportHeight).toBe(320);
		expect(initialPixelRatio).toBeGreaterThan(0);
		expect(canvas.width).toBe(Math.floor(initialViewportWidth * initialPixelRatio));
		expect(canvas.height).toBe(Math.floor(initialViewportHeight * initialPixelRatio));
		expect(canvas.clientWidth).toBe(initialViewportWidth);
		expect(canvas.clientHeight).toBe(initialViewportHeight);
		expect(canvas.dataset.flat32ViewportWidth).toBe(String(initialViewportWidth));
		expect(canvas.dataset.flat32ViewportHeight).toBe(String(initialViewportHeight));
		expect(setupFrameCount).toBeGreaterThan(0);
		expect(canvas.dataset.flat32ShadowMaps).toBe('enabled');
		expect(canvas.dataset.flat32ShadowMapType).toBe('pcf');
		expect(canvas.dataset.flat32ShadowMapUpdates).toBe('static-once');
		expect(shell.dataset.flat32ShadowMapsInstalled).toBe('true');
		expect(shell.dataset.flat32ShadowMapCount).toBe('6');
		expect(shell.dataset.flat32ShadowMapWidth).toBe('4096');
		expect(shell.dataset.flat32ShadowMapHeight).toBe('4096');
		expect(shell.dataset.flat32ShadowLayerCount).toBe('6');
		expect(shell.dataset.flat32ShadowCasterCount).toBe('6');
		expect(shell.dataset.flat32ShadowReceiverCount).toBe('7');
		expect(Number(canvas.dataset.flat32ShadowMaxTextureSize)).toBeGreaterThanOrEqual(4096);
		expect(Number(canvas.dataset.flat32ShadowMaxRenderbufferSize)).toBeGreaterThanOrEqual(4096);
		expect(Number(canvas.dataset.flat32ShadowMaxViewportWidth)).toBeGreaterThanOrEqual(4096);
		expect(Number(canvas.dataset.flat32ShadowMaxViewportHeight)).toBeGreaterThanOrEqual(4096);

		if (shell.dataset.flat32State === 'setting-up-atmosphere') {
			expect(canvas.dataset.flat32RenderPath).toBe('direct-three');
			expect(progress.hidden).toBeFalse();
			expect(status.textContent).toMatch(/Resolving|Loading|Setting up/u);
			expect(atmosphereState.textContent).toMatch(/resolving cache|loading cache|building/u);
			await waitForCondition(
				frame.contentWindow,
				() => Number(canvas.dataset.flat32FrameCount) > setupFrameCount,
				'a responsive direct frame while loading the exact cache',
				30000,
			);
		}

		await waitForCondition(
			frame.contentWindow,
			() => {
				const state = shell.dataset.flat32State;

				return state === 'ready' || state === 'atmosphere-failed';
			},
			'the production atmosphere terminal state',
			300000,
		);

		expect(shell.dataset.flat32State).withContext(error.textContent).toBe('ready');
		expect(status.textContent).toContain('Atmosphere ready');
		expect(atmosphereState.textContent).toContain('installed');
		expect(progress.hidden).toBeTrue();
		expect(error.hidden).toBeTrue();
		expect(canvas.dataset.flat32RenderPath).toBe('algorithm32');
		expect(shell.dataset.flat32AtmosphereShader).toBe('enabled');
		expect(shell.dataset.flat32AtmospherePairing).toBe('spherical/distant');
		expect(shell.dataset.flat32AtmosphereMaximumOrder).toBe('4');
		expect(shell.dataset.flat32AtmospherePositionCount).toBe('48');
		expect(shell.dataset.flat32AtmosphereIncomingDirectionCount).toBe('68');
		expect(shell.dataset.flat32AtmosphereOutgoingDirectionCount).toBe('4374');
		expect(shell.dataset.flat32AtmosphereSpectralChannelCount).toBe('15');
		expect(shell.dataset.flat32AtmosphereObserverDome).toBe('false');
		expect(shell.dataset.flat32AtmosphereRenderErrorCount).toBe('0');
		expect(canvas.dataset.flat32StellarGenerationStatus).toBe('ready');
		expect(Number(canvas.dataset.flat32StellarGenerationCount)).toBeGreaterThanOrEqual(1);
		expect(canvas.dataset.flat32StellarGenerationCompletion).toBe('complete');
		expect(canvas.dataset.flat32CelestialGenerationStatus).toBe('ready');
		expect(Number(canvas.dataset.flat32ColorBrightnessProxy)).toBeGreaterThan(0);
		expect(canvas.dataset.flat32SunTileGenerationStatus).toBe('ready');
		expect(Number(canvas.dataset.flat32SunTileGenerationCount)).toBeGreaterThanOrEqual(1);
		expect(canvas.dataset.flat32SunTileGenerationCompletion).toBe('complete');
		expect(canvas.dataset.flat32SunTileCoveragePolicy).toBe('analytic-circular-disk-pixel-overlap-field-s16-v1');
		expect(Number(shell.dataset.flat32AtmosphereSceneDepthMax)).toBeGreaterThan(300000);
		const firstAtmosphereFrameCount = Number(canvas.dataset.flat32AtmosphereFrameCount);

		expect(firstAtmosphereFrameCount).toBeGreaterThan(0);
		await waitForCondition(
			frame.contentWindow,
			() => Number(canvas.dataset.flat32AtmosphereFrameCount) > firstAtmosphereFrameCount,
			'a subsequent Algorithm32 frame',
		);

		const context = canvas.getContext('webgl2');

		expect(context).not.toBeNull();
		expect(context.drawingBufferWidth).toBe(canvas.width);
		expect(context.drawingBufferHeight).toBe(canvas.height);
		expect(context.isContextLost()).toBeFalse();
		expect(context.getError()).toBe(context.NO_ERROR);

		const atmosphereButton = shell.querySelector('#flat32-atmosphere-control');

		expect(atmosphereButton instanceof frame.contentWindow.HTMLButtonElement).toBeTrue();
		expect(atmosphereButton.textContent.trim()).toBe('Atmosphere Shader: On');
		expect(atmosphereButton.getAttribute('aria-pressed')).toBe('true');
		atmosphereButton.click();
		expect(shell.dataset.flat32AtmosphereShader).toBe('bypassed');
		expect(canvas.dataset.flat32RenderPath).toBe('direct-three');
		expect(atmosphereButton.textContent.trim()).toBe('Atmosphere Shader: Off');
		expect(atmosphereButton.getAttribute('aria-pressed')).toBe('false');
		const directPixels = new Uint8Array(
			context.drawingBufferWidth * context.drawingBufferHeight * 4,
		);
		context.readPixels(
			0,
			0,
			context.drawingBufferWidth,
			context.drawingBufferHeight,
			context.RGBA,
			context.UNSIGNED_BYTE,
			directPixels,
		);
		let coloredScenePixelCount = 0;
		for (let index = 0; index < directPixels.length; index += 4) {
			const red = directPixels[index];
			const green = directPixels[index + 1];
			const blue = directPixels[index + 2];
			if (
				directPixels[index + 3] !== 0 &&
				(red !== green || green !== blue) &&
				(red !== 0 || green !== 0 || blue !== 0)
			) {
				coloredScenePixelCount += 1;
			}
		}
		expect(coloredScenePixelCount).toBeGreaterThan(0);
		expect(context.getError()).toBe(context.NO_ERROR);
		await waitForTwoFrames(frame.contentWindow);
		expect(shell.dataset.flat32State).toBe('ready');
		atmosphereButton.click();
		expect(shell.dataset.flat32AtmosphereShader).toBe('enabled');
		expect(canvas.dataset.flat32RenderPath).toBe('algorithm32');
		expect(atmosphereButton.textContent.trim()).toBe('Atmosphere Shader: On');

		const modeButton = shell.querySelector('#flat32-mode-control');

		expect(modeButton instanceof frame.contentWindow.HTMLButtonElement).toBeTrue();
		modeButton.click();
		expect(modeButton.textContent).toBe('Switch to Globe');
		expect(shell.dataset.flat32Mode).toBe('flat/local');
		expect(shell.dataset.flat32State).toBe('setting-up-atmosphere');
		expect(pairingState.textContent.trim()).toBe('Flat geometry \u00b7 local Sun');
		expect(status.textContent).toContain('flat/local');
		expect(status.textContent).toContain('Union Glacier');
		expect(status.textContent).toContain('Flat 0');
		expect(progress.getAttribute('aria-label')).toContain('flat/local');
		expect(progress.getAttribute('aria-label')).toContain('Union Glacier');
		expect(progress.getAttribute('aria-label')).toContain('Flat 0');
		expect(shell.dataset.flat32AtmospherePairing).toBe('spherical/distant');
		await waitForCondition(
			frame.contentWindow,
			() => shell.dataset.flat32AtmospherePairing === 'flat/local',
			'the transactional flat/local atmosphere replacement',
			300000,
		);
		expect(shell.dataset.flat32State).toBe('ready');
		expect(canvas.dataset.flat32RenderPath).toBe('algorithm32');
		expect(shell.dataset.flat32AtmospherePositionCount).toBe('285');
		expect(shell.dataset.flat32AtmosphereIncomingDirectionCount).toBe('68');
		expect(shell.dataset.flat32AtmosphereOutgoingDirectionCount).toBe('4374');
		expect(shell.dataset.flat32AtmosphereSpectralChannelCount).toBe('15');
		expect(shell.dataset.flat32AtmosphereObserverDome).toBe('true');
		expect(modeButton.textContent).toBe('Switch to Globe');
		expect(status.textContent).toContain('production flat/local path');
		expect(canvas.dataset.flat32SunTileGenerationStatus).toBe('ready');
		expect(canvas.dataset.flat32SunTileGenerationCompletion).toBe('complete');
		const flatZeroOutputPixel = shell.dataset.flat32AtmosphereOutputPixel;

		const flat180Button = shell.querySelector('button[data-flat32-time="4"]');

		expect(flat180Button instanceof frame.contentWindow.HTMLButtonElement).toBeTrue();
		flat180Button.click();
		expect(shell.dataset.flat32Time).toBe('Flat 180');
		expect(flat180Button.classList.contains('is-active')).toBeTrue();
		await waitForCondition(
			frame.contentWindow,
			() => shell.dataset.flat32State === 'setting-up-atmosphere' && status.textContent.includes('Flat 180'),
			'the Flat 180 atmosphere setup report',
		);
		expect(pairingState.textContent.trim()).toBe('Flat geometry \u00b7 local Sun');
		expect(status.textContent).toContain('flat/local');
		expect(status.textContent).toContain('Union Glacier');
		expect(progress.getAttribute('aria-label')).toContain('Flat 180');
		await waitForCondition(
			frame.contentWindow,
			() =>
				shell.dataset.flat32State === 'ready' &&
				shell.dataset.flat32AtmosphereOutputPixel !== flatZeroOutputPixel,
			'the Flat 180 atmosphere publication',
			300000,
		);
		expect(shell.dataset.flat32AtmospherePairing).toBe('flat/local');
		expect(status.textContent).toContain('production flat/local path');
		expect(shell.dataset.flat32AtmosphereOutputPixel).not.toBe(flatZeroOutputPixel);
		modeButton.click();
		expect(modeButton.textContent).toBe('Switch to Flat');
		expect(shell.dataset.flat32Mode).toBe('spherical/distant');
		expect(shell.dataset.flat32State).toBe('setting-up-atmosphere');
		expect(pairingState.textContent.trim()).toBe('Spherical geometry \u00b7 distant Sun');
		expect(status.textContent).toContain('Resolving the offline distant-Sun cache');
		expect(atmosphereState.textContent).toContain('resolving cache');
		expect(shell.dataset.flat32AtmospherePairing).toBe('flat/local');
		await waitForCondition(
			frame.contentWindow,
			() => shell.dataset.flat32AtmospherePairing === 'spherical/distant',
			'the transactional spherical/distant return replacement',
			300000,
		);
		expect(shell.dataset.flat32State).toBe('ready');
		expect(shell.dataset.flat32AtmospherePositionCount).toBe('48');
		expect(modeButton.textContent).toBe('Switch to Flat');
		expect(status.textContent).toContain('production spherical/distant path');
		const stellarGenerationCountBeforeResize = Number(canvas.dataset.flat32StellarGenerationCount);

		frame.style.width = '384px';
		frame.style.height = '320px';
		frame.contentWindow.dispatchEvent(new Event('resize'));
		await waitForCondition(
			frame.contentWindow,
			() => canvas.dataset.flat32ViewportWidth === '384',
			'the resized Flat32 host viewport',
		);
		const resizedViewportWidth = Math.round(canvas.getBoundingClientRect().width);
		const resizedViewportHeight = Math.round(canvas.getBoundingClientRect().height);
		const resizedPixelRatio = Number(canvas.dataset.flat32PixelRatio);

		expect(resizedViewportWidth).toBe(384);
		expect(resizedViewportHeight).toBe(320);
		expect(resizedPixelRatio).toBeGreaterThan(0);
		expect(canvas.width).toBe(Math.floor(resizedViewportWidth * resizedPixelRatio));
		expect(canvas.height).toBe(Math.floor(resizedViewportHeight * resizedPixelRatio));
		expect(canvas.clientWidth).toBe(resizedViewportWidth);
		expect(canvas.clientHeight).toBe(resizedViewportHeight);
		expect(context.drawingBufferWidth).toBe(canvas.width);
		expect(context.drawingBufferHeight).toBe(canvas.height);
		await waitForCondition(
			frame.contentWindow,
			() => Number(canvas.dataset.flat32StellarGenerationCount) > stellarGenerationCountBeforeResize,
			'the resized stellar generation pair',
		);
		expect(canvas.dataset.flat32StellarGenerationCompletion).toBe('complete');
		const contextExtension = context.getExtension('WEBGL_lose_context');
		expect(contextExtension).not.toBeNull();
		const atmosphereFrameCountBeforeContextLoss = Number(canvas.dataset.flat32AtmosphereFrameCount);
		contextExtension.loseContext();
		await waitForCondition(
			frame.contentWindow,
			() => canvas.dataset.flat32ContextState === 'lost',
			'the Flat32 context-loss boundary',
		);
		contextExtension.restoreContext();
		await waitForCondition(
			frame.contentWindow,
			() =>
				canvas.dataset.flat32ContextState === 'restored' &&
				canvas.dataset.flat32StellarGenerationCompletion === 'complete' &&
				canvas.dataset.flat32SunTileGenerationCompletion === 'complete' &&
				Number(canvas.dataset.flat32AtmosphereFrameCount) > atmosphereFrameCountBeforeContextLoss,
			'the rebuilt Flat32 atmosphere and stellar generation',
			300000,
		);
		expect(canvas.dataset.flat32RenderPath).toBe('algorithm32');
		expect(context.isContextLost()).toBeFalse();

		const locationButton = shell.querySelector('#flat32-location-control');
		const timeBasisButton = shell.querySelector('#flat32-time-basis-control');
		const sunsetButton = shell.querySelector('button[data-flat32-globe-time="2"]');
		const hourPlusButton = shell.querySelector('button[data-flat32-hour-offset="1"]');
		expect(locationButton instanceof frame.contentWindow.HTMLButtonElement).toBeTrue();
		expect(timeBasisButton instanceof frame.contentWindow.HTMLButtonElement).toBeTrue();
		expect(sunsetButton instanceof frame.contentWindow.HTMLButtonElement).toBeTrue();
		expect(hourPlusButton instanceof frame.contentWindow.HTMLButtonElement).toBeTrue();
		locationButton.click();
		locationButton.click();
		timeBasisButton.click();
		sunsetButton.click();
		hourPlusButton.click();
		hourPlusButton.click();
		await waitForCondition(
			frame.contentWindow,
			() =>
				shell.dataset.flat32Location === 'San Jose' &&
				shell.dataset.flat32Time === 'Sunset +2h' &&
				shell.dataset.flat32State === 'ready' &&
				shell.dataset.flat32DistantSunCacheState === 'dark',
			'the shared San Jose after-dark atmosphere publication',
			300000,
		);
		expect(Number(shell.dataset.flat32SolarZenithDegrees)).toBeGreaterThanOrEqual(108);
		expect(shell.dataset.flat32AtmospherePairing).toBe('spherical/distant');
		expect(canvas.dataset.flat32RenderPath).toBe('algorithm32');
		expect(shell.dataset.flat32AtmosphereRenderErrorCount).toBe('0');
		expect(atmosphereState.textContent).toContain('installed');
		expect(status.textContent).toContain('shared dark scattering state');
		expect(error.hidden).toBeTrue();

		expect(typeof frame.contentWindow.__flat32Cleanup).toBe('function');
		frame.contentWindow.__flat32Cleanup();
		const disposedFrameCount = Number(canvas.dataset.flat32FrameCount);
		const disposedAtmosphereFrameCount = Number(canvas.dataset.flat32AtmosphereFrameCount);

		expect(shell.dataset.flat32State).toBe('disposed');
		await waitForTwoFrames(frame.contentWindow);
		expect(Number(canvas.dataset.flat32FrameCount)).toBe(disposedFrameCount);
		expect(Number(canvas.dataset.flat32AtmosphereFrameCount)).toBe(disposedAtmosphereFrameCount);
	});
});
