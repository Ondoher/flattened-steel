import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {lstat, readFile, realpath, stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';

import {resolveDistantSunSceneCache} from '../../src/flat32/DistantSunSceneCacheResolver.js';

function argument(name, fallback = null) {
	const index = process.argv.indexOf(name);
	if (index < 0) return fallback;
	if (index + 1 >= process.argv.length || process.argv[index + 1].startsWith('--')) {
		throw new Error(`${name} requires a value.`);
	}
	return process.argv[index + 1];
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function ordinaryDirectory(directory, label) {
	const facts = await lstat(directory);
	if (facts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const resolved = await realpath(directory);
	if (!(await stat(resolved)).isDirectory()) throw new Error(`${label} must be a directory.`);
	return resolved;
}

async function containedFile(root, relativePath) {
	if (!relativePath || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes('..')) {
		throw new Error('Static cache path is not contained.');
	}
	const candidate = path.join(root, relativePath);
	const resolved = await realpath(candidate);
	if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error('Static cache path escapes its package root.');
	const facts = await lstat(resolved);
	if (!facts.isFile() || facts.isSymbolicLink()) throw new Error('Static cache target is not an ordinary file.');
	return resolved;
}

function sendJson(response, status, value) {
	const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
	response.writeHead(status, {
		'content-type': 'application/json; charset=utf-8',
		'content-length': bytes.length,
		'cache-control': 'no-store',
	});
	response.end(bytes);
}

const packageRoot = await ordinaryDirectory(path.resolve(argument('--package-root')), 'Runtime package root');
const applicationRootArgument = argument('--application-root');
const applicationRoot =
	applicationRootArgument === null
		? null
		: await ordinaryDirectory(path.resolve(applicationRootArgument), 'Flat32 application root');
const report = JSON.parse(await readFile(await containedFile(packageRoot, 'package-report.json'), 'utf8'));
if (
	report.schemaId !== 'algorithm32-distant-sun-bin-covered-runtime-package-set-v1' ||
	report.accepted !== true
) {
	throw new Error('Runtime package report is incompatible.');
}
const catalogFile = await containedFile(packageRoot, report.catalogPath);
const catalogBytes = await readFile(catalogFile);
if (sha256(catalogBytes) !== report.catalogSha256) throw new Error('Runtime catalog hash does not match its report.');
const catalog = JSON.parse(catalogBytes.toString('utf8'));
const requestedPort = Number(argument('--port', '0'));
if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
	throw new RangeError('--port must be an integer from 0 through 65535.');
}

const server = createServer(async (request, response) => {
	try {
		const url = new URL(request.url, `http://${request.headers.host ?? '127.0.0.1'}`);
		if (request.method === 'GET' && url.pathname === '/api/distant-sun-scene-cache') {
			if ([...url.searchParams.keys()].some((name) => name !== 'solarZenithDegrees')) {
				sendJson(response, 400, {error: 'Only solarZenithDegrees is accepted.'});
				return;
			}
			const rawDegrees = url.searchParams.get('solarZenithDegrees');
			const solarZenithDegrees = rawDegrees === null || rawDegrees.trim() === '' ? Number.NaN : Number(rawDegrees);
			try {
				const resolution = resolveDistantSunSceneCache(catalog, solarZenithDegrees, '/scene-caches/');
				sendJson(response, 200, resolution);
			} catch (error) {
				sendJson(response, 400, {error: error instanceof Error ? error.message : String(error)});
			}
			return;
		}
		if (request.method === 'GET' && url.pathname.startsWith('/scene-caches/')) {
			const relativePath = decodeURIComponent(url.pathname.slice('/scene-caches/'.length));
			const file = await containedFile(packageRoot, relativePath);
			const facts = await stat(file);
			const extension = path.extname(file);
			const contentType = extension === '.json' ? 'application/json' : 'application/octet-stream';
			response.writeHead(200, {
				'content-type': contentType,
				'content-length': facts.size,
				'cache-control': 'public, max-age=31536000, immutable',
			});
			createReadStream(file).pipe(response);
			return;
		}
		if (request.method === 'GET' && applicationRoot !== null) {
			const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
			const file = await containedFile(applicationRoot, relativePath);
			const facts = await stat(file);
			const extension = path.extname(file);
			const contentType =
				extension === '.html'
					? 'text/html; charset=utf-8'
					: extension === '.js'
						? 'text/javascript; charset=utf-8'
						: extension === '.css'
							? 'text/css; charset=utf-8'
							: 'application/octet-stream';
			response.writeHead(200, {
				'content-type': contentType,
				'content-length': facts.size,
				'cache-control': 'no-cache',
			});
			createReadStream(file).pipe(response);
			return;
		}
		sendJson(response, 404, {error: 'Not found.'});
	} catch (error) {
		sendJson(response, error?.code === 'ENOENT' ? 404 : 500, {
			error: error instanceof Error ? error.message : String(error),
		});
	}
});

await new Promise((resolve, reject) => {
	server.once('error', reject);
	server.listen(requestedPort, '127.0.0.1', resolve);
});
const address = server.address();
process.stdout.write(`${JSON.stringify({ready: true, host: '127.0.0.1', port: address.port})}\n`);

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => server.close(() => process.exit(0)));
}
