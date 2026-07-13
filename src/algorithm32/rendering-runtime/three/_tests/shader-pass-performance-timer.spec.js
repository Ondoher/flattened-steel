import {ShaderPassPerformanceTimer} from '../ShaderPassPerformanceTimer.js';

/**
 * Called by this module to create a renderer without timer-query support.
 *
 * @returns {object} - Return renderer double.
 */
function createRendererWithoutTimerSupport() {
	return {
		/**
		 * Call this method to read context.
		 * @returns - The result produced by the operation.
		 */ getContext() {
			return {
				/**
				 * Call this method to read extension.
				 * @returns - The result produced by the operation.
				 */ getExtension() {
					return null;
				},
			};
		},
	};
}

/**
 * Called by this module to create a renderer with WebGL2 disjoint timer query support.
 *
 * @returns {object} - Return renderer double.
 */
function createRendererWithTimerSupport() {
	const query = {};
	let available = false;
	const context = {
		QUERY_RESULT_AVAILABLE: 'QUERY_RESULT_AVAILABLE',
		QUERY_RESULT: 'QUERY_RESULT',
		/**
		 * Call this method to create query.
		 * @returns - The result produced by the operation.
		 */ createQuery() {
			return query;
		},
		/**
		 * Call this method to begin query.
		 * @param target - The target value accepted by the operation.
		 * @param activeQuery - The active query value accepted by the operation.
		 */ beginQuery(target, activeQuery) {
			this.beginTarget = target;
			this.activeQuery = activeQuery;
		},
		/**
		 * Call this method to end query.
		 * @param target - The target value accepted by the operation.
		 */ endQuery(target) {
			this.endTarget = target;
		},
		/**
		 * Call this method to read query parameter. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
		 * @param activeQuery - The active query value accepted by the operation.
		 * @param parameter - The parameter value accepted by the operation.
		 * @returns - The result produced by the operation.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ getQueryParameter(activeQuery, parameter) {
			if (activeQuery !== query) {
				throw new Error('Unexpected query.');
			}

			if (parameter === 'QUERY_RESULT_AVAILABLE') {
				return available;
			}

			if (parameter === 'QUERY_RESULT') {
				return 2500000;
			}

			throw new Error(`Unexpected query parameter ${parameter}.`);
		},
		/**
		 * Call this method to read parameter.
		 * @param parameter - The parameter value accepted by the operation.
		 * @returns - The result produced by the operation.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ getParameter(parameter) {
			if (parameter === 'GPU_DISJOINT_EXT') {
				return false;
			}

			throw new Error(`Unexpected parameter ${parameter}.`);
		},
		/**
		 * Call this method to delete query.
		 * @param activeQuery - The active query value accepted by the operation.
		 */ deleteQuery(activeQuery) {
			this.deletedQuery = activeQuery;
		},
		/**
		 * Call this method to read extension. Conditional result values are selected from the accepted input and current state.
		 * @param name - The name value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ getExtension(name) {
			return name === 'EXT_disjoint_timer_query_webgl2'
				? {
						TIME_ELAPSED_EXT: 'TIME_ELAPSED_EXT',
						GPU_DISJOINT_EXT: 'GPU_DISJOINT_EXT',
					}
				: null;
		},
	};

	return {
		context,
		/** Call this method to make available. */ makeAvailable() {
			available = true;
		},
		/**
		 * Call this method to read context.
		 * @returns - The result produced by the operation.
		 */ getContext() {
			return context;
		},
	};
}

