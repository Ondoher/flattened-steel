/** Astronomical clock and contained runtime adapter for the creative San Jose day. */
export class CreativeSolarState {
	/**
	 * Creates an adapter around the already initialized production application.
	 *
	 * @param {CreativeSolarApplication} application - Browser-local application exposed by the capture runner.
	 */
	constructor(application) {
		if (!application?._modeController || !application._sceneRuntime || !application._state) {
			throw new TypeError('Creative solar state requires an initialized Flat32 application.');
		}
		this._application = application;
		this._durationSeconds = 60;
		/** @type {Flat32ApplicationState | null} */
		this._seed = null;
		/** @type {CreativeSolarTimelineKey[]} */
		this._timeline = [];
		/** @type {CreativeSolarLightingSample[]} */
		this._lightingSamples = [];
		/** @type {string | null} */
		this._activeBin = null;
		/** @type {DistantSunSceneCacheAssetSelection | undefined} */
		this._cacheAsset = undefined;
		this._initializing = false;
		this._initialized = false;
		/** @type {UnitVector3 | null} */
		this.sunriseDirectionScene = null;
		/** @type {UnitVector3 | null} */
		this.sunsetDirectionScene = null;
		this._modeChangeCount = 0;
	}

	/**
	 * Called by the timeline to construct one exact observation without changing the application.
	 *
	 * @param {number} milliseconds - UTC instant in milliseconds since the Unix epoch.
	 * @returns {Flat32ApplicationState} - Independent application observation.
	 */
	_stateAt(milliseconds) {
		if (this._seed === null) throw new Error('Creative solar timeline is not initialized.');
		return {
			...this._seed,
			observation: {...this._seed.observation, instant: new Date(Math.round(milliseconds)).toISOString()},
		};
	}

	/**
	 * Called by event solving to evaluate the production astronomical solar zenith.
	 *
	 * @param {number} milliseconds - Exact UTC instant.
	 * @returns {number} - Solar zenith in degrees.
	 */
	_zenithAt(milliseconds) {
		return this._application._createSphericalDistantSceneState(this._stateAt(milliseconds)).solarZenithDegrees;
	}

	/**
	 * Called by timeline construction to bisect one monotonic morning or evening event.
	 *
	 * @param {number} first - First bracket instant in UTC milliseconds.
	 * @param {number} last - Last bracket instant in UTC milliseconds.
	 * @param {number} zenith - Requested solar zenith in degrees.
	 * @returns {number} - Event instant, accurate to one millisecond.
	 */
	_solveEvent(first, last, zenith) {
		let lower = first;
		let upper = last;
		let lowerValue = this._zenithAt(lower) - zenith;
		const upperValue = this._zenithAt(upper) - zenith;
		if (lowerValue * upperValue > 0) throw new RangeError(`Solar zenith ${zenith} is outside the event bracket.`);
		while (upper - lower > 1) {
			const middle = Math.floor((lower + upper) / 2);
			const middleValue = this._zenithAt(middle) - zenith;
			if (lowerValue * middleValue <= 0) upper = middle;
			else {
				lower = middle;
				lowerValue = middleValue;
			}
		}
		return Math.round((lower + upper) / 2);
	}

	/**
	 * Called by initialization to derive shape-preserving Hermite clock slopes.
	 *
	 * @returns {void} - Slopes stored on the timeline keys.
	 */
	_deriveTimelineSlopes() {
		const intervals = this._timeline.slice(1).map((key, index) => key.seconds - this._timeline[index].seconds);
		const secants = intervals.map(
			(interval, index) =>
				(this._timeline[index + 1].milliseconds - this._timeline[index].milliseconds) / interval,
		);
		for (const [index, key] of this._timeline.entries()) {
			if (index === 0) key.slope = secants[0];
			else if (index === this._timeline.length - 1) key.slope = secants[secants.length - 1];
			else {
				const precedingInterval = intervals[index - 1];
				const followingInterval = intervals[index];
				const precedingWeight = 2 * followingInterval + precedingInterval;
				const followingWeight = followingInterval + 2 * precedingInterval;
				key.slope =
					(precedingWeight + followingWeight) /
					(precedingWeight / secants[index - 1] + followingWeight / secants[index]);
			}
		}
	}

