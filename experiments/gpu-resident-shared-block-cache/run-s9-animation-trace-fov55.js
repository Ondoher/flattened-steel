#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SOURCE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE_RUNNER_PATH = path.join(SOURCE_ROOT, 'run-s9-animation-trace.js');
const CONSTS_URL = pathToFileURL(path.join(SOURCE_ROOT, 'consts.js')).href;
const VARIANT_RELATIVE_PATH =
	'experiments/gpu-resident-shared-block-cache/run-s9-animation-trace-fov55.js';
const BASE_RUNNER_SHA256 = '1184954a01fc38ca770ec82ac5db38721985c520940345046780020303df46b2';
const FOV78_PARENT = Object.freeze({
	path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788918482263-s9-animation-trace/result.json',
	byteLength: 175_520,
	sha256: 'cae0c4a85f94e494ffb2cd9668fccd791f51ecd80d091062b6779758104ce6bc',
});

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (value, message) => {
	if (!value) throw new Error(message);
};

function replaceOnce(source, search, replacement, label) {
	const first = source.indexOf(search);
	fail(first >= 0, `FOV55 derivation anchor is missing: ${label}.`);
	fail(source.indexOf(search, first + search.length) < 0, `FOV55 derivation anchor is ambiguous: ${label}.`);
	return source.replace(search, replacement);
}

const [baseBytes, variantBytes] = await Promise.all([
	readFile(BASE_RUNNER_PATH),
	readFile(fileURLToPath(import.meta.url)),
]);
fail(sha256(baseBytes) === BASE_RUNNER_SHA256, 'The accepted 78-degree S9.3 runner identity changed.');
const variantSha256 = sha256(variantBytes);
const puppeteerUrl = import.meta.resolve('puppeteer');
let source = baseBytes.toString('utf8');
source = replaceOnce(
	source,
	"import puppeteer from 'puppeteer';",
	`import puppeteer from '${puppeteerUrl}';`,
	'Puppeteer import',
);
source = replaceOnce(
	source,
	"from './consts.js';",
	`from '${CONSTS_URL}';`,
	'experiment constants import',
);
source = replaceOnce(
	source,
	"const HOOK_RELATIVE_PATH = 'browser/s9-shared-packet-shader-hook.js';",
	`const S9_3_FOV78_RESULT = Object.freeze(${JSON.stringify(FOV78_PARENT)});\nconst HOOK_RELATIVE_PATH = 'browser/s9-shared-packet-shader-hook.js';`,
	'FOV78 parent declaration',
);
source = replaceOnce(
	source,
	"const RUN_SLUG = 's9-animation-trace';",
	"const RUN_SLUG = 's9-animation-trace-fov55';",
	'run slug',
);
source = replaceOnce(
	source,
	"'node experiments/gpu-resident-shared-block-cache/run-s9-animation-trace.js\\n',",
	"'node experiments/gpu-resident-shared-block-cache/run-s9-animation-trace-fov55.js\\n',",
	'command record',
);
source = replaceOnce(
	source,
	"\t\t\t\t\t\ts92Parent: S9_2_RESULT,",
	"\t\t\t\t\t\ts92Parent: S9_2_RESULT,\n\t\t\t\t\t\ts93Fov78Parent: S9_3_FOV78_RESULT,",
	'input parent',
);
const authenticationAnchor = `\t\tconst exposureNeedle = 'window.__flat32Cleanup = application.dispose.bind(application);';`;
source = replaceOnce(
	source,
	authenticationAnchor,
	`\t\tconst s93Fov78Bytes = await readFile(\n\t\t\tawait requireContainedFile(repositoryRoot, S9_3_FOV78_RESULT.path, 'S9.3 FOV78 parent'),\n\t\t);\n\t\tfail(\n\t\t\ts93Fov78Bytes.byteLength === S9_3_FOV78_RESULT.byteLength &&\n\t\t\t\tsha256(s93Fov78Bytes) === S9_3_FOV78_RESULT.sha256,\n\t\t\t'S9.3 FOV78 accepted parent identity changed.',\n\t\t);\n${authenticationAnchor}`,
	'FOV78 parent authentication',
);
const finalStartupAnchor = '\t\tstartup = await page.evaluate(() => {';
source = replaceOnce(
	source,
	finalStartupAnchor,
	`\t\tawait page.evaluate(() => {\n\t\t\tconst application = window.__flat32S9Application;\n\t\t\tconst sceneRuntime = application._sceneRuntime;\n\t\t\tsceneRuntime.camera.fov = 55;\n\t\t\tsceneRuntime.camera.updateProjectionMatrix();\n\t\t\tapplication._modeController._activeRuntime._shaderHandle._buildResult.celestialGenerationParticipant.markDirty('view');\n\t\t});\n\t\tawait page.waitForFunction(\n\t\t\t() => window.__flat32S9Application?._sceneRuntime?.camera?.fov === 55,\n\t\t\t{timeout: 5_000, polling: 16},\n\t\t);\n${finalStartupAnchor}`,
	'55-degree camera projection',
);
const fovValueAnchor = 'cameraVerticalFieldOfViewDegrees: 78,';
fail(source.split(fovValueAnchor).length - 1 === 2, 'FOV55 value anchors changed.');
source = source.replaceAll(fovValueAnchor, 'cameraVerticalFieldOfViewDegrees: 55,');
source = replaceOnce(
	source,
	'startup.cameraVerticalFieldOfViewDegrees === 78,',
	'startup.cameraVerticalFieldOfViewDegrees === 55,',
	'FOV acceptance',
);
source = replaceOnce(source, 'and 78-degree vertical FOV.', 'and 55-degree vertical FOV.', 'claim FOV');
source = replaceOnce(
	source,
	'parents: {...control.parents, s92SharedPacketRenderer: S9_2_RESULT},',
	'parents: {...control.parents, s92SharedPacketRenderer: S9_2_RESULT, s93Fov78Control: S9_3_FOV78_RESULT},',
	'provenance parent',
);
const runnerIdentity = `runner: {
							path: 'experiments/gpu-resident-shared-block-cache/run-s9-animation-trace.js',
							sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
						},`;
source = replaceOnce(
	source,
	runnerIdentity,
	`variantLauncher: {\n\t\t\t\t\t\t\tpath: '${VARIANT_RELATIVE_PATH}',\n\t\t\t\t\t\t\tsha256: '${variantSha256}',\n\t\t\t\t\t\t},\n\t\t\t\t\t\tbaseRunner: {\n\t\t\t\t\t\t\tpath: 'experiments/gpu-resident-shared-block-cache/run-s9-animation-trace.js',\n\t\t\t\t\t\t\tsha256: '${BASE_RUNNER_SHA256}',\n\t\t\t\t\t\t},`,
	'variant source identities',
);
source = replaceOnce(
	source,
	"if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();",
	'await main();',
	'derived entry point',
);

await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
