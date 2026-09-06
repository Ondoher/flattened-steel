import FlatLocalCacheFailureDiagnostic from './FlatLocalCacheFailureDiagnostic.js';

process.stdout.write(
	`${JSON.stringify(
		await new FlatLocalCacheFailureDiagnostic({
			workspaceRoot: process.cwd(),
		}).run(),
		null,
		2,
	)}\n`,
);
