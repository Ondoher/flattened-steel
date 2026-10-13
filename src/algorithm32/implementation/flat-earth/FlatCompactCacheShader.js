import DistanceMath from '../../math/DistanceMath.js';
import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';

/** Geometry-owned ragged positions, support and radial frames shared by compact construction and lookup.
 *
 * @implements {CacheBuildContributor}
 */
export class FlatCompactCacheShader {
	/** Accepted physical geometry and domain owners. @type {FlatCompactCacheShaderDefinition} */
	_definition;

	/** Creates geometry shader semantics from an already qualified explicit topology.
	 *
	 * @param {FlatCompactCacheShaderDefinition} definition - Geometry and executable domains.
	 */
	constructor(definition) {
		this._definition = definition;
	}

	/** Called by source emission to preserve a binary64 physical constant as a GLSL float literal.
	 *
	 * @param {number} value - Finite accepted scalar.
	 * @returns {string} - Decimal shader literal.
	 */
	_literal(value) {
		return Number.isInteger(value) ? value + '.0' : value.toPrecision(17);
	}

	/** Call this method to declare actual position and direction resources; no rectangular axes are fabricated.
	 *
	 * @returns {CacheBinding[]} - Scalar R32F data declarations.
	 */
	createBindings() {
		let {geometry, topology, incomingDirections, outgoingDirections} = this._definition;
		let nodes = topology.nodes.map((node) =>
			geometry.resolveCompactLocalSunCacheNodePosition({topology, positionIndex: node.index}),
		);
		let definitions = [
			{
				id: 'compact-positions',
				quantity: 'physical-position',
				units: 'meters',
				shape: [3, nodes.length],
				values: nodes.flatMap((node) => node.coordinates),
			},
			{
				id: 'compact-excesses',
				quantity: 'euclidean-radius-excess',
				units: 'meters',
				shape: [topology.positionCount],
				values: topology.nodes.map((node) => DistanceMath.toMeters(node.radiusExcess)),
			},
			{
				id: 'compact-incoming',
				quantity: 'unit-direction',
				units: '1',
				shape: [3, incomingDirections.directionCount],
				values: incomingDirections.unitVectors.flat(),
			},
			{
				id: 'compact-outgoing',
				quantity: 'unit-direction',
				units: '1',
				shape: [3, outgoingDirections.directionCount],
				values: outgoingDirections.unitVectors.flat(),
			},
			{
				id: 'compact-incoming-weights',
				quantity: 'solid-angle-weight',
				units: 'steradians',
				shape: [incomingDirections.directionCount],
				values: incomingDirections.integrationWeights.values,
			},
		];
		let names = [
			'uCompactPositions',
			'uCompactExcesses',
			'uCompactIncoming',
			'uCompactOutgoing',
			'uCompactIncomingWeights',
		];
		return definitions.map((definition, index) => ({
			spec: {
				id: definition.id,
				name: names[index],
				kind: /** @type {const} */ ('data'),
				shaderType: 'sampler2D',
				frequency: /** @type {const} */ ('build'),
			},
			value: CacheValues.createData(definition),
		}));
	}