	/**
	 * Called by frame preparation to evaluate the continuous monotonic astronomical clock.
	 *
	 * @param {number} seconds - Animation position in seconds.
	 * @returns {number} - UTC instant in milliseconds.
	 */
	_instantAt(seconds) {
		const position = Math.max(0, Math.min(this._durationSeconds, seconds));
		const index = Math.min(
			this._timeline.length - 2,
			Math.max(0, this._timeline.findIndex((key) => key.seconds > position) - 1),
		);
		if (position === this._durationSeconds) return this._timeline[this._timeline.length - 1].milliseconds;
		const first = this._timeline[index];
		const last = this._timeline[index + 1];
		const interval = last.seconds - first.seconds;
		const fraction = (position - first.seconds) / interval;
		const square = fraction * fraction;
		const cube = square * fraction;
		return (
			(2 * cube - 3 * square + 1) * first.milliseconds +
			(cube - 2 * square + fraction) * interval * first.slope +
			(-2 * cube + 3 * square) * last.milliseconds +
			(cube - square) * interval * last.slope
		);
	}

	/**
	 * Called by frame preparation to install a production GPU runtime only when its cache coverage changes.
	 *
	 * @param {Flat32ApplicationState} state - Exact requested astronomical observation.
	 * @param {number} zenith - Exact solar zenith in degrees.
	 * @returns {Promise<boolean>} - Whether a new runtime was published.
	 */
	async _ensureRuntime(state, zenith) {
		const bin = zenith >= 108 ? 'dark' : String(Math.floor(zenith + 0.5));
		this._application._state = state;
		if (bin === this._activeBin) return false;
		const summary = await this._application._modeController.switchTo('spherical-distant', state);
		if (summary === null) throw new Error('Creative solar cache transition was superseded.');
		this._activeBin = bin;
		this._modeChangeCount += 1;
		this._cacheAsset = this._application._modeController._activeMode.lightSource.configuration.sceneCacheAsset;
		return true;
	}

	/**
	 * Called by preparation to create CPU-only, exact-time model owners beside the resident cache.
	 *
	 * @param {Flat32DistantSunSceneState} sceneState - Exact production astronomical solution.
	 * @returns {CreativeSolarMode} - Temporary mode whose facade must be disposed after use.
	 */
	_createExactMode(sceneState) {
		return this._application._createSphericalDistantMode(
			sceneState,
			this._cacheAsset,
			sceneState.solarZenithDegrees >= 108 ? 'dark' : 'ready',
		);
	}

	/**
	 * Called by lighting preparation to measure the current physical model through the resident GPU cache.
	 * The local handle delegates the existing measurement implementation while publishing only to the temporary facade.
	 *
	 * @param {CreativeSolarMode} exactMode - Exact-time CPU model paired with the currently covered cache.
	 * @returns {Promise<ReceiverEnvironmentLightMeasurement>} - Measured direct and diffuse receiver light.
	 */
	async _measureLight(exactMode) {
		const runtime = this._application._modeController._activeRuntime;
		const handle = /** @type {CreativeSolarShaderHandle} */ (Object.create(runtime._shaderHandle));
		handle._facade = exactMode.algorithm32;
		const celestial = runtime._shaderHandle._buildResult.celestialGenerationParticipant;
		return handle.measureReceiverEnvironmentLight({
			THREE: celestial._sun._THREE,
			renderer: this._application._sceneRuntime.renderer,
			backend: runtime._cacheBackend,
		});
	}

