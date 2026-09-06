import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from './sceneCacheContract.js';

const DEG = 180 / Math.PI;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function resolveZenithStencil(angleDegrees, solarZenithNodesDegrees = null) {
	const grid = CONTRACT.domains.solarZenith;
	const angle = clamp(angleDegrees, 0, 180);
	const nodes = solarZenithNodesDegrees ?? Array.from({length: grid.count},
		(_unused, index) => grid.firstCenterDegrees + index * grid.spacingDegrees);
	const last = nodes.length - 1;
	if (angle <= nodes[0]) return {lowerIndex: 0, upperIndex: 0};
	if (angle >= nodes[last]) {
		return {lowerIndex: last, upperIndex: last};
	}
	let upperIndex = 1;
	while (nodes[upperIndex] < angle) upperIndex += 1;
	return {lowerIndex: upperIndex - 1, upperIndex};
}

export function maximumVisibleCentralAngleDegrees(altitudeMeters) {
	const support = CONTRACT.scenes[0].support;
	const R = support.bottomRadiusMeters;
	const horizon = (height) => Math.acos(R / (R + height));
	return (horizon(support.observer.heightMeters) + horizon(altitudeMeters)) * DEG;
}

function indexRange(minimumAngle, maximumAngle, solarZenithNodesDegrees) {
	const minimum = resolveZenithStencil(minimumAngle, solarZenithNodesDegrees);
	const maximum = resolveZenithStencil(maximumAngle, solarZenithNodesDegrees);
	return {firstIndex: minimum.lowerIndex, lastIndex: maximum.upperIndex};
}

function payload(blockCount, outgoingCount, spectralCount = CONTRACT.domains.spectral.count) {
	const spectrumCount = blockCount * outgoingCount;
	const scalarCount = spectrumCount * spectralCount;
	const bytes = scalarCount * 4;
	return {blockCount, spectrumCount, scalarCount, bytes, MiB: bytes / 2 ** 20};
}

export function buildSceneInventoryLedger(scene, {positionDomain = null,
	solarZenithDomain = null, spectralCount = CONTRACT.domains.spectral.count} = {}) {
	const altitudes = positionDomain?.nodes.map((node) => node.altitudeMeters)
		?? CONTRACT.domains.altitude.nodesMeters;
	const solarZenithNodesDegrees = solarZenithDomain?.nodes.map((node) => node.solarZenithDegrees)
		?? Array.from({length: CONTRACT.domains.solarZenith.count}, (_unused, index) =>
			CONTRACT.domains.solarZenith.firstCenterDegrees
			+ index * CONTRACT.domains.solarZenith.spacingDegrees);
	const atmosphereHeight = scene.support.topRadiusMeters
		- scene.support.bottomRadiusMeters;
	let packedOffset = 0;
	const rows = altitudes.map((altitudeMeters, altitudeIndex) => {
		const queryMinimumAltitudeMeters = altitudeIndex === 0
			? 0 : altitudes[altitudeIndex - 1];
		const queryMaximumAltitudeMeters = altitudeIndex === altitudes.length - 1
			? atmosphereHeight : altitudes[altitudeIndex + 1];
		const cap = maximumVisibleCentralAngleDegrees(queryMaximumAltitudeMeters);
		const minimumSolarZenithDegrees = clamp(
			scene.observerSolarZenithDegrees - cap, 0, 180);
		const maximumSolarZenithDegrees = clamp(
			scene.observerSolarZenithDegrees + cap, 0, 180);
		const indices = indexRange(
			minimumSolarZenithDegrees, maximumSolarZenithDegrees, solarZenithNodesDegrees);
		const count = indices.lastIndex - indices.firstIndex + 1;
		const row = {
			altitudeIndex, altitudeMeters,
			queryAltitudeSupport: {
				minimumMeters: queryMinimumAltitudeMeters,
				maximumMeters: queryMaximumAltitudeMeters,
			},
			maximumVisibleCentralAngleDegrees: cap,
			solarZenithSupport: {
				minimumDegrees: minimumSolarZenithDegrees,
				maximumDegrees: maximumSolarZenithDegrees,
			},
			retainedZenith: {...indices, count},
			packed: {firstRow: packedOffset, rowCount: count},
		};
		packedOffset += count;
		return row;
	});
	const retainedZenithIndices = [...new Set(rows.flatMap((row) =>
		Array.from({length: row.retainedZenith.count},
			(_unused, offset) => row.retainedZenith.firstIndex + offset)))];
	const fullBlockCount = altitudes.length * solarZenithNodesDegrees.length;
	const completePageBlockCount = retainedZenithIndices.length * altitudes.length;
	return {
		schemaId: CONTRACT.packedLayout.ledgerSchemaId,
		sceneId: scene.id,
		cacheIdentity: scene.cacheIdentity,
		rowKey: '(altitudeIndex, solarZenithIndex)',
		missingRowPolicy: CONTRACT.reconstruction.outOfSupport,
		rows,
		retainedBlockCount: packedOffset,
		retainedZenithIndices,
		memory: {
			fullRectangular: {
				W27: payload(fullBlockCount, CONTRACT.domains.outgoingSuccessor.count, spectralCount),
				W39: payload(fullBlockCount, CONTRACT.domains.outgoingPoc.count, spectralCount),
			},
			completeZenithPages: {
				W27: payload(completePageBlockCount, CONTRACT.domains.outgoingSuccessor.count, spectralCount),
				W39: payload(completePageBlockCount, CONTRACT.domains.outgoingPoc.count, spectralCount),
			},
			packedRows: {
				W27: payload(packedOffset, CONTRACT.domains.outgoingSuccessor.count, spectralCount),
				W39: payload(packedOffset, CONTRACT.domains.outgoingPoc.count, spectralCount),
			},
		},
	};
}

