/**
 * Production implementation of the physical `L(k - 1) -> Jk`
 * scattering algorithm and logical loop shape. This is a production-owned
 * implementation, not copied experimental source.
 *
 * Numerical authority:
 * the current production cache contract
 * functions `buildNextScatteringDensity` and `incomingRadianceAtPosition`.
 * Source-owned contributors may augment the pure L(k - 1) samples before the
 * generic phase integration without teaching this operation about a source or
 * boundary kind.
 * SHA-256: `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`.
 */

/**
 * Called by the physical recurrence to resolve every incoming-domain vector
 * independently into physical space. Incoming and outgoing executable vectors
 * may use different source-local frames.
 *
 * @param {PhysicalLaterOrderScatteringKernelRequest} request - The source mapping.
 * @param {number} positionIndex - The position index.
 * @param {PositionDomainNode} positionNode - The position node.
 * @param {Position} position - The physical position.
 * @returns {readonly UnitVector3[]} - The physical incoming directions.
 */
function resolvePhysicalIncomingDirections(request, positionIndex, positionNode, position) {
	return Array.from(
		{length: request.incomingDirectionCount},
		/**
		 * Called by the surrounding operation to handle one callback invocation.
		 * @param _unused - The intentionally unused callback value.
		 * @param directionIndex - The direction index value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (_unused, directionIndex) =>
			request.resolvePhysicalIncomingDirection({
				positionIndex,
				positionNode,
				position,
				directionIndex,
				cacheDirection: request.incomingUnitVectors[directionIndex],
			}),
	);
}

/**
 * Called by the physical recurrence to read the production exact-node incoming
 * L spectra once for one position. The resulting logical direction-by-channel
 * block is reused for every outgoing J direction rather than repeating field
 * accessor traffic inside that loop.
 *
 * @param {CpuDirectionalSpectralFieldReader} previousRadiance - The sealed L(k-1) field.
 * @param {number} positionIndex - The position index.
 * @param {number} directionCount - The incoming direction count.
 * @param {number} channelCount - The spectral channel count.
 * @returns {readonly Float64Array[]} - The exact-node incoming spectra.
 */
function readIncomingRadianceAtPosition(previousRadiance, positionIndex, directionCount, channelCount) {
	return Array.from(
		{length: directionCount},
		/**
		 * Called by the surrounding operation to handle one callback invocation.
		 * @param _unused - The intentionally unused callback value.
		 * @param directionIndex - The direction index value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (_unused, directionIndex) => {
			const spectrum = new Float64Array(channelCount);
			for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
				spectrum[wavelengthIndex] = previousRadiance.readScalar({
					directionIndex,
					positionIndex,
					wavelengthIndex,
				});
			}
			return spectrum;
		},
	);
}

/**
 * Called by the returned scattering-order kernel to execute one accepted
 * physical pure-radiance to pure-scattering build.
 *
 * @param {PhysicalLaterOrderScatteringKernelRequest} request - The physical collaborators.
 * @param {LaterOrderScatteringKernelInvocation} invocation - The field access capabilities.
 * @returns {void} - No return value.
 */
function buildPhysicalScatteringOrder(request, invocation) {
	const channelCount = request.spectralChannelCount;
	const angularWeightsSteradians = request.incomingIntegrationWeights.values;
	for (let positionIndex = 0; positionIndex < request.positionCount; positionIndex += 1) {
		const positionNode = request.positionNodes[positionIndex];
		const position = request.resolvePhysicalPosition({
			positionIndex,
			positionNode,
		});
		const incomingRadiance = readIncomingRadianceAtPosition(
			invocation.previousRadiance,
			positionIndex,
			request.incomingDirectionCount,
			channelCount,
		);

		const atmosphereCoordinate = request.geometry.resolveAtmosphereCoordinate(position);
		const medium = request.atmosphere.sampleMedium(atmosphereCoordinate);
		const physicalIncomingDirections = resolvePhysicalIncomingDirections(
			request,
			positionIndex,
			positionNode,
			position,
		);
		if (request.contributeIncomingRadiance !== undefined) {
			request.contributeIncomingRadiance({
				positionIndex,
				positionNode,
				position,
				spectralBasis: request.spectralBasis,
				incomingDirectionCount: request.incomingDirectionCount,
				physicalIncomingDirections,
				incomingRadiance,
			});
		}
		const sum = new Float64Array(channelCount);

		for (let outgoingIndex = 0; outgoingIndex < request.outgoingDirectionCount; outgoingIndex += 1) {
			sum.fill(0);
			const physicalOutgoingDirection = request.resolvePhysicalOutgoingDirection({
				positionIndex,
				positionNode,
				position,
				directionIndex: outgoingIndex,
				cacheDirection: request.outgoingUnitVectors[outgoingIndex],
			});

			for (let incomingIndex = 0; incomingIndex < request.incomingDirectionCount; incomingIndex += 1) {
				const phase = request.atmosphere.samplePhase({
					viewDirection: physicalOutgoingDirection,
					incomingDirection: physicalIncomingDirections[incomingIndex],
				});
				const phaseWeightedScatteringPerMeterPerSteradian = request.calculator.computeDirectScattering(
					medium.rayleighScattering,
					medium.mieScattering,
					phase.rayleighPhase,
					phase.miePhase,
				).values;
				const angularWeightSteradians = angularWeightsSteradians[incomingIndex];
				const radiance = incomingRadiance[incomingIndex];

				for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
					sum[wavelengthIndex] +=
						radiance[wavelengthIndex] *
						phaseWeightedScatteringPerMeterPerSteradian[wavelengthIndex] *
						angularWeightSteradians;
				}
			}

			for (let wavelengthIndex = 0; wavelengthIndex < channelCount; wavelengthIndex += 1) {
				invocation.outputScattering.writeScalar(
					{
						directionIndex: outgoingIndex,
						positionIndex,
						wavelengthIndex,
					},
					sum[wavelengthIndex],
				);
			}
		}
		request.onProgress?.({
			phase: 'later-order-scattering',
			order: request.scatteringOrder,
			completed: positionIndex + 1,
			total: request.positionCount,
		});
	}
}

/**
 * Call this function to create a fresh synchronous selected-production
 * physical `L(k - 1) -> Jk` kernel. The returned kernel captures the supplied
 * source-neutral physical callbacks, while the caller retains field ownership
 * through `ScatteringOrderFieldOperations.buildNextScatteringOrder`.
 *
 * @param {PhysicalLaterOrderScatteringKernelRequest} request - The physical collaborators and source mapping.
 * @returns {ScatteringOrderKernel} - The fresh synchronous kernel.
 */
export function createPhysicalLaterOrderScatteringKernel(request) {
	return {
		/**
		 * Call this method to build one physical pure-scattering order synchronously.
		 *
		 * @param {LaterOrderScatteringKernelInvocation} invocation - The field access capabilities.
		 * @returns {void} - No return value.
		 *
		 */
		buildPureScatteringOrder(invocation) {
			buildPhysicalScatteringOrder(request, invocation);
		},
	};
}
