const maximumReportCharacters = 512 * 1024;

/** Render supplied plain text as one Markdown paragraph or table cell.
 * @param {string} value @returns {string}
 */
function inline(value) {
	return value
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/[\\`*_\[\]<>|]/g, '\\$&');
}

/** Render an authenticated report-relative path without interpreting markup.
 * @param {string} label @param {string} path @returns {string}
 */
function link(label, path) {
	const destination = encodeURI(path).replace(
		/[<>()]/g,
		(character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
	);
	return `[${inline(label)}](<${destination}>)`;
}

/** Render one supplied scientific claim without strengthening its classification.
 * @param {SkyClosureClaim} claim @returns {string}
 */
function claimText(claim) {
	const evidence = claim.evidence.map((path, index) => link(`evidence ${index + 1}`, path));
	return `- ${inline(claim.statement)}${evidence.length ? ` (${evidence.join(', ')})` : ''}`;
}

/** Render a historical factor and the question current assessments must answer.
 * @param {SkyClosureFactor} factor @returns {string}
 */
function factorText(factor) {
	return [
		`### ${inline(factor.factorId)}`,
		'',
		`**Control and range:** ${inline(factor.controls)} ${inline(factor.range)}`,
		'',
		`**Stage and regeneration:** ${inline(factor.stage)}. ${inline(factor.regeneration)}`,
		'',
		`**Original prediction:** ${inline(factor.originalPrediction)}`,
		'',
		`**Method:** ${inline(factor.method)}`,
		'',
		`**Historical outcome:** ${inline(factor.historicalOutcome)}`,
		'',
		`**Continuation question:** ${inline(factor.currentEvidenceQuestion)}`,
		'',
		`**Limits:** ${factor.restrictions.map(inline).join(' ')}`,
	].join('\n');
}

/** Produce a bounded report from already authenticated conclusions and links.
 * This pure renderer loads no files, computes no scientific result and neither
 * selects candidates nor upgrades accepted execution to accuracy qualification.
 * @param {SkyClosureReportView} document @returns {string}
 */
export function renderClosureReport(document) {
	const counts = document.counts;
	/** @type {readonly SkyClosureClaimCategory[]} */
	const categories = [
		'understanding',
		'numerical-control',
		'predictable-response',
		'measurement-improving-accuracy',
		'unresolved',
	];
	/** @type {Readonly<Record<SkyClosureClaimCategory, string>>} */
	const categoryLabels = {
		understanding: 'Improved understanding',
		'numerical-control': 'Numerical controls',
		'predictable-response': 'Prospectively tested responses',
		'measurement-improving-accuracy': 'Measurement-improving accuracy controls',
		unresolved: 'Unresolved work',
	};
	const conclusions = categories.map((category) => {
		const claims = document.claims.filter((claim) => claim.category === category);
		return [
			`### ${categoryLabels[category]}`,
			'',
			claims.length ? claims.map(claimText).join('\n') : 'No conclusion was supplied in this category.',
		].join('\n');
	});
	const qualification =
		document.c5.status === 'skipped'
			? 'C5 was skipped. This is a decision not to run full qualification, not a passed accuracy gate or a failed construction.'
			: document.c5.status === 'not-executed'
				? 'C5 has not executed; full qualification is not established.'
				: document.c5.status === 'not-qualified'
					? 'C5 executed without meeting the declared scientific qualification gates.'
					: 'C5 is classified as qualified by the supplied assessment; its scope and evidence must accompany every resulting claim.';
	const figures = document.figures.length
		? document.figures
				.map((figure) => `- ${link(figure.caption, figure.path)}. Scope: ${inline(figure.scope)}`)
				.join('\n')
		: 'No figures were supplied.';
	const report = [
		`# ${inline(document.title)}`,
		'',
		'This report separates scientific understanding, numerical error reduction, prospective prediction and measurement-improving accuracy. A completed execution or lower Kider score alone does not establish all four.',
		'',
		`Continuation registration: ${inline(document.registrationRun)}.`,
		'',
		'## Overall conclusions',
		'',
		conclusions.join('\n\n'),
		'',
		'## Evidence boundary and qualification',
		'',
		`**Historical full-boundary evidence:** ${inline(document.scopes.historicalFull)}`,
		'',
		`**New measurement evidence:** ${inline(document.scopes.newMeasurements)}`,
		'',
		`**Component evidence:** ${inline(document.scopes.components)}`,
		'',
		'Historical full-time curves retain their original scope. New screening results cannot supply a full seventeen-time curve, and extra-time component probes cannot supply a complete noon dome. Numerical channels and Kider score channels remain separate; density references retain their density units.',
		'',
		`${qualification} ${inline(document.c5.reason)}`,
		'',
		'An unresolved reference allowance is unavailable, not zero. A finite-N4 reference does not bound the scattering tail. An observed response or a fitted explanation is not a passed prospective prediction; retained misses remain part of the conclusion.',
		'',
		'## Compensation and interaction interpretation',
		'',
		'For measured radiance M and an independently qualified physical first-order reference P, the component accounting uses r = L4 - M, n = L1 - P and p = L4 - L1 + P - M. Then r = n + p and SSE = ||n||² + ||p||² + 2 n·p. The term p includes higher-order numerical error, omitted orders and physical/observation discrepancy; it is not physics alone. Removing a negative cross term can worsen measured agreement even when the first-order error decreases.',
		'',
		'For an actual radiance change d on baseline residual r, the measured change is deltaSSE = 2 r·d + ||d||². A changed score trend can therefore arise from a changed baseline residual without a changed radiance response. The spectral interaction LAB - LA - LB + LH tests whether two numerical responses themselves interact. Overlapping angular groups are diagnostics and must not be summed as independent pieces of the global SSE.',
		'',
		'## Execution and resources',
		'',
		'| Terminal classification | Count |',
		'| --- | ---: |',
		`| Accepted | ${counts.accepted} |`,
		`| Rejected | ${counts.rejected} |`,
		`| Failed | ${counts.failed} |`,
		`| Interrupted | ${counts.interrupted} |`,
		`| Invalid, accounting only | ${counts.invalidAccounted} |`,
		'',
		'Execution acceptance authenticates a completed evidence record; it does not mean a hypothesis or accuracy gate passed. Rejected, failed and interrupted records remain immutable and charged. The pinned invalid record is retained for accounting only and contributes no scientific samples.',
		'',
		inline(document.resourceSummary),
		'',
		'Adaptive work includes rejected trials and actual queries; active nodes alone do not measure cost. Preparing a larger query union is construction work. A shared capture elapsed time cannot establish the isolated runtime of each retained view.',
		'',
		'## Figures',
		'',
		figures,
		'',
		'## Factor coverage',
		'',
		'This catalog records original expectations, methods, historical findings and the continuation questions. It covers generation and runtime choices, including sample counts and distributions. Current outcomes and qualification limits come from the authenticated conclusions above and their linked assessment tables; the historical text does not assert that a planned case succeeded.',
		'',
		document.factors.map(factorText).join('\n\n'),
		'',
		'## Remaining limits',
		'',
		document.limitations.length
			? document.limitations.map((limitation) => `- ${inline(limitation)}`).join('\n')
			: 'No additional limitations were supplied beyond the scope and factor restrictions above.',
		'',
	].join('\n');
	if (report.length > maximumReportCharacters)
		throw new Error('Closure narrative exceeds its 512 Ki-character bound.');
	return report;
}
