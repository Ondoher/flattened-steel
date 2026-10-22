import {ModeController} from '../ModeController.js';

/** Create one observable fake supported mode. */
function createMode(name, events) {
	return {
		name,
		geometry: {id: `${name}-geometry`},
		dispose() {
			events.push(`${name}:mode-disposed`);
		},
	};
}

/** Create one isolated fake composer allocation. */
function createComposer(name, events) {
	return {
		composer: {
			dispose() {
				events.push(`${name}:composer-disposed`);
			},
		},
		renderTarget: {
			dispose() {
				events.push(`${name}:target-disposed`);
			},
		},
		renderPass: {},
	};
}

/** Create one observable fake runtime candidate. */
function createRuntime(name, events, setupFailure = null) {
	let disposed = false;

	return {
		async setup() {
			events.push(`${name}:setup`);
			if (setupFailure !== null) throw setupFailure;
			return {pairing: name};
		},
		publish() {
			if (disposed) throw new Error(`${name} published after disposal.`);
			events.push(`${name}:published`);
		},
		setSkyRenderMode(mode) {
			if (disposed) throw new Error(`${name} selected after disposal.`);
			events.push(`${name}:atmosphere:${mode}`);
		},
		setSunPresentation(selection) {
			this.sunPresentation = {...selection};
		},
		dispose({restoreRendering = true} = {}) {
			if (disposed) return;
			disposed = true;
			events.push(`${name}:runtime-disposed:${restoreRendering}`);
		},
	};
}

