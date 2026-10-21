/** Independent experiment-only Gauss rule beyond the inherited256-node helper.
 * Callers validate positive weights and polynomial moments for their degree.
 * @param {number} count @returns {{nodes:number[],weights:number[]}} */
export function extendedGauss(count){
 const nodes=[],weights=[];for(let i=0;i<count;i++){let z=Math.cos(Math.PI*(i+.75)/(count+.5)),derivative=0;for(let iteration=0;iteration<40;iteration++){let p=1,previous=0;for(let j=1;j<=count;j++){const old=p;p=((2*j-1)*z*p-(j-1)*previous)/j;previous=old;}derivative=count*(z*p-previous)/(z*z-1);const next=z-p/derivative;if(Math.abs(next-z)<2e-15){z=next;break;}z=next;}nodes.push((1+z)/2);weights.push(1/((1-z*z)*derivative*derivative));}return {nodes,weights};
}
