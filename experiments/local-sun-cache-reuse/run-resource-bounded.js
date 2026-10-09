import path from 'node:path';
import os from 'node:os';
import {readFile, open, unlink, mkdir} from 'node:fs/promises';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, outputRoot, checkPath, hash} from './run-boundary.js';

/** Compile a source-pinned native collector once into this wrapper's new run.
 * @param {ExperimentRun} run - Owned new output root and provenance writer.
 * @returns {Promise<string>} - Checked collector executable; no WMI service or extra dependency.
 */
async function prepareTelemetry(run) {
	const source=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/OwnedProcessTelemetry.cs');await checkPath(repositoryRoot,source);
	const bytes=await readFile(source);await run.write('OwnedProcessTelemetry.cs',bytes);
	const executable=path.join(run.root,'OwnedProcessTelemetry.exe'),scratch=path.join(run.root,'compiler-tmp');
	await checkPath(run.root,executable);await checkPath(run.root,scratch);await mkdir(scratch);
	const compiler='C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe';
	const compileArgs=['/nologo','/optimize+','/platform:x64','/target:exe','/reference:System.Web.Extensions.dll','/out:'+executable,path.join(run.root,'OwnedProcessTelemetry.cs')];
	await run.write('telemetry-inputs.json',JSON.stringify({schema:'native-owned-telemetry-input-v2',sourceSha256:hash(bytes),compiler,compilerIdentity:hash(await readFile(compiler)),compileArgs,
		operation:'Toolhelp32 read-only PID/parent snapshot; close ownership over the child tree, add wrapper/collector, and sum current PROCESS_MEMORY_COUNTERS_EX PrivateUsage and WorkingSetSize. Missing exited processes may be skipped; access/read failures fail closed.',
		protocol:'One owned collector warmed before computation; ASCII sequence<TAB>rootPid<LF> requests, bounded to128characters; one checked JSON response per request. EOF retires the collector. Each response has a10second deadline.',
		apiSources:['https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/ns-tlhelp32-processentry32w','https://learn.microsoft.com/en-us/windows/win32/api/psapi/ns-psapi-process_memory_counters_ex']},null,'\t'));
	const result=await promisify(execFile)(compiler,compileArgs,{windowsHide:true,timeout:10000,env:{...process.env,TEMP:scratch,TMP:scratch}});
	await run.write('telemetry-compile.txt',result.stdout+result.stderr);return executable;
}

/** Keep one owned collector warm and pair each bounded response with its exact request.
 * @param {string} collector - Checked run-owned source-pinned native executable.
 * @returns {LocalSunOwnedResourceSampler} - Sequential measurement requests and explicit retirement; no process service dependency.
 */