	/** Call this method to emit shared complete spatial support and per-tap W27 angular support.
	 * Outside support produces a nonfinite sentinel rather than missing-tap renormalization.
	 *
	 * @returns {string} - Geometry-owned GLSL functions and physical constants.
	 */
	createSource() {
		let {geometry, topology} = this._definition;
		let source = geometry.configuration.sourcePosition.coordinates;
		let radial = geometry.configuration.cacheRadialFallbackDirection;
		let rows = topology.rows;
		let literals = (values) => values.map((value) => this._literal(value)).join(',');
		return `
struct CompactPositionStencil { ivec4 indices; vec4 weights; };
struct CompactDirectionStencil { ivec4 indices; vec4 weights; };
struct CompactRay { vec3 origin; vec3 direction; float lengthMeters; bool endsOnCylinder; };
const vec3 COMPACT_SOURCE = vec3(${literals(source)});
const vec3 COMPACT_RADIAL = vec3(${literals(radial)});
const float COMPACT_TOP = ${this._literal(DistanceMath.toMeters(topology.atmosphereTop))};
const float COMPACT_RADIUS = ${this._literal(DistanceMath.toMeters(topology.coverageRadius))};
const int COMPACT_ROW_COUNT = ${rows.length};
const float COMPACT_Z[${rows.length}] = float[${rows.length}](${literals(rows.map((row) => DistanceMath.toMeters(row.altitude)))});
const int COMPACT_OFFSET[${rows.length}] = int[${rows.length}](${rows.map((row) => row.offset).join(',')});
const int COMPACT_COUNT[${rows.length}] = int[${rows.length}](${rows.map((row) => row.count).join(',')});
float cacheAltitude(vec3 position) { return position.z; }
float compactNodeExcess(int index) { return texelFetch(uCompactExcesses,ivec2(index,0),0).r; }
vec3 compactPosition(int index) {
	return vec3(texelFetch(uCompactPositions,ivec2(0,index),0).r,texelFetch(uCompactPositions,ivec2(1,index),0).r,texelFetch(uCompactPositions,ivec2(2,index),0).r);
}
float compactRho(vec3 position) { return length(position.xy-COMPACT_SOURCE.xy); }
vec3 compactRadial(vec3 position) {
	vec3 radial = vec3(position.xy-COMPACT_SOURCE.xy,0.0);
	float magnitude = length(radial);
	return magnitude <= 1.0e-10 ? COMPACT_RADIAL : radial/magnitude;
}
vec3 compactPhysicalDirection(vec3 localDirection, vec3 position) {
	vec3 radial = compactRadial(position);
	return radial*localDirection.x + vec3(-radial.y,radial.x,0.0)*localDirection.y + vec3(0.0,0.0,localDirection.z);
}
vec3 compactDirection(sampler2D directions, int index, vec3 position) {
	vec3 localDirection = vec3(texelFetch(directions,ivec2(0,index),0).r,texelFetch(directions,ivec2(1,index),0).r,texelFetch(directions,ivec2(2,index),0).r);
	return compactPhysicalDirection(localDirection,position);
}
float compactBoundary(vec3 position, vec3 direction, out bool cylinder) {
	float selected = -1.0; cylinder = false;
	if(direction.z < -1.0e-9) selected = max(0.0,-position.z/direction.z);
	if(direction.z > 1.0e-9) selected = max(0.0,(COMPACT_TOP-position.z)/direction.z);
	vec2 offset = (position.xy-COMPACT_SOURCE.xy)/COMPACT_RADIUS;
	float horizontalSquared = dot(direction.xy,direction.xy);
	if(horizontalSquared > 1.0e-18) {
		float rho = compactRho(position);
		float linear = dot(offset,direction.xy);
		float inside = ((COMPACT_RADIUS-rho)/COMPACT_RADIUS)*(1.0+rho/COMPACT_RADIUS);
		float root = sqrt(max(0.0,linear*linear+horizontalSquared*inside));
		float distance = (linear >= 0.0 ? (inside==0.0 ? 0.0 : inside/(root+linear)) : (-linear+root)/horizontalSquared)*COMPACT_RADIUS;
		if(distance >= -1.0e-7 && (selected < 0.0 || distance < selected)) { selected=max(0.0,distance); cylinder=true; }
	}
	return max(0.0,selected);
}
CompactRay compactRay(int positionIndex,int directionIndex) {
	vec3 origin=compactPosition(positionIndex);
	vec3 direction=compactDirection(uCompactIncoming,directionIndex,origin);
	bool cylinder; float distance=compactBoundary(origin,direction,cylinder);
	return CompactRay(origin,direction,distance,cylinder);
}
void compactRow(float excess,int row,out int lower,out int upper,out float weight) {
	int first=COMPACT_OFFSET[row];int last=first+COMPACT_COUNT[row]-1;
	lower=first;upper=first;weight=0.0;
	if(excess<=compactNodeExcess(first))return;
	if(excess>=compactNodeExcess(last)) {lower=last;upper=last;return;}
	lower=first;upper=last;
	for(int iteration=0;iteration<${Math.ceil(Math.log2(Math.max(...rows.map((row) => row.count))))};++iteration) {
		if(upper-lower<=1)break;
		int middle=(lower+upper)/2;
		if(excess<=compactNodeExcess(middle))upper=middle;else lower=middle;
	}
	weight=(excess-compactNodeExcess(lower))/(compactNodeExcess(upper)-compactNodeExcess(lower));
}
CompactPositionStencil compactPositionStencil(float rho,float altitude) {
	int lowerRow=0;int upperRow=0;float upperWeight=0.0;
	if(altitude>=COMPACT_Z[COMPACT_ROW_COUNT-1]) {lowerRow=COMPACT_ROW_COUNT-1;upperRow=lowerRow;}
	else if(altitude>COMPACT_Z[0])for(int row=1;row<COMPACT_ROW_COUNT;++row)if(altitude<=COMPACT_Z[row]) {
		lowerRow=row-1;upperRow=row;upperWeight=(altitude-COMPACT_Z[lowerRow])/(COMPACT_Z[upperRow]-COMPACT_Z[lowerRow]);break;
	}
	float axisDistance=COMPACT_SOURCE.z-altitude;
	float excess=rho==0.0 ? 0.0 : rho*(rho/(length(vec2(rho,axisDistance))+axisDistance));
	float lowerExcess=excess+COMPACT_Z[lowerRow]-altitude;
	float upperExcess=excess+COMPACT_Z[upperRow]-altitude;
	if(upperWeight>0.0 && upperWeight<1.0) {
		float upperMaximum=compactNodeExcess(COMPACT_OFFSET[upperRow]+COMPACT_COUNT[upperRow]-1);
		if(lowerExcess<0.0) {lowerExcess=0.0;upperExcess=excess/upperWeight;}
		else if(upperExcess>upperMaximum) {upperExcess=upperMaximum;lowerExcess=(excess-upperWeight*upperMaximum)/(1.0-upperWeight);}
	}
	int lowerA;int lowerB;int upperA;int upperB;float lowerRadialWeight;float upperRadialWeight;
	compactRow(lowerExcess,lowerRow,lowerA,lowerB,lowerRadialWeight);
	compactRow(upperExcess,upperRow,upperA,upperB,upperRadialWeight);
	vec4 weights=vec4((1.0-upperWeight)*(1.0-lowerRadialWeight),(1.0-upperWeight)*lowerRadialWeight,upperWeight*(1.0-upperRadialWeight),upperWeight*upperRadialWeight);
	if(rho<0.0 || rho>COMPACT_RADIUS || altitude<0.0 || altitude>COMPACT_TOP) weights=vec4(uintBitsToFloat(0x7fc00000u));
	return CompactPositionStencil(ivec4(lowerA,lowerB,upperA,upperB),weights);
}
CompactDirectionStencil compactDirectionStencil(vec3 position,vec3 physicalDirection,bool axis) {
	vec3 radial=compactRadial(position);
	vec3 direction=axis ? vec3(length(physicalDirection.xy),0.0,physicalDirection.z) : vec3(dot(physicalDirection,radial),dot(physicalDirection,vec3(-radial.y,radial.x,0.0)),physicalDirection.z);
	direction=normalize(direction);
	int face=0;float projection=direction.x;
	if(-direction.x>projection){projection=-direction.x;face=1;}
	if(direction.y>projection){projection=direction.y;face=2;}
	if(-direction.y>projection){projection=-direction.y;face=3;}
	if(direction.z>projection){projection=direction.z;face=4;}
	if(-direction.z>projection){face=5;}
	float denominator;vec2 coordinate;
	if(face==0){denominator=max(direction.x,1.0e-30);coordinate=direction.yz/denominator;}
	else if(face==1){denominator=max(-direction.x,1.0e-30);coordinate=vec2(-direction.y,direction.z)/denominator;}
	else if(face==2){denominator=max(direction.y,1.0e-30);coordinate=vec2(-direction.x,direction.z)/denominator;}
	else if(face==3){denominator=max(-direction.y,1.0e-30);coordinate=direction.xz/denominator;}
	else if(face==4){denominator=max(direction.z,1.0e-30);coordinate=direction.xy/denominator;}
	else {denominator=max(-direction.z,1.0e-30);coordinate=vec2(-direction.x,direction.y)/denominator;}
	vec2 grid=clamp((clamp(coordinate,-1.0,1.0)+1.0)*13.0,0.0,26.0);
	vec2 nearest=floor(grid+0.5);bvec2 exact=lessThanEqual(abs(grid-nearest),vec2(1.0e-10));
	ivec2 lower=ivec2(exact.x ? nearest.x : floor(grid.x),exact.y ? nearest.y : floor(grid.y));
	ivec2 upper=ivec2(exact.x ? lower.x : min(lower.x+1,26),exact.y ? lower.y : min(lower.y+1,26));
	vec2 fraction=vec2(exact.x ? 0.0 : grid.x-float(lower.x),exact.y ? 0.0 : grid.y-float(lower.y));
	int offset=face*729;
	return CompactDirectionStencil(ivec4(offset+lower.y*27+lower.x,offset+lower.y*27+upper.x,offset+upper.y*27+lower.x,offset+upper.y*27+upper.x),vec4((1.0-fraction.x)*(1.0-fraction.y),fraction.x*(1.0-fraction.y),(1.0-fraction.x)*fraction.y,fraction.x*fraction.y));
}`;
	}

	/** Call this method to contribute compact geometry semantics to construction.
	 *
	 * @param {CacheBuildContext} _context - Accepted pass context.
	 * @returns {CacheBuildModule} - Geometry contributor with declared auxiliary data.
	 */
	createCacheModule(_context) {
		return CacheBuildModules.createBuildModule({
			id: 'flat-compact-cache-geometry-v1',
			owner: 'geometry',
			provides: ['geometry.compactCache'],
			requires: [],
			blocks: [{id: 'flat-compact-cache-geometry', phase: 'function', order: 0, source: this.createSource()}],
			bindings: this.createBindings(),
		});
	}
}
