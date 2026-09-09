#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const SOURCE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE_VERIFIER_PATH = path.join(SOURCE_ROOT, 'verify-s9-animation-trace.js');
const CONSTS_URL = pathToFileURL(path.join(SOURCE_ROOT, 'consts.js')).href;
const BASE_VERIFIER_SHA256 = 'd3024bf2b8e6dbc888cffe296b570f2ef997a8354930295c9c0d69a44c8b4c04';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (value, message) => {
	if (!value) throw new Error(message);
};

function replaceOnce(source, search, replacement, label) {
	const first = source.indexOf(search);
	fail(first >= 0, `FOV55 verifier anchor is missing: ${label}.`);
	fail(source.indexOf(search, first + search.length) < 0, `FOV55 verifier anchor is ambiguous: ${label}.`);
	return source.replace(search, replacement);
}

const baseBytes = await readFile(BASE_VERIFIER_PATH);
fail(sha256(baseBytes) === BASE_VERIFIER_SHA256, 'The accepted 78-degree S9.3 verifier identity changed.');
let source = baseBytes.toString('utf8');
source = replaceOnce(
	source,
	"from './consts.js';",
	`from '${CONSTS_URL}';`,
	'experiment constants import',
);
source = replaceOnce(
	source,
	"const DEFAULT_RUN_ID = '1788918482263-s9-animation-trace';",
	"const DEFAULT_RUN_ID = '1788919164368-s9-animation-trace-fov55';",
	'default run',
);
source = replaceOnce(
	source,
	"/^[0-9]+-s9-animation-trace$/u",
	"/^[0-9]+-s9-animation-trace-fov55$/u",
	'run id boundary',
);
source = replaceOnce(
	source,
	'result.configuration.cameraVerticalFieldOfViewDegrees === 78',
	'result.configuration.cameraVerticalFieldOfViewDegrees === 55',
	'FOV boundary',
);
const parentBoundary = `fail(
	parentBytes.byteLength === parent.byteLength && sha256(parentBytes) === parent.sha256,
	'S9.3 S9.2 parent identity changed.',
);`;
source = replaceOnce(
	source,
	parentBoundary,
	`${parentBoundary}\nconst fov78Parent = provenance.parents.s93Fov78Control;\nconst fov78ParentBytes = await readFile(path.join(repositoryRoot, ...fov78Parent.path.split('/')));\nfail(\n\tfov78ParentBytes.byteLength === fov78Parent.byteLength &&\n\t\tsha256(fov78ParentBytes) === fov78Parent.sha256,\n\t'S9.3 FOV55 comparison parent identity changed.',\n);`,
	'FOV78 comparison parent',
);

await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
