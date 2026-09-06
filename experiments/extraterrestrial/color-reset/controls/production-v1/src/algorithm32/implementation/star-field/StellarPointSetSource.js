import {CelestialSourceSupport} from '../../celestial-source-support/CelestialSourceSupport.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket as SpectralPacketClass,
} from '../../spectral-values/index.js';
import {
	STANDARD_STELLAR_CATALOG_IDENTITY,
	STANDARD_STELLAR_MEMBER_DATA,
	STANDARD_STELLAR_PHOTOMETRY_IDENTITY,
} from './consts.js';
import {StellarPointSetCacheController} from './StellarPointSetCacheController.js';
import {StellarGenerationSourceTable} from './StellarGenerationSourceTable.js';
import {StellarScreenPaletteGenerationIdentity} from './StellarScreenPaletteGenerationIdentity.js';
import {StellarScreenPaletteGenerationPolicy} from './StellarScreenPaletteGenerationPolicy.js';
import {StellarScreenPaletteGenerationStages} from './StellarScreenPaletteGenerationStages.js';
import {StellarScreenPaletteConsumerShaderContribution} from './StellarScreenPaletteConsumerShaderContribution.js';

/**
 * Standard reviewed BSC V/50 brightest-500 stellar point-set source.
 *
 * @implements {StellarPointSetCelestialSource}
 * @implements {CelestialSourceProvider}
 * @implements {StellarScreenPaletteSource}
 */
export class StellarPointSetSource {
	/** Complete static source definition. @type {StellarPointSetSourceDefinition} */
	_definition;
	/** Canonical source identity. @type {CelestialSourceIdentity} */
	_identity;
	/** Immutable packed source table for standard stellar generation. @type {StellarGenerationSourceTable} */
	_generationSourceTable;

	/** Creates the fixed reviewed production stellar source. */
	constructor() {
		const members = STANDARD_STELLAR_MEMBER_DATA.map(
			/**
			 * Called by Array.prototype.map to construct one typed stellar member.
			 * @param member - Reviewed member data.
			 * @returns - Static stellar member definition.
			 */
			(member) => ({
				id: member.id,
				direction: member.direction,
				spectralIrradiance: /** @type {SpectralIrradiancePacket} */ (
					new SpectralPacketClass({
						quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
						units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
						basis: NATIVE_15_SPECTRAL_BASIS,
						semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
						values: member.values,
						provenanceIdentity: `stellar-photometry:${STANDARD_STELLAR_PHOTOMETRY_IDENTITY}:${member.id}`,
					})
				),
			}),
		);

		this._definition = {
			id: 'stellar-catalog-v50',
			kind: 'static-stellar-point-set',
			catalog: STANDARD_STELLAR_CATALOG_IDENTITY,
			members,
		};
		this._identity = CelestialSourceSupport.describeIdentity({
			id: this._definition.id,
			kind: this._definition.kind,
			catalog: this._definition.catalog,
			members: this._definition.members.map(
				/**
				 * Called by Array.prototype.map to retain executable stellar member identity facts.
				 * @param member - Static stellar member definition.
				 * @returns - Canonical stellar member identity facts.
				 */
				(member) => ({
					id: member.id,
					direction: member.direction,
					spectralIrradiance: member.spectralIrradiance.contentHash,
				}),
			),
		});
		this._generationSourceTable = new StellarGenerationSourceTable({
			definition: this._definition,
			sourceIdentity: this._identity.definitionHash,
		});
	}

	/** @returns {string} - Stable standard stellar source identifier. */
	get id() {
		return this._definition.id;
	}

	/** Static stellar point-set discriminator. */
	get kind() {
		return /** @type {const} */ ('static-stellar-point-set');
	}

	/** @returns {StellarPointSetSourceDefinition} - Reviewed static stellar definition. */
	get celestialSourceDefinition() {
		return this._definition;
	}

	/** @returns {CelestialSourceIdentity} - Canonical identity of the reviewed definition. */
	describeCelestialSourceIdentity() {
		return this._identity;
	}

	/** @returns {StellarGenerationSourceTable} - Immutable ordered input for the stellar generation shader. */
	createStellarGenerationSourceTable() {
		return this._generationSourceTable;
	}

	/**
	 * Create the standard stellar point-index and sparse-palette shader stages.
	 *
	 * @param {StellarGenerationStagesRequest} request - Configured geometry and fixed observation.
	 * @returns {readonly StellarScreenPaletteGenerationStageDescription[]} - Ordered generation stages.
	 */
	createStellarGenerationStages(request) {
		const geometry = request.geometry.createStellarGenerationShaderContribution({
			observation: request.observation,
		});

		return new StellarScreenPaletteGenerationStages({
			source: this._generationSourceTable,
			geometry,
		}).createStages();
	}

	/**
	 * Derive exact compatibility for the fixed source/observation and one captured view.
	 *
	 * @param {StellarGenerationIdentityRequest} request - Configured geometry, observation, and exact view.
	 * @returns {StellarScreenPaletteResolvedIdentity} - Complete generation identity.
	 */
	createStellarGenerationIdentity(request) {
		const geometry = request.geometry.createStellarGenerationShaderContribution({
			observation: request.observation,
		});
		const policy = StellarScreenPaletteGenerationPolicy.createBase(this._generationSourceTable.layout);

		return StellarScreenPaletteGenerationIdentity.create({
			source: this._generationSourceTable,
			observation: request.observation,
			epochTransform: request.geometry.describeStellarEpochRelativeTransform(),
			geometryIdentity: geometry.identity,
			view: request.view,
			policy,
		});
	}

	/** Create the O(1) stellar screen-index/native-15 palette consumer contribution. */
	createStellarScreenPaletteConsumerShaderContribution() {
		return new StellarScreenPaletteConsumerShaderContribution().createShaderContribution();
	}

	/**
	 * Call this method to provide the canonical static member directions to geometry.
	 *
	 * @param {GeometryObservation} observation - Fixed construction-time clock/location snapshot.
	 * @returns {CelestialSourcePlacementState} - Static-epoch stellar placement input.
	 */
	createCelestialPlacementState(observation) {
		return {
			sourceId: this.id,
			kind: this.kind,
			frame: /** @type {const} */ ('celestial-rh-v1'),
			epoch: this._definition.catalog.epoch,
			observation,
			memberDirections: this._definition.members.map(
				/**
				 * Called by Array.prototype.map to select one canonical member direction.
				 * @param member - Static stellar member definition.
				 * @returns - Canonical receiver-to-source direction.
				 */
				(member) => member.direction,
			),
		};
	}

	/**
	 * Call this method to describe the source-owned logical celestial-cache fragment.
	 *
	 * @param {CelestialCacheBuildRequest} _request - Accepted model and placement context.
	 * @returns {CelestialCacheFragmentSpec} - Logical stellar fragment facts.
	 */
	createCelestialCacheFragment(_request) {
		return CelestialSourceSupport.describeFragment(this._definition);
	}

	/** Create one attachment-owned tiled stellar cache controller. */
	createStellarPointSetCacheController(request) {
		return new StellarPointSetCacheController(request);
	}
}
