import DistanceMath from '../../../math/DistanceMath.js';
import {DISTANT_SUN_SCENE_CACHE_LEDGER_SCHEMA_ID} from './consts.js';

/** Executable packed-row inventory ledger for one fixed distant-Sun scene. */
export default class DistantSunSceneCacheLedger {
	/** @readonly @type {string} */ schemaId;
	/** @readonly @type {DistantSunSceneSunIdentity} */ sceneSun;
	/** @readonly @type {DistantSunSceneCacheSupport} */ support;
	/** @readonly @type {readonly DistantSunSceneCacheLedgerRow[]} */ rows;
	/** @readonly @type {number} */ retainedBlockCount;
	/** @readonly @type {number} */ oracleByteLength;
	/** @readonly @type {number} */ exactSeamByteLength;

	/**
	 * Call this method to validate and reconstruct one external ledger against executable domain owners.
	 *
	 * @param {DistantSunSceneCacheLedgerRecord} record - External serialized ledger.
	 * @param {DistantSunSceneCacheLedgerDomainDefinition} domains - Canonical executable domains.
	 * @returns {DistantSunSceneCacheLedger} - Canonically reconstructed ledger.
	 */
	static fromRecord(record, domains) {
		if (!record || record.schemaId !== DISTANT_SUN_SCENE_CACHE_LEDGER_SCHEMA_ID) {
			throw new RangeError('Distant-Sun scene-cache ledger schema is incompatible.');
		}
		const ledger = new DistantSunSceneCacheLedger({
			sceneSun: record.sceneSun,
			support: record.support,
			...domains,
		});
		if (!Array.isArray(record.rows) || record.rows.length !== ledger.rows.length) {
			throw new RangeError('Distant-Sun scene-cache ledger does not retain every altitude owner.');
		}
		let firstPackedRow = 0;
		for (let altitudeIndex = 0; altitudeIndex < ledger.rows.length; altitudeIndex += 1) {
			const minimum = ledger.rows[altitudeIndex];
			const row = record.rows[altitudeIndex];
			const packedRowCount = row?.lastSolarZenithIndex - row?.firstSolarZenithIndex + 1;
			if (
				row?.altitudeIndex !== altitudeIndex ||
				JSON.stringify(row.altitude) !== JSON.stringify(minimum.altitude) ||
				!Number.isInteger(row.firstSolarZenithIndex) ||
				!Number.isInteger(row.lastSolarZenithIndex) ||
				row.firstSolarZenithIndex < 0 ||
				row.lastSolarZenithIndex >= domains.solarZenithDomain.count ||
				row.firstSolarZenithIndex > minimum.firstSolarZenithIndex ||
				row.lastSolarZenithIndex < minimum.lastSolarZenithIndex ||
				row.firstPackedRow !== firstPackedRow ||
				row.packedRowCount !== packedRowCount
			) {
				throw new RangeError('Distant-Sun scene-cache ledger is not an interpolation-closed inventory superset.');
			}
			firstPackedRow += packedRowCount;
		}
		const oracleByteLength =
			firstPackedRow *
			domains.outgoingDirectionDomain.directionCount *
			domains.spectralBasis.channelCount *
			Float32Array.BYTES_PER_ELEMENT;
		const exactSeamByteLength =
			firstPackedRow *
				domains.outgoingDirectionDomain.uniqueDirectionCount *
				domains.spectralBasis.channelCount *
				Float32Array.BYTES_PER_ELEMENT +
			domains.outgoingDirectionDomain.directionCount * Uint16Array.BYTES_PER_ELEMENT;
		if (
			record.retainedBlockCount !== firstPackedRow ||
			record.oracleByteLength !== oracleByteLength ||
			record.exactSeamByteLength !== exactSeamByteLength
		) {
			throw new RangeError('Distant-Sun scene-cache ledger byte shape does not match its retained rows.');
		}
		Object.assign(ledger, {
			rows: record.rows,
			retainedBlockCount: firstPackedRow,
			oracleByteLength,
			exactSeamByteLength,
		});
		return ledger;
	}

	/**
	 * Called by construction to resolve one physical angle into its interpolation-closed node pair.
	 *
	 * @param {SolarZenithDomain} domain - The executable solar-zenith domain.
	 * @param {number} radians - The physical local-solar-zenith angle in radians.
	 * @returns {readonly number[]} - The retained stencil indices.
	 */
	_resolveSolarZenithIndices(domain, radians) {
		return domain.resolveStencil({value: radians, units: 'radians'}).indices;
	}

	/**
	 * Called by construction to calculate the largest observer-to-node central angle visible above the sphere.
	 *
	 * @param {number} altitudeMeters - The upper physical altitude represented by the row.
	 * @returns {number} - The maximum central angle in radians.
	 */
	_maximumVisibleCentralAngle(altitudeMeters) {
		const bottomRadiusMeters = DistanceMath.toMeters(this.support.bottomRadius);
		const observerAltitudeMeters = DistanceMath.toMeters(this.support.observerAltitude);
		const horizonAngle = /** @param {number} altitude - The altitude above the spherical ground. */ (altitude) =>
			Math.acos(bottomRadiusMeters / (bottomRadiusMeters + altitude));

		return horizonAngle(observerAltitudeMeters) + horizonAngle(altitudeMeters);
	}

