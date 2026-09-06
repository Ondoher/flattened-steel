import {
	createDirectionalSpectralFieldDescriptor,
	DIRECTION_DOMAIN_ROLES,
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
} from '../caches/DirectionalSpectralFieldDescriptor.js';
import { CpuDirectionalSpectralField } from '../caches/CpuDirectionalSpectralField.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../profiles/native-15-profile.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
} from './consts.js';

/**
 * Create one source-owned binary64 CPU field from accepted field metadata.
 *
 * @param {DistantSunCpuFieldBuildDefinition} definition - Supplies the
 * normalized physical descriptor and executable packing.
 * @returns {CpuDirectionalSpectralFieldContract} Return mutable CPU field storage.
 */
function createField(definition) {
	const domainSelection = definition.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const packing = definition.packing;
	const descriptor = /** @type {CpuDirectionalSpectralFieldDescriptor} */ (createDirectionalSpectralFieldDescriptor({
		id: definition.id,
		quantity: definition.quantity,
		units: definition.units,
		directionRole: definition.directionRole,
		basis: NATIVE_15_SPECTRAL_BASIS,
		positionDomain: domainSelection.positionDomain,
		directionDomain: definition.directionDomain,
		precision: 'binary64',
		layout: packing.layout,
		order: definition.order,
		provenanceIdentity: definition.provenanceIdentity === undefined
			? DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY
			: definition.provenanceIdentity,
	}));

	return new CpuDirectionalSpectralField({
		descriptor,
		packing,
	});
}

/**
 * Create one mutable pure incoming-radiance field for the distant Sun.
 *
 * @param {DistantSunCpuPureFieldDefinition} definition - Supplies identity
 * and pure transported-radiance order.
 * @returns {CpuDirectionalSpectralFieldContract} Return mutable binary64 Lk storage.
 */
export function createDistantSunCpuPureRadianceField(definition) {
	const domainSelection = definition.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	return createField({
		id: definition.id,
		quantity: /** @type {"spectral-radiance-density"} */ (DIRECTIONAL_FIELD_QUANTITIES.RADIANCE_DENSITY),
		units: /** @type {"W m^-2 sr^-1 nm^-1"} */ (DIRECTIONAL_FIELD_UNITS.RADIANCE_DENSITY),
		directionRole: /** @type {"incoming-radiance"} */ (DIRECTION_DOMAIN_ROLES.INCOMING_RADIANCE),
		directionDomain: domainSelection.incomingDirectionDomain,
		packing: domainSelection.radiancePacking,
		order: { kind: 'pure', value: definition.order },
		provenanceIdentity: definition.provenanceIdentity,
		domainSelection,
	});
}

/**
 * Create one mutable pure outgoing scattering-density field for the distant Sun.
 *
 * @param {DistantSunCpuPureFieldDefinition} definition - Supplies identity
 * and pure scattering order.
 * @returns {CpuDirectionalSpectralFieldContract} Return mutable binary64 Jk storage.
 */
export function createDistantSunCpuPureScatteringDensityField(definition) {
	const domainSelection = definition.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	return createField({
		id: definition.id,
		quantity: /** @type {"spectral-scattering-density"} */ (DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY),
		units: /** @type {"W m^-3 sr^-1 nm^-1"} */ (DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY),
		directionRole: /** @type {"outgoing-scattering-density"} */ (DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY),
		directionDomain: domainSelection.outgoingDirectionDomain,
		packing: domainSelection.scatteringDensityPacking,
		order: { kind: 'pure', value: definition.order },
		provenanceIdentity: definition.provenanceIdentity,
		domainSelection,
	});
}

/**
 * Create one mutable cumulative outgoing scattering-density field.
 *
 * @param {DistantSunCpuCumulativeFieldDefinition} definition - Supplies
 * identity and the cumulative-through order. Internal through-3 targets are
 * valid here; only a published cache descriptor restricts requests to 1, 2,
 * or 4.
 * @returns {CpuDirectionalSpectralFieldContract} Return mutable binary64 JthroughN storage.
 */
export function createDistantSunCpuCumulativeScatteringDensityField(definition) {
	const domainSelection = definition.domainSelection
		?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	return createField({
		id: definition.id,
		quantity: /** @type {"spectral-scattering-density"} */ (DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY),
		units: /** @type {"W m^-3 sr^-1 nm^-1"} */ (DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY),
		directionRole: /** @type {"outgoing-scattering-density"} */ (DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY),
		directionDomain: domainSelection.outgoingDirectionDomain,
		packing: domainSelection.scatteringDensityPacking,
		order: {
			kind: 'cumulative-through',
			value: definition.cumulativeThroughOrder,
		},
		provenanceIdentity: definition.provenanceIdentity,
		domainSelection,
	});
}
