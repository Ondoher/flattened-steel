import {Algorithm32Runtime} from '../Algorithm32Runtime.js';
import {ThreeSceneRuntime} from '../ThreeSceneRuntime.js';

describe('Flat32 Step 5 stellar lifecycle', () => {
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
		const runtime = new Algorithm32Runtime({
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
		const failures = [];
		const runtime = new ThreeSceneRuntime(canvas, (message) => failures.push(message));
		const events = [];
		const remove = runtime.addContextLifecycleParticipant({
			handleContextLoss() {
				events.push('lost');
			},
			async handleContextRestoration() {
				events.push('restoring');
				await Promise.resolve();
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
		expect(events).toEqual(['lost', 'restoring', 'restored']);
		expect(runtime._configureViewport).toHaveBeenCalledTimes(1);
		expect(runtime._renderFrame).toHaveBeenCalledTimes(1);
		expect(runtime._started).toBeTrue();
		expect(canvas.dataset.flat32ContextState).toBe('restored');
		expect(failures).toEqual([]);
		remove();
		runtime.dispose();
	});

	it('rebuilds the normal Algorithm32 attachment after forwarding context lifecycle', async () => {
		const remove = jasmine.createSpy('removeContextLifecycleParticipant');
		const sceneRuntime = {
			addContextLifecycleParticipant: jasmine.createSpy('addContextLifecycleParticipant').and.returnValue(remove),
			restoreDirectRendering: jasmine.createSpy('restoreDirectRendering'),
		};
		const mode = {dispose: jasmine.createSpy('mode.dispose')};
		const runtime = new Algorithm32Runtime({
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
		spyOn(runtime, '_disposeSetupResources');
		spyOn(runtime, 'setup').and.resolveTo({});

		runtime.handleContextLoss();
		expect(handle.handleContextLoss).toHaveBeenCalledTimes(1);
		expect(runtime._installed).toBeFalse();
		await runtime.handleContextRestoration();
		expect(handle.handleContextRestoration).toHaveBeenCalledTimes(1);
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
		const runtime = new Algorithm32Runtime({
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
