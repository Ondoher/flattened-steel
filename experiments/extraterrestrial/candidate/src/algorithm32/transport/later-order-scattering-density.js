/**
 * Production promotion of Algorithm32-star's physical `L(k - 1) -> Jk`
 * scattering algorithm and logical loop shape. This is a production-owned
 * implementation, not copied Star source.
 *
 * Numerical authority:
 * `scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js`
 * functions `buildNextScatteringDensity` and `incomingRadianceAtPosition`.
 * Source-owned contributors may augment the pure L(k - 1) samples before the
 * generic phase integration without teaching this operation about a source or
 * boundary kind.
 * SHA-256: `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`.
 */

/**
 * Resolve every incoming-domain vector independently into physical space.
 * Incoming and outgoing executable vectors may use different source-local
 * frames.
 *
 * @param {PhysicalLaterOrderScatteringKernelRequest} request - Supplies source mapping.
 * @param {number} positionIndex - Supplies the position index.
 * @param {PositionDomainNode} positionNode - Supplies the position node.
 * @param {Position} position - Supplies the physical position.
 * @returns {readonly UnitVector3[]} Return physical incoming directions.
 */
function resolvePhysicalIncomingDirections(
	request,
	positionIndex,
	positionNode,
	position,
) {
	return Array.from(
		{ length: request.incomingDirectionCount },
		(_unused, directionIndex) =>
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
 * Read Star's exact-node incoming L spectra once for one position. The
 * resulting logical 34-by-channel block is reused for every outgoing J
 * direction rather than repeating field accessor traffic inside that loop.
 *
 * @param {CpuDirectionalSpectralFieldReader} previousRadiance - Supplies sealed L(k-1).
 * @param {number} positionIndex - Supplies the position index.
 * @param {number} directionCount - Supplies the incoming direction count.
 * @param {number} channelCount - Supplies the spectral channel count.
 * @returns {readonly Float64Array[]} Return exact-node incoming spectra.
 */
function readIncomingRadianceAtPosition(
	previousRadiance,
	positionIndex,
	directionCount,
	channelCount,
) {
	return Array.from({ length: directionCount }, (_unused, directionIndex) => {
		const spectrum = new Float64Array(channelCount);
		for (let wavelengthIndex = 0;
			wavelengthIndex < channelCount;
			wavelengthIndex += 1) {
			spectrum[wavelengthIndex] = previousRadiance.readScalar({
				directionIndex,
				positionIndex,
				wavelengthIndex,
			});
		}
		return spectrum;
	});
}

/**
 * Execute one accepted physical pure-radiance to pure-scattering build.
 *
 * @param {PhysicalLaterOrderScatteringKernelRequest} request - Supplies physical collaborators.
 * @param {LaterOrderScatteringKernelInvocation} invocation - Supplies field access.
 * @returns {void}
 */
function buildPhysicalScatteringOrder(request, invocation) {
	const channelCount = request.spectralChannelCount;
	const angularWeightsSteradians =
		request.incomingIntegrationWeights.values;
	for (let positionIndex = 0;
		positionIndex < request.positionCount;
		positionIndex += 1) {
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
		const physicalIncomingDirections =
			resolvePhysicalIncomingDirections(
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
				incomingDirectionCount:
					request.incomingDirectionCount,
				physicalIncomingDirections,
				incomingRadiance,
			});
		}
		const sum = new Float64Array(channelCount);

		for (let outgoingIndex = 0;
			outgoingIndex < request.outgoingDirectionCount;
			outgoingIndex += 1) {
			sum.fill(0);
			const physicalOutgoingDirection =
				request.resolvePhysicalOutgoingDirection({
					positionIndex,
					positionNode,
					position,
					directionIndex: outgoingIndex,
					cacheDirection:
						request.outgoingUnitVectors[outgoingIndex],
				});

			for (let incomingIndex = 0;
				incomingIndex < request.incomingDirectionCount;
				incomingIndex += 1) {
				const phase = request.atmosphere.samplePhase({
					viewDirection: physicalOutgoingDirection,
					incomingDirection:
						physicalIncomingDirections[
							incomingIndex
						],
				});
				const phaseWeightedScatteringPerMeterPerSteradian =
					request.calculator.computeDirectScattering(
						medium.rayleighScattering,
						medium.mieScattering,
						phase.rayleighPhase,
						phase.miePhase,
					).values;
				const angularWeightSteradians =
					angularWeightsSteradians[incomingIndex];
				const radiance = incomingRadiance[incomingIndex];

				for (let wavelengthIndex = 0;
					wavelengthIndex < channelCount;
					wavelengthIndex += 1) {
					sum[wavelengthIndex] += radiance[wavelengthIndex]
						* phaseWeightedScatteringPerMeterPerSteradian[wavelengthIndex]
						* angularWeightSteradians;
				}
			}

			for (let wavelengthIndex = 0;
				wavelengthIndex < channelCount;
				wavelengthIndex += 1) {
				invocation.outputScattering.writeScalar({
					directionIndex: outgoingIndex,
					positionIndex,
					wavelengthIndex,
				}, sum[wavelengthIndex]);
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
 * Create the synchronous selected-Star physical `L(k - 1) -> Jk` kernel.
 * The caller supplies field ownership through `buildNextScatteringOrder`.
 *
 * @param {PhysicalLaterOrderScatteringKernelRequest} request - Supplies physical collaborators and source mapping.
 * @returns {ScatteringOrderKernel} Return the accepted synchronous kernel.
 */
export function createPhysicalLaterOrderScatteringKernel(request) {
	return {
		buildPureScatteringOrder(invocation) {
			buildPhysicalScatteringOrder(request, invocation);
		},
	};
}
