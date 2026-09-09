const FRAME_BUDGET_MICROSECONDS = 1_000_000 / 60;

const fail = (value, message) => {
	if (!value) throw new Error(message);
	return value;
};

const microseconds = (milliseconds) => Math.round(milliseconds * 1000);
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const percentile = (values, fraction) => {
	const sorted = [...values].sort((left, right) => left - right);
	return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
};

function scenarioState(elapsedMicroseconds, durationMicroseconds) {
	const boundedElapsed = Math.max(0, Math.min(durationMicroseconds, elapsedMicroseconds));
	const progress = boundedElapsed / durationMicroseconds;
	const solarZenithDegrees = 90 - 60 * Math.sin(Math.PI * progress);
	const solarAzimuthDegrees = 90 + 180 * progress;
	const zenith = (solarZenithDegrees * Math.PI) / 180;
	const azimuth = (solarAzimuthDegrees * Math.PI) / 180;
	const directionToSunUpEastNorth = [
		Math.cos(zenith),
		Math.sin(zenith) * Math.sin(azimuth),
		Math.sin(zenith) * Math.cos(azimuth),
	];
	return {
		requestedElapsedMicroseconds: boundedElapsed,
		scenarioProgress: progress,
		solarZenithDegrees,
		solarAzimuthDegrees,
		directionToSunUpEastNorth,
		directionToSunModel: [
			directionToSunUpEastNorth[1],
			directionToSunUpEastNorth[2],
			directionToSunUpEastNorth[0],
		],
		cameraTargetUpEastNorth: [...directionToSunUpEastNorth],
		cameraTargetScene: [
			directionToSunUpEastNorth[1],
			directionToSunUpEastNorth[0],
			-directionToSunUpEastNorth[2],
		],
		cacheSceneDegrees: Math.max(30, Math.min(90, Math.floor(solarZenithDegrees + 0.5))),
		qualityIntervalCount: 10,
	};
}

function applyState(application, state) {
	const sceneRuntime = application._sceneRuntime;
	const runtime = application._modeController._activeRuntime;
	const mode = application._modeController._activeMode;
	const celestial = runtime._shaderHandle._buildResult.celestialGenerationParticipant;
	fail(celestial?._sun?._placement, 'S9.3 Sun generation participant is unavailable.');

	const camera = sceneRuntime.camera;
	camera.up.set(0, 1, 0);
	camera.lookAt(
		camera.position.x + state.cameraTargetScene[0],
		camera.position.y + state.cameraTargetScene[1],
		camera.position.z + state.cameraTargetScene[2],
	);
	camera.updateMatrixWorld(true);
	celestial._sun._placement = {
		...celestial._sun._placement,
		directionToSource: [...state.directionToSunModel],
	};
	celestial._sun.markDirty('view');
	application._endpointScene.updateDistantSunLighting(
		state.directionToSunModel,
		mode.algorithm32.receiverLight,
		mode.algorithm32.config.config.color,
	);
	sceneRuntime.refreshShadowMaps();
	window.__s9SharedPacketShader.setState({
		sceneOrdinal: state.cacheSceneDegrees - 30,
		directionToSunModel: state.directionToSunModel,
		qualityIntervalCount: state.qualityIntervalCount,
	});
	window.__s9SharedPacketShader.setEnabled(true);
}

function renderOneFrame(application) {
	const sceneRuntime = application._sceneRuntime;
	const runtimeArtifact = application._modeController._activeRuntime._shaderHandle._buildResult.runtime;
	const shaderFrameCount = runtimeArtifact.getDiagnostics().frameCount;
	const started = performance.now();
	sceneRuntime._renderOperation();
	const ended = performance.now();
	sceneRuntime._frameCount += 1;
	sceneRuntime.canvas.dataset.flat32FrameCount = String(sceneRuntime._frameCount);
	const sun = application._modeController._activeRuntime._shaderHandle._buildResult.celestialGenerationParticipant._sun;
	const center = [...sun.bindingValues()['runtime.celestial.sunScreenCenterPixels']];
	return {
		shaderFrameCount,
		cpuStartedMilliseconds: started,
		cpuEndedMilliseconds: ended,
		sunScreenCenterPixels: center,
		sunScreenCenterErrorPixels: Math.hypot(
			center[0] - sceneRuntime.canvas.width / 2,
			center[1] - sceneRuntime.canvas.height / 2,
		),
	};
}

