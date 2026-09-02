import {CanonicalValueHash} from '../value-identity/CanonicalValueHash.js';

/**
 * Return the canonical executable identity for one normalized celestial source definition.
 *
 * @param {CelestialSourceDefinitionIdentityFacts} facts - Normalized source-definition facts.
 * @returns {CelestialSourceIdentity} - Stable executable source identity.
 */
function describeIdentity(facts) {
	return {
		id: facts.id,
		kind: facts.kind,
		definitionHash: CanonicalValueHash.sha256Value(facts),
	};
}

/**
 * Return the logical cache-fragment description for one accepted source definition.
 *
 * @param {CelestialSourceDefinition} definition - Accepted static source definition.
 * @returns {CelestialCacheFragmentSpec} - Source-owned logical fragment facts.
 */
function describeFragment(definition) {
	if (definition.kind === 'distant-uniform-sun') {
		return {
			sourceId: definition.id,
			sourceKind: definition.kind,
			quantity: 'spectral-radiance-density',
			units: 'W m^-2 sr^-1 nm^-1',
			channelCount: 15,
			support: {
				angularRadius: definition.angularRadius,
				profile: definition.profile,
			},
		};
	}

	if (definition.kind === 'static-stellar-point-set') {
		return {
			sourceId: definition.id,
			sourceKind: definition.kind,
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			channelCount: 15,
			support: {
				catalog: definition.catalog,
				memberCount: 500,
			},
		};
	}

	return {
		sourceId: definition.id,
		sourceKind: definition.kind,
		quantity: 'spectral-radiance-density',
		units: 'W m^-2 sr^-1 nm^-1',
		channelCount: 15,
		support: {
			radius: definition.radius,
			centerHeight: definition.centerHeight,
			profile: definition.profile,
		},
	};
}

/** Shared canonical identity and logical-fragment methods for celestial source providers. */
export const CelestialSourceSupport = {
	describeFragment,
	describeIdentity,
};
