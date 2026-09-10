import {
	DISTANT_SUN_SHARED_CACHE_ALTITUDE_LEDGER_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT,
	DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT,
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT,
	DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
	DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
	DISTANT_SUN_SHARED_CACHE_PREPARED_ROUTE_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_RESIDENT_SLOT_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_ROW_ADDRESS_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS,
} from './consts.js';

/** Validation boundary for packet-ready, resident, predicted, and published shared-cache state. */
export default class DistantSunSharedCacheRuntimeContracts {
	/**
	 * Called by runtime validators to require one ordinary object.
	 *
	 * @param {unknown} value - Candidate object.
	 * @param {string} label - Diagnostic label.
	 * @returns {Record<string, unknown>} - Accepted record.
	 */
	_requireRecord(value, label) {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) {
			throw new TypeError(`${label} must be an object.`);
		}
		return /** @type {Record<string, unknown>} */ (value);
	}

	/**
	 * Called by runtime validators to require one exact property set.
	 *
	 * @param {Record<string, unknown>} record - Candidate record.
	 * @param {readonly string[]} expectedKeys - Complete allowed property set.
	 * @param {string} label - Diagnostic label.
	 * @returns {void}
	 */
	_requireExactKeys(record, expectedKeys, label) {
		const actual = Object.keys(record).sort();
		const expected = [...expectedKeys].sort();
		if (actual.length !== expected.length || actual.some((property, index) => property !== expected[index])) {
			throw new TypeError(`${label} properties are incompatible.`);
		}
	}

	/**
	 * Called by runtime validators to require one bounded integer.
	 *
	 * @param {unknown} value - Candidate integer.
	 * @param {number} minimum - Inclusive lower bound.
	 * @param {number} maximum - Inclusive upper bound.
	 * @param {string} label - Diagnostic label.
	 * @returns {number} - Accepted integer.
	 */
	_requireInteger(value, minimum, maximum, label) {
		if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
			throw new RangeError(`${label} is outside its contract range.`);
		}
		return value;
	}

	/**
	 * Called by runtime validators to require a nonempty string.
	 *
	 * @param {unknown} value - Candidate string.
	 * @param {string} label - Diagnostic label.
	 * @returns {string} - Accepted string.
	 */
	_requireString(value, label) {
		if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${label} must be a nonempty string.`);
		return value;
	}

	/**
	 * Called by runtime validators to require one lowercase SHA-256 identity.
	 *
	 * @param {unknown} value - Candidate hash.
	 * @param {string} label - Diagnostic label.
	 * @returns {string} - Accepted hash.
	 */
	_requireSha256(value, label) {
		if (typeof value !== 'string' || !/^[a-f0-9]{64}$/u.test(value)) {
			throw new RangeError(`${label} must be a lowercase SHA-256 hash.`);
		}
		return value;
	}

	/**
	 * Call this method to validate one packet-ready block before GPU allocation or upload.
	 * Invalid identities, storage, values, or zero padding throw; callers must not allocate or upload the block.
	 *
	 * @param {unknown} value - Candidate packet block.
	 * @returns {DistantSunSharedCachePacketBlock} - Accepted packet block.
	 */
	acceptPacketBlock(value) {
		const packetBlock = this._requireRecord(value, 'Shared-cache packet block');
		this._requireExactKeys(
			packetBlock,
			[
				'schemaId',
				'logicalBlockId',
				'decodedSha256',
				'logicalToUniqueIndexSha256',
				'blockRowCount',
				'storage',
				'values',
			],
			'Shared-cache packet block',
		);
		if (packetBlock.schemaId !== DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID) {
			throw new RangeError('Shared-cache packet-block schema is unsupported.');
		}
		this._requireString(packetBlock.logicalBlockId, 'Shared-cache packet logical block id');
		this._requireSha256(packetBlock.decodedSha256, 'Shared-cache packet decoded hash');
		this._requireSha256(packetBlock.logicalToUniqueIndexSha256, 'Shared-cache packet direction-map hash');
		const blockRowCount = this._requireInteger(
			packetBlock.blockRowCount,
			1,
			DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT,
			'Shared-cache packet row count',
		);
		const storage = this._requireRecord(packetBlock.storage, 'Shared-cache packet storage');
		this._requireExactKeys(
			storage,
			['format', 'width', 'height', 'layers', 'xFastest', 'flipY'],
			'Shared-cache packet storage',
		);
		if (
			storage.format !== 'RGBA32F' ||
			storage.width !== DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH ||
			storage.height !== DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT ||
			storage.layers !== 1 ||
			storage.xFastest !== true ||
			storage.flipY !== false
		) {
			throw new RangeError('Shared-cache packet storage differs from the canonical layer layout.');
		}
		if (
			!(packetBlock.values instanceof Float32Array) ||
			packetBlock.values.length !==
				DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH * DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT * 4
		) {
			throw new RangeError('Shared-cache packet values have an incompatible RGBA32F shape.');
		}

		for (
			let packetRowIndex = 0;
			packetRowIndex < DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT;
			packetRowIndex += 1
		) {
			const rowPopulated = packetRowIndex < blockRowCount;
			for (let directionRowIndex = 0; directionRowIndex < 27; directionRowIndex += 1) {
				const y = packetRowIndex * 27 + directionRowIndex;
				for (let x = 0; x < DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH; x += 1) {
					const firstComponentIndex = (y * DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH + x) * 4;
					if (!rowPopulated) {
						for (let componentIndex = 0; componentIndex < 4; componentIndex += 1) {
							if (!Object.is(packetBlock.values[firstComponentIndex + componentIndex], 0)) {
								throw new RangeError(
									'Shared-cache unpopulated packet rows must contain exact positive zero.',
								);
							}
						}
					} else if (x >= 486 && !Object.is(packetBlock.values[firstComponentIndex + 3], 0)) {
						throw new RangeError('Shared-cache synthetic channel 15 must contain exact positive zero.');
					}
				}
			}
		}
		return /** @type {DistantSunSharedCachePacketBlock} */ (packetBlock);
	}

	/**
	 * Call this method to validate one authenticated uploaded resident slot.
	 * Invalid state, generation, identity, row count, or layer bounds throw; callers must not publish the slot.
	 *
	 * @param {unknown} value - Candidate resident slot.
	 * @param {number} residentLayerCount - Allocated atlas layer count.
	 * @returns {DistantSunSharedCacheResidentSlot} - Accepted resident slot.
	 */
	acceptResidentSlot(value, residentLayerCount = DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT) {
		const slot = this._requireRecord(value, 'Shared-cache resident slot');
		this._requireExactKeys(
			slot,
			['schemaId', 'generation', 'slotIndex', 'state', 'logicalBlockId', 'decodedSha256', 'blockRowCount'],
			'Shared-cache resident slot',
		);
		if (slot.schemaId !== DISTANT_SUN_SHARED_CACHE_RESIDENT_SLOT_SCHEMA_ID || slot.state !== 'uploaded') {
			throw new RangeError('Shared-cache resident slot is not an authenticated uploaded slot.');
		}
		this._requireInteger(slot.generation, 1, Number.MAX_SAFE_INTEGER, 'Shared-cache resident-slot generation');
		this._requireInteger(slot.slotIndex, 0, residentLayerCount - 1, 'Shared-cache resident-slot index');
		this._requireString(slot.logicalBlockId, 'Shared-cache resident-slot block id');
		this._requireSha256(slot.decodedSha256, 'Shared-cache resident-slot decoded hash');
		this._requireInteger(
			slot.blockRowCount,
			1,
			DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT,
			'Shared-cache resident-slot row count',
		);
		return /** @type {DistantSunSharedCacheResidentSlot} */ (slot);
	}

	/**
	 * Call this method to validate an RG16UI scene-row address table.
	 * Invalid storage, generations, sentinels, or address bounds throw; callers must preserve the last-good table.
	 *
	 * @param {unknown} value - Candidate row-address table.
	 * @returns {DistantSunSharedCacheRowAddressTable} - Accepted row-address table.
	 */
	acceptRowAddressTable(value) {
		const table = this._requireRecord(value, 'Shared-cache row-address table');
		this._requireExactKeys(
			table,
			[
				'schemaId',
				'generation',
				'format',
				'width',
				'height',
				'residentLayerCount',
				'sceneRowCounts',
				'unavailableValue',
				'values',
			],
			'Shared-cache row-address table',
		);
		if (
			table.schemaId !== DISTANT_SUN_SHARED_CACHE_ROW_ADDRESS_SCHEMA_ID ||
			table.format !== 'RG16UI' ||
			table.height !== 109 ||
			table.unavailableValue !== DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS
		) {
			throw new RangeError('Shared-cache row-address table shape is incompatible.');
		}
		this._requireInteger(table.generation, 1, Number.MAX_SAFE_INTEGER, 'Shared-cache row-address generation');
		const width = this._requireInteger(table.width, 1, 0xffff, 'Shared-cache row-address width');
		const residentLayerCount = this._requireInteger(
			table.residentLayerCount,
			1,
			0xffff - 1,
			'Shared-cache resident layer count',
		);
		if (!Array.isArray(table.sceneRowCounts) || table.sceneRowCounts.length !== 109) {
			throw new RangeError('Shared-cache row-address scene-row counts are incompatible.');
		}
		for (const [sceneOrdinal, rowCount] of table.sceneRowCounts.entries()) {
			this._requireInteger(rowCount, 0, width, `Shared-cache scene ${sceneOrdinal} row count`);
		}
		if (!(table.values instanceof Uint16Array) || table.values.length !== width * 109 * 2) {
			throw new RangeError('Shared-cache row-address values have an incompatible RG16UI shape.');
		}
		for (let texelIndex = 0; texelIndex < width * 109; texelIndex += 1) {
			const slotIndex = table.values[texelIndex * 2];
			const blockRowIndex = table.values[texelIndex * 2 + 1];
			const unavailable = slotIndex === DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS;
			if (unavailable !== (blockRowIndex === DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS)) {
				throw new RangeError('Shared-cache row-address sentinel components must agree.');
			}
			if (!unavailable && (slotIndex >= residentLayerCount || blockRowIndex >= 64)) {
				throw new RangeError('Shared-cache row address exceeds the resident atlas or block-row domain.');
			}
		}
		return /** @type {DistantSunSharedCacheRowAddressTable} */ (table);
	}

	/**
	 * Call this method to validate an RGBA32I scene/altitude ledger table.
	 * Invalid storage, generations, or noncontiguous ledger coverage throw; callers must preserve the last-good table.
	 *
	 * @param {unknown} value - Candidate altitude-ledger table.
	 * @param {readonly number[]} sceneRowCounts - Accepted packed-row counts for all scenes.
	 * @returns {DistantSunSharedCacheAltitudeLedgerTable} - Accepted altitude-ledger table.
	 */
	acceptAltitudeLedgerTable(value, sceneRowCounts) {
		const table = this._requireRecord(value, 'Shared-cache altitude-ledger table');
		this._requireExactKeys(
			table,
			['schemaId', 'generation', 'format', 'width', 'height', 'values'],
			'Shared-cache altitude-ledger table',
		);
		if (
			table.schemaId !== DISTANT_SUN_SHARED_CACHE_ALTITUDE_LEDGER_SCHEMA_ID ||
			table.format !== 'RGBA32I' ||
			table.width !== 48 ||
			table.height !== 109 ||
			!Array.isArray(sceneRowCounts) ||
			sceneRowCounts.length !== 109 ||
			!(table.values instanceof Int32Array) ||
			table.values.length !== 48 * 109 * 4
		) {
			throw new RangeError('Shared-cache altitude-ledger table shape is incompatible.');
		}
		this._requireInteger(table.generation, 1, Number.MAX_SAFE_INTEGER, 'Shared-cache altitude-ledger generation');
		for (let sceneOrdinal = 0; sceneOrdinal < 109; sceneOrdinal += 1) {
			let expectedFirstScenePackedRow = 0;
			for (let altitudeIndex = 0; altitudeIndex < 48; altitudeIndex += 1) {
				const firstComponentIndex = (sceneOrdinal * 48 + altitudeIndex) * 4;
				const firstSolarZenithIndex = table.values[firstComponentIndex];
				const lastSolarZenithIndex = table.values[firstComponentIndex + 1];
				const firstScenePackedRow = table.values[firstComponentIndex + 2];
				if (
					firstSolarZenithIndex < 0 ||
					lastSolarZenithIndex >= 180 ||
					firstSolarZenithIndex > lastSolarZenithIndex ||
					firstScenePackedRow !== expectedFirstScenePackedRow ||
					table.values[firstComponentIndex + 3] !== 0
				) {
					throw new RangeError('Shared-cache altitude-ledger entry is not canonical or contiguous.');
				}
				expectedFirstScenePackedRow += lastSolarZenithIndex - firstSolarZenithIndex + 1;
			}
			if (expectedFirstScenePackedRow !== sceneRowCounts[sceneOrdinal]) {
				throw new RangeError(`Shared-cache altitude ledger does not cover scene ${sceneOrdinal} rows.`);
			}
		}
		return /** @type {DistantSunSharedCacheAltitudeLedgerTable} */ (table);
	}

	/**
	 * Call this method to validate one bounded predictively prepared route.
	 * Invalid identities, block membership, status, or host-memory bounds throw; callers must reject the route.
	 *
	 * @param {unknown} value - Candidate prepared route.
	 * @returns {DistantSunSharedCachePreparedRoute} - Accepted prepared route.
	 */
	acceptPreparedRoute(value) {
		const route = this._requireRecord(value, 'Shared-cache prepared route');
		this._requireExactKeys(
			route,
			[
				'schemaId',
				'generation',
				'routeId',
				'configurationIdentity',
				'catalogSha256',
				'sceneOrdinals',
				'requiredBlockIds',
				'preparedBlockIds',
				'hostMemoryCeilingBytes',
				'retainedBytes',
				'status',
			],
			'Shared-cache prepared route',
		);
		if (
			route.schemaId !== DISTANT_SUN_SHARED_CACHE_PREPARED_ROUTE_SCHEMA_ID ||
			(route.status !== 'partial' && route.status !== 'ready')
		) {
			throw new RangeError('Shared-cache prepared-route schema or status is unsupported.');
		}
		this._requireInteger(route.generation, 1, Number.MAX_SAFE_INTEGER, 'Shared-cache prepared-route generation');
		this._requireString(route.routeId, 'Shared-cache prepared-route id');
		this._requireSha256(route.configurationIdentity, 'Shared-cache prepared-route configuration identity');
		this._requireSha256(route.catalogSha256, 'Shared-cache prepared-route catalog hash');
		if (!Array.isArray(route.sceneOrdinals) || route.sceneOrdinals.length === 0) {
			throw new RangeError('Shared-cache prepared route must contain at least one scene.');
		}
		for (const [routeIndex, sceneOrdinal] of route.sceneOrdinals.entries()) {
			this._requireInteger(sceneOrdinal, 0, 108, `Shared-cache prepared-route scene ${routeIndex}`);
		}
		if (
			!Array.isArray(route.requiredBlockIds) ||
			new Set(route.requiredBlockIds).size !== route.requiredBlockIds.length
		) {
			throw new RangeError('Shared-cache prepared-route required block ids must be a unique array.');
		}
		if (
			!Array.isArray(route.preparedBlockIds) ||
			new Set(route.preparedBlockIds).size !== route.preparedBlockIds.length
		) {
			throw new RangeError('Shared-cache prepared-route prepared block ids must be a unique array.');
		}
		const requiredBlockIds = new Set(route.requiredBlockIds);
		for (const blockId of route.requiredBlockIds) this._requireString(blockId, 'Shared-cache required block id');
		for (const blockId of route.preparedBlockIds) {
			this._requireString(blockId, 'Shared-cache prepared block id');
			if (!requiredBlockIds.has(blockId))
				throw new RangeError('Shared-cache prepared block is not required by its route.');
		}
		const hostMemoryCeilingBytes = this._requireInteger(
			route.hostMemoryCeilingBytes,
			1,
			Number.MAX_SAFE_INTEGER,
			'Shared-cache prepared-route host-memory ceiling',
		);
		this._requireInteger(
			route.retainedBytes,
			0,
			hostMemoryCeilingBytes,
			'Shared-cache prepared-route retained bytes',
		);
		if (route.status === 'ready' && route.preparedBlockIds.length !== route.requiredBlockIds.length) {
			throw new RangeError('Shared-cache ready route has unprepared required blocks.');
		}
		return /** @type {DistantSunSharedCachePreparedRoute} */ (route);
	}

	/**
	 * Call this method to validate one coherent frame-boundary publication snapshot.
	 * A ready publication rejects unavailable rows, stale generations, missing blocks,
	 * evicted slots, and rows outside the authenticated packet block.
	 * Any invalid snapshot throws; callers must preserve the last-good publication and not expose the candidate.
	 *
	 * @param {unknown} value - Candidate publication snapshot.
	 * @returns {DistantSunSharedCachePublicationSnapshot} - Accepted publication snapshot.
	 */
	acceptPublicationSnapshot(value) {
		const snapshot = this._requireRecord(value, 'Shared-cache publication snapshot');
		this._requireExactKeys(
			snapshot,
			[
				'schemaId',
				'generation',
				'status',
				'sceneOrdinal',
				'representativeSolarZenithDegrees',
				'requiredBlockIds',
				'residentSlots',
				'rowAddressTable',
				'altitudeLedgerTable',
			],
			'Shared-cache publication snapshot',
		);
		if (
			snapshot.schemaId !== DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID ||
			(snapshot.status !== 'ready' && snapshot.status !== 'dark')
		) {
			throw new RangeError('Shared-cache publication schema or status is unsupported.');
		}
		const generation = this._requireInteger(
			snapshot.generation,
			1,
			Number.MAX_SAFE_INTEGER,
			'Shared-cache publication generation',
		);
		if (snapshot.status === 'dark') {
			if (
				snapshot.sceneOrdinal !== null ||
				snapshot.representativeSolarZenithDegrees !== null ||
				!Array.isArray(snapshot.requiredBlockIds) ||
				snapshot.requiredBlockIds.length !== 0 ||
				!Array.isArray(snapshot.residentSlots) ||
				snapshot.residentSlots.length !== 0 ||
				snapshot.rowAddressTable !== null ||
				snapshot.altitudeLedgerTable !== null
			) {
				throw new RangeError('Shared-cache dark publication must be texture-free.');
			}
			return /** @type {DistantSunSharedCachePublicationSnapshot} */ (snapshot);
		}

		const sceneOrdinal = this._requireInteger(
			snapshot.sceneOrdinal,
			0,
			107,
			'Shared-cache publication scene ordinal',
		);
		if (snapshot.representativeSolarZenithDegrees !== sceneOrdinal) {
			throw new RangeError('Shared-cache publication scene ordinal and representative angle disagree.');
		}
		if (!Array.isArray(snapshot.requiredBlockIds) || snapshot.requiredBlockIds.length === 0) {
			throw new RangeError('Shared-cache ready publication must require at least one block.');
		}
		const requiredBlockIds = new Set(snapshot.requiredBlockIds);
		if (requiredBlockIds.size !== snapshot.requiredBlockIds.length) {
			throw new RangeError('Shared-cache publication required block ids must be unique.');
		}
		for (const blockId of snapshot.requiredBlockIds)
			this._requireString(blockId, 'Shared-cache publication block id');

		if (!Array.isArray(snapshot.residentSlots) || snapshot.residentSlots.length === 0) {
			throw new RangeError('Shared-cache ready publication must identify resident slots.');
		}
		const rowAddressTable = this.acceptRowAddressTable(snapshot.rowAddressTable);
		const residentSlots = new Map();
		const residentBlockIds = new Set();
		for (const slotValue of snapshot.residentSlots) {
			const slot = this.acceptResidentSlot(slotValue, rowAddressTable.residentLayerCount);
			if (slot.generation !== generation)
				throw new RangeError('Shared-cache publication contains a stale resident slot.');
			if (residentSlots.has(slot.slotIndex) || residentBlockIds.has(slot.logicalBlockId)) {
				throw new RangeError('Shared-cache publication resident slots or block identities are duplicated.');
			}
			residentSlots.set(slot.slotIndex, slot);
			residentBlockIds.add(slot.logicalBlockId);
		}
		for (const blockId of requiredBlockIds) {
			if (!residentBlockIds.has(blockId))
				throw new RangeError('Shared-cache publication is missing a required block.');
		}

		if (rowAddressTable.generation !== generation)
			throw new RangeError('Shared-cache publication row addresses are stale.');
		const altitudeLedgerTable = this.acceptAltitudeLedgerTable(
			snapshot.altitudeLedgerTable,
			rowAddressTable.sceneRowCounts,
		);
		if (altitudeLedgerTable.generation !== generation) {
			throw new RangeError('Shared-cache publication altitude ledger is stale.');
		}

		const sceneRowCount = rowAddressTable.sceneRowCounts[sceneOrdinal];
		for (let scenePackedRow = 0; scenePackedRow < sceneRowCount; scenePackedRow += 1) {
			const firstComponentIndex = (sceneOrdinal * rowAddressTable.width + scenePackedRow) * 2;
			const slotIndex = rowAddressTable.values[firstComponentIndex];
			const blockRowIndex = rowAddressTable.values[firstComponentIndex + 1];
			if (slotIndex === DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS) {
				throw new RangeError('Shared-cache ready publication contains an unavailable row.');
			}
			const slot = residentSlots.get(slotIndex);
			if (!slot || blockRowIndex >= slot.blockRowCount || !requiredBlockIds.has(slot.logicalBlockId)) {
				throw new RangeError(
					'Shared-cache published row does not resolve to its authenticated required block.',
				);
			}
		}
		return /** @type {DistantSunSharedCachePublicationSnapshot} */ (snapshot);
	}
}
