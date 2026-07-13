import {CpuDirectionalSpectralField} from '../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {DistantSunFieldPacking} from '../../implementation/distant-sun/cache/DistantSunFieldPacking.js';
import {ScatteringOrderFieldOperations} from '../ScatteringOrderFieldOperations.js';

describe('scattering-order field operations', /** Called by Jasmine to register the named test suite. */ () => {
	it('creates a fresh writer capability with an explicit revocation lifetime', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const output = createField(context, {
			id: 'revocable-output-scattering',
			kind: 'scattering',
			order: {kind: 'pure', value: 2},
		});
		const writer = output.createWriter();
		const revocable = ScatteringOrderFieldOperations.createRevocableWriter(writer);

		expect(revocable.writer).not.toBe(writer);
		expect(revocable.writer.id).toBe(writer.id);
		expect(revocable.writer.provenanceIdentity).toBe(writer.provenanceIdentity);
		expect(revocable.writer.order).toBe(writer.order);
		expect(revocable.writer.scalarCount).toBe(writer.scalarCount);
		revocable.writer.writeScalarAtOffset(0, 3);
		revocable.revoke();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => revocable.writer.writeScalarAtOffset(1, 5),
		).toThrowError(/no longer active/u);

		output.seal();
		expect(readValues(output)).toEqual([3, 0, 0, 0, 0, 0]);
	});

	it('builds and seals the next pure order through reader/writer capabilities', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const previous = createField(context, {
			id: 'previous-radiance-j1',
			kind: 'radiance',
			order: {kind: 'pure', value: 1},
		});
		writeAndSeal(previous, [1, 2, 3, 4]);
		const output = createField(context, {
			id: 'output-scattering-j2',
			kind: 'scattering',
			order: {kind: 'pure', value: 2},
		});
		output.createWriter().fill(99);
		let kernelRequest;
		const result = ScatteringOrderFieldOperations.buildNextScatteringOrder({
			previousRadiance: previous,
			outputScattering: output,
			kernel: {
				/**
				 * Call this method to build pure scattering order.
				 * @param request - The request accepted by the operation.
				 */ buildPureScatteringOrder(request) {
					kernelRequest = request;
					request.outputScattering.writeScalarAtOffset(0, request.previousRadiance.readScalarAtOffset(0) * 2);
					request.outputScattering.writeScalarAtOffset(
						output.scalarCount - 1,
						request.previousRadiance.readScalarAtOffset(previous.scalarCount - 1) * 3,
					);
				},
			},
		});

		expect(result).toBe(output);
		expect(output.isSealed).toBeTrue();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => kernelRequest.outputScattering.writeScalarAtOffset(0, 9),
		).toThrowError(/no longer active/u);
		expect(output.scalarCount).toBe(6);
		expect(readValues(output)).toEqual([2, 0, 0, 0, 0, 12]);
	});

	it('zeros a mutable scattering target when its kernel fails', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const previous = createField(context, {
			id: 'failure-previous-radiance',
			kind: 'radiance',
			order: {kind: 'pure', value: 1},
		});
		writeAndSeal(previous, [1, 2, 3, 4]);
		const output = createField(context, {
			id: 'failure-output-scattering',
			kind: 'scattering',
			order: {kind: 'pure', value: 2},
		});
		output.createWriter().fill(7);

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.buildNextScatteringOrder({
					previousRadiance: previous,
					outputScattering: output,
					kernel: {
						/**
						 * Call this method to build pure scattering order.
						 * @param input1 - The destructured input accepted by the operation.
						 * @throws {Error} - When the operation cannot complete its caller-observable contract.
						 */ buildPureScatteringOrder({outputScattering}) {
							outputScattering.writeScalarAtOffset(1, 100);
							throw new Error('manufactured kernel failure');
						},
					},
				}),
		).toThrowError(/manufactured kernel failure/u);
		expect(output.isSealed).toBeFalse();
		output.seal();
		expect(readValues(output)).toEqual(Array(6).fill(0));
	});

	it('revokes asynchronous kernels and leaves their target mutable and zeroed', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const context = createContext();
		const previous = createField(context, {
			id: 'async-previous-radiance',
			kind: 'radiance',
			order: {kind: 'pure', value: 1},
		});
		writeAndSeal(previous, [1, 2, 3, 4]);
		const output = createField(context, {
			id: 'async-output-scattering',
			kind: 'scattering',
			order: {kind: 'pure', value: 2},
		});
		output.createWriter().fill(7);
		let lateWriteFailure;

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.buildNextScatteringOrder({
					previousRadiance: previous,
					outputScattering: output,
					kernel: {
						/**
						 * Call this method to build pure scattering order.
						 * @param input1 - The destructured input accepted by the operation.
						 * @returns - The result produced by the operation.
						 */ buildPureScatteringOrder({outputScattering}) {
							return Promise.resolve().then(
								/** Called by the promise continuation to handle one callback invocation. */ () => {
									try {
										outputScattering.writeScalarAtOffset(0, 42);
									} catch (error) {
										lateWriteFailure = error;
									}
								},
							);
						},
					},
				}),
		).toThrowError(/complete synchronously/u);
		expect(output.isSealed).toBeFalse();
		await Promise.resolve();
		expect(lateWriteFailure).toEqual(jasmine.any(Error));
		expect(lateWriteFailure.message).toMatch(/no longer active/u);
		output.seal();
		expect(readValues(output)).toEqual(Array(6).fill(0));
	});

	it('rejects aliased recurrence fields', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const aliased = createField(context, {
			id: 'aliased-radiance-field',
			kind: 'radiance',
			order: {kind: 'pure', value: 1},
		});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.buildNextScatteringOrder({
					previousRadiance: aliased,
					outputScattering: aliased,
					kernel: emptyKernel(),
				}),
		).toThrowError(/must not alias/u);
	});

	it('rejects an unsealed previous field', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const unsealed = createField(context, {
			id: 'unsealed-radiance',
			kind: 'radiance',
			order: {kind: 'pure', value: 1},
		});
		const output = createField(context, {
			id: 'unsealed-output',
			kind: 'scattering',
			order: {kind: 'pure', value: 2},
		});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.buildNextScatteringOrder({
					previousRadiance: unsealed,
					outputScattering: output,
					kernel: emptyKernel(),
				}),
		).toThrowError(/must be sealed/u);
	});

	it('sums sealed contiguous pure orders and seals the cumulative target', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const first = scatteringField(context, 'pure-j1', {kind: 'pure', value: 1});
		const second = scatteringField(context, 'pure-j2', {kind: 'pure', value: 2});
		writeAndSeal(first, [1, 2, 3, 4, 5, 6]);
		writeAndSeal(second, [0.5, 1, 1.5, 2, 2.5, 3]);
		const cumulative = scatteringField(context, 'cumulative-through-j2', {kind: 'cumulative-through', value: 2});
		cumulative.createWriter().fill(99);

		expect(
			ScatteringOrderFieldOperations.accumulatePureScatteringFields({
				pureFields: [first, second],
				cumulativeField: cumulative,
				packing: context.scatteringPacking,
			}),
		).toBe(cumulative);
		expect(cumulative.isSealed).toBeTrue();
		expect(readValues(cumulative)).toEqual([1.5, 3, 4.5, 6, 7.5, 9]);
		expect(readValues(first)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(readValues(second)).toEqual([0.5, 1, 1.5, 2, 2.5, 3]);
	});

	it('rejects unsealed or aliased pure inputs', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const unsealed = scatteringField(context, 'unsealed-j1', {kind: 'pure', value: 1});
		const secondTarget = scatteringField(context, 'unsealed-target', {kind: 'cumulative-through', value: 1});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.accumulatePureScatteringFields({
					pureFields: [unsealed],
					cumulativeField: secondTarget,
					packing: context.scatteringPacking,
				}),
		).toThrowError(/must be sealed/u);

		const aliasedTarget = scatteringField(context, 'aliased-target', {kind: 'cumulative-through', value: 1});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.accumulatePureScatteringFields({
					pureFields: [aliasedTarget],
					cumulativeField: aliasedTarget,
					packing: context.scatteringPacking,
				}),
		).toThrowError(/must not alias/u);
	});

	it('rejects duplicate inputs at the pure-order seam', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const first = scatteringField(context, 'duplicate-j1', {kind: 'pure', value: 1});
		writeAndSeal(first, Array(6).fill(1));
		const duplicateTarget = scatteringField(context, 'duplicate-target', {kind: 'cumulative-through', value: 2});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.accumulatePureScatteringFields({
					pureFields: [first, first],
					cumulativeField: duplicateTarget,
					packing: context.scatteringPacking,
				}),
		).toThrowError(/must not alias each other/u);
	});

	it('rejects a non-finite accumulated scalar and restores every target scalar', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = createContext();
		const first = scatteringField(context, 'overflow-j1', {kind: 'pure', value: 1});
		const second = scatteringField(context, 'overflow-j2', {kind: 'pure', value: 2});
		writeAndSeal(first, Array(6).fill(Number.MAX_VALUE));
		writeAndSeal(second, Array(6).fill(Number.MAX_VALUE));
		const target = scatteringField(context, 'overflow-target', {kind: 'cumulative-through', value: 2});
		target.createWriter().fill(4);

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ScatteringOrderFieldOperations.accumulatePureScatteringFields({
					pureFields: [first, second],
					cumulativeField: target,
					packing: context.scatteringPacking,
				}),
		).toThrowError(/must remain finite/u);
		expect(target.isSealed).toBeFalse();
		target.seal();
		expect(readValues(target)).toEqual(Array(6).fill(0));
	});
});

