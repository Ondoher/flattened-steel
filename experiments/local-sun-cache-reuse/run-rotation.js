import path from 'node:path';
import {readFile, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import puppeteer from 'puppeteer';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {PNG} from 'pngjs';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {readParent} from './parent-evidence.js';

/** Produce a directly viewable fresh/reused/50x absolute-difference plate.
 * @param {ExperimentRun} run - Open evidence run.
 * @param {number} degrees - Captured rotation.
 * @param {LocalSunRotationCaptionPage} page - Browser used only to caption the derived image.
 * @param {string} stateId - Frozen orbital control identity.
 * @param {string} [poseLabel] - Explicit rotation/displacement caption for a shell pose.
 * @returns {Promise<LocalSunRotationImageResidual>} - All RGB byte differences.
 */
async function imagePlate(run, degrees, page, stateId,poseLabel) {
	const freshPath = path.join(run.root, `angle-${degrees}-fresh.png`),
		reusedPath = path.join(run.root, `angle-${degrees}-reused.png`);
	await checkPath(run.root, freshPath);
	await checkPath(run.root, reusedPath);
	const fresh = PNG.sync.read(await readFile(freshPath)),
		reused = PNG.sync.read(await readFile(reusedPath));
	if (fresh.width !== reused.width || fresh.height !== reused.height) throw new Error('Image dimensions differ.');
	const plate = new PNG({width: fresh.width * 3, height: fresh.height}),
		differences = [];
	for (let y = 0; y < fresh.height; y++)
		for (let x = 0; x < fresh.width; x++)
			for (let c = 0; c < 4; c++) {
				const input = (y * fresh.width + x) * 4 + c,
					a = fresh.data[input],
					b = reused.data[input];
				plate.data[(y * plate.width + x) * 4 + c] = a;
				plate.data[(y * plate.width + x + fresh.width) * 4 + c] = b;
				plate.data[(y * plate.width + x + fresh.width * 2) * 4 + c] =
					c === 3 ? 255 : Math.min(255, 50 * Math.abs(a - b));
				if (c < 3) differences.push(Math.abs(a - b));
			}
	const dataUrl = await page.evaluate(
		async ({source, width, height, degrees, stateId,poseLabel}) => {
			const image = new Image();
			image.src = source;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height + 34;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Caption canvas unavailable.');
			context.fillStyle = '#151515';
			context.fillRect(0, 0, width, 34);
			context.drawImage(image, 0, 34);
			context.fillStyle = 'white';
			context.font = '18px sans-serif';
			for (const [index, title] of ['Fresh', 'Reused', '50x absolute RGB difference'].entries())
				context.fillText(
					`${poseLabel ?? (stateId === 'flat-0' ? `${degrees} degrees` : `${stateId}: fresh orbital control`)}: ${title}`,
					(index * width) / 3 + 12,
					23,
				);
			return canvas.toDataURL('image/png');
		},
		{
			source: `data:image/png;base64,${PNG.sync.write(plate).toString('base64')}`,
			width: plate.width,
			height: plate.height,
			degrees,
			stateId,
			poseLabel,
		},
	);
	await run.write(`angle-${degrees}-comparison.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
	differences.sort((a, b) => a - b);
	return {
		degrees,
		count: differences.length,
		maximum: differences.at(-1),
		p95: differences[Math.ceil(differences.length * 0.95) - 1],
		panels: 'left=fresh; middle=reused; right=absolute RGB-byte difference amplified 50x; identical adaptation from fresh receiver for both images',
	};
}

/** Run one contained diagnostic or selected-profile rotation attempt.
 * @returns {Promise<void>} - Completion after cleanup and sealed inventory.
 */
async function main() {
	await requireHeavyExecution();
	const diagnostic = process.argv[2] !== 'selected',
		early = process.argv.includes('--early'),
		motion = process.argv.includes('--motion');
	const candidateArgument = process.argv.find((value) => value.startsWith('--candidate='));
	const candidate = candidateArgument?.slice('--candidate='.length);
	const stateId = process.argv.find((value) => value.startsWith('--state='))?.slice('--state='.length) ?? 'flat-0';
	const shellRun=process.argv.find(value=>value.startsWith('--shell='))?.slice('--shell='.length);
	if(shellRun && (diagnostic || motion || stateId!=='flat-0'))throw new Error('Shell development rotation requires the selected Flat0 still-only matrix.');
	if (candidate && !['axis', 'local', 'covered', 'precision'].includes(candidate))
		throw new Error('Unknown corrective candidate.');
	if (!['diagnostic', 'selected'].includes(process.argv[2] ?? 'diagnostic'))
		throw new Error('Profile must be diagnostic or selected.');
	const run = await ExperimentRun.create(
		shellRun ? 'p3-shell-move' : stateId !== 'flat-0'
			? `p2-fresh-${stateId.slice(5)}`
			: candidate
				? `p2-${candidate === 'precision' ? 'prec' : candidate}-${diagnostic ? 'diag' : 'sel'}`
				: diagnostic
					? early
						? 'p2-v1'
						: 'p2-diagnostic'
					: 'p2-selected',
	);
	let browser,
		host,
		failure = null;
	const profile = path.join(run.root, 'profile');
	try {
		const parent = await readParent('00018-controls', 'controls.json'),
			acceptance = await readParent(shellRun ?? '00019-acceptance', 'gates.json');
		const layoutParent=shellRun ? await readParent(shellRun,'layout.json') : null;
		const controls = JSON.parse(new TextDecoder().decode(parent.bytes)),
			gates = JSON.parse(new TextDecoder().decode(acceptance.bytes));
		for (const q of gates.quantities)
			if (q.reuseRelative !== 0.0001 || q.cpuGpuRelative !== 0.002)
				throw new Error('Frozen gate semantics changed.');
		/** @type {LocalSunRotationRecipe} */
		const recipe = {
			state: controls.states.find((s) => s.id === stateId),
			diagnostic,
			angles: stateId !== 'flat-0' ? [0] : early ? [0, 17] : gates.matrix.rotationDegrees,
			motion,
			...(layoutParent ? {shellLayout:JSON.parse(new TextDecoder().decode(layoutParent.bytes))} : {}),
			...(candidate ? {candidate: /** @type {LocalSunCorrectionCandidate} */ (candidate)} : {}),
		};
		if(process.argv.includes('--application')) {
			if(!shellRun)throw new Error('Application proof requires explicit shell layout.');
			recipe.shellApplication=true;
			recipe.shellScene=process.argv.includes('--scene');
			recipe.shellLifecycle=process.argv.includes('--lifecycle');
			recipe.shellReplacements=process.argv.includes('--replacements');
			recipe.shellCoverageExit=process.argv.includes('--coverage-exit');
			recipe.shellWorker=process.argv.includes('--application-worker');
		}
		if(process.argv.includes('--application-worker') && !recipe.shellApplication)throw new Error('Application worker requires the actual application proof.');
		const temporalArgument=process.argv.find(value=>value.startsWith('--temporal='))?.slice('--temporal='.length);
		const temporalParents=[];
		if(temporalArgument) {
			const [name,trajectoryId,mode]=temporalArgument.split(':');
			if(!recipe.shellWorker || !shellRun || recipe.shellLifecycle || recipe.shellCoverageExit || recipe.shellReplacements || !['fresh','reuse'].includes(mode))throw new Error('Exact temporal proof requires the owned worker app and a separate fresh/reuse mode.');
			const statesParent=await readParent(name,'states.json'),selectionParent=await readParent('00281-p3-selection','selection.json'),selectedLayout=await readParent('00281-p3-selection','layout.json');
			if(selectedLayout.artifactSha256!==layoutParent.artifactSha256)throw new Error('Temporal numerical policy differs from pre-holdout selection.');
			const states=JSON.parse(new TextDecoder().decode(statesParent.bytes));
			const trajectory=states.trajectories.find(value=>value.id===trajectoryId);
			if(states.schema!=='shell-temporal-states-v1' || trajectory?.states.length!==120)throw new Error('Complete frozen temporal trajectory required.');
			const count=Number(process.argv.find(value=>value.startsWith('--temporal-count='))?.slice('--temporal-count='.length) ?? 120);
			if(![2,120].includes(count))throw new Error('Temporal execution is the full 120-state trajectory or an explicitly bounded two-state diagnostic.');
			recipe.shellTemporalStates=trajectory.states.slice(0,count);
			recipe.shellTemporalMode=/** @type {LocalSunShellTemporalMode} */(mode);
			temporalParents.push(statesParent,selectionParent,selectedLayout);
		}
		if (!recipe.state || recipe.angles[0] !== 0) throw new Error('Canonical Flat 0 input missing.');
		if(shellRun && process.argv.includes('--translations'))recipe.shellPoses=[...recipe.angles.map(degrees=>({degrees,offset:/** @type {[number,number]} */([0,0]),key:degrees})),...gates.matrix.translationsMeters.filter((/** @type {number[]} */ offset)=>offset.some(value=>value!==0)).map((/** @type {[number,number]} */ offset,/** @type {number} */ index)=>({degrees:0,offset,key:1000+index}))];
		if(process.argv.includes('--translations-only')) {
			if(!recipe.shellPoses)throw new Error('Translations-only requires the explicit shell translation matrix.');
			recipe.shellPoses=recipe.shellPoses.filter(pose=>pose.key===0 || pose.offset.some(value=>value!==0));
		}
		await run.write('gates.json', acceptance.bytes);
		const entry = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse',recipe.shellWorker ? 'shell-application-host-entry.js' : 'rotation-browser.js');
		await checkPath(repositoryRoot, entry);
		const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');
		const bundlerWarnings = [];
		const bundle = await rollup({
			input: entry,
			plugins: [nodeResolve({browser: true}), commonjs()],
			onwarn(warning) {
				bundlerWarnings.push({code: warning.code, message: warning.message});
			},
		});
		let code, inputs;
		try {
			code = (await bundle.generate({format: 'iife'})).output[0].code.replaceAll(
				'process.env.NODE_ENV',
				JSON.stringify('production'),
			);
			inputs = bundle.watchFiles;
		} finally {
			await bundle.close();
		}
		let workerCode='';
		if(shellRun) {
			const worker=await rollup({input:path.join(repositoryRoot,'experiments/local-sun-cache-reuse/shell-phase-worker.js'),plugins:[nodeResolve({browser:true}),commonjs()],onwarn(w){bundlerWarnings.push({code:w.code,message:w.message});}});
			try {workerCode=(await worker.generate({format:'iife'})).output[0].code;inputs.push(...worker.watchFiles);} finally {await worker.close();}
			await run.write('phase-worker.bundle.js',workerCode);
		}
		let applicationWorkerCode='';
		if(recipe.shellWorker) {
			const workerEntry=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/shell-application-worker.js');await checkPath(repositoryRoot,workerEntry);
			const application=await rollup({input:workerEntry,plugins:[nodeResolve({browser:true}),commonjs()],onwarn(w){bundlerWarnings.push({code:w.code,message:w.message});}});
			try {applicationWorkerCode=(await application.generate({format:'iife'})).output[0].code.replaceAll('process.env.NODE_ENV',JSON.stringify('production'));inputs.push(...application.watchFiles);}finally{await application.close();}
			await run.write('application-worker.bundle.js',applicationWorkerCode);
		}
		const identities = [];
		for (const input of [
			...new Set([
				...inputs,
				path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-rotation.js'),
				path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/heavy-execution-admission.js'),
				path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/parent-evidence.js'),
				path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-boundary.js'),
				path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/ExperimentRun.js'),
				path.join(repositoryRoot, 'package-lock.json'),
			]),
		].filter((v) => !v.startsWith('\0'))) {
			await checkPath(repositoryRoot, input);
			const bytes = await readFile(input);
			identities.push({
				path: path.relative(repositoryRoot, input).replaceAll('\\', '/'),
				byteLength: bytes.length,
				sha256: hash(bytes),
			});
		}
		await run.write('bundle.js', code);
		if(recipe.shellApplication)recipe.shellImplementationIdentity=hash(JSON.stringify({application:hash(code),worker:hash(workerCode),canvasWorker:hash(applicationWorkerCode)}));
		await run.write('recipe.json', JSON.stringify(recipe, null, '\t'));
		await run.write('bundler-warnings.json', JSON.stringify(bundlerWarnings, null, '\t'));
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'local-sun-p2-inputs-v1',
					command: `node experiments/local-sun-cache-reuse/run-rotation.js ${process.argv.slice(2).join(' ')}`,
					parents: [parent, acceptance,...(layoutParent ? [layoutParent] : []),...temporalParents].map(({bytes, ...identity}) => identity),
					inputs: identities,
					virtualModules: inputs.filter((v) => v.startsWith('\0')),
					bundleSha256: hash(code),
					operation: recipe.shellApplication
						? 'Prepare and atomically publish complete exact-state experimental shell GPU application frames, measure CPU/GPU rays and emit direct PNGs. Optional deliberate lifecycle faults exercise the real owned backend; no motion recording.'
						: 'Fresh N4 cache at rotated Flat 0 using the explicitly selected control or experimental shell policy; compare complete measured fields with canonical fields, direct and inverse reconstruction, CPU/GPU exact rays and direct PNGs. Optional ideal motion is separately selected.',
					parameters: recipe,
					fieldRetention:
						'Complete arrays inspected in memory; retain content hashes, complete residual counts and physical ray observations instead of duplicate full fields.',
				},
				null,
				'\t',
			),
		);
		host = createServer((request, response) => {
			response.writeHead(request.url === '/' || request.url === '/bundle.js' || request.url==='/phase-worker.js' && workerCode.length>0 || request.url==='/application-worker.js' && applicationWorkerCode.length>0 ? 200 : 404, {
				'content-type': request.url?.endsWith('.js') ? 'text/javascript' : 'text/html',
			});
			response.end(request.url === '/bundle.js' ? code : request.url==='/phase-worker.js' ? workerCode : request.url==='/application-worker.js' ? applicationWorkerCode : '<!doctype html><script src="/bundle.js"></script>');
		});
		await new Promise((resolve, reject) => {
			host.once('error', reject);
			host.listen(0, '127.0.0.1', () => resolve(undefined));
		});
		const address = host.address();
		if (!address || typeof address === 'string') throw new Error('Loopback unavailable.');
		await checkPath(run.root, profile);
		const executablePath =
				process.env.LOCAL_SUN_CACHE_CHROME_EXECUTABLE ??
				'C:/Program Files/Google/Chrome/Application/chrome.exe',
			args = [
				'--enable-gpu',
				'--use-angle=d3d11',
				'--ignore-gpu-blocklist',
				'--disable-background-timer-throttling',
			];
		browser = await puppeteer.launch({
			executablePath,
			headless: 'new',
			userDataDir: profile,
			args,
			protocolTimeout: recipe.shellTemporalStates?.length===120 ? 10800000 : 1800000,
		});
		await run.write(
			'browser.json',
			JSON.stringify(
				{
					version: await browser.version(),
					executablePath,
					executableSha256: hash(await readFile(executablePath)),
					args,
					node: process.version,
					headless: 'new',
					profilePolicy: 'fresh disposable profile removed before sealing',
				},
				null,
				'\t',
			),
		);
		const page = await browser.newPage();
		page.setDefaultTimeout(0);
		await page.setViewport({width: 720, height: 414, deviceScaleFactor: 1});
		page.on('console', (m) => {
			console.log(m.text());
			void run.progress('browser', m.text());
		});
		page.on('pageerror', (e) => {
			console.log(String(e));
			void run.progress('browser-error', String(e));
		});
		await page.exposeFunction('localSunRotationArtifact', async (name, json) => {
			if (
				!/^(angle-\d+-(fresh|reused|application)\.png|angle-\d+\.json|rotation\.mp4|blink-17\.mp4|motion\.json)$/u.test(
					name,
				)
			)
				throw new Error('Invalid artifact name.');
			const value = JSON.parse(json);
			const bytes = name.endsWith('.png')
				? Buffer.from(value.dataUrl.split(',')[1], 'base64')
				: name.endsWith('.mp4')
					? Buffer.from(value.base64, 'base64')
					: JSON.stringify(value, null, '\t');
			await run.write(name, bytes);
		});
		await page.goto(`http://127.0.0.1:${address.port}/`, {waitUntil: 'load'});
		const result = JSON.parse(
			await page.evaluate(
				(recipe) =>
					/** @type {LocalSunRotationBridge} */ (/** @type {unknown} */ (globalThis))[recipe.shellWorker ? 'localSunShellApplicationWorker' : 'localSunRotation'](
						recipe,
					),
				recipe,
			),
		);
		result.images = [];
		const artifactAngles=recipe.shellApplication ? result.results.map(row=>{if(!('artifactKey' in row) || typeof row.artifactKey!=='number')throw new Error('Application artifact key missing.');return row.artifactKey;}) : recipe.shellPoses?.map(pose=>pose.key) ?? recipe.angles;
		for (const angle of artifactAngles) {
			const pose=recipe.shellPoses?.find(value=>value.key===angle);
			result.images.push(recipe.shellApplication ? {artifact:`angle-${angle}-application.png`,role:'Single actual published application frame; no independent fresh/reused comparison'} : await imagePlate(run, angle, page, stateId,pose ? `${pose.degrees} deg; XY +[${pose.offset}] m` : undefined));
		}
		result.assessment = {
			candidate: candidate ?? 'original-control',
			stateId,
			role: recipe.shellApplication ? 'Exact-state application publication with explicitly listed developmental movement, replacement or lifecycle cases' :
				stateId === 'flat-0'
					? 'fixed-offset synthetic rotation'
					: 'fresh orbital-time visual control; outside the fixed-offset reuse admission',
			qualification:
				'Execution success is separate from numerical admission; evaluate every recorded residual, coverage and endpoint gate.',
		};
		await run.write('result.json', JSON.stringify(result, null, '\t'));
	} catch (error) {
		failure = String(error.stack ?? error);
	} finally {
		try {
			await browser?.close();
			await checkPath(run.root, profile);
			await rm(profile, {recursive: true, force: true});
		} catch (error) {
			failure ??= `Browser cleanup: ${error}`;
		}
		try {
			if (host?.listening)
				await new Promise((resolve, reject) => host.close((e) => (e ? reject(e) : resolve(undefined))));
		} catch (error) {
			failure ??= `Host cleanup: ${error}`;
		}
	}
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({run: run.name, failure}));
	if (failure) process.exitCode = 1;
}

await main();
