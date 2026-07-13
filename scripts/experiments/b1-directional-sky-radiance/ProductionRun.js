import {createHash} from 'node:crypto';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';

import {CAPTURE_TIMES} from './benchmark.js';

const MANIFEST_SCHEMA = 'algorithm32-current-production-b1-run-v2';
const REQUIRED_ORDERS = Object.freeze([4]);
const EXECUTION_BACKENDS = Object.freeze(['cpu-reference-binary64', 'gpu-production-shaders-r32f']);

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function readJson(path, label) {
	let value;
	try {
		value = JSON.parse(readFileSync(path, 'utf8'));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${path}`, {cause: error});
	}
	return value;
}

function resolveManifestPath(path) {
	const absolute = resolve(path);
	if (!existsSync(absolute)) throw new Error(`Production run does not exist: ${absolute}`);
	return statSync(absolute).isDirectory() ? join(absolute, 'manifest.json') : absolute;
}

function resolveRunFile(runDirectory, name, label) {
	if (typeof name !== 'string' || name.length === 0 || basename(name) !== name) {
		throw new Error(`${label} must name a direct file in the production run directory.`);
	}
	const path = resolve(runDirectory, name);
	if (dirname(path) !== runDirectory || !existsSync(path)) {
		throw new Error(`${label} does not exist in the production run: ${path}`);
	}
	return path;
}

function verifyFile(runDirectory, record, nameKey, hashKey, label) {
	const path = resolveRunFile(runDirectory, record[nameKey], label);
	const bytes = readFileSync(path);
	if (sha256(bytes) !== record[hashKey]) {
		throw new Error(`${label} SHA-256 does not match the production-run manifest: ${path}`);
	}
	return path;
}

function verifyProvenance(path, record, manifest) {
	const provenance = readJson(path, `J${record.order} provenance`);
	if (provenance.runId !== manifest.runId || provenance.order !== record.order) {
		throw new Error(`J${record.order} provenance does not identify its production run and order.`);
	}
	if (provenance.backend !== manifest.backend) {
		throw new Error(`J${record.order} provenance backend does not match its production run.`);
	}
	if (
		provenance.rowCount !== manifest.conditions.length * 81 ||
		provenance.completeCanonicalBoundary !== (manifest.conditions.length === CAPTURE_TIMES.length)
	) {
		throw new Error(`J${record.order} provenance boundary size does not match the production-run manifest.`);
	}
	if (provenance.table?.name !== record.table || provenance.table?.sha256 !== record.tableSha256) {
		throw new Error(`J${record.order} provenance does not identify its finalized table.`);
	}
}

function load(path, {requireCanonical = true} = {}) {
	const manifestPath = resolveManifestPath(path);
	if (!existsSync(manifestPath)) throw new Error(`Production-run manifest not found: ${manifestPath}`);
	const manifest = readJson(manifestPath, 'Production-run manifest');
	const runDirectory = dirname(manifestPath);
	if (manifest.schema !== MANIFEST_SCHEMA || manifest.status !== 'COMPLETE') {
		throw new Error(`Production-run manifest must be a complete ${MANIFEST_SCHEMA} record.`);
	}
	if (typeof manifest.runId !== 'string' || manifest.runId.length === 0) {
		throw new Error('Production-run manifest must identify its run.');
	}
	if (!EXECUTION_BACKENDS.includes(manifest.backend)) {
		throw new Error('Production-run manifest must identify one supported execution backend.');
	}
	if (manifest.backend === 'gpu-production-shaders-r32f' && !manifest.gpuCapabilities) {
		throw new Error('GPU production runs must record their WebGL capability identity.');
	}
	if (!Array.isArray(manifest.outputs)) throw new Error('Production-run manifest outputs must be an array.');
	if (!Array.isArray(manifest.conditions)) throw new Error('Production-run manifest conditions must be an array.');
	if (
		requireCanonical &&
		(!Array.isArray(manifest.orders) ||
			manifest.orders.length !== REQUIRED_ORDERS.length ||
			manifest.orders.some((order, index) => order !== REQUIRED_ORDERS[index]) ||
			manifest.outputs.length !== REQUIRED_ORDERS.length)
	) {
		throw new Error('Canonical production run must contain only the paper/default J4 boundary.');
	}
	if (
		requireCanonical &&
		(manifest.conditions.length !== CAPTURE_TIMES.length ||
			manifest.conditions.some((time, index) => time !== CAPTURE_TIMES[index]))
	) {
		throw new Error('Production run must contain the complete canonical 17-condition boundary in order.');
	}
	const outputsByOrder = new Map();
	for (const record of manifest.outputs) {
		if (!Number.isInteger(record.order) || outputsByOrder.has(record.order)) {
			throw new Error(`Production-run output order is invalid or duplicated: ${record.order}.`);
		}
		const provenancePath = verifyFile(
			runDirectory,
			record,
			'provenance',
			'provenanceSha256',
			`J${record.order} provenance`,
		);
		verifyProvenance(provenancePath, record, manifest);
		const output = {
			order: record.order,
			tablePath: verifyFile(runDirectory, record, 'table', 'tableSha256', `J${record.order} table`),
			provenancePath,
			cubePath: record.cube
				? verifyFile(runDirectory, record, 'cube', 'cubeSha256', `J${record.order} cube`)
				: null,
			defaultProvenancePath: record.defaultProvenance
				? verifyFile(runDirectory, record, 'defaultProvenance', 'defaultProvenanceSha256', 'Default provenance')
				: null,
		};
		outputsByOrder.set(record.order, Object.freeze(output));
	}
	if (requireCanonical) {
		for (const order of REQUIRED_ORDERS) {
			const output = outputsByOrder.get(order);
			if (!output?.cubePath)
				throw new Error(`Canonical production run is missing the complete J${order} boundary cube.`);
		}
		if (!outputsByOrder.get(4).defaultProvenancePath) {
			throw new Error('Canonical production run is missing the Default provenance alias for its J4 boundary.');
		}
	}
	return Object.freeze({manifestPath, runDirectory, manifest, outputsByOrder});
}

function candidatePaths(run) {
	const defaultOutput = run.outputsByOrder.get(4);
	return Object.freeze({
		proposedPath: defaultOutput.tablePath,
		proposedProvenancePath: defaultOutput.defaultProvenancePath,
		proposedCubePath: defaultOutput.cubePath,
	});
}

/** Validated current-production B1 run and scorer-input resolver. */
export const ProductionRun = Object.freeze({
	MANIFEST_SCHEMA,
	REQUIRED_ORDERS,
	EXECUTION_BACKENDS,
	load,
	candidatePaths,
});
