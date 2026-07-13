import { sha256Descriptor } from '../../descriptors/descriptorSupport.js';
import { createScalarArrayTextureLayout } from '../ScalarArrayTextureLayout.js';
import {
	createCacheBuildModule,
	createCacheOwnerIdentity,
	createCachePlanIdentity,
} from '../gpu/cacheBuildContracts.js';

export const STELLAR_POINT_SET_CACHE_VALUE_KEY = 'cache.stellarPointSetIrradiance';

function positiveInteger(value, label) {
	if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${label} must be a positive integer.`);
	return value;
}

function requireSource(source) {
	if (!source || typeof source.describeStaticIdentity !== 'function' || typeof source.createTransportMembers !== 'function') throw new TypeError('Tiled star cache requires a packet-owning stellar source.');
	return source;
}

/**
 * Geometry-owned, bounded packing of transported stellar point fields.
 * Tiles retain the established `(u,h,wavelength)` samples; placement and
 * rotation are intentionally absent because they are live geometry state.
 */
export class TiledStarPointSetCache {
	constructor({ source, pointCache, capacity = 512, tileColumns = 32, tileRows = 16 }) {
		this.source = requireSource(source);
		if (!pointCache?.domain || !Array.isArray(pointCache.members) || !(pointCache.memberFields instanceof Map)) throw new TypeError('Tiled star cache requires a complete CPU point-set cache.');
		this.capacity = positiveInteger(capacity, 'Star cache capacity');
		this.tileColumns = positiveInteger(tileColumns, 'Star cache tile columns');
		this.tileRows = positiveInteger(tileRows, 'Star cache tile rows');
		if (this.tileColumns * this.tileRows !== this.capacity) throw new RangeError('Star cache tile grid must exactly cover capacity.');
		this.members = Object.freeze([...pointCache.members]);
		if (this.members.length !== 500 || this.members.length > this.capacity) throw new RangeError('Tiled stellar cache requires exactly 500 active members within capacity.');
		const sourceMembers = this.source.createTransportMembers();
		if (new Set(sourceMembers.map((member) => member.memberId)).size !== this.members.length || this.members.some((member) => !sourceMembers.some((sourceMember) => sourceMember.memberId === member.memberId))) throw new RangeError('CPU point-set members must exactly match the stellar source roster.');
		this.directionCount = pointCache.domain.uNodes.length;
		this.positionCount = pointCache.domain.altitudeNodesMeters.length;
		this.wavelengthCount = pointCache.channelCount;
		this.layout = createScalarArrayTextureLayout({
			id: 'stellar-point-set-tiled-r32f-layout-v1',
			directionCount: this.tileColumns * this.directionCount,
			positionCount: this.tileRows * this.positionCount,
			wavelengthCount: this.wavelengthCount,
		});
		this.memberTiles = new Map(this.members.map((member, memberIndex) => [member.memberId, Object.freeze({
			memberId: member.memberId, memberIndex, tileX: memberIndex % this.tileColumns, tileY: Math.floor(memberIndex / this.tileColumns),
		})]));
		if (typeof this.source.describeCanonicalPointDirections !== 'function') throw new TypeError('Tiled stellar cache requires canonical source directions.');
		const directions = this.source.describeCanonicalPointDirections();
		if (directions.length !== this.members.length || new Set(directions.map((direction) => direction.memberId)).size !== this.members.length) throw new RangeError('Tiled stellar cache directions must exactly cover the source roster.');
		this.canonicalDirections = Object.freeze(this.members.map((member) => {
			const direction = directions.find((value) => value.memberId === member.memberId);
			if (!direction || direction.frameId !== 'celestial-rh-v1' || !Array.isArray(direction.direction) || direction.direction.length !== 3) throw new RangeError('Tiled stellar cache requires celestial-rh-v1 unit directions.');
			return Object.freeze([...direction.direction]);
		}));
		this.values = new Float32Array(this.layout.shape.direction * this.layout.shape.position * this.wavelengthCount);
		for (const member of this.members) {
			const tile = this.memberTiles.get(member.memberId);
			const field = pointCache.memberFields.get(member.memberId);
			for (let h = 0; h < this.positionCount; h += 1) for (let u = 0; u < this.directionCount; u += 1) for (let wavelength = 0; wavelength < this.wavelengthCount; wavelength += 1) {
				this.values[this.offset(member.memberId, u, h, wavelength)] = field.data[((h * this.directionCount + u) * this.wavelengthCount) + wavelength];
			}
		}
		this.fieldIdentity = sha256Descriptor({
			kind: 'stellar-point-set-tiled-field-v1', source: this.source.describeStaticIdentity(), pointFieldIdentity: pointCache.fieldIdentity,
			capacity: this.capacity, tileColumns: this.tileColumns, tileRows: this.tileRows,
			memberIds: this.members.map((member) => member.memberId), layout: this.layout.contentHash,
		});
	}

	tileForMember(memberId) {
		const tile = this.memberTiles.get(memberId);
		if (!tile) throw new RangeError(`Unknown tiled star member: ${memberId}.`);
		return tile;
	}

	offset(memberId, directionIndex, positionIndex, wavelengthIndex) {
		if (!Number.isInteger(directionIndex) || directionIndex < 0 || directionIndex >= this.directionCount) throw new RangeError('Star direction index is outside its tile.');
		if (!Number.isInteger(positionIndex) || positionIndex < 0 || positionIndex >= this.positionCount) throw new RangeError('Star position index is outside its tile.');
		if (!Number.isInteger(wavelengthIndex) || wavelengthIndex < 0 || wavelengthIndex >= this.wavelengthCount) throw new RangeError('Star wavelength index is outside its cache.');
		const tile = this.tileForMember(memberId);
		const x = tile.tileX * this.directionCount + directionIndex;
		const y = tile.tileY * this.positionCount + positionIndex;
		return ((wavelengthIndex * this.layout.shape.position + y) * this.layout.shape.direction) + x;
	}

	read(memberId, directionIndex, positionIndex, wavelengthIndex) {
		return this.values[this.offset(memberId, directionIndex, positionIndex, wavelengthIndex)];
	}

	isUnusedTileZero() {
		for (let memberIndex = this.members.length; memberIndex < this.capacity; memberIndex += 1) {
			const tileX = memberIndex % this.tileColumns;
			const tileY = Math.floor(memberIndex / this.tileColumns);
			for (let wavelength = 0; wavelength < this.wavelengthCount; wavelength += 1) for (let h = 0; h < this.positionCount; h += 1) for (let u = 0; u < this.directionCount; u += 1) {
				const offset = ((wavelength * this.layout.shape.position + tileY * this.positionCount + h) * this.layout.shape.direction) + tileX * this.directionCount + u;
				if (this.values[offset] !== 0) return false;
			}
		}
		return true;
	}
}

/** Create the cache-render plan that copies the CPU-owned transport field to R32F. */
export function createTiledStarPointSetGpuBuildPlan({ tiledCache }) {
	if (!(tiledCache instanceof TiledStarPointSetCache)) throw new TypeError('GPU star plan requires a tiled stellar point cache.');
	const layout = tiledCache.layout;
	const field = {
		id: 'stellar-point-set-tiled-r32f',
		storage: { format: 'R32F', width: layout.shape.direction, height: layout.shape.position, layers: layout.shape.wavelength },
		descriptor: {
			kind: 'stellar-point-set-irradiance-tile-field', id: 'stellar-point-set-tiled-r32f-field-v1',
			quantity: 'irradiance-density', units: 'W m^-2 nm^-1', precision: 'binary32', layout,
			contentHash: sha256Descriptor({ tiledFieldIdentity: tiledCache.fieldIdentity, layout: layout.contentHash }),
		},
	};
	// The values are a runtime binary32 realization of `fieldIdentity`; hashing
	// a million-scalar copy would duplicate that source/template/packet identity
	// without adding an invalidation input.
	const packedField = {
		id: 'stellar-point-set-tiled-packed-field-v1', quantity: 'irradiance-density', units: 'W m^-2 nm^-1',
		shape: [field.storage.width, field.storage.height, field.storage.layers], values: tiledCache.values,
		contentHash: tiledCache.fieldIdentity,
	};
	const pass = {
		id: 'stellar-point-set-tiled-r32f-copy', kind: 'stellar-point-set-copy', order: 1, inputs: [], output: field.id,
		modules: [createCacheBuildModule({
			id: 'stellar-point-set-tiled-r32f-copy-module-v1', owner: 'cache', provides: ['cache.stellarPointSetIrradiance'], requires: [],
			bindings: [{ spec: { id: 'stellar-point-set-tiled-packed-field', name: 'uStellarPointSetPackedField', kind: 'data', shaderType: 'sampler2DArray', frequency: 'build' }, value: packedField }],
			blocks: [{ id: 'stellar-point-set-tiled-r32f-copy-main', phase: 'main', order: 0, source: 'a32CacheOutput = texelFetch(uStellarPointSetPackedField, ivec3(int(gl_FragCoord.x), int(gl_FragCoord.y), a32CacheWavelengthLayer), 0).r;' }],
		})],
	};
	return {
		identity: createCachePlanIdentity('stellar-point-set-tiled-r32f-plan-v1', [field], [pass]),
		descriptorDefinition: {
			id: 'stellar-point-set-tiled-gpu-cache-v1', field: field.descriptor,
			incomingDirectionDomain: { id: 'stellar-point-set-member-tile-domain-v1', contentHash: sha256Descriptor({ capacity: tiledCache.capacity, tileColumns: tiledCache.tileColumns, tileRows: tiledCache.tileRows, memberIds: tiledCache.members.map((member) => member.memberId) }) },
			controls: { id: 'stellar-point-set-static-transport-controls-v1', contentHash: tiledCache.fieldIdentity },
			constructionIdentities: { source: createCacheOwnerIdentity('lightSource', 'stellar-point-set-source-v1', [pass]), atmosphere: { id: 'stellar-point-set-cpu-transport-v1', contentHash: tiledCache.fieldIdentity }, geometry: { id: 'stellar-point-set-tile-geometry-v1', contentHash: tiledCache.fieldIdentity } },
		},
		fields: [field], passes: [pass], result: field.id, runtimeValueKey: STELLAR_POINT_SET_CACHE_VALUE_KEY,
	};
}

export default TiledStarPointSetCache;
