#!/usr/bin/env node

import {createReadStream} from 'node:fs';
import {lstat, mkdir, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

async function requireContainedFile(root, relativePath) {
	if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..')) {
		throw new Error('Static path is not contained.');
	}
	const target = await realpath(path.join(root, relativePath));
	if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Static path escapes its root.');
	const information = await lstat(target);
	if (!information.isFile() || information.isSymbolicLink()) throw new Error('Static target is not a real file.');
	return target;
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const packageRoot = await realpath(path.resolve(requireArgument('--package')));
if (!packageRoot.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('PA5 source package must remain under tmp/extraterrestrial.');
}
const outputDirectory = path.resolve(requireArgument('--output'));
if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('PA5 proof output must remain under tmp/extraterrestrial.');
}
await lstat(outputDirectory).then(
	() => {
		throw new Error('PA5 proof output directory must not already exist.');
	},
	(error) => {
		if (error.code !== 'ENOENT') throw error;
	},
);
await mkdir(outputDirectory);
if ((await realpath(outputDirectory)) !== outputDirectory) throw new Error('PA5 proof output must resolve exactly.');

const manifestPath = requireArgument('--manifest');
const manifestSha256 = requireArgument('--manifest-sha256');
const manifest = JSON.parse(await readFile(await requireContainedFile(packageRoot, manifestPath), 'utf8'));
const loadRequest = {
	manifestPath,
	manifestSha256,
	cacheIdentity: manifest.cacheIdentity,
	expected: {
		sceneSun: manifest.sceneSun,
		atmosphereIdentity: manifest.atmosphereIdentity,
		geometryIdentity: manifest.geometryIdentity,
		groundIdentity: manifest.groundIdentity,
		numericalIdentity: manifest.numericalIdentity,
	},
};
const control = {
	asset: {assetRoot: '/package/', loadRequest},
	failedAsset: {
		assetRoot: '/package/',
		loadRequest: {...loadRequest, cacheIdentity: `${manifest.cacheIdentity}:incompatible`},
	},
};
const document =
	'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="module">const target=document.querySelector("#result");try{const module=await import("/repository/scripts/algorithm32/solar-zenith-cache/runPa5LifecycleBrowser.js");target.textContent=JSON.stringify(await module.runPa5LifecycleBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>';
const server = createServer(async (request, response) => {
	try {
		const url = new URL(request.url, 'http://127.0.0.1');
		if (url.pathname === '/') {
			response.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
			response.end(document);
			return;
		}
		if (url.pathname === '/control.json') {
			response.writeHead(200, {'content-type': 'application/json'});
			response.end(JSON.stringify(control));
			return;
		}
		const prefix = url.pathname.startsWith('/repository/')
			? '/repository/'
			: url.pathname.startsWith('/package/')
				? '/package/'
				: null;
		if (!prefix) throw new Error('Static request is outside the declared roots.');
		const root = prefix === '/repository/' ? repositoryRoot : packageRoot;
		const target = await requireContainedFile(root, decodeURIComponent(url.pathname.slice(prefix.length)));
		response.writeHead(200, {
			'content-type': target.endsWith('.js') ? 'text/javascript' : 'application/octet-stream',
		});
		createReadStream(target).pipe(response);
	} catch (error) {
		response.writeHead(500, {'content-type': 'text/plain'});
		response.end(error.message);
	}
});

let browser;
const profilePath = path.join(outputDirectory, '.chrome-profile');
try {
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	browser = await puppeteer.launch({
		executablePath: path.resolve(requireArgument('--chrome')),
		headless: 'new',
		userDataDir: profilePath,
		protocolTimeout: 7_500_000,
		args: [
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-software-rasterizer',
		],
	});
	const page = await browser.newPage();
	page.on('console', (message) => process.stdout.write(`${message.text()}\n`));
	await page.goto(`http://127.0.0.1:${server.address().port}/`);
	await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'pending', {
		timeout: 7_500_000,
	});
	const result = JSON.parse(await page.$eval('#result', (element) => element.textContent));
	if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
	const report = {
		schemaId: 'algorithm32-distant-sun-pa5-lifecycle-proof-v1',
		accepted: true,
		sourcePackage: packageRoot,
		manifestPath,
		derivation: {
			parentCacheIdentity: manifest.cacheIdentity,
			operation:
				'production controller initial load, exact reuse, failed replacement, WebGL context cycle, forced exact reload, atomic swap, and disposal',
			implementation: 'scripts/algorithm32/solar-zenith-cache/runPa5LifecycleBrowser.js',
		},
		result,
	};
	await writeFile(path.join(outputDirectory, 'pa5-lifecycle-proof.json'), `${JSON.stringify(report, null, 2)}\n`, {
		flag: 'wx',
	});
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(() => resolve()));
	await rm(profilePath, {recursive: true, force: true, maxRetries: 20, retryDelay: 250});
}
