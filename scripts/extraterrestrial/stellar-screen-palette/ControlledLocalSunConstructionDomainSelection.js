import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
} from '../candidate/src/algorithm32/domains/consts.js';
import LocalSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/LocalSunConstructionDomainSelection.js';
import LocalSunFieldPacking from
	'../candidate/src/algorithm32/light-sources/LocalSunFieldPacking.js';
import {NATIVE_15_SPECTRAL_BASIS} from
	'../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN,
	REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE,
} from './ReflectionCompletedFibonacci68Control.js';

export const CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY = Object.freeze({
	id: 'contained-local-sun-reflection-completed-fibonacci68-domain-injection-v1',
	operation:
		'Keep the candidate local-Sun z-by-rho position domain, W27 outgoing domain, native-15 basis, construction graph, and runtime publication; replace only the paired-Fibonacci-34 incoming quadrature and its direction-fastest radiance packing with the contained reflection-completed ordinary-Fibonacci-68 control.',
	incomingPolicyId:
		REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_PROVENANCE.policyId,
	runtimeDependencyPolicy:
		'Imports resolve only to scripts/extraterrestrial/candidate and scripts/extraterrestrial/stellar-screen-palette; production src/algorithm32 is provenance-only and is not a runtime dependency.',
});

/**
 * Adapt the immutable candidate local-Sun selection at its existing domain
 * seam. The superclass establishes all candidate-compatible position,
 * outgoing, spectral, and packing contracts; this contained subclass replaces
 * only the incoming quadrature and the packing whose fastest extent depends on
 * it.
 */
export class ControlledLocalSunConstructionDomainSelection extends
	LocalSunConstructionDomainSelection {
	constructor(definition) {
		super({
			...definition,
			outgoingDirectionDomainOwner:
				CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		});

		const incoming = REFLECTION_COMPLETED_FIBONACCI_68_CONTROL_DOMAIN;
		this.incomingDirectionDomain = incoming.descriptor;
		this.incomingUnitVectors = incoming.unitVectors;
		this.incomingIntegrationWeights = incoming.integrationWeights;
		this.incomingDirectionCount = incoming.directionCount;
		this.radiancePacking = new LocalSunFieldPacking({
			id: definition.radiancePackingId,
			directionCount: this.incomingDirectionCount,
			positionCount: this.positionCount,
			wavelengthCount: this.spectralChannelCount,
		});
		this.controlPolicy = CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY;
	}

	/**
	 * Derive the control from the same geometry-owned z-by-rho lattice used by
	 * the candidate selection. Optional counts exist only for bounded proof
	 * construction; the default remains the candidate production grid.
	 */
	static fromGeometry(geometry, options = {}) {
		const positionDomainOwner = geometry.createLocalSunCachePositionDomain({
			...(options.zCount === undefined
				? {}
				: {zCount: options.zCount}),
			...(options.rhoCount === undefined
				? {}
				: {rhoCount: options.rhoCount}),
		});
		const gridIdentity =
			`z${positionDomainOwner.zCount}-rho${positionDomainOwner.rhoCount}`;

		return new ControlledLocalSunConstructionDomainSelection({
			id: options.id
				?? `contained-local-sun-${gridIdentity}-reflection-completed-fibonacci68-w27-control-v1`,
			positionDomainOwner,
			outgoingDirectionDomainOwner:
				CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			radiancePackingId: options.radiancePackingId
				?? `contained-local-sun-${gridIdentity}-reflection-completed-fibonacci68-radiance-packing-control-v1`,
			scatteringDensityPackingId:
				options.scatteringDensityPackingId
					?? `contained-local-sun-${gridIdentity}-w27-scattering-density-packing-control-v1`,
		});
	}
}
