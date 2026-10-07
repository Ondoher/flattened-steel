import {TheHoursRun} from './TheHoursRun.js';
import {TheHoursDeliverables} from './TheHoursDeliverables.js';

const [manifestPath, manifestBytes, manifestSha256] = process.argv.slice(2);
if (!Number.isSafeInteger(Number(manifestBytes)) || !/^[a-f0-9]{64}$/u.test(manifestSha256 ?? ''))
	throw new Error('Supply the exact full-film qualification manifest identity.');
const run = new TheHoursRun({
	outputRoot: '.codex-tmp/p3-strobing-20261007/runs',
});
const evidenceRoot = process.env.ALGORITHM32_THE_HOURS_EVIDENCE_ROOT;
if (!evidenceRoot)
	throw new Error('Set ALGORITHM32_THE_HOURS_EVIDENCE_ROOT to the read-only comparison evidence root.');
const archive = new TheHoursRun({outputRoot: '.codex-tmp/p3-strobing-20261007/runs', evidenceRoot});
await run.allocate('delivery');
let heartbeatTail = Promise.resolve();
const heartbeat = setInterval(
	/** Called during media assembly to retain bounded progress. */ () => {
		heartbeatTail = heartbeatTail.then(() => run.progress({phase: 'working', manifestPath}));
	},
	15000,
);
try {
	const result = await new TheHoursDeliverables(run, archive).create({
		path: manifestPath,
		byteLength: Number(manifestBytes),
		sha256: manifestSha256,
	});
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(await run.finish('accepted', result));
} catch (error) {
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(await run.finish('failed', {message: String(error), stack: error.stack}));
	process.exitCode = 1;
}
