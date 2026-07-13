#!/usr/bin/env node

import { createG0Snapshot } from '../harness/lib/snapshot.js';

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('create-g0-snapshot accepts no command-line arguments.');
	}
	const manifest = await createG0Snapshot();
	process.stdout.write(`${JSON.stringify({
		status: 'created',
		manifest: manifest.experiment.manifest,
		sourceRevision: manifest.source.git.revision,
		sourceTree: manifest.source.git.sourceTree,
		sourceFiles: manifest.source.inventory.fileCount,
		sourceBytes: manifest.source.inventory.totalBytes,
		sourceAggregateSha256: manifest.source.inventory.aggregateSha256,
		excludedRunnableFiles:
			manifest.runnableBoundary.excludedFileCount,
	}, null, 2)}\n`);
}

main().catch((error) => {
	process.stderr.write(`G0 snapshot creation failed: ${error.stack ?? error}\n`);
	process.exitCode = 1;
});