describe('Flat32 mode transaction', () => {
	it('publishes the newest Sun choices after pending runtime setup and rejects invalid changes', async () => {
		const events = [],
			runtimes = [];
		let release;
		const wait = new Promise((resolve) => {
			release = resolve;
		});
		const controller = new ModeController({
			createMode: () => createMode('sun', events),
			createRuntime: () => {
				const runtime = createRuntime('sun', events);
				runtime.setup = async () => {
					await wait;
					return {pairing: 'sun'};
				};
				runtimes.push(runtime);
				return runtime;
			},
			endpointScene: {},
			onFailure() {},
			onPublished() {},
			sceneRuntime: {createAtmosphereComposer: () => createComposer('sun', events), restoreDirectRendering() {}},
		});
		try {
			const pending = controller.switchTo('flat-local', {});
			await Promise.resolve();
			expect(runtimes.length).toBe(1);
			controller.setSunPresentation({sunIlluminationScale: 0, sunDiscBrightnessScale: 0.5});
			release();
			await pending;
			expect(runtimes[0].sunPresentation).toEqual({sunIlluminationScale: 0, sunDiscBrightnessScale: 0.5});
			expect(() => controller.setSunPresentation({sunIlluminationScale: NaN})).toThrowError(RangeError);
			expect(runtimes[0].sunPresentation).toEqual({sunIlluminationScale: 0, sunDiscBrightnessScale: 0.5});
		} finally {
			controller.dispose();
		}
	});
	it('stages a same-kind height change and restores the complete prior geometry on setup failure', async () => {
		const events = [];
		let height = 5;
		const controller = new ModeController({
			createMode: (_kind, state) => ({
				...createMode(`height-${state.observerHeight.value}`, events),
				observerHeight: state.observerHeight,
			}),
			createRuntime: ({mode}) =>
				createRuntime(
					mode.name,
					events,
					mode.observerHeight.value === 2000 ? new Error('height preparation failed') : null,
				),
			endpointScene: {},
			onFailure() {},
			onPublished() {},
			onPreparing: (_kind, mode) => {
				height = mode.observerHeight.value;
			},
			onReverted: (_kind, mode) => {
				height = mode.observerHeight.value;
			},
			sceneRuntime: {
				createAtmosphereComposer: () => createComposer('height', events),
				restoreDirectRendering() {},
			},
		});
		try {
			for (const value of [5, 500]) {
				await controller.switchTo('spherical-distant', {observerHeight: {value, units: 'meters'}});
				expect(height).toBe(value);
			}
			await expectAsync(
				controller.switchTo('spherical-distant', {observerHeight: {value: 2000, units: 'meters'}}),
			).toBeRejectedWithError('height preparation failed');
			expect(height).toBe(500);
		} finally {
			controller.dispose();
		}
	});
	it('routes admitted flat-local observation changes through the installed runtime', async () => {
		const events = [],
			mode = createMode('compact', events),
			runtime = createRuntime('compact', events);
		runtime.canUpdateSharedScene = () => true;
		runtime.updateSharedScene = jasmine.createSpy('exact-local-update').and.resolveTo({pairing: 'flat/local'});
		const create = jasmine.createSpy('create-mode').and.returnValue(mode);
		const published = jasmine.createSpy('published');
		const controller = new ModeController({
			createMode: create,
			createRuntime: () => runtime,
			endpointScene: {},
			onFailure() {},
			onPublished: published,
			sceneRuntime: {
				createAtmosphereComposer: () => createComposer('compact', events),
				restoreDirectRendering() {},
			},
		});
		const first = {selection: 'compact', observation: {instant: 'first'}},
			next = {...first, observation: {instant: 'next'}};
		await controller.switchTo('flat-local', first);
		await controller.switchTo('flat-local', next);
		expect(create).toHaveBeenCalledTimes(1);
		expect(runtime.updateSharedScene).toHaveBeenCalledTimes(1);
		expect(runtime.updateSharedScene.calls.mostRecent().args[0]).toBe(next);
		expect(published.calls.mostRecent().args).toEqual(['flat-local', mode, next]);
		controller.dispose();
	});
	it('reuses one shared runtime for observation changes and rebuilds for configuration changes', async () => {
		const events = [];
		let release;
		let reject;
		let created = 0;
		const runtime = createRuntime('shared', events);
		Object.assign(runtime, {
			canUpdateSharedScene: () => true,
			updateSharedScene: (_state, request) =>
				new Promise((resolve, fail) => {
					release = () => {
						events.push('live:published');
						resolve({pairing: 'shared'});
					};
					reject = fail;
					request.signal.addEventListener('abort', () => fail(new Error('superseded')), {once: true});
				}),
		});
		const controller = new ModeController(
			/** @type {any} */ ({
				endpointScene: {},
				onFailure() {},
				createMode: () => {
					created += 1;
					return createMode('shared', events);
				},
				createRuntime: () => runtime,
				sceneRuntime: {
					createAtmosphereComposer: () => createComposer('shared', events),
					restoreDirectRendering() {},
				},
			}),
		);
		const state = /** @type {Flat32ApplicationState} */ (
			/** @type {unknown} */ ({selection: 'original', observation: {instant: 'first'}})
		);
		await controller.switchTo('spherical-distant', state);
		const changing = controller.switchTo('spherical-distant', {
			...state,
			flatTimeIndex: 2,
			timeLabel: 'Flat 90',
			observation: {...state.observation, instant: 'second'},
		});
		expect(created).toBe(1);
		expect(events.filter((event) => event === 'shared:setup').length).toBe(1);
		expect(events).not.toContain('live:published');
		release();
		await changing;
		const failed = controller.switchTo('spherical-distant', state);
		reject(new Error('held'));
		await expectAsync(failed).toBeRejectedWithError('held');
		expect(controller.currentKind).toBe('spherical-distant');
		expect(created).toBe(1);
		await controller.switchTo(
			'spherical-distant',
			/** @type {Flat32ApplicationState} */ ({...state, selection: 'changed'}),
		);
		expect(created).toBe(2);
		controller.dispose();
	});

	it('retains the shader-bypass selection across a mode replacement', async () => {
		const events = [];
		const controller = new ModeController(
			/** @type {any} */ ({
				atmosphereEnabled: true,
				endpointScene: {},
				onFailure() {},
				createMode(kind) {
					return createMode(kind, events);
				},
				createRuntime({mode, skyRenderMode}) {
					events.push(`${mode.name}:constructed:${skyRenderMode}`);
					return createRuntime(mode.name, events);
				},
				onPreparing() {},
				onReverted() {},
				onPublished() {},
				sceneRuntime: {
					createAtmosphereComposer() {
						return createComposer('candidate', events);
					},
					restoreDirectRendering() {},
				},
			}),
		);

		await controller.switchTo('spherical-distant', /** @type {Flat32ApplicationState} */ ({}));
		controller.setAtmosphereEnabled(false);
		expect(() => controller.setAtmosphereEnabled(undefined)).toThrowError(TypeError);
		expect(() => controller.setSkyRenderMode(undefined)).toThrowError(TypeError);
		await controller.switchTo('flat-local', /** @type {Flat32ApplicationState} */ ({}));

		expect(events).toContain('spherical-distant:constructed:full');
		expect(events).toContain('spherical-distant:atmosphere:shader-off');
		expect(events).toContain('flat-local:constructed:shader-off');
		expect(events).toContain('flat-local:atmosphere:shader-off');
		controller.dispose();
	});

	it('preserves and republishes the last valid mode after candidate setup failure', async () => {
		const events = [];
		const modes = [];
		const runtimes = [
			createRuntime('baseline', events),
			createRuntime('replacement', events, new Error('candidate failed')),
		];
		let composerIndex = 0;
		const controller = new ModeController(
			/** @type {any} */ ({
				endpointScene: {},
				onFailure() {},
				createMode(kind) {
					const mode = createMode(kind === 'spherical-distant' ? 'baseline' : 'replacement', events);

					modes.push(mode);
					return mode;
				},
				createRuntime() {
					return runtimes.shift();
				},
				onPreparing(kind) {
					events.push(`prepare:${kind}`);
				},
				onReverted(kind, mode) {
					events.push(`revert:${kind}:${mode.name}`);
				},
				onPublished(kind) {
					events.push(`accepted:${kind}`);
				},
				sceneRuntime: {
					createAtmosphereComposer() {
						composerIndex += 1;
						return createComposer(`candidate-${composerIndex}`, events);
					},
					restoreDirectRendering() {
						events.push('direct-restored');
					},
				},
			}),
		);
		const state = /** @type {Flat32ApplicationState} */ ({});

		await controller.switchTo('spherical-distant', state);
		await expectAsync(controller.switchTo('flat-local', state)).toBeRejectedWithError('candidate failed');

		expect(controller.currentKind).toBe('spherical-distant');
		expect(events).toContain('replacement:runtime-disposed:false');
		expect(events).toContain('revert:spherical-distant:baseline');
		expect(events.filter((event) => event === 'baseline:published').length).toBe(2);
		expect(events).not.toContain('baseline:runtime-disposed:false');

		controller.dispose();
		expect(events).toContain('baseline:runtime-disposed:true');
	});

	it('disposes the isolated mode, composer, and target when runtime construction fails', async () => {
		const events = [];
		const controller = new ModeController(
			/** @type {any} */ ({
				endpointScene: {},
				onFailure() {},
				createMode() {
					return createMode('candidate', events);
				},
				createRuntime() {
					throw new Error('runtime construction failed');
				},
				onPreparing() {
					events.push('prepare:candidate');
				},
				onReverted() {
					events.push('unexpected-revert');
				},
				onPublished() {
					events.push('unexpected-publish');
				},
				sceneRuntime: {
					createAtmosphereComposer() {
						return createComposer('candidate', events);
					},
					restoreDirectRendering() {
						events.push('direct-restored');
					},
				},
			}),
		);

		await expectAsync(
			controller.switchTo('flat-local', /** @type {Flat32ApplicationState} */ ({})),
		).toBeRejectedWithError('runtime construction failed');

		expect(controller.currentKind).toBeNull();
		expect(events).toContain('candidate:mode-disposed');
		expect(events).toContain('candidate:composer-disposed');
		expect(events).toContain('candidate:target-disposed');
		expect(events).toContain('direct-restored');
		expect(events).not.toContain('unexpected-publish');
	});

	it('aborts asynchronous preparation and publishes only the newest request', async () => {
		const events = [];
		const controller = new ModeController(
			/** @type {any} */ ({
				endpointScene: {},
				onFailure() {},
				async createMode(kind, _state, request) {
					if (kind === 'spherical-distant') {
						await new Promise((resolve) => {
							request.signal.addEventListener(
								'abort',
								() => {
									events.push('first:aborted');
									resolve();
								},
								{once: true},
							);
						});
					}
					return createMode(kind, events);
				},
				createRuntime({mode}) {
					return createRuntime(mode.name, events);
				},
				onPreparing(kind) {
					events.push(`prepare:${kind}`);
				},
				onReverted() {
					events.push('unexpected-revert');
				},
				onPublished(kind) {
					events.push(`accepted:${kind}`);
				},
				sceneRuntime: {
					createAtmosphereComposer() {
						return createComposer('newest', events);
					},
					restoreDirectRendering() {
						events.push('direct-restored');
					},
				},
			}),
		);

		const first = controller.switchTo('spherical-distant', /** @type {Flat32ApplicationState} */ ({}));
		await Promise.resolve();
		const second = controller.switchTo('flat-local', /** @type {Flat32ApplicationState} */ ({}));

		expect(await first).toBeNull();
		expect((await second).pairing).toBe('flat-local');
		expect(events).toContain('first:aborted');
		expect(events).toContain('spherical-distant:mode-disposed');
		expect(events).toContain('accepted:flat-local');
		expect(events).not.toContain('accepted:spherical-distant');
		expect(events).not.toContain('unexpected-revert');

		controller.dispose();
	});
});
