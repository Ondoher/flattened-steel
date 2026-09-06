import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const payloadText = readFileSync(new URL(
	'../algorithm32-star-legacy-34-j2-compatibility.json',
	import.meta.url,
), 'utf8');
const payload = JSON.parse(payloadText);
const manifest = JSON.parse(readFileSync(new URL(
	'../../light-sources/fixtures/algorithm32-star-legacy-l1-parity.json',
	import.meta.url,
), 'utf8'));

describe('Algorithm32-star preserved legacy L1 fixture', () => {
	it('retains the exact standalone payload and pinned source identity', () => {
		const payloadSha256 = createHash('sha256').update(payloadText).digest('hex');

		expect(payloadSha256).toBe(manifest.authority.preservedPayloadSha256);
		expect(manifest.authority.selectedImplementationSha256).toBe(
			'98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a',
		);
		expect(payload.authority.productionSnapshot.gitCommit).toBe(
			manifest.authority.productionSourceCommit,
		);
		expect(payload.controls).toEqual(jasmine.objectContaining({
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			altitudeBinCount: 48,
			directionCount: 34,
		}));
	});

	it('extracts 1,530 unique direct L1 scalars without an external dependency', () => {
		const selectedCases = manifest.extraction.caseIds.map((caseId) =>
			payload.cases.find((entry) => entry.id === caseId));
		const values = selectedCases.flatMap((entry) =>
			entry.incomingSamples.flatMap((sample) => sample.radiance));

		expect(selectedCases.map((entry) => entry.altitudeBinIndex))
			.toEqual(manifest.extraction.positionIndices);
		expect(selectedCases.every((entry) => entry.incomingSamples.length === 34))
			.toBeTrue();
		expect(selectedCases.every((entry) => entry.incomingSamples.every(
			(sample) => sample.radiance.length === 15,
		))).toBeTrue();
		expect(values.length).toBe(manifest.extraction.uniqueScalarCount);
		expect(values.every(Number.isFinite)).toBeTrue();

		for (const selected of selectedCases) {
			const sameAltitudeCases = payload.cases.filter(
				(entry) => entry.altitudeBinIndex === selected.altitudeBinIndex,
			);
			for (const entry of sameAltitudeCases) {
				expect(entry.incomingSamples.map((sample) => sample.radiance))
					.toEqual(selected.incomingSamples.map((sample) => sample.radiance));
			}
		}
	});
});
