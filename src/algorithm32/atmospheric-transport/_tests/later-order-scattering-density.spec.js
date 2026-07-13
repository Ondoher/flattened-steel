import {createPhysicalLaterOrderScatteringKernel} from '../later-order-scattering-density.js';

describe('physical later-order scattering kernel', /** Called by Jasmine to register the named test suite. */ () => {
	it('creates fresh kernels that retain their callback closures and evaluation order', /** Called by Jasmine to exercise the named behavior. */ () => {
		const firstEvents = [];
		const secondEvents = [];
		const firstKernel = createPhysicalLaterOrderScatteringKernel(createKernelRequest(3, firstEvents));
		const secondKernel = createPhysicalLaterOrderScatteringKernel(createKernelRequest(5, secondEvents));
		const firstWrites = [];
		const secondWrites = [];

		expect(firstKernel).not.toBe(secondKernel);
		expect(firstKernel.buildPureScatteringOrder).not.toBe(secondKernel.buildPureScatteringOrder);

		firstKernel.buildPureScatteringOrder(createKernelInvocation(firstEvents, firstWrites));
		secondKernel.buildPureScatteringOrder(createKernelInvocation(secondEvents, secondWrites));

		const expectedOrder = [
			'position',
			'read',
			'coordinate',
			'medium',
			'incoming',
			'contribute',
			'outgoing',
			'phase',
			'calculate',
			'write',
			'progress',
		];
		expect(firstEvents).toEqual(expectedOrder);
		expect(secondEvents).toEqual(expectedOrder);
		expect(firstWrites).toEqual([3]);
		expect(secondWrites).toEqual([5]);
	});

	it('propagates contributor failure before outgoing evaluation or publication', /** Called by Jasmine to exercise the named behavior. */ () => {
		const events = [];
		const writes = [];
		const failure = new Error('manufactured incoming-radiance contribution failure');
		const kernel = createPhysicalLaterOrderScatteringKernel(createKernelRequest(3, events, failure));

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => kernel.buildPureScatteringOrder(createKernelInvocation(events, writes)),
		).toThrow(failure);
		expect(events).toEqual(['position', 'read', 'coordinate', 'medium', 'incoming', 'contribute']);
		expect(writes).toEqual([]);
	});
});

/**
 * Called by this module to create one minimal physical recurrence request.
 *
 * @param {number} coefficient - The phase-weighted spectral coefficient.
 * @param {string[]} events - The ordered callback observations.
 * @param {Error | null} [contributorError] - The optional contributor failure.
 * @returns {PhysicalLaterOrderScatteringKernelRequest} - The recurrence request.
 *
 */
function createKernelRequest(coefficient, events, contributorError = null) {
	return /** @type {PhysicalLaterOrderScatteringKernelRequest} */ (
		/** @type {unknown} */ ({
			geometry: {
				/**
				 * Call this method to resolve atmosphere coordinate.
				 * @returns - The result produced by the operation.
				 */ resolveAtmosphereCoordinate() {
					events.push('coordinate');
					return {altitude: {value: 0, units: 'meters'}};
				},
			},
			atmosphere: {
				/**
				 * Call this method to sample medium.
				 * @returns - The result produced by the operation.
				 */ sampleMedium() {
					events.push('medium');
					return {
						rayleighScattering: {values: [0]},
						mieScattering: {values: [0]},
					};
				},
				/**
				 * Call this method to sample phase.
				 * @returns - The result produced by the operation.
				 */ samplePhase() {
					events.push('phase');
					return {rayleighPhase: 1, miePhase: 0};
				},
			},
			calculator: {
				/**
				 * Call this method to compute direct scattering.
				 * @returns - The result produced by the operation.
				 */ computeDirectScattering() {
					events.push('calculate');
					return {values: [coefficient]};
				},
			},
			scatteringOrder: 2,
			positionNodes: [{index: 0, coordinate: {value: 0, units: 'meters'}, role: 'manufactured', metadata: {}}],
			positionCount: 1,
			incomingUnitVectors: [[1, 0, 0]],
			incomingDirectionCount: 1,
			incomingIntegrationWeights: {values: [0.5], units: 'steradians'},
			outgoingUnitVectors: [[0, 1, 0]],
			outgoingDirectionCount: 1,
			spectralBasis: {id: 'manufactured-basis', channelCount: 1, channels: []},
			spectralChannelCount: 1,
			/**
			 * Call this method to resolve physical position.
			 * @returns - The result produced by the operation.
			 */ resolvePhysicalPosition() {
				events.push('position');
				return {coordinates: [0, 0, 0], units: 'meters'};
			},
			/**
			 * Call this method to resolve physical incoming direction.
			 * @returns - The result produced by the operation.
			 */ resolvePhysicalIncomingDirection() {
				events.push('incoming');
				return [1, 0, 0];
			},
			/**
			 * Call this method to resolve physical outgoing direction.
			 * @returns - The result produced by the operation.
			 */ resolvePhysicalOutgoingDirection() {
				events.push('outgoing');
				return [0, 1, 0];
			},
			/**
			 * Call this method to contribute incoming radiance.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ contributeIncomingRadiance() {
				events.push('contribute');
				if (contributorError !== null) {
					throw contributorError;
				}
			},
			/** Call this method to on progress. */ onProgress() {
				events.push('progress');
			},
		})
	);
}

/**
 * Called by this module to create one manufactured field invocation.
 *
 * @param {string[]} events - The ordered callback observations.
 * @param {number[]} writes - The published scalar observations.
 * @returns {LaterOrderScatteringKernelInvocation} - The field invocation.
 *
 */
function createKernelInvocation(events, writes) {
	return {
		previousRadiance: {
			id: 'manufactured-previous-radiance',
			provenanceIdentity: 'manufactured-previous-radiance',
			order: {kind: 'pure', value: 1},
			scalarCount: 1,
			/**
			 * Call this method to read scalar.
			 * @returns - The result produced by the operation.
			 */ readScalar() {
				events.push('read');
				return 2;
			},
			/**
			 * Call this method to read scalar at offset.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ readScalarAtOffset() {
				throw new Error('dense reads are not part of the recurrence contract.');
			},
		},
		outputScattering: {
			id: 'manufactured-output-scattering',
			provenanceIdentity: 'manufactured-output-scattering',
			order: {kind: 'pure', value: 2},
			scalarCount: 1,
			/**
			 * Call this method to write scalar.
			 * @param _coordinates - The intentionally unused callback value.
			 * @param value - The value accepted by the operation.
			 */ writeScalar(_coordinates, value) {
				events.push('write');
				writes.push(value);
			},
			/**
			 * Call this method to write scalar at offset.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ writeScalarAtOffset() {
				throw new Error('dense writes are not part of the recurrence contract.');
			},
			/**
			 * Call this method to fill.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ fill() {
				throw new Error('field initialization belongs to field orchestration.');
			},
		},
	};
}
