import {execFile, spawn} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	EXPERIMENT_ROOT, OUTPUT_ROOT, assertLexicallyContained,
} from '../../harness/lib/roots.js';

const executeFile = promisify(execFile);
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function executeChromeCdp({url, profile, timeoutMilliseconds}) {
	const child = spawn(CHROME_PATH, ['--headless=new','--enable-gpu','--enable-webgl','--ignore-gpu-blocklist',
		'--use-angle=d3d11','--disable-software-rasterizer','--remote-debugging-port=0','--no-first-run',
		`--user-data-dir=${profile}`,url], {windowsHide:true});
	const stdout=[],stderr=[];child.stdout.on('data',(value)=>stdout.push(value));child.stderr.on('data',(value)=>stderr.push(value));
	const deadline=Date.now()+timeoutMilliseconds;
	try {
		let port;
		while(Date.now()<deadline){try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split(/\r?\n/u)[0]);break;}catch{await delay(100);}}
		if(!Number.isInteger(port))throw new Error('Chrome did not publish its DevTools port.');
		let target;
		while(Date.now()<deadline){const list=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json()).catch(()=>[]);
			target=list.find(item=>item.type==='page'&&item.url===url)??list.find(item=>item.type==='page');if(target)break;await delay(100);}
		if(!target?.webSocketDebuggerUrl)throw new Error('Chrome did not publish a page debugging target.');
		const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
		let nextId=1;const pending=new Map();socket.addEventListener('message',(event)=>{const message=JSON.parse(event.data);if(!message.id)return;
			const record=pending.get(message.id);if(!record)return;pending.delete(message.id);message.error?record.reject(new Error(message.error.message)):record.resolve(message.result);});
		const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=nextId++;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
		await cdp('Runtime.enable');let content='pending';
		while(Date.now()<deadline){const evaluated=await cdp('Runtime.evaluate',{expression:"document.querySelector('#result')?.textContent ?? 'pending'",returnByValue:true});
			content=evaluated.result?.value??'pending';if(content!=='pending')break;await delay(1000);}
		if(content==='pending')throw new Error('Chrome page did not finish before the timeout.');
		const html=await cdp('Runtime.evaluate',{expression:'document.documentElement.outerHTML',returnByValue:true});socket.close();
		return {stdout:html.result.value,stderr:Buffer.concat(stderr).toString('utf8')};
	} finally {child.kill();}
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

async function requestBody(request, limit) {
	const chunks = [];
	let length = 0;
	for await (const chunk of request) {
		length += chunk.length;
		if (length > limit) throw new Error('Browser upload exceeds the declared limit.');
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

export async function executeContainedBrowser({
	run,
	modulePath,
	exportName,
	servedRoots = {},
	importMap = {},
	browserDriver = 'chrome-dump-dom',
	uploadLimitBytes = 64 * 1024 * 1024,
	timeoutMilliseconds = 7_500_000,
}) {
	await lstat(CHROME_PATH);
	const progress = [];
	const requests = [];
	const uploads = new Map();
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/lane/', path.join(EXPERIMENT_ROOT, 'solar-zenith-cache')],
		...Object.entries(servedRoots),
	]);
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, 'http://127.0.0.1');
			const pathname = decodeURIComponent(url.pathname);
			requests.push(`${request.method} ${pathname}`);
			if (pathname === '/progress') {
				progress.push({stage: url.searchParams.get('stage'), time: Date.now()});
				response.writeHead(204); response.end(); return;
			}
			if (request.method === 'POST' && pathname.startsWith('/artifact/')) {
				if (!/^\/artifact\/[a-z0-9][a-z0-9./-]*$/u.test(pathname)
					|| pathname.includes('..') || uploads.has(pathname)) {
					throw new Error('Invalid or duplicate browser artifact path.');
				}
				uploads.set(pathname, await requestBody(request, uploadLimitBytes));
				response.writeHead(204); response.end(); return;
			}
			const route = [...roots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) throw new Error('Unsupported browser path.');
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('Served path escapes its root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) throw new Error('Served target is not a real file.');
			const [canonicalRoot, canonicalTarget] = await Promise.all([realpath(root), realpath(target)]);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Served real path escapes its root.');
			}
			response.writeHead(200, {'content-type': contentType(target)});
			response.end(await readFile(canonicalTarget));
		} catch (error) {
			response.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
			response.end(error.message);
		}
	});
	let profile = null;
	try {
		await new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});
		const html = '<!doctype html><meta charset="utf-8"><script type="importmap">'
			+ JSON.stringify({imports: importMap}) + '</script><pre id="result">pending</pre>'
			+ '<script type="module">window.pointLocalProgress=(stage)=>fetch("/progress?stage="'
			+ '+encodeURIComponent(stage));const target=document.querySelector("#result");try{'
			+ `const module=await import(${JSON.stringify(modulePath)});target.textContent=JSON.stringify(await module[${JSON.stringify(exportName)}]());`
			+ '}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>';
		await run.writeArtifact('browser/index.html', html);
		profile = assertLexicallyContained(OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId), 'browser profile');
		await mkdir(profile, {recursive: true});
		let browserOutput;
		try {
			if (browserDriver === 'chrome-cdp') {
				browserOutput = await executeChromeCdp({url:`http://127.0.0.1:${server.address().port}/browser/index.html`,
					profile,timeoutMilliseconds});
			} else {
				if (browserDriver !== 'chrome-dump-dom') throw new Error(`Unsupported browser driver: ${browserDriver}.`);
				browserOutput = await executeFile(CHROME_PATH, [
				'--headless=new', '--enable-gpu', '--enable-webgl',
				'--ignore-gpu-blocklist', '--use-angle=d3d11',
				'--disable-software-rasterizer', '--disable-breakpad',
				'--disable-crash-reporter', '--disable-component-update',
				'--disable-background-networking', '--disable-gpu-shader-disk-cache',
				'--no-first-run', `--user-data-dir=${profile}`,
				'--virtual-time-budget=7200000', '--dump-dom',
				`http://127.0.0.1:${server.address().port}/browser/index.html`,
				], {timeout: timeoutMilliseconds, maxBuffer: 32 * 1024 * 1024, windowsHide: true});
			}
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			await run.writeArtifact('browser/stderr-on-failure.txt', error.stderr ?? '');
			await run.writeJsonArtifact('browser/progress-on-failure.json', progress);
			throw error;
		}
		await run.writeArtifact('browser/dom.html', browserOutput.stdout);
		await run.writeArtifact('browser/stderr.txt', browserOutput.stderr);
		await run.writeJsonArtifact('browser/progress.json', progress);
		await run.writeJsonArtifact('browser/requests.json', requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u.exec(browserOutput.stdout)?.[1];
		if (!resultText) throw new Error('Browser emitted no result.');
		const result = JSON.parse(resultText);
		if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
		return {result, uploads, progress, requests};
	} finally {
		await new Promise((resolve) => server.close(() => resolve()));
		if (profile) await rm(profile, {recursive: true, force: true}).catch(() => {});
	}
}
