import {Algorithm32Runtime} from '../Algorithm32Runtime.js';
import {ThreeSceneRuntime} from '../ThreeSceneRuntime.js';

describe('Flat32 Step 5 stellar lifecycle', () => {
	it('publishes a complete state between deterministic manual frames', async () => {
		let runtime = new ThreeSceneRuntime(document.createElement('canvas'), fail, {frameCadence: 'manual'});
		let events = [];
		const schedule = spyOn(window, 'requestAnimationFrame').and.returnValue(1);
		runtime._started = true;
		runtime._renderOperation = () => events.push('render');
		await runtime.atFrameBoundary(() => events.push('complete-cache-and-light'), new AbortController().signal);
		expect(events).toEqual(['complete-cache-and-light']);
		expect(runtime.stepFrame()).toBe(1);
		expect(runtime.stepFrame()).toBe(2);
		expect(events).toEqual(['complete-cache-and-light', 'render', 'render']);
		expect(schedule).not.toHaveBeenCalled();
		runtime.dispose();
	});

	it('stores candidate scene-linear color in full float without changing its viewport', () => {
		let runtime = new ThreeSceneRuntime(document.createElement('canvas'), fail, {sceneColorPrecision: 'float32'});
		runtime._viewportSize = {width: 16, height: 9};
		const target = runtime._createComposerRenderTarget();
		expect(target.width).toBe(16);
		expect(target.height).toBe(9);
		expect(target.texture.type).toBe(1015);
		expect(target.depthBuffer).toBeTrue();
		target.dispose();
		runtime.dispose();
	});
	it('publishes prepared state before rendering and excludes a canceled frame operation', async () => {
		let runtime = new ThreeSceneRuntime(document.createElement('canvas'), fail);
		let events = [];
		spyOn(window, 'requestAnimationFrame').and.returnValue(1);
		runtime._started = true;
		runtime._renderOperation = () => events.push('render');
		const canceled = new AbortController();
		const rejected = runtime
			.atFrameBoundary(() => events.push('stale'), canceled.signal)
			.catch(() => events.push('canceled'));
		canceled.abort();
		const published = runtime.atFrameBoundary(
			() => events.push('complete-cache-and-light'),
			new AbortController().signal,
		);
		expect(events).toEqual([]);
		runtime._renderFrame();
		await Promise.all([published, rejected]);
		expect(events.slice(0, 2)).toEqual(['complete-cache-and-light', 'render']);
		expect(events).not.toContain('stale');
		runtime.dispose();
	});

	it('reads the post-swap composer buffer that retains direct scene color', () => {
		const remove = jasmine.createSpy('removeContextLifecycleParticipant');
		const sceneTarget = {width: 8, height: 6};
		const outputPeer = {width: 8, height: 6};
		const previousTarget = {};
		const context = {
			RGBA: 6408,
			FLOAT: 5126,
			readPixels: jasmine.createSpy('readPixels').and.callFake((x, y, width, height, format, type, pixel) => {
				pixel.set([0, 0, 0, 1]);
			}),
		};
		const renderer = {
			getRenderTarget: () => previousTarget,
			getContext: () => context,
			setRenderTarget: jasmine.createSpy('setRenderTarget'),
		};
		let runtime = new Algorithm32Runtime({
			sceneRuntime: {
				addContextLifecycleParticipant: () => remove,
				restoreDirectRendering: jasmine.createSpy('restoreDirectRendering'),
			},
			endpointScene: {},
			mode: {dispose: jasmine.createSpy('mode.dispose')},
			onFailure: () => {},
			deferPublication: true,
		});
		runtime._composer = {readBuffer: outputPeer, writeBuffer: sceneTarget};

		expect(runtime._readSceneInputPixel(renderer)).toEqual([0, 0, 0, 1]);
		expect(renderer.setRenderTarget.calls.allArgs()).toEqual([[sceneTarget], [previousTarget]]);
		runtime.dispose();
	});

	it('waits for registered context restoration before resuming frame rendering', async () => {
		const canvas = document.createElement('canvas');
		let failures = [];
		let runtime = new ThreeSceneRuntime(canvas, (message) => failures.push(message));
		let events = [];
		const remove = runtime.addContextLifecycleParticipant({
			handleContextLoss() {
				events.push('lost');
			},
			async handleContextRestoration() {
				events.push('restoring');
				await runtime.atFrameBoundary(() => {
					expect(runtime._started).toBeFalse();
					events.push('published-before-resume');
				}, new AbortController().signal);
				events.push('restored');
			},
		});
		spyOn(runtime, '_configureViewport');
		spyOn(runtime, '_renderFrame');
		runtime._started = true;
		const event = {preventDefault: jasmine.createSpy('preventDefault')};

		runtime._handleContextLost(event);
		expect(event.preventDefault).toHaveBeenCalledTimes(1);
		expect(runtime._started).toBeFalse();
		expect(canvas.dataset.flat32ContextState).toBe('lost');
		await runtime._handleContextRestored();
		expect(events).toEqual(['lost', 'restoring', 'published-before-resume', 'restored']);
		expect(runtime._restoringContext).toBeFalse();
		expect(runtime._configureViewport).toHaveBeenCalledTimes(1);
		expect(runtime._renderFrame).toHaveBeenCalledTimes(1);
		expect(runtime._started).toBeTrue();
		expect(canvas.dataset.flat32ContextState).toBe('restored');
		expect(failures).toEqual([]);
		remove();
		runtime.dispose();
	});

	it('releases lost-context resources before rebuilding the normal Algorithm32 attachment', async () => {
		const remove = jasmine.createSpy('removeContextLifecycleParticipant');
		const sceneRuntime = {
			addContextLifecycleParticipant: jasmine.createSpy('addContextLifecycleParticipant').and.returnValue(remove),
			restoreDirectRendering: jasmine.createSpy('restoreDirectRendering'),
		};
		const mode = {dispose: jasmine.createSpy('mode.dispose')};
		let runtime = new Algorithm32Runtime({
			sceneRuntime,
			endpointScene: {},
			mode,
			onFailure: () => {},
			deferPublication: true,
		});
		const handle = {
			handleContextLoss: jasmine.createSpy('handleContextLoss'),
			handleContextRestoration: jasmine.createSpy('handleContextRestoration'),
			dispose: jasmine.createSpy('dispose'),
		};
		runtime._shaderHandle = handle;
		runtime._installed = true;
		spyOn(runtime, '_disposeSetupResources').and.callThrough();
		spyOn(runtime, 'setup').and.resolveTo({});

		runtime.handleContextLoss();
		expect(handle.handleContextLoss).toHaveBeenCalledTimes(1);
		expect(handle.dispose).toHaveBeenCalledTimes(1);
		expect(runtime._disposeSetupResources).toHaveBeenCalledTimes(1);
		expect(runtime._installed).toBeFalse();
		await runtime.handleContextRestoration();
		expect(handle.handleContextRestoration).not.toHaveBeenCalled();
		expect(runtime._disposeSetupResources).toHaveBeenCalledTimes(1);
		expect(runtime.setup).toHaveBeenCalledTimes(1);
		runtime.dispose();
		expect(remove).toHaveBeenCalledTimes(1);
	});

	it('does not use completely black scene or output color as a preflight publication criterion', () => {
		const remove = jasmine.createSpy('removeContextLifecycleParticipant');
		const context = {
			NO_ERROR: 0,
			getError: jasmine.createSpy('getError').and.returnValue(0),
		};
		const renderer = {
			debug: {
				checkShaderErrors: false,
				onShaderError: null,
			},
			info: {programs: []},
			getContext: () => context,
		};
		const sceneRuntime = {
			addContextLifecycleParticipant: jasmine.createSpy('addContextLifecycleParticipant').and.returnValue(remove),
			renderer,
			restoreDirectRendering: jasmine.createSpy('restoreDirectRendering'),
		};
		let runtime = new Algorithm32Runtime({
			sceneRuntime,
			endpointScene: {},
			mode: {dispose: jasmine.createSpy('mode.dispose')},
			onFailure: () => {},
			deferPublication: true,
		});
		runtime._composer = {render: jasmine.createSpy('render')};
		runtime._shaderHandle = {
			getDiagnostics: () => ({
				status: 'installed',
				runtime: {frameCount: 1, renderErrorCount: 0},
			}),
			dispose: jasmine.createSpy('dispose'),
		};
		spyOn(runtime, '_updateBindingValues');
		spyOn(runtime, '_readSceneInputPixel').and.returnValue([0, 0, 0, 0]);
		spyOn(runtime, '_readOutputPixel').and.returnValue([0, 0, 0, 0]);

		const preflight = runtime._preflightComposedFrame();

		expect(preflight.sceneInputPixel).toEqual([0, 0, 0, 0]);
		expect(preflight.outputPixel).toEqual([0, 0, 0, 0]);
		runtime.dispose();
		expect(remove).toHaveBeenCalledTimes(1);
	});
});
