import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/index.js';
import {
	DISTANT_SUN_SHARED_CACHE_ALTITUDE_LEDGER_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
	DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
	DISTANT_SUN_SHARED_CACHE_PREPARED_ROUTE_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_RESIDENT_SLOT_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_ROW_ADDRESS_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS,
} from '../consts.js';
import DistantSunSharedCachePacketLayout from '../DistantSunSharedCachePacketLayout.js';
import DistantSunSharedCacheRuntimeContracts from '../DistantSunSharedCacheRuntimeContracts.js';

describe('DistantSunSharedCache packet and runtime contracts', /** Called by Jasmine to register packet and publication behavior. */ () => {
	const packetLayout = new DistantSunSharedCachePacketLayout();
	const contracts = new DistantSunSharedCacheRuntimeContracts();

	it('freezes the canonical source and destination equations', /** Called by Jasmine to prove exact mapping coordinates. */ () => {
		expect(packetLayout.resolveSourceIndex(14, 2, 4057, 3)).toBe((14 * 3 + 2) * 4058 + 4057);
		expect(packetLayout.resolveDestination(14, 63, 4373, 23)).toEqual({
			layer: 23,
			y: 1727,
			x: 647,
			component: 2,
		});
		expect(packetLayout.resolveDestination(0, 0, 0, 0)).toEqual({layer: 0, y: 0, x: 0, component: 0});
	});

	it('copies exact Float32 bits and preserves synthetic and partial-row positive-zero padding', /** Called by Jasmine to prove packet construction semantics. */ () => {
		const logicalToUniqueIndex = Uint16Array.from(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices,
		);
		const decodedValues = new Float32Array(15 * 4058);
		const decodedBits = new Uint32Array(decodedValues.buffer);
		decodedBits[packetLayout.resolveSourceIndex(0, 0, logicalToUniqueIndex[0], 1)] = 0x3f800001;
		decodedBits[packetLayout.resolveSourceIndex(14, 0, logicalToUniqueIndex[4373], 1)] = 0x00000001;
		const packet = packetLayout.pack({
			logicalBlockId: 'block:test',
			decodedSha256: 'a'.repeat(64),
			blockRowCount: 1,
			decodedValues,
			logicalToUniqueIndex,
			logicalToUniqueIndexSha256: 'b'.repeat(64),
		});
		const packetBits = new Uint32Array(packet.values.buffer);
		const first = packetLayout.resolveDestination(0, 0, 0, 0);
		const last = packetLayout.resolveDestination(14, 0, 4373, 0);
		const packetIndex = (destination) =>
			(destination.y * DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH + destination.x) * 4 + destination.component;

		expect(packetBits[packetIndex(first)]).toBe(0x3f800001);
		expect(packetBits[packetIndex(last)]).toBe(0x00000001);
		expect(Object.is(packet.values[486 * 4 + 3], 0)).toBeTrue();
		expect(Object.is(packet.values[(27 * DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH + 0) * 4 + 0], 0)).toBeTrue();
		expect(contracts.acceptPacketBlock(packet)).toBe(packet);
	});

	it('accepts one coherent ready publication and the texture-free dark state', /** Called by Jasmine to prove complete atomic snapshots. */ () => {
		const fixture = createRuntimeFixture();
		expect(contracts.acceptPublicationSnapshot(fixture.publication)).toBe(fixture.publication);
		const dark = {
			schemaId: DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID,
			generation: 2,
			status: 'dark',
			sceneOrdinal: null,
			representativeSolarZenithDegrees: null,
			requiredBlockIds: [],
			residentSlots: [],
			rowAddressTable: null,
			altitudeLedgerTable: null,
		};
		expect(contracts.acceptPublicationSnapshot(dark)).toBe(dark);
	});

	it('rejects unavailable, stale, missing, and out-of-block published rows', /** Called by Jasmine to prove last-good publication gates. */ () => {
		const unavailable = createRuntimeFixture();
		unavailable.rowAddressTable.values[0] = DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS;
		unavailable.rowAddressTable.values[1] = DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS;
		expect(() => contracts.acceptPublicationSnapshot(unavailable.publication)).toThrowError(/unavailable/u);

		const stale = createRuntimeFixture();
		stale.slot.generation = 2;
		expect(() => contracts.acceptPublicationSnapshot(stale.publication)).toThrowError(/stale/u);

		const missing = createRuntimeFixture();
		missing.publication.requiredBlockIds = ['block:missing'];
		expect(() => contracts.acceptPublicationSnapshot(missing.publication)).toThrowError(/missing/u);

		const outside = createRuntimeFixture();
		outside.rowAddressTable.values[1] = 63;
		expect(() => contracts.acceptPublicationSnapshot(outside.publication)).toThrowError(
			/authenticated required block/u,
		);
	});

	it('validates published slot indices against the explicitly allocated larger atlas', () => {
		const fixture = createRuntimeFixture();
		fixture.rowAddressTable.residentLayerCount = 62;
		fixture.slot.slotIndex = 61;
		for (let index = 0; index < fixture.rowAddressTable.values.length; index += 2)
			if (fixture.rowAddressTable.values[index] === 0) fixture.rowAddressTable.values[index] = 61;
		expect(contracts.acceptPublicationSnapshot(fixture.publication)).toBe(fixture.publication);
		fixture.slot.slotIndex = 62;
		expect(() => contracts.acceptPublicationSnapshot(fixture.publication)).toThrowError(/contract range/u);
	});

	it('rejects mixed sentinels, altitude-ledger gaps, and prepared-route memory overflow', /** Called by Jasmine to prove metadata and prediction bounds. */ () => {
		const mixed = createRuntimeFixture();
		mixed.rowAddressTable.values[2] = DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS;
		mixed.rowAddressTable.values[3] = 0;
		expect(() => contracts.acceptRowAddressTable(mixed.rowAddressTable)).toThrowError(/sentinel/u);

		const ledgerGap = createRuntimeFixture();
		ledgerGap.altitudeLedgerTable.values[6] = 2;
		expect(() =>
			contracts.acceptAltitudeLedgerTable(
				ledgerGap.altitudeLedgerTable,
				ledgerGap.rowAddressTable.sceneRowCounts,
			),
		).toThrowError(/contiguous/u);

		const route = {
			schemaId: DISTANT_SUN_SHARED_CACHE_PREPARED_ROUTE_SCHEMA_ID,
			generation: 1,
			routeId: 'route:test',
			configurationIdentity: 'a'.repeat(64),
			catalogSha256: 'b'.repeat(64),
			sceneOrdinals: [0, 1, 2],
			requiredBlockIds: ['block:0', 'block:1'],
			preparedBlockIds: ['block:0'],
			hostMemoryCeilingBytes: 100,
			retainedBytes: 101,
			status: 'partial',
		};
		expect(() => contracts.acceptPreparedRoute(route)).toThrowError(/contract range/u);
		expect(() => contracts.acceptPreparedRoute({...route, retainedBytes: 50, status: 'ready'})).toThrowError(
			/unprepared/u,
		);
	});

	it('rejects a noncanonical W27 seam map before packet construction', /** Called by Jasmine to prove direction-map authentication against executable W27. */ () => {
		const logicalToUniqueIndex = Uint16Array.from(
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices,
		);
		logicalToUniqueIndex[0] = logicalToUniqueIndex[0] + 1;
		expect(() =>
			packetLayout.pack({
				logicalBlockId: 'block:test',
				decodedSha256: 'a'.repeat(64),
				blockRowCount: 1,
				decodedValues: new Float32Array(15 * 4058),
				logicalToUniqueIndex,
				logicalToUniqueIndexSha256: 'b'.repeat(64),
			}),
		).toThrowError(/executable W27/u);
	});
});