	/**
	 * Called by construction to build all interpolation-closed altitude rows.
	 *
	 * @param {DistantSunSceneCacheLedgerDefinition} definition - The accepted scene and executable domains.
	 * @returns {readonly DistantSunSceneCacheLedgerRow[]} - The ordered packed rows.
	 */
	_buildRows(definition) {
		const altitudeNodes = definition.positionDomain.nodes;
		const atmosphereHeightMeters =
			DistanceMath.toMeters(definition.support.topRadius) -
			DistanceMath.toMeters(definition.support.bottomRadius);
		const observerSolarZenithRadians = definition.support.observerSolarZenith.value;
		let firstPackedRow = 0;

		return altitudeNodes.map((node, altitudeIndex) => {
			const upperQueryAltitudeMeters =
				altitudeIndex === altitudeNodes.length - 1
					? atmosphereHeightMeters
					: DistanceMath.toMeters(altitudeNodes[altitudeIndex + 1].coordinate);
			const centralAngle = this._maximumVisibleCentralAngle(upperQueryAltitudeMeters);
			const minimumAngle = Math.max(observerSolarZenithRadians - centralAngle, 0);
			const maximumAngle = Math.min(observerSolarZenithRadians + centralAngle, Math.PI);
			const minimumIndices = this._resolveSolarZenithIndices(definition.solarZenithDomain, minimumAngle);
			const maximumIndices = this._resolveSolarZenithIndices(definition.solarZenithDomain, maximumAngle);
			const firstSolarZenithIndex = minimumIndices[0];
			const lastSolarZenithIndex = maximumIndices[maximumIndices.length - 1];
			const packedRowCount = lastSolarZenithIndex - firstSolarZenithIndex + 1;
			const row = {
				altitudeIndex,
				altitude: node.coordinate,
				firstSolarZenithIndex,
				lastSolarZenithIndex,
				firstPackedRow,
				packedRowCount,
			};

			firstPackedRow += packedRowCount;
			return row;
		});
	}

	/**
	 * Creates one interpolation-closed packed-row ledger from canonical executable domains.
	 *
	 * @param {DistantSunSceneCacheLedgerDefinition} definition - The exact scene, support, and domain owners.
	 */
	constructor(definition) {
		if (definition.support.observerSolarZenith.units !== 'radians') {
			throw new RangeError('Scene-cache observer solar zenith must use radians.');
		}

		this.schemaId = DISTANT_SUN_SCENE_CACHE_LEDGER_SCHEMA_ID;
		this.sceneSun = definition.sceneSun;
		this.support = definition.support;
		this.rows = this._buildRows(definition);
		this.retainedBlockCount = this.rows.reduce((sum, row) => sum + row.packedRowCount, 0);
		this.oracleByteLength =
			this.retainedBlockCount *
			definition.outgoingDirectionDomain.directionCount *
			definition.spectralBasis.channelCount *
			Float32Array.BYTES_PER_ELEMENT;
		this.exactSeamByteLength =
			this.retainedBlockCount *
				definition.outgoingDirectionDomain.uniqueDirectionCount *
				definition.spectralBasis.channelCount *
				Float32Array.BYTES_PER_ELEMENT +
			definition.outgoingDirectionDomain.directionCount * Uint16Array.BYTES_PER_ELEMENT;
	}

	/**
	 * Call this method to resolve one retained altitude/Z180 coordinate to its packed row.
	 *
	 * @param {number} altitudeIndex - The Native48 altitude-node index.
	 * @param {number} solarZenithIndex - The Z180 local-solar-zenith index.
	 * @returns {number} - The packed payload row.
	 * @throws {RangeError} - When the coordinate is outside declared scene support.
	 */
	lookupPackedRow(altitudeIndex, solarZenithIndex) {
		const row = this.rows[altitudeIndex];
		if (
			!row ||
			!Number.isInteger(solarZenithIndex) ||
			solarZenithIndex < row.firstSolarZenithIndex ||
			solarZenithIndex > row.lastSolarZenithIndex
		) {
			throw new RangeError('Distant-Sun scene-cache coordinate is outside declared support.');
		}

		return row.firstPackedRow + solarZenithIndex - row.firstSolarZenithIndex;
	}

	/**
	 * Call this method to return the serialized external ledger record.
	 *
	 * @returns {DistantSunSceneCacheLedgerRecord} - The complete immutable record shape.
	 */
	toRecord() {
		return {
			schemaId: this.schemaId,
			sceneSun: this.sceneSun,
			support: this.support,
			rows: this.rows,
			retainedBlockCount: this.retainedBlockCount,
			oracleByteLength: this.oracleByteLength,
			exactSeamByteLength: this.exactSeamByteLength,
		};
	}
}
