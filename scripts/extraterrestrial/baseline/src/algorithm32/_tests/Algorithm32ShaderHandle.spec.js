import { Algorithm32ShaderHandle } from '../Algorithm32ShaderHandle.js';

function createBuildResult(modelVersion, controller = null, runtime = null) {
	return {
		modelVersion,
		cacheController: controller,
		cache: controller ? {} : null,
		cacheIdentity: controller ? {} : null,
		runtime,
	};
}

function createController(name, events = []) {
	return {
		name,
		dispose: jasmine.createSpy(`${name}.dispose`).and.callFake(() => {
			events.push(`${name}:controller`);
		}),
	};
}

function createRuntime(name, events = []) {
	return {
		prepare: jasmine.createSpy(`${name}.prepare`).and.resolveTo(),
		dispose: jasmine.createSpy(`${name}.dispose`).and.callFake(() => {
			events.push(`${name}:runtime`);
		}),
		getDiagnostics: () => ({ name }),
	};
}

function createState(options = {}) {
	const oldController = options.oldController ?? createController('old');
	const oldRuntime = options.oldRuntime ?? createRuntime('old');
	const nextController = options.nextController ?? createController('next');
	const nextRuntime = options.nextRuntime ?? createRuntime('next');
	const nextBuildResult = options.nextBuildResult
		?? createBuildResult(2, nextController, nextRuntime);
	const shaderBuilder = {
		build: jasmine.createSpy('build').and.resolveTo(nextBuildResult),
		dispose: jasmine.createSpy('builder.dispose'),
	};
	const prepared = {
		baseVersion: 1,
		version: 2,
		config: {},
		model: {},
		reference: { dispose: jasmine.createSpy('reference.dispose') },
		shaderBuilder,
		snapshot: { version: 2 },
	};
	const facade = {
		_prepareConfig: jasmine.createSpy('prepareConfig').and.returnValue(prepared),
		_commitPreparedConfig: jasmine.createSpy('commitPreparedConfig')
			.and.returnValue(prepared.snapshot),
		_discardPreparedConfig: jasmine.createSpy('discardPreparedConfig'),
		_createShaderBuildRequest: jasmine.createSpy('createShaderBuildRequest')
			.and.callFake((setup, config, lifecycle) => ({ setup, config, ...lifecycle })),
		_forgetShaderHandle: jasmine.createSpy('forgetShaderHandle'),
	};

	return {
		facade,
		prepared,
		oldController,
		oldRuntime,
		nextController,
		nextRuntime,
		state: {
			facade,
			setup: { composer: {} },
			buildResult: createBuildResult(1, oldController, oldRuntime),
		},
	};
}

describe('Algorithm32ShaderHandle', () => {
	it('publishes a completed replacement before disposing the previous attachment', async () => {
		const context = createState();
		const handle = new Algorithm32ShaderHandle(context.state);
		const config = {};
		const renderer = {};

		await handle.prepare(renderer);
		await expectAsync(handle.setConfig(config)).toBeResolvedTo({ version: 2 });
		expect(context.oldRuntime.prepare).toHaveBeenCalledOnceWith(renderer);
		expect(context.facade._prepareConfig).toHaveBeenCalledOnceWith(config);
		expect(context.prepared.shaderBuilder.build).toHaveBeenCalledWith(
			jasmine.objectContaining({
				previousBuildResult: context.state.buildResult,
				signal: jasmine.any(AbortSignal),
			}),
		);
		expect(context.facade._commitPreparedConfig)
			.toHaveBeenCalledOnceWith(context.prepared);
		expect(context.oldRuntime.dispose).toHaveBeenCalledTimes(1);
		expect(context.oldController.dispose).toHaveBeenCalledTimes(1);
		expect(handle.getDiagnostics()).toEqual({
			status: 'installed',
			modelVersion: 2,
			runtime: { name: 'next' },
		});
	});

	it('retains an exactly reused controller while replacing only the runtime pass', async () => {
		const controller = createController('shared');
		const context = createState({
			oldController: controller,
			nextController: controller,
		});
		const handle = new Algorithm32ShaderHandle(context.state);

		await handle.setConfig({});

		expect(context.oldRuntime.dispose).toHaveBeenCalledTimes(1);
		expect(controller.dispose).not.toHaveBeenCalled();
		handle.dispose();
		expect(controller.dispose).toHaveBeenCalledTimes(1);
	});

	it('keeps the installed runtime and config when replacement construction fails', async () => {
		const context = createState();
		context.prepared.shaderBuilder.build.and.rejectWith(new Error('cache build failed'));
		const handle = new Algorithm32ShaderHandle(context.state);

		await expectAsync(handle.setConfig({})).toBeRejectedWithError(/cache build failed/);

		expect(context.facade._commitPreparedConfig).not.toHaveBeenCalled();
		expect(context.facade._discardPreparedConfig)
			.toHaveBeenCalledOnceWith(context.prepared);
		expect(context.oldRuntime.dispose).not.toHaveBeenCalled();
		expect(context.oldController.dispose).not.toHaveBeenCalled();
		expect(handle.getDiagnostics().modelVersion).toBe(1);
	});

	it('disposes the runtime before its controller exactly once', () => {
		const events = [];
		const controller = createController('active', events);
		const runtime = createRuntime('active', events);
		const context = createState({ oldController: controller, oldRuntime: runtime });
		const handle = new Algorithm32ShaderHandle(context.state);

		handle.dispose();
		handle.dispose();

		expect(events).toEqual(['active:runtime', 'active:controller']);
		expect(context.facade._forgetShaderHandle).toHaveBeenCalledOnceWith(handle);
		expect(() => handle.getDiagnostics()).toThrowError(/disposed/);
	});

	it('still disposes the controller and forgets the handle when runtime disposal fails', () => {
		const controller = createController('active');
		const runtime = createRuntime('active');
		runtime.dispose.and.throwError('runtime disposal failed');
		const context = createState({ oldController: controller, oldRuntime: runtime });
		const handle = new Algorithm32ShaderHandle(context.state);

		expect(() => handle.dispose()).toThrowError(/runtime disposal failed/);
		expect(runtime.dispose).toHaveBeenCalledTimes(1);
		expect(controller.dispose).toHaveBeenCalledTimes(1);
		expect(context.facade._forgetShaderHandle).toHaveBeenCalledOnceWith(handle);
		expect(() => handle.getDiagnostics()).toThrowError(/disposed/);
	});
});
