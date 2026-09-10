import ExperimentRun from './ExperimentRun.js';
import RunEvidenceVerifier from './RunEvidenceVerifier.js';

const roots = process.argv.slice(2);
if (!roots.length) throw new Error('Supply one or more sealed experiment run paths.');
const run = new ExperimentRun();
await run.start('verification');
try {
	const verifier = new RunEvidenceVerifier(run);
	const results = [];
	for (const root of roots) {
		results.push(await verifier.verify(root));
		run.progress({
			phase: 'verification',
			completed: results.length,
			total: roots.length,
			message: 'Verified ' + root,
		});
	}
	await run.write('verification.json', {
		operation:
			'Read-only SHA-256 verification of immutable scientific artifacts and source snapshots; supplemental retained-file inventory',
		results,
	});
	await run.finish('accepted', {
		stage: 'E6-artifact-verification',
		runs: results.map(({root, scientificArtifactCount, retainedFileCount, retainedBytes}) => ({
			root,
			scientificArtifactCount,
			retainedFileCount,
			retainedBytes,
		})),
	});
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