/** Called by this spec to create coherent resident metadata for all 109 scenes. */
function createRuntimeFixture() {
	const sceneRowCounts = Array.from({length: 109}, () => 48);
	const rowAddressValues = new Uint16Array(48 * 109 * 2);
	rowAddressValues.fill(DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS);
	for (let scenePackedRow = 0; scenePackedRow < 48; scenePackedRow += 1) {
		rowAddressValues[scenePackedRow * 2] = 0;
		rowAddressValues[scenePackedRow * 2 + 1] = scenePackedRow;
	}
	const rowAddressTable = {
		schemaId: DISTANT_SUN_SHARED_CACHE_ROW_ADDRESS_SCHEMA_ID,
		generation: 1,
		format: 'RG16UI',
		width: 48,
		height: 109,
		residentLayerCount: 24,
		sceneRowCounts,
		unavailableValue: DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS,
		values: rowAddressValues,
	};
	const altitudeLedgerValues = new Int32Array(48 * 109 * 4);
	for (let sceneOrdinal = 0; sceneOrdinal < 109; sceneOrdinal += 1) {
		for (let altitudeIndex = 0; altitudeIndex < 48; altitudeIndex += 1) {
			const firstComponentIndex = (sceneOrdinal * 48 + altitudeIndex) * 4;
			altitudeLedgerValues[firstComponentIndex] = 0;
			altitudeLedgerValues[firstComponentIndex + 1] = 0;
			altitudeLedgerValues[firstComponentIndex + 2] = altitudeIndex;
			altitudeLedgerValues[firstComponentIndex + 3] = 0;
		}
	}
	const altitudeLedgerTable = {
		schemaId: DISTANT_SUN_SHARED_CACHE_ALTITUDE_LEDGER_SCHEMA_ID,
		generation: 1,
		format: 'RGBA32I',
		width: 48,
		height: 109,
		values: altitudeLedgerValues,
	};
	const slot = {
		schemaId: DISTANT_SUN_SHARED_CACHE_RESIDENT_SLOT_SCHEMA_ID,
		generation: 1,
		slotIndex: 0,
		state: 'uploaded',
		logicalBlockId: 'block:0',
		decodedSha256: 'a'.repeat(64),
		blockRowCount: 48,
	};
	const publication = {
		schemaId: DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID,
		generation: 1,
		status: 'ready',
		sceneOrdinal: 0,
		representativeSolarZenithDegrees: 0,
		requiredBlockIds: ['block:0'],
		residentSlots: [slot],
		rowAddressTable,
		altitudeLedgerTable,
	};
	return {rowAddressTable, altitudeLedgerTable, slot, publication};
}
