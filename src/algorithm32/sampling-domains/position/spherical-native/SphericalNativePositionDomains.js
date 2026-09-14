import {NATIVE_48_POSITION_DOMAIN_OWNER, NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER} from './consts.js';

/** Closed selection and ingress validation for the production distant-Sun altitude owners. */
export const SphericalNativePositionDomains = {
	/**
	 * Call this method to select an executable altitude owner; omission retains Native48.
	 *
	 * @param {SphericalNativePositionDomainSelection} [selection] - Explicit construction-grid selection.
	 * @returns {SphericalNativePositionDomain} - Canonical executable owner.
	 * @throws {RangeError} - Unsupported configuration selection.
	 */
	select(selection = 'native48') {
		if (selection === 'native48') return NATIVE_48_POSITION_DOMAIN_OWNER;
		if (selection === 'native51-near-ground') return NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER;
		throw new RangeError('Unsupported spherical native position-domain selection.');
	},

	/**
	 * Call this method to validate physical node facts against a supported executable owner.
	 * Retained Native48 profile names remain compatible; Native51 requires its new versioned identity.
	 *
	 * @param {SphericalNativePositionDomainInput} domain - External position-domain configuration with unit-bearing point samples.
	 * @returns {SphericalNativePositionDomain} - Canonical owner whose physical nodes exactly match the input.
	 * @throws {RangeError} - Unsupported extent, identity, node ordering, units, or physical coordinates.
	 */
	accept(domain) {
		const owner =
			domain?.count === 48
				? NATIVE_48_POSITION_DOMAIN_OWNER
				: domain?.count === 51
					? NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER
					: null;
		if (
			!owner ||
			typeof domain.id !== 'string' ||
			domain.id.length === 0 ||
			!Array.isArray(domain.nodes) ||
			domain.nodes.length !== owner.count ||
			(owner === NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER && domain.id !== owner.id) ||
			(owner === NATIVE_48_POSITION_DOMAIN_OWNER &&
				domain.id === NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER.id) ||
			domain.nodes.some(
				(node, index) =>
					node?.index !== index ||
					node.coordinate?.units !== 'meters' ||
					!Object.is(node.coordinate.value, owner.nodes[index].coordinate.value),
			)
		) {
			throw new RangeError(
				'Position domain must contain the exact supported Native48 or named Native51 altitude nodes.',
			);
		}
		return owner;
	},
};
