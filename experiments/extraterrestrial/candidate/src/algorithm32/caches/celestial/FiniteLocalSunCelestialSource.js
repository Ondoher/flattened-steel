import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	assertSpectralPacket,
	createSpectralPacket,
} from '../../quantities/index.js';
import DistanceMath from '../../utils/DistanceMath.js';
import { createCacheBuildModule } from '../gpu/cacheBuildContracts.js';

/**
 * Source-owned definition of a finite, uniform local Sun.
 *
 * The simulator supplies this object's radius and surface radiance. Geometry
 * supplies the evaluated center, receiver-relative support, and visibility.
 */
export class FiniteLocalSunCelestialSource {
	constructor({ sourceId = 'local-sun', surfaceRadiance, radius, spectralBasis }) {
		if (typeof sourceId !== 'string' || sourceId.length === 0) {
			throw new TypeError('Finite local Sun requires a sourceId.');
		}
		DistanceMath.assertDistance(radius, 'Finite local Sun radius');
		const radiusMeters = DistanceMath.toMeters(radius);
		if (!(radiusMeters > 0)) {
			throw new RangeError('Finite local Sun radius must be positive.');
		}
		this.sourceId = sourceId;
		this.radius = DistanceMath.inMeters(radiusMeters);
		this.surfaceRadiance = assertSpectralPacket(surfaceRadiance, {
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			basis: spectralBasis,
		});
	}

	describeStaticIdentity() {
		return {
			sourceId: this.sourceId,
			kind: 'finite-uniform-disk',
			radius: this.radius,
			surfaceRadianceHash: this.surfaceRadiance.contentHash,
		};
	}

	/** Return a portable source fragment; geometry attaches live placement. */
	buildCacheFragments() {
		return [{
			sourceId: this.sourceId,
			kind: 'finite-uniform-disk',
			composition: 'additive',
			localFrame: 'flat-local-source-body-v1',
			anchor: [0, 0, 0],
			relativeOffset: [0, 0],
			width: 1,
			height: 1,
			channelCount: this.surfaceRadiance.basis.channelCount,
			sourceRadiance: {
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				contentHash: this.surfaceRadiance.contentHash,
				values: [...this.surfaceRadiance.values],
			},
			support: {
				kind: 'finite-uniform-disk',
				radius: this.radius,
			},
		}];
	}

	/**
	 * Render the source-owned radiance into the geometry-owned R32F cache.
	 * Placement is deliberately absent: it is a live geometry transform rather
	 * than a physical-field invalidation input.
	 */
	createCacheBuildModule({ channelCount }) {
		if (channelCount !== this.surfaceRadiance.basis.channelCount) {
			throw new RangeError('Finite local Sun cache channel count must match its spectral basis.');
		}
		return createCacheBuildModule({
			id: `flat-finite-sun-${this.sourceId}-radiance-module-v1`,
			owner: 'lightSource',
			provides: ['lightSource.finiteCelestialRadiance'],
			requires: [],
			bindings: [{
				spec: {
					id: `flat-finite-sun-${this.sourceId}-radiance`,
					name: 'uFlatFiniteSunSurfaceRadiance',
					kind: 'uniform',
					shaderType: `float[${channelCount}]`,
					frequency: 'build',
				},
				value: this.surfaceRadiance,
			}],
			blocks: [{
				id: `flat-finite-sun-${this.sourceId}-radiance-main`,
				phase: 'main',
				order: 0,
				source: 'a32CacheOutput = uFlatFiniteSunSurfaceRadiance[a32CacheWavelengthLayer];',
			}],
		});
	}

	/**
	 * Integrate this uniform source over one geometry-resolved apparent disk.
	 * Steradians are dimensionless in the represented spectral units.
	 */
	resolveDirectIllumination(placement) {
		if (!placement || placement.sourceId !== this.sourceId) {
			throw new TypeError('Finite local Sun illumination requires its geometry placement.');
		}
		if (!(placement.visibleSolidAngleSteradians >= 0)) {
			throw new RangeError('Finite local Sun placement requires visible solid angle.');
		}
		return createSpectralPacket({
			basis: this.surfaceRadiance.basis,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			values: this.surfaceRadiance.values.map(
				(value) => value * placement.visibleSolidAngleSteradians,
			),
			provenanceIdentity: `finite-local-sun-solid-angle:${this.sourceId}:${this.surfaceRadiance.contentHash}:${placement.transformFingerprint}`,
		});
	}
}

export default FiniteLocalSunCelestialSource;
