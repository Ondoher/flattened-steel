import assert from 'node:assert/strict';
import {phaseMoments} from './phase-moments.mjs';

/** Exact spherical squared norm of the registered piecewise-linear cosine PDF.
 * Integrate each squared linear polynomial, then divide by2*pi. This is an
 * independent aligned-source phase-convolution manufacture, not atmospheric light.
 * @param {any} table @returns {number} */
export function phaseSquareNorm(table) {
 assert.ok(table&&table.mu.length===table.pdf.length);
 let norm=0;
 for(let i=1;i<table.mu.length;i++) {
  const a=table.pdf[i-1],b=table.pdf[i];
  norm+=(table.mu[i]-table.mu[i-1])*(a*a+a*b+b*b)/(6*Math.PI);
 }
 return norm;
}

/** At aligned source/outgoing axes all Legendre products are positive; the
 * exact squared norm minus the partial sum measures the missing phase-only tail.
 * It does not bound the error for an arbitrary spatially varying illumination.
 * @param {any} table @param {number[]} levels @returns {any} */
export function phaseTail(table,levels) {
 const exact=phaseSquareNorm(table),a=phaseMoments(table,Math.max(...levels)),rows=[];
 let sum=0;
 for(let l=0;l<a.length;l++) {
  sum+=(2*l+1)*a[l]*a[l]/(4*Math.PI);
  if(levels.includes(l))rows.push({L:l,partial:sum,tail:exact-sum,relativeTail:(exact-sum)/exact});
 }
 return {exact,rows};
}
