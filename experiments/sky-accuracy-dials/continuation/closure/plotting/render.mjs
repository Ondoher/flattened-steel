import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {checkedAbsolute, identity, readRepository, resolveRepository, sha256} from '../../../io/files.mjs';

const rendererPath = 'experiments/sky-accuracy-dials/continuation/closure/plotting/render.ps1';
const hostPath = 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';

/** Authenticate a bounded ordinary installed tool without writing to its location.
 * @param {DialContinuationToolIdentity} tool - Identity reported by the actual child.
 * @returns {void}
 */
function verifyTool(tool) {
	assert.ok(tool && typeof tool.path === 'string' && typeof tool.version === 'string');
	assert.match(tool.sha256, /^[a-f0-9]{64}$/u);
	assert.ok(Number.isSafeInteger(tool.byteLength) && tool.byteLength > 0 && tool.byteLength <= 16 * 1024 ** 2);
	const absolute = checkedAbsolute(path.resolve(tool.path));
	const facts = statSync(absolute);
	assert.ok(facts.isFile());
	assert.equal(facts.size, tool.byteLength);
	const bytes = readFileSync(absolute);
	assert.equal(bytes.length, tool.byteLength);
	assert.equal(sha256(bytes), tool.sha256);
}

/** Render finite, already assessed values using a standard plotting library.
 * The child receives JSON through stdin, runs hidden, and returns PNG bytes through stdout.
 * Neither process writes image intermediates, plotting caches, or dependency files.
 * @param {SkyClosurePlotRequest} request - Frozen scientific series and exact source identities.
 * @returns {Promise<SkyClosureRenderedPlot>} Standalone image and exact installed-tool identities.
 */
export async function renderClosurePlot(request) {
	assert.equal(process.platform, 'win32', 'The bounded renderer uses the installed Windows charting library.');
	assert.match(request.name, /^[a-z0-9][a-z0-9-]*\.png$/u);
	assert.ok(['line', 'point', 'column'].includes(request.kind ?? 'line'));
	for (const text of [
		request.title,
		request.description,
		request.xLabel,
		request.yLabel,
		request.scope,
		request.caption,
	])
		assert.ok(typeof text === 'string' && text.length > 0 && text.length <= 2000);
	assert.ok(request.series.length > 0 && request.series.length <= 16);
	for (const series of request.series) {
		assert.ok(typeof series.label === 'string' && series.label.length > 0);
		assert.ok(series.x.length > 0 && series.x.length <= 10000 && series.x.length === series.y.length);
		assert.ok([...series.x, ...series.y].every(Number.isFinite), 'Unresolved/missing plot values are not zeros.');
	}
	for (const tick of request.xTicks ?? [])
		assert.ok(Number.isFinite(tick.value) && typeof tick.label === 'string' && tick.label.length > 0);
	const renderer = identity(rendererPath);
	const input = JSON.stringify(request);
	assert.ok(Buffer.byteLength(input) < 1024 ** 2, 'Plot request exceeds its bounded pipe allocation.');
	const host = checkedAbsolute(path.resolve(hostPath));
	const hostBytes = readFileSync(host);
	const hostHash = sha256(hostBytes);
	const output = await new Promise((resolve, reject) => {
		const child = execFile(
			host,
			['-NoLogo', '-NoProfile', '-NonInteractive', '-File', resolveRepository(rendererPath)],
			{windowsHide: true, timeout: 30000, maxBuffer: 4 * 1024 ** 2, encoding: 'utf8'},
			(error, stdout, stderr) =>
				error ? reject(new Error(`Scientific plot failed: ${error.message}; ${stderr}`)) : resolve(stdout),
		);
		child.stdin.on('error', reject);
		child.stdin.end(input, 'utf8');
	});
	/** @type {SkyClosurePlotResponse} */ const result = JSON.parse(String(output));
	assert.equal(result.schemaId, 'sky-standard-plot-v1');
	assert.ok(typeof result.base64 === 'string' && result.base64.length < 3 * 1024 ** 2);
	assert.equal(path.resolve(result.tool.powershell.path).toLowerCase(), host.toLowerCase());
	assert.equal(result.tool.powershell.sha256, hostHash, 'Plotting host changed during execution.');
	verifyTool(result.tool.powershell);
	verifyTool(result.tool.charting);
	readRepository(renderer.path, renderer);
	const contents = Buffer.from(result.base64, 'base64');
	assert.equal(contents.toString('base64'), result.base64);
	assert.deepEqual(contents.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
	assert.equal(contents.readUInt32BE(16), 1200);
	assert.equal(contents.readUInt32BE(20), 760);
	return {contents, tool: result.tool, renderer, format: 'png'};
}