function startTelemetry(collector) {
	const process_ = spawn(collector,[String(process.pid)],{windowsHide:true,stdio:['pipe','pipe','pipe']});
	/** @type {LocalSunOwnedTelemetryPending|null} */ let pending=null;
	/** @type {Error|null} */ let fatal=null;
	let sequence=0,buffer='',stderr='',closed=false,stopping=false;
	/** @type {()=>void} */ let completeClose;
	const closePromise=new Promise(resolve=>{completeClose=()=>resolve(undefined);});
	/** Retain native exit/timeout context and bounded stderr in the original failure.
	 * @param {string} message - Concrete protocol or process failure.
	 * @param {string|number|null} code - Native exit or symbolic protocol code.
	 * @param {string|null} signal - Observed native exit signal, if any.
	 * @returns {Error} - Failure with inspectable structured cause.
	 */
	const makeError=(message,code,signal=null)=>{
		/** @type {LocalSunHostResourceFailure} */ const cause={message,code,killed:null,signal,stdout:buffer.slice(-8192),stderr};
		return new Error(message,{cause});
	};
	/** Reject the one active request and retain the first failure for retirement.
	 * @param {Error} error - Original failure; no retry or resource-limit relaxation.
	 * @returns {void} - Pending deadline is cleared.
	 */
	const fail=error=>{fatal??=error;if(pending){const current=pending;pending=null;clearTimeout(current.timer);current.reject(fatal);}};
	process_.on('error',fail);process_.stdin.on('error',fail);process_.stdout.on('error',fail);process_.stderr.on('error',fail);
	process_.stderr.on('data',bytes=>{stderr=(stderr+String(bytes)).slice(-8192);});
	process_.stdout.on('data',bytes=>{
		try {
			buffer+=String(bytes);
			if(buffer.length>65536)throw makeError('Owned collector response exceeded its bound.','TELEMETRY_RESPONSE_BOUND');
			let end;
			while((end=buffer.indexOf('\n'))>=0) {
				const line=buffer.slice(0,end);buffer=buffer.slice(end+1);
				/** @type {LocalSunOwnedResourceReply} */ const parsed=JSON.parse(line);
				if(!pending || parsed.schema!=='win32-owned-tree-resource-v2' || parsed.sequence!==pending.sequence || parsed.rootPid!==pending.rootPid ||
					!Number.isSafeInteger(parsed.privateBytes) || parsed.privateBytes<0 || !Number.isSafeInteger(parsed.workingSetBytes) || parsed.workingSetBytes<0 ||
					!Array.isArray(parsed.pids) || !parsed.pids.includes(process.pid) || !parsed.pids.includes(process_.pid) || parsed.pids.some(pid=>!Number.isSafeInteger(pid) || pid<=0) ||
					!Number.isFinite(parsed.collectorMilliseconds) || parsed.collectorMilliseconds<0)
					throw makeError('Owned collector response does not match a valid live request.','TELEMETRY_RESPONSE_IDENTITY');
				const current=pending;pending=null;clearTimeout(current.timer);
				current.resolve({...parsed,freeBytes:os.freemem(),timestamp:new Date().toISOString()});
			}
		} catch(error){fail(error instanceof Error?error:new Error(String(error)));}
	});
	process_.on('close',(code,signal)=>{
		closed=true;
		if(!stopping || code!==0 || pending || buffer.trim())fail(makeError('Owned collector closed before clean retirement.','COLLECTOR_EXIT_'+code,signal));
		completeClose();
	});
	/** Await owned collector exit without leaving a live timeout after early completion.
	 * @returns {Promise<boolean>} - True only after the close event; deadline remains10seconds.
	 */
	const closeWithin=()=>new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),10000);void closePromise.then(()=>{clearTimeout(timer);resolve(true);});});
	return {
		/** Request one sample; overlapping requests are rejected before writing.
		 * @param {number} rootPid - Current owned child root, or this wrapper during warmup.
		 * @returns {Promise<LocalSunHostResourceSample>} - Checked measurement before its unchanged10second deadline.
		 */
		sample(rootPid) {
			if(fatal || closed)return Promise.reject(fatal??makeError('Owned collector is closed.','TELEMETRY_CLOSED'));
			if(pending || !Number.isSafeInteger(rootPid) || rootPid<=0 || sequence>=2147483647)return Promise.reject(makeError('Invalid sequential telemetry request.','TELEMETRY_REQUEST'));
			const id=++sequence;
			return new Promise((resolve,reject)=>{
				const timer=setTimeout(()=>fail(makeError('Owned collector response timed out for sequence '+id+', root '+rootPid+'.','TELEMETRY_TIMEOUT')),10000);
				pending={sequence:id,rootPid,timer,resolve,reject};
				process_.stdin.write(id+'\t'+rootPid+'\n',error=>{if(error)fail(error);});
			});
		},
		/** Retire the collector on EOF, killing only this owned collector if retirement stalls.
		 * @returns {Promise<void>} - Closed collector or explicit cleanup failure.
		 */
		async stop() {
			stopping=true;
			if(!closed)process_.stdin.end();
			if(!closed && !await closeWithin()){process_.kill();if(!await closeWithin())throw makeError('Owned collector did not retire.','TELEMETRY_CLEANUP_TIMEOUT');}
			if(fatal)throw fatal;
		},
	};
}

/** Preserve useful bounded process-failure fields instead of retaining only its message.
 * @param {unknown} error - Original compiler, collector, launcher or cleanup exception.
 * @returns {LocalSunHostResourceFailure} - Safe scalar metadata and bounded output tails.
 */