async function drainGpuQueries(application, maximumMilliseconds) {
	const sceneRuntime = application._sceneRuntime;
	const timer = application._modeController._activeRuntime._composer.passes.find(
		(pass) => pass?._performanceTimer?._passName === 'algorithm32-runtime-shader',
	)?._performanceTimer;
	fail(timer, 'S9.3 could not locate the production runtime GPU timer.');
	const started = performance.now();
	let polls = 0;
	while (timer._pendingQueries.length > 0 && performance.now() - started < maximumMilliseconds) {
		await new Promise((resolve) => requestAnimationFrame(resolve));
		timer.poll(sceneRuntime.renderer);
		polls += 1;
	}
	return {polls, pendingQueryCount: timer._pendingQueries.length, elapsedMilliseconds: performance.now() - started};
}

function correlatePerformance(frames, samples) {
	const samplesByFrame = new Map();
	for (const sample of samples) {
		if (sample.passName !== 'algorithm32-runtime-shader' || !Number.isInteger(sample.frameCount)) continue;
		let events = samplesByFrame.get(sample.frameCount);
		if (!events) {
			events = [];
			samplesByFrame.set(sample.frameCount, events);
		}
		events.push(sample);
	}
	for (const frame of frames) {
		const events = samplesByFrame.get(frame.shaderFrameCount) ?? [];
		const cpu = events.find((event) => event.event === 'cpu-submit');
		const gpu = events.find((event) => event.event === 'gpu-elapsed');
		const error = events.find((event) => event.event === 'gpu-query-error');
		frame.shaderCpuSubmitMicroseconds = cpu?.cpuSubmitDuration
			? microseconds(cpu.cpuSubmitDuration.value * 1000)
			: null;
		frame.gpuElapsedMicroseconds = gpu?.gpuDuration ? microseconds(gpu.gpuDuration.value * 1000) : null;
		frame.gpuTimerDisjoint = gpu?.disjoint ?? null;
		frame.gpuTimerSampleId = cpu?.sampleId ?? gpu?.sampleId ?? error?.sampleId ?? null;
		frame.gpuTimerOutcome = gpu
			? gpu.disjoint
				? 'disjoint'
				: gpu.gpuDuration
					? 'complete'
					: 'completed-without-duration'
			: error
				? 'query-error'
				: cpu
					? 'cpu-only-unresolved'
					: 'not-issued-pending-limit';
		frame.gpuTimerError = error?.errorMessage ?? null;
	}
}

