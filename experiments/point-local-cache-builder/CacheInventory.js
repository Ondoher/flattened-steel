import Ledger from '../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {
	SpectralBasis,
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_SAMPLE_SEMANTICS,
} from '../../src/algorithm32/spectral-values/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {
	NATIVE_48_POSITION_DOMAIN_OWNER as positionDomain,
	SOLAR_ZENITH_180_DOMAIN_OWNER as solarZenithDomain,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as outgoingDirectionDomain,
} from '../../src/algorithm32/sampling-domains/index.js';

/** Input-driven adaptation of the production coordinate union and block planner. */
export default class CacheInventory {
	/** Call this method to plan scene ledgers and a shared inventory without computing radiance.
	 * Unsupported domains, invalid scenes, or incompatible spectral selections reject before GPU work.
	 * @param {DistantSunSceneCacheCompilerBuildRequest} buildRequest - Explicit physical and numerical inputs.
	 * @param {BuilderScene[]} requests - Arbitrary-length scene list, retaining order and duplicates.
	 * @param {number[]} wavelengths - Spectral indices to materialize in order.
	 * @returns {BuilderInventory} - Shared coordinates, block ownership, and scene reconstruction indexes.
	 */
	create(buildRequest, requests, wavelengths) {
		const spec = buildRequest.transportSpec;
		const domains = spec.domains;
		if (
			spec.shaderProfile?.coordinateContract !== 'scene-cache-receiver-local-v1' ||
			spec.numerical.maximumScatteringOrder !== 4
		)
			throw new Error('The current compiler requires receiver-local N4.');
		if (
			domains.position.count !== positionDomain.count ||
			domains.solarZenith.count !== solarZenithDomain.count ||
			domains.outgoing.directionCount !== outgoingDirectionDomain.directionCount ||
			domains.outgoing.faceWidth !== outgoingDirectionDomain.faceWidth ||
			JSON.stringify(domains.position.nodes.map((n) => n.altitudeMeters)) !==
				JSON.stringify(positionDomain.nodes.map((n) => n.coordinate.value)) ||
			JSON.stringify(domains.solarZenith.nodes.map((n) => n.muS)) !==
				JSON.stringify(solarZenithDomain.nodes.map((n) => n.muS)) ||
			JSON.stringify(domains.solarZenith.nodes.map((n) => n.solarZenithDegrees)) !==
				JSON.stringify(solarZenithDomain.nodes.map((n) => 0.5 + n.index)) ||
			JSON.stringify(domains.outgoing.unitVectors) !== JSON.stringify(outgoingDirectionDomain.unitVectors)
		)
			throw new Error('Requested domains need matching executable ledger and seam owners.');
		const ozone = spec.atmosphere.ozone;
		if (!ozone.absorptionEnabled && ozone.crossSectionTable.values.some((value) => value !== 0))
			throw new Error('Disabled ozone requires zero absorption coefficients in the compiler inputs.');
		if (
			domains.incoming.directionCount !== domains.incoming.unitVectors.length ||
			domains.incoming.directionCount !== domains.incoming.integrationWeightsSteradians.length
		)
			throw new Error('Incoming quadrature shape is inconsistent.');
		if (
			!requests.length ||
			!wavelengths.length ||
			new Set(wavelengths).size !== wavelengths.length ||
			wavelengths.some((w) => !Number.isInteger(w) || w < 0 || w >= domains.spectrum.channels.length)
		)
			throw new Error('Invalid scenes or wavelengths.');
		const coordinatesByKey = new Map();
		const spectralBasis =
			domains.spectrum.id === NATIVE_15_SPECTRAL_BASIS.id
				? NATIVE_15_SPECTRAL_BASIS
				: new SpectralBasis({
						id: domains.spectrum.id,
						schemaRevision: SPECTRAL_BASIS_SCHEMA_REVISION,
						semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
						channels: domains.spectrum.channels.map((channel) => ({
							id: channel.id,
							center: {value: channel.centerNanometers, units: 'nanometers'},
							width: {value: channel.binWidthNanometers, units: 'nanometers'},
						})),
					});
		const scenes = requests.map((request, ordinal) => {
			if (
				!request.id ||
				!Number.isFinite(request.zenithDegrees) ||
				request.zenithDegrees < 0 ||
				request.zenithDegrees > 180 ||
				!Number.isFinite(request.observerAltitudeMeters) ||
				request.observerAltitudeMeters < 0 ||
				request.observerAltitudeMeters >= spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters
			)
				throw new Error('Invalid scene support.');
			const angle = (request.zenithDegrees * Math.PI) / 180;
			const ledger = new Ledger({
				positionDomain,
				solarZenithDomain,
				outgoingDirectionDomain,
				spectralBasis,
				sceneSun: {
					id: request.id,
					instant: request.time ?? 'explicit-scene-input',
					sourceIdentity: spec.source.id,
					directionToSourceUpEastNorth: [Math.cos(angle), Math.sin(angle), 0],
				},
				support: {
					id: request.id,
					bottomRadius: {value: spec.planet.bottomRadiusMeters, units: 'meters'},
					topRadius: {value: spec.planet.topRadiusMeters, units: 'meters'},
					observerAltitude: {value: request.observerAltitudeMeters, units: 'meters'},
					observerSolarZenith: {value: angle, units: 'radians'},
					completeCameraRotation: true,
					arbitraryShortenedEndpoint: true,
				},
			}).toRecord();
			const keys = [];
			for (const row of ledger.rows)
				for (let z = row.firstSolarZenithIndex; z <= row.lastSolarZenithIndex; z++) {
					const key = `${row.altitudeIndex}:${z}`;
					coordinatesByKey.set(key, [row.altitudeIndex, z]);
					keys.push(key);
				}
			return {ordinal, request, ledger, keys, indexes: []};
		});
		const coordinates = [...coordinatesByKey.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
		const indexByKey = new Map(coordinates.map((coordinate, index) => [coordinate.join(':'), index]));
		for (const scene of scenes) scene.indexes = scene.keys.map((key) => indexByKey.get(key));
		const rows = [];
		for (const [index, [a, z]] of coordinates.entries()) {
			const prior = rows.at(-1);
			if (prior && prior.altitudeIndex === a && prior.lastSolarZenithIndex + 1 === z) {
				prior.lastSolarZenithIndex = z;
				prior.packedRowCount++;
			} else
				rows.push({
					altitudeIndex: a,
					altitude: positionDomain.nodes[a].coordinate,
					firstSolarZenithIndex: z,
					lastSolarZenithIndex: z,
					firstPackedRow: index,
					packedRowCount: 1,
				});
		}
		const directionBytes = Buffer.from(outgoingDirectionDomain.logicalToUniqueDirectionIndices.buffer);
		const uniqueCount = outgoingDirectionDomain.uniqueDirectionCount;
		const maximumRows = Math.floor((16 * 1024 * 1024) / (uniqueCount * wavelengths.length * 4));
		if (maximumRows < 1) throw new Error('Spectrum exceeds one bounded codec row.');
		const groups = new Map();
		for (const coordinate of coordinates) {
			const key = `${Math.floor(coordinate[0] / 8)}:${Math.floor(coordinate[1] / 8)}`;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push(coordinate);
		}
		const blocks = [];
		for (const group of groups.values())
			for (let start = 0; start < group.length; start += maximumRows)
				blocks.push({coordinates: group.slice(start, start + maximumRows)});
		return {
			buildRequest,
			scenes,
			coordinates,
			blocks,
			directionBytes,
			uniqueCount,
			directionCount: domains.outgoing.directionCount,
			channelCount: wavelengths.length,
			wavelengths,
			unionLedger: {...scenes[0].ledger, rows, retainedBlockCount: coordinates.length},
		};
	}
}
