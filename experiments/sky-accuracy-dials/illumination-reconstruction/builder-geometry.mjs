import assert from 'node:assert/strict';
import {make} from '../structured-incoming/factory.mjs';
import {cells} from '../phase-cells/geometry.mjs';
import {sourceFrame,dot} from '../numerics/math.js';
import {models,phases,physical} from './common.mjs';
import {polarUnion} from './polar-union.mjs';

/** Construct an actual canonical-world receiver independently of any retained
 * probe packet. The Sun remains world+Z; incoming light directions are local
 * look directions. This prepares geometry only, never oracle light.
 * @param {number} radius @param {number} altitude @param {number} zenithDegrees
 * @param {string} id @returns {any} */
export function builderTarget(radius,altitude,zenithDegrees,id){
 assert.ok(radius>0&&altitude>=0&&Number.isFinite(altitude)&&zenithDegrees>=0&&zenithDegrees<=180);
 const angle=zenithDegrees*Math.PI/180;
 const point=/** @type {[number,number,number]} */ ([(radius+altitude)*Math.sin(angle),0,(radius+altitude)*Math.cos(angle)]),axes=sourceFrame(point),axis=axes.map(a=>dot(a,[0,0,1]));
 return {id,kind:'contained-builder-row',point,altitude,zenithDegrees,axis};
}

/** Build the registered64x64 original and fixed full128-proposal union without
 * opening a retained incident-radiance or physical-reference packet. Active
 * medium and spectral material belong to the supplied profile. No outgoing
 * direction controls the incoming topology. @param {any} profile
 * @param {any} target @param {number} channel @param {any} config
 * @returns {any} */
export function builderGeometry(profile,target,channel,config){
 assert.ok(Number.isInteger(channel)&&channel>=0&&channel<profile.control.medium.rayleigh.length);
 assert.equal(config.kind,'Bboth');assert.equal(config.mu,64);assert.equal(config.phi,64);assert.equal(config.k,.5);
 const g=make(config,target,profile.control.medium.radius,1),mesh=cells(g),f={p:profile,t:target,g,mesh,packet:{channel},px:null,bases:null,sourcePhases:null};
 f.px=physical(f);f.bases=models(f);f.sourcePhases=g.nodes.map(d=>phases(f.px,d));
 return {f,union:polarUnion(f,Array(g.rings.length-1).fill(0))};
}

/** Conservative geometric zero-light boundary for atmospheric N1 only.
 * Visible points lie within acos(R/r_receiver)+acos(R/r_point) of the receiver;
 * directly illuminated points have solar zenith <=pi/2+acos(R/r_point).
 * With r_point<=R+top the triangle inequality gives the bound below.
 * It excludes ground reflection, finite-source extent and higher orders.
 * @param {number} radius @param {number} top @param {number} altitude
 * @returns {number} Radians. */
export function atmosphericL1ShadowBound(radius,top,altitude){
 assert.ok(radius>0&&top>=0&&altitude>=0&&altitude<=top);
 return Math.PI/2+Math.acos(radius/(radius+altitude))+2*Math.acos(radius/(radius+top));
}
