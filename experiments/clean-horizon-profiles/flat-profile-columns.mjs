import {interpolate} from './profile-sampling.mjs';

/** Exact integral of the retained piecewise-linear aerosol density along a flat straight segment.
 * @param {any} profile Frozen ARM model.
 * @param {number} startAltitude Segment start, meters.
 * @param {number} endAltitude Segment end, meters.
 * @param {number} length Segment length, meters.
 * @returns {number} Density column in meters, normalized by surface extinction.
 */
export function flatColumnMeters(profile,startAltitude,endAltitude,length){
 if(![startAltitude,endAltitude,length].every(v=>Number.isFinite(v)&&v>=0))throw Error('Nonnegative finite flat segment required');
 const a=Math.min(startAltitude,endAltitude),b=Math.max(startAltitude,endAltitude),density=h=>interpolate(profile.altitudesMeters,profile.extinction550PerMeter,h)/profile.extinction550PerMeter[0];
 if(a===b)return length*density(a);const knots=[a,...profile.altitudesMeters.filter(h=>h>a&&h<b),b];let area=0;for(let i=1;i<knots.length;i++)area+=(knots[i]-knots[i-1])*(density(knots[i])+density(knots[i-1]))/2;return length*area/(b-a);
}

/** Emit exact flat columns using the same knots and prefix integrals; horizontal rays avoid subtraction.
 * @param {any} profile Frozen ARM model.
 * @returns {string} GLSL, following densityShader's ARM_HEIGHT/ARM_DENSITY declarations.
 */
export function flatColumnShader(profile){
 const z=profile.altitudesMeters,d=profile.extinction550PerMeter.map(v=>v/profile.extinction550PerMeter[0]),area=[0];for(let i=1;i<z.length;i++)area.push(area.at(-1)+(z[i]-z[i-1])*(d[i]+d[i-1])/2);
 return `const float ARM_AREA[${z.length}]=float[](${area.map(v=>v.toExponential(12)).join(',')});
int armColumnCell(float h){int lo=0,hi=${z.length-1};for(int i=0;i<${Math.ceil(Math.log2(z.length))};i++){int mid=(lo+hi)/2;if(h>=ARM_HEIGHT[mid])lo=mid;else hi=mid;}return min(lo,${z.length-2});}
float armAerosolColumn(float z0,float z1,float lengthMeters){
 float lo=min(z0,z1),hi=max(z0,z1),span=hi-lo;
 if(span<0.001)return lengthMeters*0.5*(armAerosolDensity(lo)+armAerosolDensity(hi));
 float top=ARM_HEIGHT[${z.length-1}],a=min(lo,top),b=min(hi,top);int i=armColumnCell(a),j=armColumnCell(b);float value;
 if(i==j)value=(b-a)*0.5*(armAerosolDensity(a)+armAerosolDensity(b));
 else value=(ARM_HEIGHT[i+1]-a)*0.5*(armAerosolDensity(a)+ARM_DENSITY[i+1])+(ARM_AREA[j]-ARM_AREA[i+1])+(b-ARM_HEIGHT[j])*0.5*(ARM_DENSITY[j]+armAerosolDensity(b));
 value+=max(0.0,hi-max(lo,top))*ARM_DENSITY[${z.length-1}];return lengthMeters*max(0.0,value)/span;
}`;
}
