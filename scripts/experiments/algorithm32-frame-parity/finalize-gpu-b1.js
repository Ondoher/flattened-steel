import {createHash} from 'node:crypto';
import {copyFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';

import {publishProductionB1Result} from '../b1-directional-sky-radiance/publish-production-result.js';

function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
	const text = `${JSON.stringify(value, null, 2)}\n`;
	writeFileSync(path, text, {encoding: 'utf8', flag: 'wx'});
	return sha256(text);
}

function parseArguments(argv) {
	if (argv.length !== 4 || argv[0] !== '--source' || argv[2] !== '--output') {
		throw new Error('Usage: finalize-gpu-b1.js --source SOURCE_RUN_DIRECTORY --output OUTPUT_ROOT');
	}
	return {source: resolve(argv[1]), output: resolve(argv[3])};
}

function main() {
	const options = parseArguments(process.argv.slice(2));
	const sourceManifest = readJson(join(options.source, 'manifest.json'));
	if (sourceManifest.status !== 'COMPLETE' || sourceManifest.orders?.[0] !== 4) {
		throw new Error('Source must be one complete retained-frame J4 GPU boundary.');
	}
	const sourceOutput = sourceManifest.outputs[0];
	const sourceProvenance = readJson(join(options.source, sourceOutput.provenance));
	const outputDirectory = resolve(options.output, 'b1-directional-sky-radiance/gpu');
	mkdirSync(outputDirectory, {recursive: true});
	const runId = `current-production-retained-frame-b1-gpu-finalized-${new Date()
		.toISOString()
		.replace(/[-:.]/g, '')}`;
	for (const name of [sourceOutput.table, sourceOutput.cube, 'values.json']) {
		copyFileSync(join(options.source, name), join(outputDirectory, basename(name)), undefined);
	}
	const provenance = {
		...sourceProvenance,
		runId,
		profileId: 'paper-j4-retained-z-up-frame-diagnostic',
		presentationName: 'Algorithm32 Paper J4 Retained Z-Up Frame Diagnostic',
		nativeSpectralBoundary: {
			channelCount: 40,
			centersNanometers: Array.from({length: 40}, (_, index) => 360 + (470 * index) / 40),
			sampleSemantics: 'point-sampled-spectral-density',
			projection: 'identity-direct-40',
		},
		numericalControls: {
			...sourceProvenance.numericalControls,
			incomingDirectionDomain: 'algorithm32-fibonacci-34-incoming-v1',
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
		},
		sourceRun: {
			runId: sourceManifest.runId,
			manifest: join(options.source, 'manifest.json'),
			tableSha256: sourceOutput.tableSha256,
		},
	};
	const provenanceSha256 = writeJson(join(outputDirectory, sourceOutput.provenance), provenance);
	const defaultProvenanceName = 'algorithm32-retained-frame-gpu-default-provenance.json';
	const defaultProvenanceSha256 = writeJson(join(outputDirectory, defaultProvenanceName), {
		...provenance,
		profileId: 'paper',
		presentationName: 'Algorithm32 Paper',
	});
	const output = {
		...sourceOutput,
		provenanceSha256,
		defaultProvenance: defaultProvenanceName,
		defaultProvenanceSha256,
	};
	const manifest = {
		...sourceManifest,
		runId,
		completedAt: new Date().toISOString(),
		outputs: [output],
		sourceRun: {runId: sourceManifest.runId, manifest: join(options.source, 'manifest.json')},
	};
	writeJson(join(outputDirectory, 'manifest.json'), manifest);
	const publication = publishProductionB1Result(join(outputDirectory, 'manifest.json'), {
		outputRoot: options.output,
	});
	process.stdout.write(`${JSON.stringify({manifest, outputDirectory, publication}, null, 2)}\n`);
}

main();
