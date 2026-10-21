import {registration,setup,phases} from './common.mjs';
import {physical} from '../interior-illumination/physics.mjs';
import {polarUnion} from './polar-union.mjs';

/** Full-proposal geometry is independent of the old twelve-ring allocation;
 * zero scores select reuse bookkeeping only. The node operation is the actual
 * contained direct-L1 GPU operation, not the old compiler trapezoid or Gauss128.
 * @param {number} channel @returns {any} */
export function polarNativeField(channel){
 const base=setup(registration(),'paper','node-89',3),f={...base,packet:{...base.packet,channel}};
 f.px=physical(f);f.sourcePhases=f.g.nodes.map(d=>phases(f.px,d));
 return {f,union:polarUnion(f,Array(f.g.rings.length-1).fill(0))};
}

/** Uniform analytic tail of the physical g=.7 Cornette-Shanks phase kernel.
 * Its positive moments obey a_l <=2C*g^(l-2), C=3/(2*(2+g^2)).
 * This concerns phase-kernel truncation; coefficient integration and floating
 * evaluation retain separate empirical checks. @param {number} L @returns {number} */
export function paperPhaseTail(L){const g=.7,C=3/(2*(2+g*g));return 2*C/(4*Math.PI)*g**(L-1)*((2*L+3)/(1-g)+2*g/(1-g)**2);}
