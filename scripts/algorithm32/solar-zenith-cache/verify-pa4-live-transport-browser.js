#!/usr/bin/env node

import {createReadStream} from 'node:fs';
import {lstat, mkdir, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

function argument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

async function containedFile(root, relativePath) {
	if (!relativePath || relativePath.startsWith('/') || relativePath.includes('..'))
		throw new Error('Static path is not contained.');
	const target = await realpath(path.join(root, relativePath));
	if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Static path escapes its root.');
	const information = await lstat(target);
	if (!information.isFile() || information.isSymbolicLink()) throw new Error('Static target is not a real file.');
	return target;
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const packageRoot = await realpath(path.resolve(argument('--package')));
if (!packageRoot.startsWith(`${evidenceRoot}${path.sep}`))
	throw new Error('PA4 source package must remain under tmp/extraterrestrial.');
const outputDirectory = path.resolve(argument('--output'));
if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`))
	throw new Error('PA4 output must remain under tmp/extraterrestrial.');
await lstat(outputDirectory).then(
	() => {
		throw new Error('PA4 output directory must not already exist.');
	},
	(error) => {
		if (error.code !== 'ENOENT') throw error;
	},
);
await mkdir(outputDirectory);
if ((await realpath(outputDirectory)) !== outputDirectory) throw new Error('PA4 output must resolve exactly.');

const manifestPath = argument('--manifest');
const manifest = JSON.parse(await readFile(await containedFile(packageRoot, manifestPath), 'utf8'));
const control = {
	observation: {
		instant: manifest.sceneSun.instant,
		location: {
			latitude: {value: 37.3382, units: 'degrees'},
			longitude: {value: -121.8863, units: 'degrees'},
		},
	},
	sceneCacheAsset: {
		assetRoot: '/package/',
		loadRequest: {
			manifestPath,
			manifestSha256: argument('--manifest-sha256'),
			cacheIdentity: manifest.cacheIdentity,
			expected: {
				sceneSun: manifest.sceneSun,
				atmosphereIdentity: manifest.atmosphereIdentity,
				geometryIdentity: manifest.geometryIdentity,
				groundIdentity: manifest.groundIdentity,
				numericalIdentity: manifest.numericalIdentity,
			},
		},
	},
};
const document =
	'<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/repository/node_modules/three/build/three.module.js","three/":"/repository/node_modules/three/"}}</script><pre id="result">pending</pre><script type="module">const target=document.querySelector("#result");try{const module=await import("/repository/scripts/algorithm32/solar-zenith-cache/runPa4LiveTransportBrowser.js");target.textContent=JSON.stringify(await module.runPa4LiveTransportBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>';
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
		const target = await containedFile(root, decodeURIComponent(url.pathname.slice(prefix.length)));
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
		executablePath: path.resolve(argument('--chrome')),
		headless: 'new',
		userDataDir: profilePath,
		args: [
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-software-rasterizer',
		],
	});
	const page = await browser.newPage();
	await page.goto(`http://127.0.0.1:${server.address().port}/`);
	await page.waitForFunction(() => document.querySelector('#result')?.textContent !== 'pending', {
		timeout: 7_500_000,
	});
	const result = JSON.parse(await page.$eval('#result', (element) => element.textContent));
	if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
	const imageDataUrls = result.imageDataUrls;
	delete result.imageDataUrls;
	if (!imageDataUrls?.objectFree?.startsWith('data:image/png;base64,')) {
		throw new Error('PA4 browser did not return the object-free PNG render.');
	}
	if (!imageDataUrls?.objectShortened?.startsWith('data:image/png;base64,')) {
		throw new Error('PA4 browser did not return the object-shortened PNG render.');
	}
	const imagePaths = {
		objectFree: path.join(outputDirectory, 'pa4-nautical-live-q30-object-free.png'),
		objectShortened: path.join(outputDirectory, 'pa4-nautical-live-q30-object-shortened.png'),
	};
	for (const [name, imagePath] of Object.entries(imagePaths)) {
		await writeFile(imagePath, Buffer.from(imageDataUrls[name].slice('data:image/png;base64,'.length), 'base64'), {
			flag: 'wx',
		});
	}
	const report = {
		schemaId: 'algorithm32-distant-sun-pa4-live-transport-proof-v1',
		accepted: true,
		sourcePackage: packageRoot,
		manifestPath,
		imagePaths,
		result,
	};
	await writeFile(
		path.join(outputDirectory, 'pa4-live-transport-proof.json'),
		`${JSON.stringify(report, null, 2)}\n`,
		{flag: 'wx'},
	);
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
	await browser?.close();
	await new Promise((resolve) => server.close(() => resolve()));
	await rm(profilePath, {recursive: true, force: true, maxRetries: 20, retryDelay: 250});
}
