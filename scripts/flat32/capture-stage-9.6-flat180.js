import {createServer} from 'node:http';
import {mkdir, readFile, stat} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';

import puppeteer from 'puppeteer';

const root = resolve('dist/flat32');
const output = resolve('.tmp/stage-9.6-flat180-n4.png');
const contentTypes = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'text/javascript',
};
const server = createServer(async (request, response) => {
	try {
		const relativePath =
			request.url === '/' || request.url?.startsWith('/?')
				? 'index.html'
				: decodeURIComponent(request.url?.split('?')[0] ?? '').replace(/^\/+/u, '');
		const path = resolve(root, relativePath);

		if (path !== root && !path.startsWith(`${root}${sep}`)) {
			response.writeHead(403).end();
			return;
		}
		const file = await readFile(path);

		response.writeHead(200, {
			'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream',
		});
		response.end(file);
	} catch {
		response.writeHead(404).end();
	}
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const port = typeof address === 'object' && address !== null ? address.port : 0;
const browser = await puppeteer.launch({
	headless: 'new',
	protocolTimeout: 600000,
	defaultViewport: {
		width: 512,
		height: 256,
		deviceScaleFactor: 1,
	},
	args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--window-size=512,256'],
});

try {
	const page = await browser.newPage();
	const errors = [];

	page.setDefaultTimeout(600000);
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto(`http://127.0.0.1:${port}/?diagnostic=flat180-wide-n4`, {
		waitUntil: 'networkidle0',
		timeout: 600000,
	});
	await page.waitForFunction(
		() => {
			const shell = document.querySelector('.flat32-shell');
			const canvas = document.querySelector('#flat32-canvas');

			return (
				shell?.dataset.flat32State === 'ready' &&
				shell.dataset.flat32AtmospherePairing === 'flat/local' &&
				shell.dataset.flat32AtmosphereMaximumOrder === '4' &&
				canvas?.dataset.flat32RenderPath === 'algorithm32'
			);
		},
		{timeout: 600000},
	);
	await page.addStyleTag({
		content:
			'.flat32-scene-controls,.flat32-time-panel{display:none!important}' +
			'#flat32-canvas{display:block!important;' +
			'width:512px!important;height:256px!important}',
	});
	await page.evaluate(() => {
		window.dispatchEvent(new Event('resize'));
	});
	await new Promise((resolveFrame) => setTimeout(resolveFrame, 1000));
	const canvas = await page.$('#flat32-canvas');

	if (canvas === null) throw new Error('Flat32 canvas is unavailable.');
	await mkdir(resolve('.tmp'), {recursive: true});
	await canvas.screenshot({path: output, type: 'png'});
	const shellState = await page.evaluate(() => {
		const shell = document.querySelector('.flat32-shell');
		const canvas = document.querySelector('#flat32-canvas');

		return {
			state: shell?.dataset.flat32State,
			pairing: shell?.dataset.flat32AtmospherePairing,
			maximumOrder: shell?.dataset.flat32AtmosphereMaximumOrder,
			sourcePosition: shell?.dataset.flat32AtmosphereSourcePosition,
			cacheRadialMaximum: shell?.dataset.flat32AtmosphereCacheRadialMaximum,
			setupDurationMilliseconds: shell?.dataset.flat32AtmosphereSetupDurationMilliseconds,
			renderPath: canvas?.dataset.flat32RenderPath,
		};
	});

	process.stdout.write(
		`${JSON.stringify(
			{
				output,
				bytes: (await stat(output)).size,
				errors,
				shellState,
			},
			null,
			2,
		)}\n`,
	);
} finally {
	await browser.close();
	await new Promise((resolveClose) => server.close(resolveClose));
}
