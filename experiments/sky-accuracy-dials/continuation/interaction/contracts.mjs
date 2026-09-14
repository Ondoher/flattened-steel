import assert from 'node:assert/strict';
import {loadInputs} from '../../execution.mjs';
import {acceptControls, deriveProfile} from '../../numerics/profile.js';
import {loadSpectra, extractBoundary} from '../../processing.mjs';
import {continuationCase} from '../cases.mjs';
import {mechanismCase} from '../mechanisms/cases.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';

/** Name the only three registered two-factor forecasts.
 * @param {string} targetCaseId - Exact joint target from the mechanism catalog.
 * @returns {readonly [string,string,string]} H, factor A and factor B case names.
 */
export function interactionVertices(targetCaseId) {
	if (targetCaseId === 'j1-higher') return ['r0', 'h-factored', 'd48-factored'];
	if (targetCaseId === 'end-t320') return ['r0', 'i512-end', 'h-t320'];
	if (targetCaseId === 'higher-end') return ['r0', 'd48-factored', 'i512-end'];
	throw new RangeError('Only the three registered C4 interaction targets are admitted.');
}

/** Project extra historical output selectors onto the exact grouped comparison.
 * @param {SkyControlInput} controls - Validated parent generation controls.
 * @returns {SkyControls} Same generation settings with only grouped views8/16.
 */
function comparisonControls(controls) {
	const admitted = acceptControls(controls);
	assert.ok([8, 16].every((count) => admitted.viewIntervals.includes(count)));
	assert.ok(admitted.representations.includes('grouped'));
	assert.ok(admitted.solarInterpolations.includes('monotone-cubic'));
	return {...admitted, viewIntervals: [8, 16], representations: ['grouped'], solarInterpolations: ['monotone-cubic']};
}

/** Authenticate one exact factorial vertex and every consumed spectral artifact.
 * A matching case label alone is insufficient: geometry, atmosphere, numerical
 * controls, representation, axes and original registration must all agree.
 * @param {string} run - Accepted immutable source run.
 * @param {string} expectedCase - Required parent or target case.
 * @param {DialContinuationRegistrationRead} registration - Original C0 authority.
 * @param {SkyMechanismRegistrationRead} catalog - Prospective C3/C4 catalog.
 * @returns {SkyInteractionSource} Fully authenticated compact source boundary.
 */
export function readInteractionSource(run, expectedCase, registration, catalog) {
	const input = acceptedMechanismInput(run),
		loaded = loadSpectra(run);
	assert.deepEqual(loaded.sealIdentity, input.seal);
	assert.equal(loaded.caseId, expectedCase);
	const historical = expectedCase === 'r0' || expectedCase === 'h-factored';
	const candidate = historical ? continuationCase(expectedCase) : mechanismCase(expectedCase);
	const physical = deriveProfile(loadInputs().native48, candidate.controls);
	assert.deepEqual(
		loaded.control.buildRequest,
		physical.buildRequest,
		'Factorial vertex physical/numerical request changed.',
	);
	assert.deepEqual(comparisonControls(loaded.control.controls), comparisonControls(candidate.controls));
	assert.deepEqual(loaded.control.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(
		loaded.control.scenes.map((scene) => scene.time),
		registration.record.scopes.screen.times,
	);
	assert.deepEqual(
		loaded.control.scenes,
		registration.probeScenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
	);
	assert.equal(loaded.control.continuation?.finalFirstOrder, candidate.finalFirstOrder);
	assert.equal(
		loaded.control.continuation?.higherRepresentation ?? 'combined-raw',
		historical ? 'combined-raw' : mechanismCase(expectedCase).higherRepresentation,
	);
	assert.equal(loaded.control.continuation?.referenceMode, 'component');
	assert.equal(input.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(input.terminal.recipe.parameters.jobKind, 'gpu');
	assert.equal(input.terminal.recipe.parameters.scope, 'screen');
	assert.equal(input.terminal.recipe.parameters.phase, candidate.phase);
	assert.equal(input.terminal.recipe.parameters.caseId, expectedCase);
	if (expectedCase === 'r0')
		assert.deepEqual(input.seal, catalog.record.reusedH, 'The baseline must be the exact registered H.');
	if (!historical) {
		assert.deepEqual(
			catalog.record.cases.find((item) => item.id === expectedCase),
			candidate,
		);
		assert.ok(
			input.terminal.recipe.parents.some(
				(parent) =>
					parent.path === catalog.seal.path &&
					parent.sha256 === catalog.seal.sha256 &&
					parent.byteLength === catalog.seal.byteLength,
			),
		);
	}
	const artifacts = [mechanismArtifact(input, 'control.json'), mechanismArtifact(input, 'execution.json')];
	for (const [ordinal, channel] of loaded.control.channels.entries()) {
		const stem = `channel-${String(channel).padStart(2, '0')}`;
		artifacts.push(mechanismArtifact(input, `${stem}.json`), mechanismArtifact(input, `${stem}.f64`));
		const data = loaded.spectra[ordinal];
		assert.equal(data.channel, channel);
		assert.equal(
			data.bytes.length,
			8 * data.shape.representationCount * data.shape.viewCount * data.shape.orderCount * data.shape.rayCount,
		);
		for (let offset = 0; offset < data.bytes.length; offset += 8)
			assert.ok(
				Number.isFinite(data.bytes.readDoubleLE(offset)) && data.bytes.readDoubleLE(offset) >= 0,
				'Observed radiance must be finite and nonnegative.',
			);
	}
	for (const view of [8, 16])
		for (let order = 1; order <= 4; order++) extractBoundary(loaded, 'grouped', view, 'monotone-cubic', order);
	return {input, loaded, artifacts};
}

/** Flatten a selected grouped boundary into channel-major f64 view/order/ray.
 * No future target is read, and negative additive predictions remain unclamped.
 * @param {readonly SkyInteractionSource[]} sources - Exact H, A and B vertices.
 * @returns {readonly Buffer[]} Six channel buffers, each views8/16 then N1-N4.
 */
export function additiveSpectrumBytes(sources) {
	assert.equal(sources.length, 3);
	const channels = sources[0].loaded.control.channels;
	const times = sources[0].loaded.control.scenes.map((scene) => scene.time);
	const rayCount = times.length * 81;
	const buffers = channels.map(() => Buffer.alloc(2 * 4 * rayCount * 8));
	for (const [viewIndex, view] of [8, 16].entries())
		for (let order = 1; order <= 4; order++) {
			const [h, a, b] = sources.map((source) =>
				extractBoundary(source.loaded, 'grouped', view, 'monotone-cubic', order),
			);
			for (const [channelOrdinal] of channels.entries())
				for (let time = 0; time < times.length; time++)
					for (let x = 0; x < 9; x++)
						for (let y = 0; y < 9; y++) {
							const index = (time * 81 + y * 9 + x) * channels.length + channelOrdinal;
							const value = a.values[index] + b.values[index] - h.values[index];
							assert.ok(Number.isFinite(value), 'Additive spectrum overflow.');
							buffers[channelOrdinal].writeDoubleLE(
								value,
								((viewIndex * 4 + order - 1) * rayCount + time * 81 + x * 9 + y) * 8,
							);
						}
		}
	return buffers;
}
