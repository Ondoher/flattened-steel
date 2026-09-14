import assert from 'node:assert/strict';
import {mechanismCase} from '../mechanisms/cases.mjs';
import {extractBoundary} from '../../processing.mjs';
import {additiveSpectrumBytes, interactionVertices} from './contracts.mjs';
import {buildInteractionForecasts, evaluateInteractionForecast, interactionStrata} from './metrics.mjs';

/** Exercise actual layout, prediction gates and SSE algebra with synthetic fields.
 * No source-run identity is fabricated as scientific evidence: identities below
 * are labelled manufactured and are used only by the pure assertion helpers.
 * @param {DialContinuationRegistrationRead} registration - Existing fixed gate values.
 * @param {SkyGpuControl} originalControl - Existing screen geometry and physical axes.
 * @returns {SkyInteractionImplementationProof} Compact manufactured checks.
 */
export function verifyInteractionImplementation(registration, originalControl) {
	let checks = 0;
	/** Count one meaningful assertion. @param {unknown} value @param {string} message @returns {void} */
	const check = (value, message) => {
		assert.ok(value, message);
		checks++;
	};
	assert.deepEqual(interactionVertices('j1-higher'), ['r0', 'h-factored', 'd48-factored']);
	checks++;
	assert.deepEqual(interactionVertices('end-t320'), ['r0', 'i512-end', 'h-t320']);
	checks++;
	assert.deepEqual(interactionVertices('higher-end'), ['r0', 'd48-factored', 'i512-end']);
	checks++;
	assert.throws(() => interactionVertices('h-t320'));
	checks++;
	const control = {
		...originalControl,
		controls: {
			...originalControl.controls,
			representations: /** @type {readonly SkyRepresentation[]} */ (['grouped']),
			viewIntervals: [8, 16],
			solarInterpolations: /** @type {readonly SkySolarInterpolation[]} */ (['monotone-cubic']),
		},
	};
	const rayCount = control.scenes.length * 81;
	/** Construct a clearly manufactured source without filesystem or GPU work.
	 * @param {string} id - Explicit synthetic case identity.
	 * @param {number} scale - Main-effect perturbation multiplier.
	 * @returns {SkyInteractionSource} In-memory arithmetic fixture.
	 */
	const source = (id, scale) => {
		const seal = {path: `manufactured/${id}/sealed.json`, byteLength: 1, sha256: '0'.repeat(64)};
		const shape = {representationCount: 1, viewCount: 2, orderCount: 4, rayCount};
		const spectra = control.channels.map((channel, ordinal) => {
			const bytes = Buffer.alloc(2 * 4 * rayCount * 8);
			for (let index = 0; index < bytes.length / 8; index++) {
				const ray = index % rayCount,
					base = 0.01 + ray * 1e-6 + ordinal * 2e-4,
					delta = (1 + ray / 250 + ordinal / 10) * 1e-5;
				bytes.writeDoubleLE(base + scale * delta, index * 8);
			}
			return {channel, shape, bytes};
		});
		return {
			input: {
				run: `manufactured/${id}`,
				seal,
				terminal: {
					state: 'accepted',
					artifacts: [],
					recipe: {
						parents: [],
						parameters: {
							continuationRegistration: registration.run,
							jobKind: 'gpu',
							scope: 'screen',
							phase: 'C4',
							caseId: id,
						},
					},
				},
			},
			loaded: {sealIdentity: seal, caseId: id, control, spectra},
			artifacts: [],
		};
	};
	const h = source('r0', 0),
		a = source('i512-end', 1),
		b = source('h-t320', 0.5),
		target = source('end-t320', 0);
	const buffers = additiveSpectrumBytes([h, a, b]);
	for (let channel = 0; channel < buffers.length; channel++) {
		target.loaded.spectra[channel].bytes.set(buffers[channel]);
		for (let index = 0; index < buffers[channel].length; index += 8)
			check(
				buffers[channel].readDoubleLE(index) ===
					a.loaded.spectra[channel].bytes.readDoubleLE(index) +
						b.loaded.spectra[channel].bytes.readDoubleLE(index) -
						h.loaded.spectra[channel].bytes.readDoubleLE(index),
				'Channel/view/order/x-y flattening preserves every additive scalar exactly.',
			);
	}
	const base = extractBoundary(h.loaded, 'grouped', 8, 'monotone-cubic', 1);
	const measured = {
		...base,
		configId: 'manufactured-measurements',
		sourceIdentity: {path: 'manufactured/measurements.json', byteLength: 1, sha256: '1'.repeat(64)},
		values: Float64Array.from(base.values, (value) => value + 0.005),
	};
	const forecasts = buildInteractionForecasts([h, a, b], buffers, mechanismCase('end-t320'), registration, measured);
	const strata = interactionStrata(control);
	const evidence = {
		predictionSeal: {path: 'manufactured/prediction/sealed.json', byteLength: 1, sha256: '2'.repeat(64)},
		lockedAt: '2026-09-13T00:00:00.000Z',
		candidateStartedAt: '2026-09-13T00:00:01.000Z',
		candidateIdentity: target.input.seal,
		predictionSha256: forecasts[0].predictionSha256,
	};
	let maximumSseResidual = 0;
	for (const forecast of forecasts) {
		const result = evaluateInteractionForecast(
			forecast,
			[h, a, b, target],
			measured,
			evidence,
			strata,
			registration.record.scientificGates,
		);
		check(result.spectralPassed, 'Exact additive response passes every registered spectral group.');
		check(result.scorePassed, 'Exact additive response passes aggregate and per-time score forecasts.');
		for (const contrast of result.contrasts)
			maximumSseResidual = Math.max(maximumSseResidual, Math.abs(contrast.identityResidual));
	}
	const opposite = source('end-t320', -1.5);
	const rejected = evaluateInteractionForecast(
		forecasts[0],
		[h, a, b, opposite],
		measured,
		{...evidence, candidateIdentity: opposite.input.seal},
		strata,
		registration.record.scientificGates,
	);
	check(
		!rejected.spectralPassed && rejected.spectral.groups.every((group) => !group.passed),
		'Opposite response fails every spectral condition/angular group.',
	);
	check(!rejected.scorePassed, 'Opposite response rejects the locked measured-score direction.');
	assert.throws(() =>
		evaluateInteractionForecast(
			forecasts[0],
			[h, a, b, target],
			measured,
			{...evidence, candidateStartedAt: evidence.lockedAt},
			strata,
			registration.record.scientificGates,
		),
	);
	checks++;
	const dimA = source('i512-end', 0),
		dimB = source('h-t320', 0);
	for (const fixture of [dimA, dimB])
		for (const channel of fixture.loaded.spectra)
			for (let offset = 0; offset < channel.bytes.length; offset += 8) channel.bytes.writeDoubleLE(0.001, offset);
	const negative = additiveSpectrumBytes([source('r0', 0), dimA, dimB]);
	check(
		negative.some((buffer) => buffer.readDoubleLE(0) < 0),
		'A negative additive model is preserved without clipping.',
	);
	return {
		schemaId: 'sky-interaction-implementation-proof-v1',
		checks,
		passed: true,
		selectorCount: forecasts.length,
		nonemptyAngularGroupCount: strata.length,
		maximumSseIdentityResidual: maximumSseResidual,
		scope: 'Manufactured layout, additive model, fixed spectral/score gates and SSE identities only; no GPU target, Kider outcome or independent numerical reference is generated.',
	};
}
