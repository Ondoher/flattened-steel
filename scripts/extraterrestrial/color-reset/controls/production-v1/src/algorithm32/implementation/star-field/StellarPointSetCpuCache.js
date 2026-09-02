import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {STELLAR_POINT_SET_CACHE_LAYOUT} from './consts.js';

/** Complete binary64 transported stellar point-set field in production member order. */
export class StellarPointSetCpuCache {
	/** @type {StellarPointSetCacheDescriptor} */
	descriptor;
	/** @type {Float64Array} */
	_values;

	/** @param {Readonly<{model: SharedModel, domain: CelestialContributionDomainDescription, placement: Extract<CelestialResolvedPlacement, {readonly kind: 'static-stellar-point-set'}>, source: StellarPointSetCelestialSource & CelestialSourceProvider}>} request */
	constructor(request) {
		const {model, domain, placement, source} = request ?? {};
		const geometry = /** @type {GeometryModel & CelestialGeometryCapability} */ (model?.geometry);
		if (typeof geometry?.createCelestialBuildSample !== 'function') {
			throw new TypeError('Stellar point-set CPU construction requires celestial geometry.');
		}
		if (source?.kind !== 'static-stellar-point-set' || placement?.sourceId !== source.id || placement.kind !== source.kind) {
			throw new RangeError('Stellar point-set CPU placement must match its source.');
		}
		const roster = model.celestialSources;
		if (roster?.family !== 'spherical-sun-stars-radial-v1' || !Object.is(roster.stars, source)) {
			throw new RangeError('Stellar point-set CPU source must be the configured spherical roster source.');
		}
		const geometryDomain = geometry.describeCelestialContributionDomain();
		if (domain?.contentHash !== geometryDomain.contentHash) {
			throw new RangeError('Stellar point-set CPU domain does not match its geometry owner.');
		}
		const layout = STELLAR_POINT_SET_CACHE_LAYOUT;
		if (domain.directionCoordinates.length !== layout.directionCount || domain.altitudeNodes.length !== layout.receiverCount) {
			throw new RangeError('Stellar point-set CPU construction requires the exact 11 by 13 domain.');
		}
		const members = source.celestialSourceDefinition.members;
		if (members.length !== layout.memberCount || members.some((member) => member.spectralIrradiance.values.length !== layout.channelCount)) {
			throw new RangeError('Stellar point-set CPU construction requires 500 native-15 members.');
		}

		const sourceIdentity = source.describeCelestialSourceIdentity();
		const descriptorFacts = {
			id: 'algorithm32-stellar-point-set-tiled-cache-v1',
			sourceId: source.id,
			domainIdentity: domain.contentHash,
			storage: layout.storage,
			channelCount: layout.channelCount,
			memberCount: layout.memberCount,
			quantity: /** @type {const} */ ('spectral-irradiance-density'),
			units: /** @type {const} */ ('W m^-2 nm^-1'),
			valueKey: /** @type {const} */ ('cache.celestial.starTransport'),
			sourceIdentity,
			atmosphereIdentity: CanonicalValueHash.sha256Value({
				id: model.atmosphere.id,
				spectralBasis: model.atmosphere.spectralBasis.contentHash,
				intervalCount: model.profile.numerical.sourcePathTransmittance.intervalCount,
			}),
		};
		this.descriptor = Object.freeze({
			...descriptorFacts,
			storage: Object.freeze({...descriptorFacts.storage}),
			contentHash: CanonicalValueHash.sha256Value(descriptorFacts),
		});
		this._values = new Float64Array(layout.storage.width * layout.storage.height * layout.storage.layers);

		const transmittance = new Float64Array(layout.receiverCount * layout.directionCount * layout.channelCount);
		for (let receiverIndex = 0; receiverIndex < layout.receiverCount; receiverIndex += 1) {
			for (let directionIndex = 0; directionIndex < layout.directionCount; directionIndex += 1) {
				const sample = geometry.createCelestialBuildSample({domain, placement, receiverIndex, directionIndex});
				if (!sample.supported) continue;
				const opticalDepth = model.atmosphere.integrateOpticalDepth(sample.sourcePath);
				if (opticalDepth.blockedByGround) {
					throw new RangeError('Supported stellar geometry sample produced ground-blocked transmittance.');
				}
				for (let channelIndex = 0; channelIndex < layout.channelCount; channelIndex += 1) {
					const value = opticalDepth.transmittance.values[channelIndex];
					if (!Number.isFinite(value) || value < 0 || value > 1) {
						throw new RangeError('Stellar point-set transmittance must be finite and within [0, 1].');
					}
					transmittance[(receiverIndex * layout.directionCount + directionIndex) * layout.channelCount + channelIndex] = value;
				}
			}
		}

		for (const [memberIndex, member] of members.entries()) {
			const tileX = memberIndex % layout.tileColumns;
			const tileY = Math.floor(memberIndex / layout.tileColumns);
			for (let receiverIndex = 0; receiverIndex < layout.receiverCount; receiverIndex += 1) {
				for (let directionIndex = 0; directionIndex < layout.directionCount; directionIndex += 1) {
					for (let channelIndex = 0; channelIndex < layout.channelCount; channelIndex += 1) {
						const transport = transmittance[(receiverIndex * layout.directionCount + directionIndex) * layout.channelCount + channelIndex];
						const value = member.spectralIrradiance.values[channelIndex] * transport;
						if (!Number.isFinite(value) || value < 0) throw new RangeError('Stellar transported irradiance must be finite and nonnegative.');
						const x = tileX * layout.directionCount + directionIndex;
						const y = tileY * layout.receiverCount + receiverIndex;
						this._values[(channelIndex * layout.storage.height + y) * layout.storage.width + x] = value;
					}
				}
			}
		}
	}

	/** Return a binary32 layer-major copy suitable for the accepted R32F representation. */
	packedValues() {
		return new Float32Array(this._values);
	}

	/** Read one logical member/domain scalar from the complete binary64 field. */
	readScalar({memberIndex, directionIndex, receiverIndex, wavelengthIndex}) {
		const layout = STELLAR_POINT_SET_CACHE_LAYOUT;
		if (![memberIndex, directionIndex, receiverIndex, wavelengthIndex].every(Number.isInteger)) throw new TypeError('Stellar cache coordinates must be integers.');
		if (memberIndex < 0 || memberIndex >= layout.memberCount || directionIndex < 0 || directionIndex >= layout.directionCount || receiverIndex < 0 || receiverIndex >= layout.receiverCount || wavelengthIndex < 0 || wavelengthIndex >= layout.channelCount) throw new RangeError('Stellar cache coordinate is outside the logical field.');
		const x = (memberIndex % layout.tileColumns) * layout.directionCount + directionIndex;
		const y = Math.floor(memberIndex / layout.tileColumns) * layout.receiverCount + receiverIndex;
		return this._values[(wavelengthIndex * layout.storage.height + y) * layout.storage.width + x];
	}
}
