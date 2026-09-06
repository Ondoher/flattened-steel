import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, assertSpectralPacket, createSpectralPacket } from '../../quantities/index.js';
import { createCacheBuildModule } from '../gpu/cacheBuildContracts.js';

/** Independent distant-Sun source definition that returns portable cache fragments. */
export class DistantSunCelestialSource {
	constructor({ sourceId = 'sun', atmosphericSun, spectralBasis }) {
		if (typeof sourceId !== 'string' || sourceId.length === 0) throw new TypeError('Distant Sun source requires sourceId.');
		if (!atmosphericSun?.configuration || typeof atmosphericSun.describe !== 'function') throw new TypeError('Distant Sun source requires an atmospheric light source.');
		const irradiance = assertSpectralPacket(atmosphericSun.configuration.sourceIrradiance, { quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, basis: spectralBasis });
		const angularRadiusRadians = atmosphericSun.configuration.angularRadius?.value;
		if (!(angularRadiusRadians > 0 && angularRadiusRadians < Math.PI / 2)) throw new RangeError('Distant Sun requires positive angular radius.');
		const solidAngle = 2 * Math.PI * (1 - Math.cos(angularRadiusRadians));
		this.sourceId = sourceId;
		this.atmosphericSun = atmosphericSun;
		this.radiance = createSpectralPacket({ basis: spectralBasis, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: irradiance.values.map((value) => value / solidAngle), provenanceIdentity: `distant-sun-fragment:${sourceId}:${irradiance.contentHash}` });
		this.angularRadiusRadians = angularRadiusRadians;
	}

	describeStaticIdentity() { return { sourceId: this.sourceId, kind: 'uniform-disk', radianceHash: this.radiance.contentHash, angularRadiusRadians: this.angularRadiusRadians }; }
	buildCacheFragments() { return [{ sourceId: this.sourceId, kind: 'uniform-disk', composition: 'additive', localFrame: 'canonical-celestial-sphere-v1', anchor: [0, 0, 1], relativeOffset: [0, 0], width: 1, height: 1, channelCount: this.radiance.basis.channelCount, sourceRadiance: { quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, contentHash: this.radiance.contentHash, values: [...this.radiance.values] }, support: { kind: 'uniform-disk', angularRadiusRadians: this.angularRadiusRadians } }]; }

	/** Contribute source radiometry to a geometry-assembled celestial render pass. */
	createCacheBuildModule({ channelCount }) {
		if (channelCount !== this.radiance.basis.channelCount) throw new RangeError('Celestial source channel count must match its spectral basis.');
		return createCacheBuildModule({
			id: `primary-celestial-${this.sourceId}-uniform-disk-module-v1`,
			owner: 'lightSource',
			provides: ['lightSource.celestialRadiance'],
			requires: ['atmosphere.celestialPathTransmittance', 'geometry.celestialBuildCoordinates'],
			bindings: [{
				spec: { id: `primary-celestial-${this.sourceId}-radiance`, name: 'uPrimaryCelestialSourceRadiance', kind: 'uniform', shaderType: `float[${channelCount}]`, frequency: 'build' },
				value: this.radiance,
			}],
			blocks: [{
				id: `primary-celestial-${this.sourceId}-uniform-disk-main`, phase: 'main', order: 0,
				source: `int directionIndex = int(gl_FragCoord.x);
int positionIndex = int(gl_FragCoord.y);
vec3 receiverPositionMeters = celestialCachePosition(positionIndex);
vec3 directionToSource = celestialCacheDirection(positionIndex, directionIndex);
a32CacheOutput = celestialCacheRayBlockedByGround(receiverPositionMeters, directionToSource)
	? 0.0
	: uPrimaryCelestialSourceRadiance[a32CacheWavelengthLayer]
		* celestialCachePathTransmittance(
			receiverPositionMeters,
			directionToSource,
			a32CacheWavelengthLayer
		);`,
			}],
		});
	}
}

export default DistantSunCelestialSource;
