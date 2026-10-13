import {Algorithm32Runtime} from '../Algorithm32Runtime.js';
import {ThreeSceneRuntime} from '../ThreeSceneRuntime.js';

// Virtual complete packets isolate the real application publication boundary.
// Physical shader, receiver, field and numerical claims belong to the GPU proof.
describe('Flat32 explicit local complete-frame publication', () => {
	it('restores staged exact lighting when renderer installation rejects before the frame commit', async () => {
		const lighting = {publish: jasmine.createSpy('publish-lighting'), revert: jasmine.createSpy('revert-lighting')};
		const first = {},
			next = {contents: {sceneLighting: lighting}};
		const owner = {
			active: first,
			publishPreparedLocalFrame(frame, install) {
				install();
				this.active = frame;
				return {frame, retirementErrors: []};
			},
			dispose() {},
			whenReleased: () => Promise.resolve(),
		};
		const scene = {
			canvas: {dataset: {}},
			addContextLifecycleParticipant: () => () => {},
			atFrameBoundary: async (operation) => operation(),
			installRenderOperation() {
				throw new Error('renderer rejected');
			},
			restoreDirectRendering() {},
		};
		const runtime = new Algorithm32Runtime({
			sceneRuntime: scene,
			endpointScene: {},
			mode: {dispose() {}},
			onFailure: fail,
			localFrameController: owner,
		});
		await expectAsync(runtime.publishPreparedLocalFrame(next, new AbortController().signal)).toBeRejectedWithError(
			'renderer rejected',
		);
		expect(owner.active).toBe(first);
		expect(lighting.publish).toHaveBeenCalledTimes(1);
		expect(lighting.revert).toHaveBeenCalledTimes(1);
		runtime.dispose({restoreRendering: false});
	});
	it('holds the earlier complete packet until the real scene boundary, then renders the replacement', async () => {
		spyOn(window, 'requestAnimationFrame').and.returnValue(1);
		const scene = new ThreeSceneRuntime(document.createElement('canvas'), fail);
		scene._started = true;
		const first = {contents: {renderFrame: jasmine.createSpy('first-frame')}},
			next = {contents: {renderFrame: jasmine.createSpy('next-frame')}};
		const owner = {
			active: first,
			prepareLocalFrame: jasmine.createSpy('prepare').and.resolveTo(next),
			/** Called by the real runtime to model source validation, renderer installation and commit.
			 *
			 * @param {PreparedLocalSunFrame} frame - Virtual complete packet.
			 * @param {LocalSunFrameRenderInstallation} install - Real renderer installation callback.
			 * @returns {LocalSunFramePublication} - Virtual complete commit observation.
			 */
			publishPreparedLocalFrame(frame, install) {
				install?.();
				this.active = frame;
				return {frame, retirementErrors: []};
			},
			dispose() {
				this.active = null;
			},
			whenReleased: () => Promise.resolve(),
		};
		const runtime = new Algorithm32Runtime({
			sceneRuntime: scene,
			endpointScene: {},
			mode: {dispose() {}},
			onFailure: fail,
			localFrameController: owner,
		});
		const frame = await runtime.prepareLocalFrame({});
		expect(owner.active).toBe(first);
		const publication = runtime.publishPreparedLocalFrame(frame, new AbortController().signal);
		expect(owner.active).toBe(first);
		scene._renderFrame();
		expect((await publication).frame).toBe(next);
		expect(owner.active).toBe(next);
		expect(next.contents.renderFrame).toHaveBeenCalledTimes(1);
		expect(first.contents.renderFrame).not.toHaveBeenCalled();
		runtime.dispose({restoreRendering: false});
		await runtime.whenLocalFrameResourcesReleased();
		scene.dispose();
	});

	it('rejects cancelled publication and defers owned backend teardown through the final borrower', async () => {
		const scene = new ThreeSceneRuntime(document.createElement('canvas'), fail, {frameCadence: 'manual'});
		scene._started = true;
		let release;
		const released = new Promise((resolve) => {
			release = resolve;
		});
		const first = {},
			next = {};
		const owner = {
			active: first,
			/** Called by the real runtime to model source validation, renderer installation and commit.
			 *
			 * @param {PreparedLocalSunFrame} frame - Virtual complete packet.
			 * @param {LocalSunFrameRenderInstallation} install - Real renderer installation callback.
			 * @returns {LocalSunFramePublication} - Virtual complete commit observation.
			 */
			publishPreparedLocalFrame(frame, install) {
				install?.();
				this.active = frame;
				return {frame, retirementErrors: []};
			},
			dispose() {
				this.active = null;
			},
			whenReleased: () => released,
		};
		const runtime = new Algorithm32Runtime({
			sceneRuntime: scene,
			endpointScene: {},
			mode: {dispose() {}},
			onFailure: fail,
			localFrameController: owner,
		});
		const cancellation = new AbortController();
		cancellation.abort();
		await expectAsync(runtime.publishPreparedLocalFrame(next, cancellation.signal)).toBeRejected();
		expect(owner.active).toBe(first);
		const backend = {dispose: jasmine.createSpy('owned-backend-dispose')};
		runtime._cacheBackend = backend;
		runtime.dispose({restoreRendering: false});
		await Promise.resolve();
		expect(backend.dispose).not.toHaveBeenCalled();
		release();
		await runtime.whenLocalFrameResourcesReleased();
		expect(backend.dispose).toHaveBeenCalledTimes(1);
		scene.dispose();
	});
});