/**
 * Called by this module to empty kernel.
 * @returns - The result produced by the operation.
 */
function emptyKernel() {
	return {
		/** Call this method to build pure scattering order. */ buildPureScatteringOrder() {},
	};
}

/**
 * Called by this module to scattering field.
 * @param context - The execution context accepted by the operation.
 * @param id - The id value accepted by the operation.
 * @param order - The order value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function scatteringField(context, id, order) {
	return createField(context, {id, kind: 'scattering', order});
}

/**
 * Called by this module to create field.
 * @param context - The execution context accepted by the operation.
 * @param input2 - The destructured input accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createField(context, {id, kind, order}) {
	const packing = kind === 'radiance' ? context.radiancePacking : context.scatteringPacking;
	const acceptedOrder =
		order.kind === 'pure'
			? order
			: {
					...order,
					included:
						order.included ??
						Array.from(
							{length: order.value},
							/**
							 * Called by the surrounding operation to handle one callback invocation.
							 * @param _unused - The intentionally unused callback value.
							 * @param index - The zero-based index accepted by the operation.
							 * @returns - The callback result returned to its caller.
							 */ (_unused, index) => index + 1,
						),
				};

	return new CpuDirectionalSpectralField({
		id,
		provenanceIdentity: `manufactured:${id}`,
		order: acceptedOrder,
		packing,
	});
}