function summarize(frames, drain) {
	const intervals = frames.slice(1).map(
		(frame, index) => frame.animationCallbackMicroseconds - frames[index].animationCallbackMicroseconds,
	);
	const gpuValues = frames
		.filter((frame) => frame.gpuTimerOutcome === 'complete')
		.map((frame) => frame.gpuElapsedMicroseconds);
	const cpuValues = frames.map(
		(frame) => frame.cpuSubmissionEndMicroseconds - frame.cpuSubmissionStartMicroseconds,
	);
	const worstOnePercentCount = Math.max(1, Math.ceil(intervals.length * 0.01));
	const worstOnePercentIntervals = [...intervals]
		.sort((left, right) => right - left)
		.slice(0, worstOnePercentCount);
	const expectedPresentationSlotCount =
		Math.floor(frames.at(-1).animationCallbackMicroseconds / FRAME_BUDGET_MICROSECONDS) + 1;
	const missedPresentationSlots = Math.max(0, expectedPresentationSlotCount - frames.length);
	const hitches = [];
	for (let index = 1; index < frames.length; index += 1) {
		const frame = frames[index];
		const callbackIntervalMicroseconds = intervals[index - 1];
		if (callbackIntervalMicroseconds <= FRAME_BUDGET_MICROSECONDS * 1.5) continue;
		const attribution = [];
		if ((frame.gpuElapsedMicroseconds ?? 0) > FRAME_BUDGET_MICROSECONDS)
			attribution.push('gpu-duration-over-60hz-budget');
		if (
			frame.cpuSubmissionEndMicroseconds - frame.cpuSubmissionStartMicroseconds >
			FRAME_BUDGET_MICROSECONDS
		)
			attribution.push('cpu-submission-over-60hz-budget');
		if (frame.cacheEvents.length > 0) attribution.push('cache-scene-transition');
		if (attribution.length === 0) attribution.push('callback-cadence-gap');
		hitches.push({
			frameId: frame.frameId,
			callbackIntervalMicroseconds,
			missedPresentationSlots: Math.max(
				0,
				Math.round(callbackIntervalMicroseconds / FRAME_BUDGET_MICROSECONDS) - 1,
			),
			gpuElapsedMicroseconds: frame.gpuElapsedMicroseconds,
			cpuSubmissionMicroseconds:
				frame.cpuSubmissionEndMicroseconds - frame.cpuSubmissionStartMicroseconds,
			cacheEvents: frame.cacheEvents,
			attribution,
		});
	}
	const outcomeCounts = Object.fromEntries(
		[...new Set(frames.map((frame) => frame.gpuTimerOutcome))]
			.sort()
			.map((outcome) => [outcome, frames.filter((frame) => frame.gpuTimerOutcome === outcome).length]),
	);
	const transitionFrames = frames.filter((frame) => frame.cacheEvents.length > 0);
	const stableFrames = frames.filter((frame) => frame.cacheEvents.length === 0);
	const transitionGpu = transitionFrames
		.map((frame) => frame.gpuElapsedMicroseconds)
		.filter((value) => value !== null);
	const stableGpu = stableFrames
		.map((frame) => frame.gpuElapsedMicroseconds)
		.filter((value) => value !== null);
	const callbackIntervalFor = (selectedFrames) =>
		selectedFrames
			.filter((frame) => frame.frameId > 0)
			.map(
				(frame) =>
					frame.animationCallbackMicroseconds -
					frames[frame.frameId - 1].animationCallbackMicroseconds,
			);
	const transitionIntervals = callbackIntervalFor(transitionFrames);
	const stableIntervals = callbackIntervalFor(stableFrames);
	return {
		submittedFrameCount: frames.length,
		expectedPresentationSlotCount,
		traceElapsedMicroseconds: frames.at(-1).animationCallbackMicroseconds,
		meanFramesPerSecond:
			((frames.length - 1) * 1_000_000) /
			(frames.at(-1).animationCallbackMicroseconds - frames[0].animationCallbackMicroseconds),
		onePercentLowFramesPerSecond: 1_000_000 / mean(worstOnePercentIntervals),
		missedPresentationSlots,
		longestVisibleHoldMicroseconds: Math.max(...intervals),
		callbackCadence: {
			meanIntervalMicroseconds: mean(intervals),
			medianIntervalMicroseconds: percentile(intervals, 0.5),
			p95IntervalMicroseconds: percentile(intervals, 0.95),
			p99IntervalMicroseconds: percentile(intervals, 0.99),
		},
		cpuSubmission: {
			meanMicroseconds: mean(cpuValues),
			medianMicroseconds: percentile(cpuValues, 0.5),
			p95Microseconds: percentile(cpuValues, 0.95),
			maximumMicroseconds: Math.max(...cpuValues),
		},
		gpuTimer: {
			outcomeCounts,
			completeFraction: gpuValues.length / frames.length,
			meanMicroseconds: gpuValues.length > 0 ? mean(gpuValues) : null,
			medianMicroseconds: gpuValues.length > 0 ? percentile(gpuValues, 0.5) : null,
			p95Microseconds: gpuValues.length > 0 ? percentile(gpuValues, 0.95) : null,
			maximumMicroseconds: gpuValues.length > 0 ? Math.max(...gpuValues) : null,
			drain,
		},
		cacheTransitionCount: frames.reduce((sum, frame) => sum + frame.cacheEvents.length, 0),
		cacheTransitionComparison: {
			transitionFrameCount: transitionFrames.length,
			stableFrameCount: stableFrames.length,
			meanTransitionCallbackIntervalMicroseconds: mean(transitionIntervals),
			meanStableCallbackIntervalMicroseconds: mean(stableIntervals),
			meanTransitionGpuMicroseconds: mean(transitionGpu),
			meanStableGpuMicroseconds: mean(stableGpu),
		},
		repeatedCacheStateFrameCount: frames.filter((frame) => frame.cacheEvents.length === 0).length,
		skippedCacheDegreeFrameCount: frames.filter((frame) =>
			frame.cacheEvents.some(
				(event) =>
					event.type === 'scene-selection' &&
					event.fromDegrees !== null &&
					Math.abs(event.toDegrees - event.fromDegrees) > 1,
			),
		).length,
		lateFrameCount: hitches.length,
		hitches,
	};
}

