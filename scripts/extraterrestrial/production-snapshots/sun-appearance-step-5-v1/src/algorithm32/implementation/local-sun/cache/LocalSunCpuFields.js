import {CpuDirectionalSpectralField} from '../../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY} from './consts.js';

/** Binary64 field-family allocator for a local-Sun cache. */
export default class LocalSunCpuFields {
	/**
	 * Called by LocalSunCpuFields to allocate one field from source-owned
	 * executable facts.
	 *
	 * @param {LocalSunCpuFieldBuildDefinition} definition - The field facts.
	 * @returns {CpuDirectionalSpectralFieldContract} - The fresh mutable field.
	 */
	_createField(definition) {
		const order =
			definition.order.kind === 'pure'
				? {kind: /** @type {const} */ ('pure'), value: definition.order.value}
				: {
						kind: /** @type {const} */ ('cumulative-through'),
						value: definition.order.value,
						included:
							definition.order.included === undefined
								? Array.from(
										{length: definition.order.value},
										/**
										 * Called by the surrounding operation to handle one callback invocation.
										 * @param _unused - The intentionally unused callback value.
										 * @param index - The zero-based index accepted by the operation.
										 * @returns - The callback result returned to its caller.
										 */ (_unused, index) => index + 1,
									)
								: [...definition.order.included],
					};

		return new CpuDirectionalSpectralField({
			id: definition.id,
			provenanceIdentity: definition.provenanceIdentity ?? LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
			order,
			packing: definition.packing,
		});
	}

	/**
	 * Call this method to create one mutable pure incoming-radiance field with
	 * source-owned packing and provenance.
	 *
	 * @param {LocalSunCpuPureFieldDefinition} definition - The identity and pure order.
	 * @returns {CpuDirectionalSpectralFieldContract} - The fresh mutable field.
	 */
	static createPureRadiance(definition) {
		return new LocalSunCpuFields()._createField({
			id: definition.id,
			packing: definition.domainSelection.radiancePacking,
			order: {kind: 'pure', value: definition.order},
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection: definition.domainSelection,
		});
	}

	/**
	 * Call this method to create one mutable pure outgoing scattering-density
	 * field with source-owned packing and provenance.
	 *
	 * @param {LocalSunCpuPureFieldDefinition} definition - The identity and pure order.
	 * @returns {CpuDirectionalSpectralFieldContract} - The fresh mutable field.
	 */
	static createPureScatteringDensity(definition) {
		return new LocalSunCpuFields()._createField({
			id: definition.id,
			packing: definition.domainSelection.scatteringDensityPacking,
			order: {kind: 'pure', value: definition.order},
			provenanceIdentity: definition.provenanceIdentity,
			domainSelection: definition.domainSelection,
		});
	}

	/**
	 * Call this method to create one mutable cumulative outgoing
	 * scattering-density field with source-owned packing and provenance.
	 *
	 * @param {LocalSunCpuCumulativeFieldDefinition} definition - The identity and through-order.
	 * @returns {CpuDirectionalSpectralFieldContract} - The fresh mutable field.
	 */
	static createCumulativeScatteringDensity(definition) {
		return new LocalSunCpuFields()._createField({
			id: definition.id,
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
