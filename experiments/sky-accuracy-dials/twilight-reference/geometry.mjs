import {createPointStencilBuilder,viewPathIntervals} from '../numerics/view.js';
import {sourceFrame,localDirection,dot,unit} from '../numerics/math.js';

/** Actual 5m observer rays; Sun fixed at world +Z, same relative azimuth as external solver.
 * @param {any} control @returns {any} GPU lookup queries and final-view quadrature.
 */
export function plan(control){
 const queries=[],rays=[],spec=control.request.transportSpec;
 for(const scene of control.scenes)for(const elevation of control.elevations)for(const intervals of [30,120]){
  const theta=scene.zenith*Math.PI/180,up=[Math.sin(theta),0,Math.cos(theta)],radius=spec.planet.bottomRadiusMeters+5;
  const origin=/** @type {SkyVector3} */([up[0]*radius,up[1]*radius,up[2]*radius]),[along,across]=sourceFrame(origin),e=elevation*Math.PI/180,a=control.azimuth*Math.PI/180;
  const direction=unit(up.map((v,i)=>Math.sin(e)*v+Math.cos(e)*(Math.cos(a)*along[i]+Math.sin(a)*across[i])));
  const p=dot(origin,direction),length=(spec.planet.topRadiusMeters-radius)*(spec.planet.topRadiusMeters+radius)/(Math.sqrt(p*p+(spec.planet.topRadiusMeters-radius)*(spec.planet.topRadiusMeters+radius))+p);
  const ray={origin,direction,length},stencil=createPointStencilBuilder(control.request);
  const samples=viewPathIntervals(spec,ray,'quadratic',intervals).map(({start,end})=>{
   const distance=(start+end)/2,point=/** @type {SkyVector3} */([origin[0]+direction[0]*distance,origin[1]+direction[1]*distance,origin[2]+direction[2]*distance]),s=stencil.sample(point,direction,end-start),local=localDirection(point,direction),indices=[];
   for(let h=0;h<s.altitudeWeights.length;h++)for(let z=0;z<4;z++){const c=stencil.coordinates[s.indices[(h*4+z)*s.directionWeights.length]];indices.push(queries.length);queries.push([...local,c.y]);}
   return {...s,indices,directionWeights:[1]};
  });
  rays.push({...ray,samples,witness:{scene:scene.id,elevation,azimuth:control.azimuth,intervals,zenith:scene.zenith}});
 }
 return {queries,rays};
}
