import { ShaderPassPerformanceTimer } from '../ShaderPassPerformanceTimer.js';

/**
 * Create a renderer without timer-query support.
 *
 * @returns {object} Return renderer double.
 */
function createRendererWithoutTimerSupport() {
	return {
		getContext() {
			return {
				getExtension() {
					return null;
				},
			};
		},
	};
}

/**
 * Create a renderer with WebGL2 disjoint timer query support.
 *
 * @returns {object} Return renderer double.
 */
function createRendererWithTimerSupport() {
	const query = {};
	let available = false;
	const context = {
		QUERY_RESULT_AVAILABLE: 'QUERY_RESULT_AVAILABLE',
		QUERY_RESULT: 'QUERY_RESULT',
		createQuery() {
			return query;
		},
		beginQuery(target, activeQuery) {
			this.beginTarget = target;
			this.activeQuery = activeQuery;
		},
		endQuery(target) {
			this.endTarget = target;
		},
		getQueryParameter(activeQuery, parameter) {
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
		getParameter(parameter) {
			if (parameter === 'GPU_DISJOINT_EXT') {
				return false;
			}

			throw new Error(`Unexpected parameter ${parameter}.`);
		},
		deleteQuery(activeQuery) {
			this.deletedQuery = activeQuery;
		},
		getExtension(name) {
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
		makeAvailable() {
			available = true;
		},
		getContext() {
			return context;
		},
	};
}

describe('ShaderPassPerformanceTimer', () => {
	it('stays inactive when no performance callback is supplied', () => {
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: null,
		});

		expect(timer.enabled).toBeFalse();
		expect(timer.begin(createRendererWithoutTimerSupport())).toBeNull();
	});

	it('defaults absent numerical controls and rejects invalid supplied controls', () => {
		expect(() => new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: () => {},
			sampleIntervalFrames: 0,
		})).toThrowError(RangeError, /sampleIntervalFrames/);
		expect(() => new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: () => {},
			maxPendingQueries: Number.NaN,
		})).toThrowError(RangeError, /maxPendingQueries/);
		expect(() => new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: () => {},
			sampleIntervalFrames: null,
		})).toThrowError(RangeError, /sampleIntervalFrames/);
	});

	it('emits CPU submit samples without GPU timing when the extension is unavailable', () => {
		const samples = [];
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: (sample) => samples.push(sample),
		});
		const renderer = createRendererWithoutTimerSupport();
		const activeSample = timer.begin(renderer, { frameCount: 7 });

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

	it('skips creating samples between configured sampling frames', () => {
		const samples = [];
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: (sample) => samples.push(sample),
			sampleIntervalFrames: 3,
		});
		const renderer = createRendererWithoutTimerSupport();
		const first = timer.begin(renderer, { frameCount: 1 });
		const second = timer.begin(renderer, { frameCount: 2 });
		const third = timer.begin(renderer, { frameCount: 3 });
		const fourth = timer.begin(renderer, { frameCount: 4 });

		timer.end(renderer, first);
		timer.end(renderer, second);
		timer.end(renderer, third);
		timer.end(renderer, fourth);

		expect(first).not.toBeNull();
		expect(second).toBeNull();
		expect(third).toBeNull();
		expect(fourth).not.toBeNull();
		expect(samples.map((sample) => sample.frameCount)).toEqual([1, 4]);
	});

	it('emits GPU elapsed samples when WebGL2 timer-query results become available', () => {
		const samples = [];
		const renderer = createRendererWithTimerSupport();
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: (sample) => samples.push(sample),
		});
		const activeSample = timer.begin(renderer, { frameCount: 11 });

		timer.end(renderer, activeSample);
		renderer.makeAvailable();
		timer.poll(renderer);

		const gpuSample = samples.find((sample) => sample.event === 'gpu-elapsed');

		expect(samples.some((sample) => sample.event === 'cpu-submit')).toBeTrue();
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

	it('does not accumulate unresolved GPU timer queries past the configured cap', () => {
		const samples = [];
		const renderer = createRendererWithTimerSupport();
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: (sample) => samples.push(sample),
			maxPendingQueries: 1,
		});
		const first = timer.begin(renderer, { frameCount: 1 });

		timer.end(renderer, first);
		const second = timer.begin(renderer, { frameCount: 2 });

		expect(first).not.toBeNull();
		expect(second).toBeNull();
		expect(samples.map((sample) => sample.event)).toEqual(['cpu-submit']);
	});

	it('deletes pending GPU timer queries on dispose', () => {
		const renderer = createRendererWithTimerSupport();
		const timer = new ShaderPassPerformanceTimer({
			passName: 'test-pass',
			performanceCallback: () => {},
		});
		const activeSample = timer.begin(renderer, { frameCount: 11 });

		timer.end(renderer, activeSample);
		timer.dispose();

		expect(renderer.context.deletedQuery).toBe(activeSample.query);
		expect(timer.begin(renderer)).toBeNull();
	});
});
