import FlatLocalCacheConvergenceStudy from
	'./FlatLocalCacheConvergenceStudy.js';

process.stdout.write(`${JSON.stringify(
	await new FlatLocalCacheConvergenceStudy({
		workspaceRoot: process.cwd(),
	}).run(),
	null,
	2,
)}\n`);