/**
 * Called by this module to create context.
 * @returns - The result produced by the operation.
 */
function createContext() {
	const radiancePacking = new DistantSunFieldPacking({
		id: 'manufactured-radiance-packing',
		directionCount: 2,
		positionCount: 1,
		wavelengthCount: 2,
	});
	const scatteringPacking = new DistantSunFieldPacking({
		id: 'manufactured-scattering-packing',
		directionCount: 3,
		positionCount: 1,
		wavelengthCount: 2,
	});

	return {
		radiancePacking,
		scatteringPacking,
	};
}

/**
 * Called by this module to write and seal.
 * @param field - The field value accepted by the operation.
 * @param values - The values value accepted by the operation.
 * @returns - The result produced by the operation.
 * @throws {Error} - When the operation cannot complete its caller-observable contract.
 */
function writeAndSeal(field, values) {
	if (values.length !== field.scalarCount) {
		throw new Error('manufactured values must match the field scalar count.');
	}

	const writer = field.createWriter();
	values.forEach(
		/**
		 * Called by Array.prototype.forEach to process one collection value.
		 * @param value - The value accepted by the operation.
		 * @param offset - The offset value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value, offset) => writer.writeScalarAtOffset(offset, value),
	);
	field.seal();
	return field;
}

/**
 * Called by this module to read values.
 * @param field - The field value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function readValues(field) {
	const reader = field.createReader();
	return Array.from(
		{length: field.scalarCount},
		/**
		 * Called by the surrounding operation to handle one callback invocation.
		 * @param _unused - The intentionally unused callback value.
		 * @param offset - The offset value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (_unused, offset) => reader.readScalarAtOffset(offset),
	);
}
