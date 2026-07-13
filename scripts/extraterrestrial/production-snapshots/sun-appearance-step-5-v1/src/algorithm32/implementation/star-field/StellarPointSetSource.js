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

/**
 * Standard reviewed BSC V/50 brightest-500 stellar point-set source.
 *
 * @implements {StellarPointSetCelestialSource}
 * @implements {CelestialSourceProvider}
 */
export class StellarPointSetSource {
	/** Complete static source definition. @type {StellarPointSetSourceDefinition} */
	_definition;
	/** Canonical source identity. @type {CelestialSourceIdentity} */
	_identity;

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

	/**
	 * Call this method to provide the canonical static member directions to geometry.
	 *
	 * @param {GeometryObservation} _observation - Construction-time observation retained by dynamic source families.
	 * @returns {CelestialSourcePlacementState} - Static-epoch stellar placement input.
	 */
	createCelestialPlacementState(_observation) {
		return {
			sourceId: this.id,
			kind: this.kind,
			frame: this._definition.catalog.frame,
			epoch: this._definition.catalog.epoch,
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
}