	/**
	 * Called by animation frames to interpolate measured diffuse spectra and sky adaptation.
	 *
	 * @param {number} seconds - Animation position in seconds.
	 * @param {CreativeSolarMode} exactMode - Exact-time direct-spectrum owner.
	 * @returns {ReceiverEnvironmentLightMeasurement} - Complete smooth receiver-light measurement.
	 */
	_interpolateLight(seconds, exactMode) {
		let following = this._lightingSamples.findIndex((sample) => sample.seconds >= seconds);
		if (following < 0) following = this._lightingSamples.length - 1;
		const first = this._lightingSamples[Math.max(0, following - 1)];
		const last = this._lightingSamples[following];
		const fraction =
			first === last ? 0 : Math.max(0, Math.min(1, (seconds - first.seconds) / (last.seconds - first.seconds)));
		const spectralMath = this._application._creativeSpectralMath;
		if (!spectralMath) throw new Error('Creative animation requires the production SpectralMath exposure.');
		const diffuseHorizontal = /** @type {SpectralIrradiancePacket} */ (
			spectralMath.addSpectralPackets(
				spectralMath.scaleSpectralPacket(first.measurement.diffuseHorizontal, 1 - fraction),
				spectralMath.scaleSpectralPacket(last.measurement.diffuseHorizontal, fraction),
			)
		);
		const direct = exactMode.algorithm32.receiverLight;
		return exactMode.algorithm32._localLightLevelCalculator.combineReceiverLight({
			identity: `creative-receiver:${exactMode.algorithm32.config.config.observation.instant}:${diffuseHorizontal.contentHash}`,
			directNormal: direct.directNormal,
			directHorizontal: direct.directHorizontal,
			diffuseHorizontal,
			stellarAdaptationLuminance: {
				value:
					first.measurement.stellarAdaptationLuminance.value +
					fraction *
						(last.measurement.stellarAdaptationLuminance.value -
							first.measurement.stellarAdaptationLuminance.value),
				units: 'cd m^-2',
			},
		});
	}

	/**
	 * Called by frame application to synchronize production Sun, stellar, and physical-light bindings.
	 *
	 * @param {CreativeSolarMode} exactMode - Exact observation and source placement.
	 * @param {ReceiverEnvironmentLightMeasurement} receiverLight - Current direct and diffuse measurement.
	 * @returns {void} - Updated resident runtime bindings; rendering remains caller-owned.
	 */
	_publishBindings(exactMode, receiverLight) {
		const controller = this._application._modeController;
		const runtime = controller._activeRuntime;
		const config = exactMode.algorithm32.config.config;
		const geometry = exactMode.geometry;
		const direction = geometry.configuration.directionToSource;
		const atmospherePass = runtime._composer.passes.find((pass) => pass.uniforms?.uDistantSunDirection);
		if (!atmospherePass) throw new Error('Creative atmosphere source-direction uniform is unavailable.');
		atmospherePass.uniforms.uDistantSunDirection.value = [...direction];
		const celestial = runtime._shaderHandle._buildResult.celestialGenerationParticipant;
		celestial._sun._geometry = geometry;
		celestial._sun._observation = config.observation;
		celestial._sun._placement = geometry.resolveCelestialPlacements({
			roster: config.celestialSources,
			observation: config.observation,
		})[0];
		celestial._sun.markDirty('view');
		const stellar = celestial._stellar;
		if (stellar) {
			stellar._geometry = geometry;
			stellar._observation = config.observation;
			stellar._geometryContribution = geometry.createStellarGenerationShaderContribution({
				observation: config.observation,
			});
			for (const declaration of stellar._geometryContribution.uniforms) {
				if (!declaration.valueKey.startsWith('geometry.stellar')) continue;
				for (const uniforms of [stellar._pointUniforms, stellar._paletteUniforms]) {
					uniforms[declaration.name].value = declaration.defaultValue;
				}
			}
			stellar.markDirty('configuration');
		}
		const algorithm = controller._activeMode.algorithm32;
		algorithm._receiverEnvironmentLightController._active = receiverLight;
		algorithm._colorRuntimeBindingValues['color.totalHorizontalIlluminance.value'] =
			receiverLight.photopicTotalHorizontalIlluminance.value;
		algorithm._colorRuntimeBindingValues['presentation.stellar.adaptationLuminanceCdM2'] =
			receiverLight.stellarAdaptationLuminance.value;
		algorithm._colorRuntimeBindingValues['presentation.stellar.receiverLightIdentity'] = receiverLight.identity;
		algorithm.setAdaptingLuminance(receiverLight.totalHorizontalLuminanceProxy);
		this._application._endpointScene.updateDistantSunLighting(direction, receiverLight, config.color);
		this._application._sceneRuntime.refreshShadowMaps();
	}

