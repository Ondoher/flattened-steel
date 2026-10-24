import {CanonicalAtmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {DistantSunPointLocalCacheAerosolOptics as Aerosols} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheAerosolOptics.js';
import {interpolate, densityShader} from './profile-sampling.mjs';

/** Experiment-only factorized vertical aerosol reconstruction shared by CPU, view and celestial transport. */
export class ArmAtmosphere extends CanonicalAtmosphere {
	/** @param {any} profile - Frozen, provenance-backed model contract. */
	constructor(profile) {
		const base = new CanonicalAtmosphere();
		const extinction = base._createAtmospherePacket('spectral-extinction-coefficient', 'm^-1', profile.mie, 'arm-surface-extinction');
		super({constants: {...base.constants, mieSingleScatteringAlbedo: profile.albedo},
			seaLevelRayleighScattering: /** @type {SpectralScatteringCoefficientPacket} */(base.seaLevelRayleighScattering),
			seaLevelMieExtinction: /** @type {any} */(extinction)});
		this.profile = profile;
	}
	/** Replace only the aerosol density; keep the canonical molecular profile. */
	_exponentialDensity(height, scaleHeight) {
		if (this.profile && scaleHeight === this.constants.mieScaleHeight.value)
			return interpolate(this.profile.altitudesMeters, this.profile.extinction550PerMeter, height) / this.profile.extinction550PerMeter[0];
		return super._exponentialDensity(height, scaleHeight);
	}
	/** Same scalar conditional phase in CPU and construction. */
	_miePhaseFunction(g, cosine) {
		if (!this.profile) return super._miePhaseFunction(g, cosine);
		return interpolate(this.profile.phase.mu, this.profile.phase.pdf, cosine) / (2 * Math.PI);
	}
	/** Live view-path sampling uses the same height table as the offline compiler. */
	_runtimeMediumBlock() {
		const source = super._runtimeMediumBlock();
		if (!source.includes('exp(-altitudeMeters / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS)')) throw Error('Runtime medium changed');
		return densityShader(this.profile) + '\n' + source.replaceAll('exp(-altitudeMeters / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS)', 'armAerosolDensity(altitudeMeters)');
	}
	/** Celestial/direct-source cache paths must not retain the exponential aerosol profile. */
	_cacheMediumBlock(usesAltitudeScalar = false) {
		const source = super._cacheMediumBlock(usesAltitudeScalar);
		if (!source.includes('/ uCacheMieScaleHeight)')) throw Error('Celestial medium changed');
		return densityShader(this.profile) + '\n' + source.replace(/exp\(-([^;\n]+) \/ uCacheMieScaleHeight\)/gu, 'armAerosolDensity($1)');
	}
	/** Preserve the parent cache contract and replace its scalar phase evaluator. */
	createCacheModule(context) {
		const module = super.createCacheModule(context);
		return {...module, blocks: module.blocks.map(block => {
			if (block.id !== 'canonical-atmosphere-cache-phase') return block;
			const phase = Aerosols.createShaderSource(this.profile.phase).replace('float miePhase(', 'float cacheMiePhase(').replace('2.0*PI', '2.0*CACHE_PI');
			return {...block, source: block.source.replace(/float cacheMiePhase\([\s\S]+$/u, phase)};
		})};
	}
}
