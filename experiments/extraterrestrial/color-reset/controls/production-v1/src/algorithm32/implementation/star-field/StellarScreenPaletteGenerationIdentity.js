import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {CelestialRenderViewSnapshot} from '../../rendering-runtime/three/CelestialRenderViewSnapshot.js';

const SOURCE_SCHEMA = 'stellar-screen-palette-source-compatibility-v1';
const OBSERVATION_SCHEMA = 'stellar-screen-palette-observation-v1';
const GENERATION_SCHEMA = 'stellar-screen-palette-generation-v1';

/** Exact source, fixed-observation, view, and complete generation identity derivation. */
export class StellarScreenPaletteGenerationIdentity {
	/**
	 * Derive the canonical identity of all projection-affecting view facts.
	 *
	 * @param {Omit<CelestialRenderViewSnapshot, 'identity'>} view - Renderer-neutral view facts.
	 * @returns {string} - Canonical view identity.
	 */
	static createViewIdentity(view) {
		return CelestialRenderViewSnapshot.createIdentity(view);
	}

	/**
	 * Derive the complete compatibility and generation identities.
	 *
	 * @param {StellarScreenPaletteGenerationIdentityConfiguration} configuration - Exact immutable generation facts.
	 * @returns {StellarScreenPaletteResolvedIdentity} - Complete identity description.
	 */
	static create(configuration) {
		const {source, observation, epochTransform, geometryIdentity, view, policy} = configuration;
		const derivedViewIdentity = StellarScreenPaletteGenerationIdentity.createViewIdentity(view);
		if (view.identity !== derivedViewIdentity) {
			throw new RangeError('Stellar generation view identity does not match its projection-affecting facts.');
		}

		if (!Number.isFinite(Date.parse(observation.instant))) {
			throw new RangeError('Stellar generation identity requires a valid fixed UTC observation instant.');
		}

		const layout = policy.layout;
		const numericalPolicy = policy.numericalPolicy;
		const sourceIdentity = CanonicalValueHash.sha256Value({
			schema: SOURCE_SCHEMA,
			sourceTableIdentity: source.identity,
			sourceDefinitionIdentity: source.sourceIdentity,
			frame: source.frame,
			epoch: source.epoch,
			layout,
			numericalPolicy,
			policyIdentity: policy.identity,
		});
		const observationIdentity = CanonicalValueHash.sha256Value({
			schema: OBSERVATION_SCHEMA,
			catalogEpoch: source.epoch,
			observation,
			epochTransform,
			geometryIdentity,
		});
		const compatibility = {
			sourceIdentity,
			observationIdentity,
			viewIdentity: derivedViewIdentity,
		};
		const generationIdentity = CanonicalValueHash.sha256Value({
			schema: GENERATION_SCHEMA,
			compatibility,
		});

		return {
			generationIdentity,
			compatibility,
			policyIdentity: policy.identity,
		};
	}

}