	/**
	 * Called by initialization to retain one-second actual GPU receiver measurements.
	 *
	 * @param {CreativeSolarInitializeOptions} options - Optional awaited progress publisher.
	 * @returns {Promise<void>} - Complete measured table for subsequent interpolation.
	 */
	async _prepareLighting(options) {
		const sampleCount = Math.ceil(this._durationSeconds) + 1;
		for (let index = 0; index < sampleCount; index += 1) {
			const seconds = Math.min(this._durationSeconds, index);
			const state = this._stateAt(this._instantAt(seconds));
			const sceneState = this._application._createSphericalDistantSceneState(state);
			await this._ensureRuntime(state, sceneState.solarZenithDegrees);
			const exactMode = this._createExactMode(sceneState);
			try {
				this._lightingSamples.push({
					seconds,
					instant: state.observation.instant,
					measurement: await this._measureLight(exactMode),
				});
			} finally {
				exactMode.dispose();
			}
			await options.onProgress?.({
				phase: 'prepare-lighting',
				completed: index + 1,
				total: sampleCount,
				message: `Measured receiver light ${index + 1}/${sampleCount}.`,
			});
		}
	}

	/**
	 * Call this method to resolve the real summer-day events and optionally premeasure smooth diffuse lighting.
	 * A later call with the same duration may prepare the previously omitted lighting table.
	 * Initialization rejects if a production cache or receiver measurement fails; callers must abort that run.
	 *
	 * @param {CreativeSolarInitializeOptions} [options] - Duration, lighting preparation, and progress publication.
	 * @returns {Promise<CreativeSolarDescription>} - Exact events and retained lighting policy.
	 */
	async initialize(options = {}) {
		if (this._initializing) throw new Error('Creative solar initialization is already active.');
		const durationSeconds = options.durationSeconds ?? 60;
		if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
			throw new RangeError('Animation duration must be positive.');
		if (this._initialized) {
			if (durationSeconds !== this._durationSeconds)
				throw new RangeError('An initialized astronomical duration cannot change.');
			if (options.prepareLighting !== false && this._lightingSamples.length === 0) {
				this._initializing = true;
				try {
					await this._prepareLighting(options);
				} finally {
					this._initializing = false;
				}
			}
			return this.describe();
		}
		this._durationSeconds = durationSeconds;
		this._initializing = true;
		const application = this._application;
		application._cancelLocationTimeRefresh();
		const sceneRuntime = application._sceneRuntime;
		if (sceneRuntime._frameRequest !== null) window.cancelAnimationFrame(sceneRuntime._frameRequest);
		sceneRuntime._frameRequest = null;
		sceneRuntime._started = false;
		let selected = application._state;
		for (let attempt = 0; selected.locationLabel !== 'San Jose' && attempt < 8; attempt += 1) {
			selected = {...application._locationTimeController.nextLocation(selected), modeKind: 'spherical-distant'};
		}
		if (selected.locationLabel !== 'San Jose') throw new Error('Production San Jose location is unavailable.');
		this._seed = {
			...application._locationTimeController.selectGlobeTime(selected, 1),
			modeKind: 'spherical-distant',
		};
		const noon = Date.parse(this._seed.observation.instant);
		const halfDay = 12 * 60 * 60 * 1000;
		const events = [
			{seconds: 0, zenith: 110, morning: true},
			{seconds: 7, zenith: 96, morning: true},
			{seconds: 12, zenith: 90, morning: true},
			{seconds: 18, zenith: 78, morning: true},
			{seconds: 30, zenith: this._zenithAt(noon), morning: false},
			{seconds: 42, zenith: 78, morning: false},
			{seconds: 48, zenith: 90, morning: false},
			{seconds: 53, zenith: 96, morning: false},
			{seconds: 60, zenith: 110, morning: false},
		];
		this._timeline = events.map((event) => ({
			seconds: (event.seconds * durationSeconds) / 60,
			milliseconds:
				event.seconds === 30
					? noon
					: this._solveEvent(
							event.morning ? noon - halfDay : noon,
							event.morning ? noon : noon + halfDay,
							event.zenith,
						),
			solarZenithDegrees: event.zenith,
			slope: 0,
		}));
		this._deriveTimelineSlopes();
		const sunrise = application._createSphericalDistantSceneState(this._stateAt(this._timeline[2].milliseconds));
		const sunset = application._createSphericalDistantSceneState(this._stateAt(this._timeline[6].milliseconds));
		this.sunriseDirectionScene = sunrise.geometry.expressCelestialDirectionInScene(sunrise.directionToSourceModel);
		this.sunsetDirectionScene = sunset.geometry.expressCelestialDirectionInScene(sunset.directionToSourceModel);
		if (options.prepareLighting !== false) await this._prepareLighting(options);
		this._initializing = false;
		this._initialized = true;
		return this.describe();
	}