function failureDetails(error) {
	const original=error instanceof Error && error.cause && typeof error.cause==='object'?error.cause:error;
	const code=original && typeof original==='object' && 'code' in original?original.code:null;
	const signal=original && typeof original==='object' && 'signal' in original?original.signal:null;
	const killed=original && typeof original==='object' && 'killed' in original?original.killed:null;
	const stdout=original && typeof original==='object' && 'stdout' in original?original.stdout:'';
	const stderr=original && typeof original==='object' && 'stderr' in original?original.stderr:'';
	return {message:error instanceof Error?error.message:String(error),code:typeof code==='string'||typeof code==='number'?code:null,
		killed:typeof killed==='boolean'?killed:null,signal:typeof signal==='string'?signal:null,stdout:String(stdout).slice(-8192),stderr:String(stderr).slice(-8192)};
}

/** Run one experiment proof with exclusive ownership and sampled aggregate resource stop thresholds.
 * @returns {Promise<void>} - New immutable resource record and child output; no video, checkpoint or production mutation.
 */
async function main() {
	const run = await ExperimentRun.create('resource-bound');
	const separator = process.argv.indexOf('--');
	const flags = process.argv.slice(2, separator < 0 ? undefined : separator);
	const numberFlag = /** @param {string} name - Named positive numeric option. @param {number} fallback - Default. */ (name, fallback) => {
		const value = Number(flags.find(flag => flag.startsWith(name + '='))?.slice(name.length + 1) ?? fallback);
		if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Positive integral resource limit required.');
		return value;
	};
	let child;
	let failure = null;
	/** @type {LocalSunHostResourceFailure|null} */ let failureDetail=null;
	/** @type {LocalSunOwnedResourceSampler|undefined} */ let telemetry;
	let exitCode = null;
	let peakPrivateBytes = 0, peakWorkingSetBytes = 0, minimumFreeBytes = os.freemem();
	let acquired = false;
	const lock = path.join(outputRoot, 'heavy-execution.lock');
	const ownership = JSON.stringify({pid: process.pid, nonce: randomUUID(), run: run.name});
	try {
		if (process.platform !== 'win32' || separator < 0) throw new Error('Windows owned-process telemetry and explicit -- launcher boundary required.');
		const [script, ...arguments_] = process.argv.slice(separator + 1);
		if (!script || !/^[a-z0-9-]+\.js$/u.test(script) || arguments_.some(value => /video|motion|\.mp4/iu.test(value)))
			throw new Error('An experiment launcher basename is required; video generation is outside this execution.');
		const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', script);
		await checkPath(repositoryRoot, file);
		const maximumBytes = numberFlag('--max-owned-mib', 8192) * 1048576;
		const reserveBytes = numberFlag('--reserve-mib', 8192) * 1048576;
		const maximumMilliseconds = numberFlag('--minutes', 45) * 60000;
		if (maximumMilliseconds > 90 * 60000 || maximumBytes > 8192 * 1048576 || reserveBytes < 8192 * 1048576)
			throw new Error('Execution may tighten but cannot relax the 8 GiB owned limit, 8 GiB reserve or 90-minute ceiling.');
		const source = await readFile(file);
		await run.write('launcher.js', source);
		for (const name of ['run-resource-bounded.js', 'ExperimentRun.js', 'run-boundary.js'])
			await run.write('source-' + name, await readFile(path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name)));
		await run.write('inputs.json', JSON.stringify({schema: 'host-resource-bound-input-v1', command: process.argv.slice(1),
			launcher: {script, sha256: hash(source), arguments: arguments_}, limits: {maximumBytes, reserveBytes, maximumMilliseconds, sampleIntervalMilliseconds: 5000},
			tools: {node: process.version, platform: process.platform}, totalBytes: os.totalmem(), operation:
			'Exclusive one-heavy-job launch, descendant process census and summed private/working-set bytes. Stop only owned child tree on threshold, duration or measurement failure. Limits are sampled stop thresholds, not kernel allocation caps; driver/GPU bytes remain separate.'}, null, '\t'));
		await checkPath(outputRoot, lock);
		const handle = await open(lock, 'wx');
		acquired = true;
		try {await handle.writeFile(ownership);} finally {await handle.close();}
		if (os.freemem() < reserveBytes) throw new Error('Free-memory reserve is unavailable before launch.');
		// Fail closed if process telemetry cannot be collected before computation.
		telemetry=startTelemetry(await prepareTelemetry(run));
		const warmed=await telemetry.sample(process.pid);
		peakPrivateBytes=Math.max(peakPrivateBytes,warmed.privateBytes);peakWorkingSetBytes=Math.max(peakWorkingSetBytes,warmed.workingSetBytes);minimumFreeBytes=Math.min(minimumFreeBytes,warmed.freeBytes);
		await run.progress('telemetry-warmup',JSON.stringify(warmed));
		if(warmed.privateBytes>maximumBytes || warmed.workingSetBytes>maximumBytes || warmed.freeBytes<reserveBytes)throw new Error('Owned memory or free-memory stop threshold exceeded during telemetry warmup.');
		child = spawn(process.execPath, ['--max-old-space-size=2048', file, ...arguments_], {
			cwd: repositoryRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
			env: {...process.env, NODE_OPTIONS: '--max-old-space-size=2048', LOCAL_SUN_HEAVY_EXECUTION: ownership},
		});
		const launched = Date.now();
		let ended = false;
		const completion = new Promise((resolve, reject) => {
			child.once('error', reject);
			child.once('exit', code => {exitCode = code; ended = true; resolve(undefined);});
		});
		// Attach immediately so a launch error during telemetry cannot become an
		// unhandled rejection; awaiting the original promise still reports it.
		void completion.catch(() => {});
		let stdout = '', stderr = '';
		child.stdout.on('data', bytes => {const value = String(bytes); stdout = (stdout + value).slice(-32768); process.stdout.write(value);});
		child.stderr.on('data', bytes => {const value = String(bytes); stderr = (stderr + value).slice(-32768); process.stderr.write(value);});
		while (!ended) {
			if (!child.pid) throw new Error('Owned child PID unavailable.');
			const observed = await telemetry.sample(child.pid);
			peakPrivateBytes = Math.max(peakPrivateBytes, observed.privateBytes);
			peakWorkingSetBytes = Math.max(peakWorkingSetBytes, observed.workingSetBytes);
			minimumFreeBytes = Math.min(minimumFreeBytes, observed.freeBytes);
			await run.progress('resources', JSON.stringify(observed));
			if (observed.privateBytes > maximumBytes || observed.workingSetBytes > maximumBytes || observed.freeBytes < reserveBytes)
				throw new Error('Owned memory or machine free-memory stop threshold exceeded.');
			if (Date.now() - launched > maximumMilliseconds) throw new Error('Bounded workload duration exceeded.');
			await Promise.race([completion, new Promise(resolve => setTimeout(resolve, 5000))]);
		}
		await completion;
		await run.write('stdout-tail.txt', stdout);
		await run.write('stderr-tail.txt', stderr);
		if (exitCode !== 0) throw new Error('Owned proof exited unsuccessfully: ' + exitCode);
	} catch (error) {
		failureDetail=failureDetails(error);
		failure = error instanceof Error ? error.message : String(error);
		if (child?.pid && child.exitCode === null && child.signalCode === null) {
			try {
				await promisify(execFile)('C:/Windows/System32/taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {windowsHide: true});
				await new Promise(resolve => {if (child.exitCode !== null || child.signalCode !== null) resolve(undefined); else child.once('exit', resolve);});
			} catch (cleanup) {failure += '; owned-tree stop: ' + String(cleanup);}
		}
	} finally {
		try {await telemetry?.stop();} catch(error){failureDetail??=failureDetails(error);failure??=failureDetail.message;}
		if (acquired) {
			await checkPath(outputRoot, lock);
			if (await readFile(lock, 'utf8') !== ownership) throw new Error('Execution lock identity changed; preserve it.');
			await unlink(lock);
		}
	}
	await run.write('result.json', JSON.stringify({schema: 'host-resource-bound-v1', exitCode, failure, failureDetail,
		peakPrivateBytes, peakWorkingSetBytes, minimumFreeBytes, resourceQualified: !failure,
		claim: 'Sampled workload resource evidence, not physical cache acceptance. Interrupted child artifacts remain incomplete and are never reopened.'}, null, '\t'));
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({resourceRun: run.name, failure, peakPrivateBytes, peakWorkingSetBytes, minimumFreeBytes}));
	if (failure) process.exitCode = 1;
}
await main();
