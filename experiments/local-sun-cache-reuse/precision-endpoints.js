import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';

/** Emit a two-part float constant with approximately 48 significant binary bits.
 * @param {number} value - Finite binary64 physical scalar.
 * @returns {string} - GLSL vec2 high/low expression.
 */
function pair(value) {
	const hi = Math.fround(value),
		lo = Math.fround(value - hi);
	return `vec2(${hi.toExponential(16)}, ${lo.toExponential(16)})`;
}

/** Adapt the owned geometry contribution to compensated observer-centred bounds.
 * Static sphere facts are uploaded as constants; no per-ray CPU endpoints enter GLSL.
 * @param {FlatEarthGeometry} geometry - Fresh configured experiment owner.
 * @returns {void} - Installs a contribution adapter on this instance only.
 */
export function installPrecisionEndpoints(geometry) {
	const original = geometry.createShaderContribution.bind(geometry);
	const facts = geometry.configuration,
		dome = facts.observerCenteredDome;
	if (!dome) throw new Error('Precision adapter requires an observer dome.');
	const extent = dome.maxObserverViewRayExtent.value;
	const z = facts.observerPosition.coordinates[2];
	const ratio = (z - dome.sphereCenter.coordinates[2]) / extent;
	const helper = `
vec3 p2DirectionLow = vec3(0.0);
vec2 p2SelectedEnd = vec2(0.0);
float p2Round(float a) { return uintBitsToFloat(floatBitsToUint(a) & uint(uP2RoundMask)); }
vec2 p2Add(vec2 a, vec2 b) {
 float s=p2Round(a.x+b.x); float v=p2Round(s-a.x);
 float e=p2Round(a.x-p2Round(s-v))+p2Round(b.x-v);
 e=p2Round(e+a.y); e=e+b.y;
 float h=p2Round(s+e); return vec2(h,p2Round(e-p2Round(h-s)));
}
vec2 p2Mul(vec2 a, vec2 b) {
 float c=p2Round(a.x*b.x);
 float ah=uintBitsToFloat(floatBitsToUint(a.x)&0xfffff000u); float al=a.x-ah;
 float bh=uintBitsToFloat(floatBitsToUint(b.x)&0xfffff000u); float bl=b.x-bh;
 float e=p2Round(ah*bh-c);
 e=p2Round(e+ah*bl); e=p2Round(e+al*bh); e=p2Round(e+al*bl);
 e=e+a.x*b.y+a.y*b.x;
 return p2Add(vec2(c,0.0),vec2(e,0.0));
}
vec2 p2Div(vec2 a, vec2 b) {
 float q=a.x/b.x; vec2 r=p2Add(a,-p2Mul(b,vec2(q,0.0)));
 return p2Add(vec2(q,0.0),vec2((r.x+r.y)/b.x,0.0));
}
vec2 p2Sqrt(vec2 a) {
 float q=sqrt(a.x); vec2 r=p2Add(a,-p2Mul(vec2(q,0.0),vec2(q,0.0)));
 return p2Add(vec2(q,0.0),vec2((r.x+r.y)/(2.0*q),0.0));
}
vec2 p2DomeEnd(vec3 direction) {
 vec2 dz=vec2(direction.z,p2DirectionLow.z);
 vec2 b=p2Mul(${pair(ratio)},dz);
 vec2 root=p2Sqrt(p2Add(p2Mul(b,b),vec2(1.0,0.0)));
 vec2 q=b.x>=0.0 ? p2Div(vec2(1.0,0.0),p2Add(root,b)) : p2Add(root,-b);
 return p2Mul(q,${pair(extent)});
}
bool observerDomeBoundaryDistance(vec3 originMeters,vec3 direction,out float distanceMeters) {
 vec2 endpoint=p2DomeEnd(direction); distanceMeters=endpoint.x; return true;
}
void p2ResolveSelectedEnd(vec3 direction,float endpoint,bool sceneEndpoint) {
 vec2 selected=p2DomeEnd(direction);
 if(direction.z>0.000001) {
  vec2 top=p2Div(${pair(facts.topAltitude.value - z)},vec2(direction.z,p2DirectionLow.z));
  if(top.x<selected.x) selected=top;
 }
 if(direction.z< -0.000001) {
  vec2 ground=p2Div(${pair(-z)},vec2(direction.z,p2DirectionLow.z));
  if(ground.x<selected.x) selected=ground;
 }
 if(sceneEndpoint && endpoint<selected.x) selected=vec2(endpoint,0.0);
 p2SelectedEnd=selected;
}
`;
	geometry.createShaderContribution = () => {
		const contribution = original();
		return {
			...contribution,
			id: contribution.id + '-p2-compensated',
			uniforms: [
				...contribution.uniforms,
				{name: 'uP2RoundMask', type: 'int', valueKey: 'experiment.p2RoundMask', defaultValue: -1},
			],
			functions: contribution.functions.map((block) => {
				if (block.id === 'geometry-depth-helper') {
					const begin = block.code.indexOf('bool observerDomeBoundaryDistance(');
					const end = block.code.indexOf('void chooseNearestBoundary(', begin);
					if (begin < 0 || end < 0) throw new Error('Boundary adapter anchor changed.');
					return {...block, code: block.code.slice(0, begin) + helper + block.code.slice(end)};
				}
				if (block.id === 'geometry-path-helper') {
					const anchor = 'return PathBounds(0.0, max(0.0, endDistanceMeters),';
					if (!block.code.includes(anchor)) throw new Error('Path adapter anchor changed.');
					return {
						...block,
						code: block.code.replace(
							anchor,
							'p2ResolveSelectedEnd(ray.direction, endDistanceMeters, hasSceneEndpoint);\n\t' + anchor,
						),
					};
				}
				return block;
			}),
		};
	};
}