	/**
	 * Call this method to apply an ideal animation instant before the caller updates its camera and renders.
	 * Cache and measurement failures reject without authorizing a partial capture.
	 *
	 * @param {number} seconds - Animation position within the initialized duration.
	 * @returns {Promise<CreativeSolarFrame>} - Exact astronomical state and current physical scene lighting.
	 */
	async apply(seconds) {
		if (!this._initialized) throw new Error('Creative solar state must be initialized before applying a frame.');
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > this._durationSeconds) {
			throw new RangeError('Creative animation time is outside the initialized duration.');
		}
		const state = this._stateAt(this._instantAt(seconds));
		const sceneState = this._application._createSphericalDistantSceneState(state);
		const modeChanged = await this._ensureRuntime(state, sceneState.solarZenithDegrees);
		const exactMode = this._createExactMode(sceneState);
		try {
			const receiverLight =
				this._lightingSamples.length > 0
					? this._interpolateLight(seconds, exactMode)
					: await this._measureLight(exactMode);
			this._publishBindings(exactMode, receiverLight);
			return {
				animationSeconds: seconds,
				instant: state.observation.instant,
				solarZenithDegrees: sceneState.solarZenithDegrees,
				directionToSunModel: sceneState.directionToSourceModel,
				directionToSunScene: exactMode.geometry.expressCelestialDirectionInScene(
					sceneState.directionToSourceModel,
				),
				receiverLight,
				colorDisplayModel: exactMode.algorithm32.config.config.color,
				cacheIdentity: this._cacheAsset?.loadRequest.cacheIdentity ?? 'algorithm32-procedural-dark-scattering',
				modeChanged,
				geometry: exactMode.geometry,
			};
		} finally {
			exactMode.dispose();
		}
	}

	/**
	 * Call this method to describe the astronomical timeline and actual lighting approximation used by the run.
	 *
	 * @returns {CreativeSolarDescription} - Current replay and illumination provenance.
	 */
	describe() {
		return {
			durationSeconds: this._durationSeconds,
			location: 'San Jose',
			timeline: this._timeline.map((key) => ({...key, instant: new Date(key.milliseconds).toISOString()})),
			sunriseDirectionScene: this.sunriseDirectionScene,
			sunsetDirectionScene: this.sunsetDirectionScene,
			lightingPolicy:
				this._lightingSamples.length > 0
					? 'Exact-time direct spectra; linear interpolation of one-second GPU-measured Native15 diffuse spectra and measured sky adaptation.'
					: 'Exact-time direct and GPU-measured Native15 diffuse spectra at every requested frame.',
			lightingSampleCount: this._lightingSamples.length,
			modeChangeCount: this._modeChangeCount,
		};
	}
}
