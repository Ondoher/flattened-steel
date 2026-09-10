import assert from 'node:assert/strict';
import ExperimentRun from './ExperimentRun.js';
import GpuProofHost from './GpuProofHost.js';

const run = new ExperimentRun();
await run.start('lifecycle');
try {
	const poolSource = await run.read('experiments/00000-shared-cache-calculation-reuse/RetainedGpuSession.js');
	const cases = [];
	for (const mode of process.argv.includes('--session-error')
		? ['session-error']
		: ['pool', 'cancel', 'timeout', 'rejected']) {
		const abort = new AbortController();
		const events = [];
		const caseRun = Object.create(run);
		caseRun.root = `${run.root}/case-${mode}`;
		await run.files.directory(caseRun.root);
		caseRun.progress = (event) => {
			events.push(event);
			run.progress(event);
			if (mode === 'cancel' && event.message === 'ready') abort.abort(new Error('intentional cancellation'));
		};
		const post = `const base = new URL('.', import.meta.url); const post = (route, value) => fetch(new URL(route, base), {method:'POST',body:JSON.stringify(value)});`;
		const program =
			mode === 'session-error'
				? `import Pool from './pool.js'; ${post}
const gl=document.createElement('canvas').getContext('webgl2');
if(!gl) throw new Error('WebGL2 missing');
const pool=new Pool(gl,64);
const texture=pool.texture({width:4,height:4},()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,4,4,0,gl.RED,gl.FLOAT,null);return t;});
try {throw new Error('intentional session error');}
catch(error) {
 pool.close();
 if(gl.isTexture(texture)||pool.stats.residentBytes!==0) throw new Error('Session error cleanup failed');
 await post('progress',{message:'active-session-released'});
 await post('complete',{accepted:false,error:error.message});
} finally {gl.getExtension('WEBGL_lose_context')?.loseContext();}`
				: mode === 'pool'
					? `import Pool from './pool.js'; ${post}
try {
 const gl=document.createElement('canvas').getContext('webgl2'); if(!gl) throw new Error('WebGL2 missing');
 const pool=new Pool(gl,64);
 const allocate=(width,height)=>()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,width,height,0,gl.RED,gl.FLOAT,null);return t;};
 const a=pool.texture({width:4,height:4},allocate(4,4)); pool.release(a);
 const b=pool.texture({width:4,height:4},allocate(4,4)); if(a!==b) throw new Error('No reuse'); pool.release(b);
 const c=pool.texture({width:2,height:2},allocate(2,2)); if(gl.isTexture(a)) throw new Error('Eviction failed');
 let rejected=false; try{pool.texture({width:8,height:8},allocate(8,8));}catch{rejected=true;} if(!rejected) throw new Error('Budget not enforced');
 pool.release(c); pool.boundary();
 const p=pool.program('same-source',()=>gl.createProgram()); if(pool.program('same-source',()=>gl.createProgram())!==p) throw new Error('No program reuse');
 pool.close(); if(gl.isTexture(c)||gl.isProgram(p)||pool.stats.residentBytes!==0) throw new Error('Cleanup failed');
 await post('complete',{accepted:true,jobs:[{}],stats:pool.stats,elapsedMilliseconds:0,finalResidentBytes:0});
 gl.getExtension('WEBGL_lose_context')?.loseContext();
}catch(error){await post('complete',{accepted:false,error:String(error)});}`
					: `${post} await post('progress',{message:'ready'}); ${mode === 'rejected' ? "await post('complete',{accepted:false,error:'intentional rejection'});" : ''}`;
		const sources = new Map([
			['browser.js', Buffer.from(program)],
			['pool.js', poolSource],
		]);
		await run.write(`${mode}-browser.js`, Buffer.from(program));
		let result, failure;
		try {
			result = await new GpuProofHost().run({
				run: caseRun,
				jobs: [{id: mode, wavelengths: []}],
				sources,
				signal: abort.signal,
				acceptTile: async () => {
					throw new Error('No tile expected.');
				},
				maximumMilliseconds: mode === 'timeout' ? 4000 : 15000,
			});
		} catch (error) {
			failure = error;
		}
		if (mode === 'pool') assert.equal(result?.accepted, true);
		else
			assert.match(
				failure?.message ?? '',
				mode === 'cancel'
					? /intentional cancellation/u
					: mode === 'timeout'
						? /deadline/u
						: mode === 'session-error'
							? /intentional session error/u
							: /intentional rejection/u,
			);
		if (mode === 'session-error') assert.ok(events.some((event) => event.message === 'active-session-released'));
		const cleanup = events.find((event) => event.phase === 'host-cleanup');
		assert.ok(cleanup);
		assert.deepEqual(JSON.parse(cleanup.message), {listening: false, browserStopped: true});
		cases.push({
			mode,
			accepted: true,
			cleanup: JSON.parse(cleanup.message),
			result,
			expectedFailure: failure?.message,
		});
	}
	const preAborted = AbortSignal.abort(new Error('pre-cancelled'));
	await assert.rejects(
		new GpuProofHost().run({run, jobs: [], sources: new Map(), signal: preAborted, acceptTile: async () => {}}),
		/pre-cancelled/u,
	);
	await assert.rejects(run.files.resolve('../outside'));
	await run.write('lifecycle-proof.json', {
		cases,
		preCancellation: true,
		traversalRejected: true,
		operation:
			'Real browser resource reuse/eviction and host cancellation, deadline, rejection and cleanup proofs.',
	});
	await run.finish('accepted', {stage: 'E4-lifecycle', cases, preCancellation: true, traversalRejected: true});
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
