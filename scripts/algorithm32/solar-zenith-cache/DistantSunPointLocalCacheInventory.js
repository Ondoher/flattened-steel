import DistantSunSceneCacheLedger from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../src/algorithm32/sampling-domains/index.js';
import {
	SpectralBasis,
	SPECTRAL_BASIS_SCHEMA_REVISION,
	SPECTRAL_SAMPLE_SEMANTICS,
} from '../../../src/algorithm32/spectral-values/index.js';

export const DISTANT_SUN_POINT_LOCAL_MAXIMUM_DECODED_BLOCK_BYTES = 16 * 1024 * 1024;
export const DISTANT_SUN_POINT_LOCAL_MAXIMUM_ENCODED_BLOCK_BYTES = 17 * 1024 * 1024;
const BLOCK_AXIS_SIZE = 8;

function sameValues(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

/** Production planner for one input-driven receiver-local cache inventory. */
export default class DistantSunPointLocalCacheInventory {
	/**
	 * Plan the interpolation-closed union for an ordered scene list and spectral selection.
	 * Invalid physical domains, scenes, or selections reject before GPU execution.
	 *
	 * @param {DistantSunSceneCacheCompilerBuildRequest} buildRequest - Complete physical and numerical compiler input.
	 * @param {DistantSunPointLocalScene[]} requests - Ordered nonempty scene list; duplicates remain distinct consumers.
	 * @param {number[]} wavelengths - Unique indexes into the request's spectral basis.
	 * @returns {DistantSunPointLocalInventory} - Shared coordinates, bounded blocks, and scene reconstruction indexes.
	 */
	create(buildRequest, requests, wavelengths) {
		const spec = buildRequest?.transportSpec;
		const domains = spec?.domains;
		if (
			spec?.shaderProfile?.coordinateContract !== 'scene-cache-receiver-local-v1' ||
			spec?.numerical?.maximumScatteringOrder !== 4
		) {
			throw new RangeError('Point-local compilation requires the receiver-local cumulative J4 contract.');
		}
		if (
			domains?.position?.count !== NATIVE_48_POSITION_DOMAIN_OWNER.count ||
			domains?.solarZenith?.count !== SOLAR_ZENITH_180_DOMAIN_OWNER.count ||
			domains?.outgoing?.directionCount !== CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount ||
			domains?.outgoing?.faceWidth !== CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faceWidth ||
			!sameValues(
				domains.position.nodes.map((node) => node.altitudeMeters),
				NATIVE_48_POSITION_DOMAIN_OWNER.nodes.map((node) => node.coordinate.value),
			) ||
			!sameValues(
				domains.solarZenith.nodes.map((node) => node.muS),
				SOLAR_ZENITH_180_DOMAIN_OWNER.nodes.map((node) => node.muS),
			) ||
			!sameValues(
				domains.solarZenith.nodes.map((node) => node.solarZenithDegrees),
				SOLAR_ZENITH_180_DOMAIN_OWNER.nodes.map((node) => node.index + 0.5),
			) ||
			!sameValues(domains.outgoing.unitVectors, CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors)
		) {
			throw new RangeError('Point-local compilation requires the production Native48/Z180/W27 domains.');
		}
		if (
			domains.incoming.directionCount !== domains.incoming.unitVectors.length ||
			domains.incoming.directionCount !== domains.incoming.integrationWeightsSteradians?.length
		) {
			throw new RangeError('Point-local incoming-direction vectors and integration weights disagree.');
		}
		const ozone = spec.atmosphere?.ozone;
		if (!ozone || (!ozone.absorptionEnabled && ozone.crossSectionTable.values.some((value) => value !== 0))) {
			throw new RangeError('Disabled ozone requires an explicit zero cross-section table.');
		}
		if (
			!Array.isArray(requests) ||
			requests.length === 0 ||
			!Array.isArray(wavelengths) ||
			wavelengths.length === 0 ||
			new Set(wavelengths).size !== wavelengths.length ||
			wavelengths.some(
				(index) => !Number.isInteger(index) || index < 0 || index >= domains.spectrum.channels.length,
			)
		) {
			throw new RangeError('Point-local compilation requires scenes and unique in-range wavelength indexes.');
		}

		const spectralBasis = this._spectralBasis(domains.spectrum);
		const coordinatesByKey = new Map();
		const scenes = requests.map((request, ordinal) => {
			this._requireScene(request, spec);
			const observerSolarZenithRadians = (request.zenithDegrees * Math.PI) / 180;
			const ledger = new DistantSunSceneCacheLedger({
				positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
				solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
				outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
				spectralBasis,
				sceneSun: {
					id: request.id,
					instant: request.instant ?? 'explicit-point-local-scene',
					sourceIdentity: spec.source.id,
					directionToSourceUpEastNorth: [
						Math.cos(observerSolarZenithRadians),
						Math.sin(observerSolarZenithRadians),
						0,
					],
				},
				support: {
					id: request.id,
					bottomRadius: {value: spec.planet.bottomRadiusMeters, units: 'meters'},
					topRadius: {value: spec.planet.topRadiusMeters, units: 'meters'},
					observerAltitude: {value: request.observerAltitudeMeters, units: 'meters'},
					observerSolarZenith: {value: observerSolarZenithRadians, units: 'radians'},
					completeCameraRotation: true,
					arbitraryShortenedEndpoint: true,
				},
			}).toRecord();
			const keys = [];
			for (const row of ledger.rows) {
				for (let zenith = row.firstSolarZenithIndex; zenith <= row.lastSolarZenithIndex; zenith += 1) {
					const key = `${row.altitudeIndex}:${zenith}`;
					coordinatesByKey.set(key, [row.altitudeIndex, zenith]);
					keys.push(key);
				}
			}
			return {ordinal, request: {...request}, ledger, keys, indexes: []};
		});

		const coordinates = [...coordinatesByKey.values()].sort(
			(left, right) => left[0] - right[0] || left[1] - right[1],
		);
		const indexByKey = new Map(coordinates.map((coordinate, index) => [coordinate.join(':'), index]));
		for (const scene of scenes) scene.indexes = scene.keys.map((key) => indexByKey.get(key));

		const rows = [];
		for (const [packedIndex, [altitudeIndex, solarZenithIndex]] of coordinates.entries()) {
			const prior = rows.at(-1);
			if (prior && prior.altitudeIndex === altitudeIndex && prior.lastSolarZenithIndex + 1 === solarZenithIndex) {
				prior.lastSolarZenithIndex = solarZenithIndex;
				prior.packedRowCount += 1;
			} else {
				rows.push({
					altitudeIndex,
					altitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[altitudeIndex].coordinate,
					firstSolarZenithIndex: solarZenithIndex,
					lastSolarZenithIndex: solarZenithIndex,
					firstPackedRow: packedIndex,
					packedRowCount: 1,
				});
			}
		}

		const directionMap = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices;
		const directionBytes = Buffer.from(directionMap.buffer, directionMap.byteOffset, directionMap.byteLength);
		const uniqueDirectionCount = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.uniqueDirectionCount;
		const maximumRowsPerBlock = Math.floor(
			DISTANT_SUN_POINT_LOCAL_MAXIMUM_DECODED_BLOCK_BYTES /
				(uniqueDirectionCount * wavelengths.length * Float32Array.BYTES_PER_ELEMENT),
		);
		if (maximumRowsPerBlock < 1) throw new RangeError('The selected spectrum exceeds one bounded cache row.');
		const groups = new Map();
		for (const coordinate of coordinates) {
			const tile = {
				altitudeIndex: Math.floor(coordinate[0] / BLOCK_AXIS_SIZE) * BLOCK_AXIS_SIZE,
				solarZenithIndex: Math.floor(coordinate[1] / BLOCK_AXIS_SIZE) * BLOCK_AXIS_SIZE,
			};
			const key = `${tile.altitudeIndex}:${tile.solarZenithIndex}`;
			if (!groups.has(key)) groups.set(key, {tile, coordinates: []});
			groups.get(key).coordinates.push(coordinate);
		}
		const blocks = [];
		for (const group of groups.values()) {
			for (let start = 0; start < group.coordinates.length; start += maximumRowsPerBlock) {
				blocks.push({
					tile: group.tile,
					coordinates: group.coordinates.slice(start, start + maximumRowsPerBlock),
				});
			}
		}

		return {
			buildRequest,
			scenes,
			coordinates,
			blocks,
			directionBytes,
			uniqueDirectionCount,
			logicalDirectionCount: domains.outgoing.directionCount,
			channelCount: wavelengths.length,
			wavelengths: [...wavelengths],
			maximumDecodedBlockBytes: DISTANT_SUN_POINT_LOCAL_MAXIMUM_DECODED_BLOCK_BYTES,
			maximumEncodedBlockBytes: DISTANT_SUN_POINT_LOCAL_MAXIMUM_ENCODED_BLOCK_BYTES,
			unionLedger: {...scenes[0].ledger, rows, retainedBlockCount: coordinates.length},
		};
	}

	_spectralBasis(spectrum) {
		if (spectrum.id === NATIVE_15_SPECTRAL_BASIS.id) return NATIVE_15_SPECTRAL_BASIS;
		return new SpectralBasis({
			id: spectrum.id,
			schemaRevision: SPECTRAL_BASIS_SCHEMA_REVISION,
			semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
			channels: spectrum.channels.map((channel) => ({
				id: channel.id,
				center: {value: channel.centerNanometers, units: 'nanometers'},
				width: {value: channel.binWidthNanometers, units: 'nanometers'},
			})),
		});
	}

	_requireScene(request, spec) {
		const atmosphereHeightMeters = spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters;
		if (
			!request ||
			typeof request.id !== 'string' ||
			request.id.length === 0 ||
			!Number.isFinite(request.zenithDegrees) ||
			request.zenithDegrees < 0 ||
			request.zenithDegrees > 180 ||
			!Number.isFinite(request.observerAltitudeMeters) ||
			request.observerAltitudeMeters < 0 ||
			request.observerAltitudeMeters >= atmosphereHeightMeters
		) {
			throw new RangeError('Point-local scene support is outside the spherical atmosphere.');
		}
	}
}
