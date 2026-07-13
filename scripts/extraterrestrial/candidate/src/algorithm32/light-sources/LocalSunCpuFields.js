import {
	createDirectionalSpectralFieldDescriptor,
	DIRECTION_DOMAIN_ROLES,
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
} from '../caches/DirectionalSpectralFieldDescriptor.js';
import { CpuDirectionalSpectralField } from
	'../caches/CpuDirectionalSpectralField.js';
import { NATIVE_15_SPECTRAL_BASIS } from
	'../profiles/native-15-profile.js';
import {
	LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
} from './local-sun-consts.js';

/** Create the binary64 field families owned by a local Sun cache. */
export default class LocalSunCpuFields {
	/**
	 * Allocate one field from source-owned executable facts.
	 *
	 * @param {LocalSunCpuFieldBuildDefinition} definition - Supplies field facts.
	 * @returns {CpuDirectionalSpectralFieldContract} The mutable field.
	 */
	_createField(definition) {
		const descriptor =
			/** @type {CpuDirectionalSpectralFieldDescriptor} */ (
				createDirectionalSpectralFieldDescriptor({
					id: definition.id,
					quantity: definition.quantity,
					units: definition.units,
					directionRole: definition.directionRole,
					basis: NATIVE_15_SPECTRAL_BASIS,
					positionDomain:
						definition.domainSelection.positionDomain,
					directionDomain: definition.directionDomain,
					precision: 'binary64',
					layout: definition.packing.layout,
					order: definition.order,
					provenanceIdentity: definition.provenanceIdentity
						?? LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
				})
			);

		return new CpuDirectionalSpectralField({
			descriptor,
			packing: definition.packing,
		});
	}

	/**
	 * Create one mutable pure incoming-radiance field.
	 *
	 * @param {LocalSunCpuPureFieldDefinition} definition - Supplies identity and order.
	 * @returns {CpuDirectionalSpectralFieldContract} The mutable field.
	 */
	static createPureRadiance(definition) {
		return new LocalSunCpuFields()._createField({
			id: definition.id,
			quantity: /** @type {"spectral-radiance-density"} */ (
				DIRECTIONAL_FIELD_QUANTITIES.RADIANCE_DENSITY
			),
			units: /** @type {"W m^-2 sr^-1 nm^-1"} */ (
				DIRECTIONAL_FIELD_UNITS.RADIANCE_DENSITY
			),
			directionRole: /** @type {"incoming-radiance"} */ (
				DIRECTION_DOMAIN_ROLES.INCOMING_RADIANCE
			),
			directionDomain:
				definition.domainSelection.incomingDirectionDomain,
			packing: definition.domainSelection.radiancePacking,
			order: { kind: 'pure', value: definition.order },
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection: definition.domainSelection,
		});
	}

	/**
	 * Create one mutable pure outgoing scattering-density field.
	 *
	 * @param {LocalSunCpuPureFieldDefinition} definition - Supplies identity and order.
	 * @returns {CpuDirectionalSpectralFieldContract} The mutable field.
	 */
	static createPureScatteringDensity(definition) {
		return new LocalSunCpuFields()._createField({
			id: definition.id,
			quantity: /** @type {"spectral-scattering-density"} */ (
				DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY
			),
			units: /** @type {"W m^-3 sr^-1 nm^-1"} */ (
				DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY
			),
			directionRole: /** @type {"outgoing-scattering-density"} */ (
				DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY
			),
			directionDomain:
				definition.domainSelection.outgoingDirectionDomain,
			packing: definition.domainSelection.scatteringDensityPacking,
			order: { kind: 'pure', value: definition.order },
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection: definition.domainSelection,
		});
	}

	/**
	 * Create one mutable cumulative outgoing scattering-density field.
	 *
	 * @param {LocalSunCpuCumulativeFieldDefinition} definition - Supplies identity and through-order.
	 * @returns {CpuDirectionalSpectralFieldContract} The mutable field.
	 */
	static createCumulativeScatteringDensity(definition) {
		return new LocalSunCpuFields()._createField({
			id: definition.id,
			quantity: /** @type {"spectral-scattering-density"} */ (
				DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY
			),
			units: /** @type {"W m^-3 sr^-1 nm^-1"} */ (
				DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY
			),
			directionRole: /** @type {"outgoing-scattering-density"} */ (
				DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY
			),
			directionDomain:
				definition.domainSelection.outgoingDirectionDomain,
			packing: definition.domainSelection.scatteringDensityPacking,
			order: {
				kind: 'cumulative-through',
				value: definition.cumulativeThroughOrder,
			},
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection: definition.domainSelection,
		});
	}
}
