/** Compose the already qualified authored resident functions in one caller-owned
 * browser dispatch. Source strings come from those modules and are covered by
 * the immutable run's source inventory. No remote/user code is evaluated.
 * @param {any} request @returns {any} */
export function projectionDispatch(request){
 const key='__queryProjectionDispatch';
 if(request.action==='init'){
  const query=Function('return ('+request.querySource+');')(),fourier=Function('return ('+request.fourierSource+');')(),renderer=query({action:'init',shader:request.queryShader});
  fourier({action:'init',L:request.L,shader:request.fourierShader});globalThis[key]={query,fourier};return renderer;
 }
 const s=globalThis[key];if(!s)throw Error('Projection dispatch must be initialized');
 if(request.action==='close'){s.fourier({action:'close'});s.query({action:'close'});globalThis[key]=null;return true;}
 s.query({...request.query,retainLightOnly:true});return s.fourier({count:request.query.count,quadrature:request.quadrature});
}
