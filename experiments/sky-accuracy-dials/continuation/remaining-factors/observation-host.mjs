import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';
import {checkedAbsolute} from '../../io/files.mjs';
import {runObservationGpu} from './observation-browser.mjs';

/** One bounded DevTools command on a new independently owned connection.
 * @param {string} endpoint @param {string} method @param {Record<string,unknown>} params
 * @param {number} timeout @returns {Promise<SkyObservationDevToolsReply>}
 */
function command(endpoint, method, params, timeout) {
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(endpoint, {maxPayload: 256 * 1024 ** 2});
		const timer = setTimeout(() => {
			socket.terminate();
			reject(new Error(method + ' timeout'));
		}, timeout);
		socket.once('error', (error) => {
			clearTimeout(timer);
			reject(error);
		});
		socket.once('open', () => socket.send(JSON.stringify({id: 1, method, params})));
		socket.on('message', (bytes) => {
			const message = JSON.parse(String(bytes));
			if (message.id !== 1) return;
			clearTimeout(timer);
			socket.close();
			if (message.error) reject(new Error(JSON.stringify(message.error)));
			else resolve(message.result);
		});
		socket.once('close', () => {
			clearTimeout(timer);
			reject(new Error(method + ' connection closed'));
		});
	});
}

/** Run the same self-contained browser kernel through direct DevTools commands.
 * @param {string} chrome @param {string} profile @param {SkyObservationTransfer} payload
 * @param {SkyTargetedShaders} shaders @param {(message:string)=>void} progress
 * @returns {Promise<SkyTargetedGpuResult>}
 */
export async function executeObservationGpu(chrome, profile, payload, shaders, progress) {
	checkedAbsolute(chrome);
	checkedAbsolute(profile);
	const child = spawn(
		chrome,
		[
			'--headless',
			'--remote-debugging-port=0',
			'--user-data-dir=' + profile,
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--disable-software-rasterizer',
			'--use-angle=d3d11',
			'--disable-background-networking',
			'--disable-component-update',
			'--no-first-run',
			'--no-default-browser-check',
			'about:blank',
		],
		{windowsHide: true, stdio: 'ignore'},
	);
	/** @type {Error|null} */ let launchError = null;
	child.once('error', (error) => {
		launchError = error;
	});
	let browserEndpoint = '';
	try {
		const portFile = path.join(profile, 'DevToolsActivePort'),
			started = Date.now();
		while (!existsSync(portFile)) {
			if (launchError) throw launchError;
			assert.ok(child.exitCode === null && Date.now() - started < 45000, 'Browser startup timeout/exit');
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		const lines = readFileSync(checkedAbsolute(portFile), 'utf8').trim().split(/\r?\n/),
			port = Number(lines[0]);
		assert.ok(Number.isInteger(port) && port > 0 && port < 65536);
		assert.ok(lines[1].startsWith('/devtools/browser/'));
		browserEndpoint = `ws://127.0.0.1:${port}${lines[1]}`;
		const response = await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(10000)});
		assert.ok(response.ok);
		const targets = /** @type {SkyObservationDevToolsTarget[]} */ (await response.json());
		const target = targets.find((t) => t.type === 'page' && t.url === 'about:blank');
		assert.ok(target);
		assert.ok(target.webSocketDebuggerUrl.startsWith(`ws://127.0.0.1:${port}/devtools/page/`));
		progress('Browser ready; transferring prepared Float32 geometry and executing the fixed GPU matrix.');
		const context = await command(
			target.webSocketDebuggerUrl,
			'Runtime.evaluate',
			{expression: 'globalThis'},
			10000,
		);
		assert.ok(context.result?.objectId);
		const result = await command(
			target.webSocketDebuggerUrl,
			'Runtime.callFunctionOn',
			{
				functionDeclaration: runObservationGpu.toString(),
				objectId: context.result.objectId,
				arguments: [{value: payload}, {value: shaders}],
				awaitPromise: true,
				returnByValue: true,
			},
			5 * 60000,
		);
		assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
		assert.ok(result.result?.value);
		return /** @type {SkyTargetedGpuResult} */ (result.result.value);
	} finally {
		if (browserEndpoint && child.exitCode === null) {
			try {
				await command(browserEndpoint, 'Browser.close', {}, 10000);
			} catch {
				/* Closure can precede the command response. */
			}
		}
		if (child.exitCode === null) {
			await Promise.race([
				new Promise((resolve) => child.once('exit', resolve)),
				new Promise((resolve) => setTimeout(resolve, 3000)),
			]);
		}
		if (child.exitCode === null) child.kill('SIGKILL');
	}
}