export async function runS9AnimationTrace(configuration) {
	const durationMicroseconds = configuration.durationMicroseconds;
	fail(durationMicroseconds === 20_000_000, 'S9.3 duration changed.');
	const application = fail(window.__flat32S9Application, 'S9.3 application exposure is unavailable.');
	const sceneRuntime = application._sceneRuntime;
	const canvas = sceneRuntime.canvas;
	const gl = fail(canvas.getContext('webgl2'), 'S9.3 WebGL2 context is unavailable.');
	const timerExtension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
	fail(timerExtension, 'S9.3 requires EXT_disjoint_timer_query_webgl2.');
	fail(
		gl.drawingBufferWidth === configuration.width && gl.drawingBufferHeight === configuration.height,
		'S9.3 drawing buffer dimensions changed.',
	);
	fail(sceneRuntime._started === true, 'S9.3 production frame loop is not active.');
	if (sceneRuntime._frameRequest !== null) {
		cancelAnimationFrame(sceneRuntime._frameRequest);
		sceneRuntime._frameRequest = null;
	}
	const runtimeTimer = application._modeController._activeRuntime._composer.passes.find(
		(pass) => pass?._performanceTimer?._passName === 'algorithm32-runtime-shader',
	)?._performanceTimer;
	fail(runtimeTimer, 'S9.3 could not configure the production runtime GPU timer.');
	const originalMaximumPendingQueries = runtimeTimer._maxPendingQueries;
	runtimeTimer._maxPendingQueries = 32;

	const warmupState = scenarioState(0, durationMicroseconds);
	applyState(application, warmupState);
	for (let index = 0; index < 8; index += 1) {
		await new Promise((resolve) => requestAnimationFrame(resolve));
		renderOneFrame(application);
	}
	await drainGpuQueries(application, 5_000);
	window.__flat32PerformanceSamples.length = 0;

	const frames = [];
	let previousCacheDegrees = null;
	let animationStartMilliseconds = null;
	let requestIssuedMilliseconds = performance.now();
	await new Promise((resolve, reject) => {
		const tick = (callbackMilliseconds) => {
			try {
				if (animationStartMilliseconds === null) animationStartMilliseconds = callbackMilliseconds;
				const callbackElapsedMicroseconds = microseconds(
					callbackMilliseconds - animationStartMilliseconds,
				);
				const state = scenarioState(callbackElapsedMicroseconds, durationMicroseconds);
				const cacheEvents = [];
				if (state.cacheSceneDegrees !== previousCacheDegrees) {
					cacheEvents.push({
						type: 'scene-selection',
						fromDegrees: previousCacheDegrees,
						toDegrees: state.cacheSceneDegrees,
						sceneOrdinal: state.cacheSceneDegrees - 30,
						publication: 'whole-route-resident-metadata-switch',
					});
					previousCacheDegrees = state.cacheSceneDegrees;
				}
				applyState(application, state);
				const rendered = renderOneFrame(application);
				const frame = {
					frameId: frames.length,
					requestIssuedMicroseconds:
						animationStartMilliseconds === callbackMilliseconds
							? 0
							: microseconds(requestIssuedMilliseconds - animationStartMilliseconds),
					requestedElapsedMicroseconds: state.requestedElapsedMicroseconds,
					animationCallbackMicroseconds: callbackElapsedMicroseconds,
					scenarioProgress: state.scenarioProgress,
					solarZenithDegrees: state.solarZenithDegrees,
					solarAzimuthDegrees: state.solarAzimuthDegrees,
					directionToSunUpEastNorth: state.directionToSunUpEastNorth,
					cameraTargetUpEastNorth: state.cameraTargetUpEastNorth,
					directionToSunModel: state.directionToSunModel,
					cacheSceneDegrees: state.cacheSceneDegrees,
					qualityIntervalCount: state.qualityIntervalCount,
					cpuSubmissionStartMicroseconds: microseconds(
						rendered.cpuStartedMilliseconds - animationStartMilliseconds,
					),
					cpuSubmissionEndMicroseconds: microseconds(
						rendered.cpuEndedMilliseconds - animationStartMilliseconds,
					),
					shaderFrameCount: rendered.shaderFrameCount,
					sunScreenCenterPixels: rendered.sunScreenCenterPixels,
					sunScreenCenterErrorPixels: rendered.sunScreenCenterErrorPixels,
					cacheEvents,
				};
				frames.push(frame);
				if (callbackElapsedMicroseconds >= durationMicroseconds) {
					sceneRuntime._frameRequest = null;
					resolve();
					return;
				}
				requestIssuedMilliseconds = performance.now();
				sceneRuntime._frameRequest = requestAnimationFrame(tick);
			} catch (error) {
				sceneRuntime._frameRequest = null;
				reject(error);
			}
		};
		sceneRuntime._frameRequest = requestAnimationFrame(tick);
	});

	const drain = await drainGpuQueries(application, 10_000);
	const performanceSamples = [...window.__flat32PerformanceSamples];
	correlatePerformance(frames, performanceSamples);
	const summary = summarize(frames, drain);
	const webglError = gl.getError();
	return {
		frames,
		summary,
		browser: {
			drawingBuffer: {width: gl.drawingBufferWidth, height: gl.drawingBufferHeight},
			timerExtension: 'EXT_disjoint_timer_query_webgl2',
			timerMaximumPendingQueries: {
				production: originalMaximumPendingQueries,
				traceInstrumentation: runtimeTimer._maxPendingQueries,
			},
			performanceSampleCount: performanceSamples.length,
			webglError,
			contextLost: gl.isContextLost(),
			shaderHook: window.__s9SharedPacketShader.diagnostics(),
		},
	};
}