describe('ShaderPassPerformanceTimer', /** Called by Jasmine to register the named test suite. */ () => {
	it('stays inactive when no performance callback is supplied', /** Called by Jasmine to exercise the named behavior. */ () => {
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: null,
		});

		expect(timer.enabled).toBeFalse();
		expect(timer.begin(createRendererWithoutTimerSupport())).toBeNull();
	});

	it('defaults absent numerical options and rejects invalid supplied options', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new ShaderPassPerformanceTimer({
					passName: 'test-pass',
					/** Called by this module to performance callback. */ performanceCallback: () => {},
					sampleIntervalFrames: 0,
				}),
		).toThrowError(RangeError, /sampleIntervalFrames/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new ShaderPassPerformanceTimer({
					passName: 'test-pass',
					/** Called by this module to performance callback. */ performanceCallback: () => {},
					maxPendingQueries: Number.NaN,
				}),
		).toThrowError(RangeError, /maxPendingQueries/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new ShaderPassPerformanceTimer({
					passName: 'test-pass',
					/** Called by this module to performance callback. */ performanceCallback: () => {},
					sampleIntervalFrames: null,
				}),
		).toThrowError(RangeError, /sampleIntervalFrames/);
	});

	it('emits CPU submit samples without GPU timing when the extension is unavailable', /** Called by Jasmine to exercise the named behavior. */ () => {
		const samples = [];
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			/**
			 * Called by timer to performance callback.
			 * @param sample - The sample value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ performanceCallback: (sample) => samples.push(sample),
		});
		const renderer = createRendererWithoutTimerSupport();
		const activeSample = timer.begin(renderer, {frameCount: 7});

		timer.end(renderer, activeSample);

		expect(samples.length).toBe(1);
		expect(samples[0].passName).toBe('test-pass');
		expect(samples[0].event).toBe('cpu-submit');
		expect(samples[0].frameCount).toBe(7);
		expect(samples[0].gpuAvailable).toBeFalse();
		expect(samples[0].timestamp).toEqual({
			value: jasmine.any(Number),
			units: 'seconds',
		});
		expect(samples[0].cpuSubmitDuration).toEqual({
			value: jasmine.any(Number),
			units: 'seconds',
		});
	});

	it('skips creating samples between configured sampling frames', /** Called by Jasmine to exercise the named behavior. */ () => {
		const samples = [];
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			/**
			 * Called by timer to performance callback.
			 * @param sample - The sample value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ performanceCallback: (sample) => samples.push(sample),
			sampleIntervalFrames: 3,
		});
		const renderer = createRendererWithoutTimerSupport();
		const first = timer.begin(renderer, {frameCount: 1});
		const second = timer.begin(renderer, {frameCount: 2});
		const third = timer.begin(renderer, {frameCount: 3});
		const fourth = timer.begin(renderer, {frameCount: 4});

		timer.end(renderer, first);
		timer.end(renderer, second);
		timer.end(renderer, third);
		timer.end(renderer, fourth);

		expect(first).not.toBeNull();
		expect(second).toBeNull();
		expect(third).toBeNull();
		expect(fourth).not.toBeNull();
		expect(
			samples.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param sample - The sample value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sample) => sample.frameCount,
			),
		).toEqual([1, 4]);
	});

	it('emits GPU elapsed samples when WebGL2 timer-query results become available', /** Called by Jasmine to exercise the named behavior. */ () => {
		const samples = [];
		const renderer = createRendererWithTimerSupport();
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			/**
			 * Called by timer to performance callback.
			 * @param sample - The sample value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ performanceCallback: (sample) => samples.push(sample),
		});
		const activeSample = timer.begin(renderer, {frameCount: 11});

		timer.end(renderer, activeSample);
		renderer.makeAvailable();
		timer.poll(renderer);

		const gpuSample = samples.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param sample - The sample value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (sample) => sample.event === 'gpu-elapsed',
		);

		expect(
			samples.some(
				/**
				 * Called by Array.prototype.some to test one collection value for a matching condition.
				 * @param sample - The sample value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sample) => sample.event === 'cpu-submit',
			),
		).toBeTrue();
		expect(gpuSample.passName).toBe('test-pass');
		expect(gpuSample.sampleId).toBe(activeSample.id);
		expect(gpuSample.frameCount).toBe(11);
		expect(gpuSample.gpuAvailable).toBeTrue();
		expect(gpuSample.disjoint).toBeFalse();
		expect(gpuSample.gpuDuration).toEqual({
			value: 0.0025,
			units: 'seconds',
		});
	});

	it('does not accumulate unresolved GPU timer queries past the configured cap', /** Called by Jasmine to exercise the named behavior. */ () => {
		const samples = [];
		const renderer = createRendererWithTimerSupport();
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			/**
			 * Called by timer to performance callback.
			 * @param sample - The sample value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ performanceCallback: (sample) => samples.push(sample),
			maxPendingQueries: 1,
		});
		const first = timer.begin(renderer, {frameCount: 1});

		timer.end(renderer, first);
		const second = timer.begin(renderer, {frameCount: 2});

		expect(first).not.toBeNull();
		expect(second).toBeNull();
		expect(
			samples.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param sample - The sample value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sample) => sample.event,
			),
		).toEqual(['cpu-submit']);
	});

	it('deletes pending GPU timer queries on dispose', /** Called by Jasmine to exercise the named behavior. */ () => {
		const renderer = createRendererWithTimerSupport();
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			/** Called by timer to performance callback. */ performanceCallback: () => {},
		});
		const activeSample = timer.begin(renderer, {frameCount: 11});

		timer.end(renderer, activeSample);
		timer.dispose();

		expect(renderer.context.deletedQuery).toBe(activeSample.query);
		expect(timer.begin(renderer)).toBeNull();
	});
});
