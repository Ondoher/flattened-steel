import {LocalSunFrameController} from '../LocalSunFrameController.js';
import {LocalSunFrameTestSupport} from './LocalSunFrameTestSupport.js';

describe('LocalSunFrameController complete publication and lease lifecycle', () => {
	describe('canonical reuse and retained borrowers', () => {
		it('stages exact live state and reuses one field without changing the displayed frame until publication', async () => {
			const backend = new LocalSunFrameTestSupport();
			const controller = new LocalSunFrameController({backend, stageFrame: (request) => backend.stage(request)});
			const profile = LocalSunFrameTestSupport.createProfile();
			const first = await controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile));
			expect(controller.active).toBeNull();
			expect(controller.publishPreparedLocalFrame(first).frame).toBe(first);
			const submissions = backend.submissions;
			const borrower = first.borrowCache();
			const live = profile.createLiveProfile({
				observation: {
					instant: '2024-12-14T18:27:41.487Z',
					location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
				},
				receiverPosition: {coordinates: [500, -700, 2], units: 'meters'},
				sourcePosition: {coordinates: [500, -700, 4828032], units: 'meters'},
			});
			const second = await controller.prepareLocalFrame(LocalSunFrameTestSupport.request(live));
			expect(controller.active).toBe(first);
			expect(second.constructionIdentity).toBe(first.constructionIdentity);
			expect(second.identity).not.toBe(first.identity);
			expect(backend.submissions).toBe(submissions);
			expect(second.contents.celestialInputs.observation.instant).toBe('2024-12-14T18:27:41.487Z');
			controller.publishPreparedLocalFrame(second);
			expect(controller.active).toBe(second);
			expect(() => first.borrowCache()).toThrow();
			expect(borrower.getRuntimeBindings().bindings.length).toBe(7);
			controller.dispose();
			let released = false;
			const completion = controller.whenReleased().then(() => {
				released = true;
			});
			await Promise.resolve();
			expect(released).toBeFalse();
			expect(borrower.getRuntimeBindings().bindings.length).toBe(7);
			expect(backend.handles.size).toBe(7);
			borrower.dispose();
			borrower.dispose();
			await completion;
			expect(released).toBeTrue();
			expect(backend.handles.size).toBe(0);
		});

		it('rebuilds changed supported source strength and retires old resources only after borrower release', async () => {
			const backend = new LocalSunFrameTestSupport();
			const controller = new LocalSunFrameController({backend, stageFrame: (request) => backend.stage(request)});
			const first = await controller.prepareLocalFrame(
				LocalSunFrameTestSupport.request(LocalSunFrameTestSupport.createProfile(1)),
			);
			controller.publishPreparedLocalFrame(first);
			const borrower = first.borrowCache(),
				submissions = backend.submissions;
			const second = await controller.prepareLocalFrame(
				LocalSunFrameTestSupport.request(LocalSunFrameTestSupport.createProfile(0)),
			);
			expect(second.constructionIdentity).not.toBe(first.constructionIdentity);
			expect(backend.submissions).toBeGreaterThan(submissions);
			controller.publishPreparedLocalFrame(second);
			expect(borrower.getRuntimeBindings().bindings.length).toBe(7);
			expect(backend.handles.size).toBe(14);
			borrower.dispose();
			expect(backend.handles.size).toBe(7);
			controller.dispose();
			expect(backend.handles.size).toBe(0);
		});
	});
	describe('preparation admission and generation', () => {
		it('holds the complete frame across receiver/compile failures and unsupported or over-budget requests', async () => {
			const backend = new LocalSunFrameTestSupport();
			let receiverFailure = false;
			const controller = new LocalSunFrameController({
				backend,
				stageFrame: (request) => {
					if (receiverFailure) throw new Error('receiver failure');
					return backend.stage(request);
				},
			});
			const profile = LocalSunFrameTestSupport.createProfile();
			const first = await controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile));
			controller.publishPreparedLocalFrame(first);
			receiverFailure = true;
			await expectAsync(
				controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile)),
			).toBeRejectedWithError('receiver failure');
			expect(controller.active).toBe(first);
			expect(backend.handles.size).toBe(7);
			receiverFailure = false;
			const compile = backend.compile.bind(backend);
			backend.capabilities.id = 'replacement-required';
			backend.compile = () => {
				throw new Error('compile failure');
			};
			await expectAsync(
				controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile)),
			).toBeRejectedWithError('compile failure');
			expect(controller.active).toBe(first);
			const retainedBorrow = first.borrowCache();
			expect(retainedBorrow.getRuntimeBindings().bindings.length).toBe(7);
			retainedBorrow.dispose();
			backend.compile = compile;
			const outside = profile.createLiveProfile({
				observation: profile.models.geometry.configuration.observation,
				receiverPosition: {coordinates: [33378001, 0, 2], units: 'meters'},
				sourcePosition: {coordinates: [0, 0, 4828032], units: 'meters'},
			});
			const submissions = backend.submissions;
			await expectAsync(controller.prepareLocalFrame(LocalSunFrameTestSupport.request(outside))).toBeRejected();
			await expectAsync(
				controller.prepareLocalFrame({
					...LocalSunFrameTestSupport.request(profile),
					otherOwnedGpuBytes: {value: 2000000000, units: 'bytes'},
				}),
			).toBeRejected();
			expect(backend.submissions).toBe(submissions);
			expect(controller.active).toBe(first);
			const nearEdge = profile.createLiveProfile({
				observation: profile.models.geometry.configuration.observation,
				receiverPosition: {coordinates: [33377999, 0, 2], units: 'meters'},
				sourcePosition: {coordinates: [0, 0, 4828032], units: 'meters'},
			});
			await expectAsync(
				controller.prepareLocalFrame({
					...LocalSunFrameTestSupport.request(nearEdge),
					viewRays: [
						{
							origin: nearEdge.models.geometry.configuration.observerPosition,
							direction: [1, 0, 0],
							length: {value: 1000, units: 'meters'},
						},
					],
				}),
			).toBeRejectedWithError(/exits complete cache support/u);
			expect(controller.active).toBe(first);
			expect(backend.submissions).toBe(submissions);
			controller.dispose();
			expect(backend.handles.size).toBe(0);
		});

		it('disposes a late superseded stage and publishes only the newest complete generation', async () => {
			const backend = new LocalSunFrameTestSupport();
			let release,
				entered,
				block = false;
			const started = new Promise((resolve) => {
				entered = resolve;
			});
			const gate = new Promise((resolve) => {
				release = resolve;
			});
			const controller = new LocalSunFrameController({
				backend,
				stageFrame: async (request) => {
					if (block) {
						block = false;
						entered();
						await gate;
					}
					return backend.stage(request);
				},
			});
			const profile = LocalSunFrameTestSupport.createProfile();
			const first = await controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile));
			controller.publishPreparedLocalFrame(first);
			block = true;
			const stale = controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile));
			const staleRejected = expectAsync(stale).toBeRejected();
			await started;
			const current = controller.prepareLocalFrame({
				...LocalSunFrameTestSupport.request(profile),
				presentationIdentity: 'new exact display',
			});
			expect(controller.active).toBe(first);
			release();
			await staleRejected;
			const frame = await current;
			controller.publishPreparedLocalFrame(frame);
			expect(controller.active).toBe(frame);
			expect(backend.stagedDisposals).toBe(2);
			controller.dispose();
			expect(backend.handles.size).toBe(0);
		});

		it('cancels prepared publication, retains an immutable exact-state snapshot, and allows retry', async () => {
			const backend = new LocalSunFrameTestSupport();
			const controller = new LocalSunFrameController({backend, stageFrame: (request) => backend.stage(request)});
			const profile = LocalSunFrameTestSupport.createProfile();
			const first = await controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile));
			controller.publishPreparedLocalFrame(first);
			const request = LocalSunFrameTestSupport.request(profile);
			const pending = controller.prepareLocalFrame(request);
			request.viewRays[0].origin = {coordinates: [33378001, 0, 2], units: 'meters'};
			const candidate = await pending;
			controller.cancelPreparation();
			expect(() => controller.publishPreparedLocalFrame(candidate)).toThrow();
			expect(controller.active).toBe(first);
			const retry = await controller.prepareLocalFrame(LocalSunFrameTestSupport.request(profile));
			controller.publishPreparedLocalFrame(retry);
			expect(controller.active).toBe(retry);
			controller.dispose();
			expect(backend.handles.size).toBe(0);
		});
	});
	describe('context loss and restoration', () => {
		it('invalidates all old-context borrowers and restores a fresh complete retained request', async () => {
			const backend = new LocalSunFrameTestSupport();
			const controller = new LocalSunFrameController({backend, stageFrame: (request) => backend.stage(request)});
			const first = await controller.prepareLocalFrame(
				LocalSunFrameTestSupport.request(LocalSunFrameTestSupport.createProfile()),
			);
			controller.publishPreparedLocalFrame(first);
			const oldBorrow = first.borrowCache();
			controller.handleContextLoss();
			expect(controller.active).toBeNull();
			expect(backend.handles.size).toBe(0);
			expect(() => oldBorrow.getRuntimeBindings()).toThrow();
			const restored = new LocalSunFrameTestSupport();
			const next = await controller.restoreContext(restored);
			expect(controller.active).toBeNull();
			expect(next.identity).not.toBe(first.identity);
			expect(restored.submissions).toBeGreaterThan(0);
			controller.publishPreparedLocalFrame(next);
			oldBorrow.dispose();
			controller.dispose();
			expect(restored.handles.size).toBe(0);
		});

		it('restores the last published request after rejected support and retains it through restoration failure', async () => {
			const backend = new LocalSunFrameTestSupport();
			let failStage = false;
			const controller = new LocalSunFrameController({
				backend,
				stageFrame: (request) =>
					failStage ? Promise.reject(new Error('restoration stage failed')) : backend.stage(request),
			});
			const request = LocalSunFrameTestSupport.request(LocalSunFrameTestSupport.createProfile());
			const first = await controller.prepareLocalFrame(request);
			controller.publishPreparedLocalFrame(first);
			const unsupported = {
				...request,
				viewRays: [{origin: {coordinates: [33378001, 0, 2], units: 'meters'}, direction: [0, 0, 1]}],
			};
			await expectAsync(controller.prepareLocalFrame(unsupported)).toBeRejected();
			expect(controller.active).toBe(first);
			controller.handleContextLoss();
			failStage = true;
			const failedBackend = new LocalSunFrameTestSupport();
			await expectAsync(controller.restoreContext(failedBackend)).toBeRejectedWithError(
				'restoration stage failed',
			);
			controller.handleContextLoss();
			expect(failedBackend.handles.size).toBe(0);
			failStage = false;
			const restoredBackend = new LocalSunFrameTestSupport();
			const restored = await controller.restoreContext(restoredBackend);
			expect(restored.profile.contentHash).toBe(first.profile.contentHash);
			controller.publishPreparedLocalFrame(restored);
			expect(controller.active).toBe(restored);
			controller.dispose();
			await controller.whenReleased();
			expect(restoredBackend.handles.size).toBe(0);
		});
	});
	describe('publication and complete resource retirement', () => {
		it('holds the earlier complete frame when renderer installation rejects before commit, and permits retry', async () => {
			const backend = new LocalSunFrameTestSupport(),
				controller = new LocalSunFrameController({backend, stageFrame: (request) => backend.stage(request)});
			const request = LocalSunFrameTestSupport.request(LocalSunFrameTestSupport.createProfile());
			const first = await controller.prepareLocalFrame(request);
			controller.publishPreparedLocalFrame(first);
			const next = await controller.prepareLocalFrame(request);
			expect(() =>
				controller.publishPreparedLocalFrame(next, () => {
					throw new Error('render installation failed');
				}),
			).toThrowError('render installation failed');
			expect(controller.active).toBe(first);
			expect(backend.stagedDisposals).toBe(0);
			expect(backend.handles.size).toBe(7);
			const install = jasmine.createSpy('render-installation');
			controller.publishPreparedLocalFrame(next, install);
			expect(install).toHaveBeenCalledTimes(1);
			expect(controller.active).toBe(next);
			controller.dispose();
			await controller.whenReleased();
			expect(backend.handles.size).toBe(0);
		});

		it('reports retirement errors after a successful commit while still releasing every owned lease', async () => {
			const backend = new LocalSunFrameTestSupport();
			let failRetirement = true;
			const controller = new LocalSunFrameController({
				backend,
				stageFrame: async (request) => {
					const contents = await backend.stage(request),
						fails = failRetirement;
					return {
						...contents,
						dispose() {
							contents.dispose();
							if (fails) throw new Error('retirement failure');
						},
					};
				},
			});
			const request = LocalSunFrameTestSupport.request(LocalSunFrameTestSupport.createProfile());
			const first = await controller.prepareLocalFrame(request);
			controller.publishPreparedLocalFrame(first);
			failRetirement = false;
			const next = await controller.prepareLocalFrame(request),
				publication = controller.publishPreparedLocalFrame(next);
			expect(publication.frame).toBe(next);
			expect(publication.retirementErrors.length).toBe(1);
			expect(controller.active).toBe(next);
			expect(backend.handles.size).toBe(7);
			controller.dispose();
			await controller.whenReleased();
			expect(backend.handles.size).toBe(0);
		});

		it('waits for late staged resources to retire before releasing the external backend owner', async () => {
			const backend = new LocalSunFrameTestSupport();
			let enter, finish;
			const entered = new Promise((resolve) => {
					enter = resolve;
				}),
				gate = new Promise((resolve) => {
					finish = resolve;
				});
			const controller = new LocalSunFrameController({
				backend,
				stageFrame: async (request) => {
					enter();
					await gate;
					return backend.stage(request);
				},
			});
			const pending = controller.prepareLocalFrame(
				LocalSunFrameTestSupport.request(LocalSunFrameTestSupport.createProfile()),
			);
			const rejected = expectAsync(pending).toBeRejected();
			await entered;
			controller.dispose();
			let released = false;
			const completion = controller.whenReleased().then(() => {
				released = true;
			});
			await Promise.resolve();
			expect(released).toBeFalse();
			expect(backend.handles.size).toBe(7);
			finish();
			await rejected;
			await completion;
			expect(released).toBeTrue();
			expect(backend.handles.size).toBe(0);
		});
	});
});