export function lookupPackedRow(ledger, altitudeIndex, zenithIndex) {
	const row = ledger.rows[altitudeIndex];
	if (!row || zenithIndex < row.retainedZenith.firstIndex
		|| zenithIndex > row.retainedZenith.lastIndex) {
		throw new RangeError('Point-local scene-cache query is outside declared support.');
	}
	return row.packed.firstRow + zenithIndex - row.retainedZenith.firstIndex;
}

export function proveLedgerClosure(ledger, scene) {
	const altitudes = CONTRACT.domains.altitude.nodesMeters;
	const top = scene.support.topRadiusMeters - scene.support.bottomRadiusMeters;
	let queryCount = 0;
	let stencilTapCount = 0;
	const roundTrip = new Set();
	for (const row of ledger.rows) {
		for (let z = row.retainedZenith.firstIndex;
			z <= row.retainedZenith.lastIndex; z += 1) {
			const packed = lookupPackedRow(ledger, row.altitudeIndex, z);
			if (packed !== row.packed.firstRow + z - row.retainedZenith.firstIndex
				|| roundTrip.has(packed)) throw new Error('Packed-row mapping is not bijective.');
			roundTrip.add(packed);
		}
	}
	for (let interval = 0; interval < altitudes.length; interval += 1) {
		const low = interval === 0 ? 0 : altitudes[interval];
		const high = interval === altitudes.length - 1 ? top : altitudes[interval + 1];
		const altitudeStencil = interval === altitudes.length - 1
			? [interval] : [interval, interval + 1];
		for (let step = 0; step <= 128; step += 1) {
			const altitude = low + (high - low) * step / 128;
			const cap = maximumVisibleCentralAngleDegrees(altitude);
			for (let radialStep = 0; radialStep <= 16; radialStep += 1) {
				const alpha = cap * radialStep / 16 / DEG;
				for (let azimuthStep = 0; azimuthStep < 64; azimuthStep += 1) {
					const phi = 2 * Math.PI * azimuthStep / 64;
					const theta = scene.observerSolarZenithDegrees / DEG;
					const mu = clamp(Math.cos(theta) * Math.cos(alpha)
						+ Math.sin(theta) * Math.sin(alpha) * Math.cos(phi), -1, 1);
					const zenithStencil = resolveZenithStencil(Math.acos(mu) * DEG);
					for (const a of altitudeStencil) for (const z of [zenithStencil.lowerIndex, zenithStencil.upperIndex]) {
						lookupPackedRow(ledger, a, z);
						stencilTapCount += 1;
					}
					queryCount += 1;
				}
			}
		}
	}
	if (roundTrip.size !== ledger.retainedBlockCount) {
		throw new Error('Packed-row ledger does not round-trip every block.');
	}
	return {accepted: true, queryCount, stencilTapCount,
		packedRoundTripCount: roundTrip.size};
}
