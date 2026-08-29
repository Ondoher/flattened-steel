const DEG = 180 / Math.PI;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function zenithStencil(angleDegrees) {
	const angle = clamp(angleDegrees, 0, 180);
	if (angle <= 0.5) return {lowerIndex: 0, upperIndex: 0};
	if (angle >= 179.5) return {lowerIndex: 179, upperIndex: 179};
	const coordinate = angle - 0.5;
	return {lowerIndex: Math.floor(coordinate), upperIndex: Math.ceil(coordinate)};
}

function visibleCap(altitudeMeters, observerHeightMeters) {
	const radius = 6360000;
	return (Math.acos(radius / (radius + observerHeightMeters))
		+ Math.acos(radius / (radius + altitudeMeters))) * DEG;
}

/** Build the same interpolation-safe packed ledger over a supplied 48-node grid. */
export function buildP6RadialLedger({scene, positionDomain}) {
	const altitudes = positionDomain.nodes.map((node) => node.altitudeMeters);
	let packedOffset = 0;
	const rows = altitudes.map((altitudeMeters, altitudeIndex) => {
		const minimumMeters = altitudeIndex === 0 ? 0 : altitudes[altitudeIndex - 1];
		const maximumMeters = altitudeIndex === altitudes.length - 1
			? 60000 : altitudes[altitudeIndex + 1];
		const cap = visibleCap(maximumMeters, scene.observer.heightMeters);
		const observerSolarZenithDegrees = 90 - scene.solarElevationDegrees;
		const minimumDegrees = clamp(observerSolarZenithDegrees - cap, 0, 180);
		const maximumDegrees = clamp(observerSolarZenithDegrees + cap, 0, 180);
		const firstIndex = zenithStencil(minimumDegrees).lowerIndex;
		const lastIndex = zenithStencil(maximumDegrees).upperIndex;
		const count = lastIndex - firstIndex + 1;
		const row = {
			altitudeIndex, altitudeMeters,
			queryAltitudeSupport: {minimumMeters, maximumMeters},
			maximumVisibleCentralAngleDegrees: cap,
			solarZenithSupport: {minimumDegrees, maximumDegrees},
			retainedZenith: {firstIndex, lastIndex, count},
			packed: {firstRow: packedOffset, rowCount: count},
		};
		packedOffset += count;
		return row;
	});
	return {
		schemaId: 'point-local-packed-row-ledger-v1',
		sceneId: scene.id,
		cacheIdentity: 'san-jose-solar-noon-point-local-c4-native15-n4-p6-radial-v1',
		positionDomainId: positionDomain.id,
		rowKey: '(altitudeIndex, solarZenithIndex)',
		missingRowPolicy: 'explicit failure',
		rows,
		retainedBlockCount: packedOffset,
		retainedZenithIndices: [...new Set(rows.flatMap((row) => Array.from(
			{length: row.retainedZenith.count},
			(_unused, offset) => row.retainedZenith.firstIndex + offset,
		)))],
	};
}
