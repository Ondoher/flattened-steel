/** Browser-safe Legendre rule on [0,1]; checked against the retained host rule.
 * @param {number} n Positive node count.
 * @returns {LocalHorizonRule} Nodes and weights, with no transport dependencies.
 */
function gauss(n){
	const nodes=Array(n),weights=Array(n);
	for(let i=0;i<Math.ceil(n/2);i++){
		let z=Math.cos(Math.PI*(i+0.75)/(n+0.5)),derivative=0;
		for(let step=0;step<32;step++){
			let a=1,b=0;
			for(let j=1;j<=n;j++){const c=b;b=a;a=((2*j-1)*z*b-(j-1)*c)/j;}
			derivative=n*(z*a-b)/(z*z-1);const delta=a/derivative;z-=delta;if(Math.abs(delta)<1e-15)break;
		}
		const w=1/((1-z*z)*derivative*derivative);
		nodes[i]=(1-z)/2;nodes[n-i-1]=(1+z)/2;weights[i]=w;weights[n-i-1]=w;
	}return {nodes,weights};
}

/** Generate independent flat point-source N1 transport from physical data only.
 * @param {HorizonReferenceMedium} m Frozen physical packet, spectral densities per nm.
 * @param {number} n Gauss nodes per logarithmic distance segment.
 * @returns {string} GLSL using the caller's ray/domain, never its cache/evaluators.
 */
export function referenceBlock(m, n) {
	const q = gauss(n);
	const array = (name, values) => `const float ${name}[${values.length}]=float[](${values.map(x => Number(x).toExponential(16)).join(',')});`;
	return `${array('lhX', q.nodes)} ${array('lhW', q.weights)}
${array('lhR', m.rayleigh)} ${array('lhM', m.mie)} ${array('lhE', m.sourceIrradiance)}
float lhColumn(float h,float vz,float t,float H){float a=vz*t/H;return exp(-h/H)*t*(abs(a)<0.001?1.0-a/2.0+a*a/6.0:(1.0-exp(-a))/a);}
void lhPath(inout ShaderState state){
 state.pathRadiance=zeroSpectral();state.transmittance=oneSpectral();
 if(!state.bounds.valid)return;
 vec3 o=state.ray.originMeters,v=state.ray.direction;
 float end=state.bounds.endDistanceMeters;
 float edges[7]=float[](0.0,10000.0,50000.0,100000.0,300000.0,1000000.0,end);
 for(int bin=0;bin<6;bin++){
  float a=min(end,edges[bin]),b=min(end,edges[bin+1]);if(b<=a)continue;
  float la=log(1.0+a/1000.0),dz=log(1.0+b/1000.0)-la;
  for(int j=0;j<${n};j++){
   float t=1000.0*(exp(la+dz*lhX[j])-1.0),jac=(t+1000.0)*dz*lhW[j];
   vec3 x=o+v*t,delta=vec3(${m.sourcePosition.join(',')})-x;
   float d=length(delta);vec3 s=delta/d;
   float ts=s.z>0.0?min(d,(${m.topAltitude}.0-x.z)/s.z):d;
   float c=dot(v,s),g=${m.g},pR=3.0*(1.0+c*c)/(16.0*3.141592653589793);
   float pM=3.0*(1.0-g*g)*(1.0+c*c)/(8.0*3.141592653589793*(2.0+g*g)*pow(1.0+g*g-2.0*g*c,1.5));
   float r=exp(-x.z/${m.rayleighHeight}.0),h=exp(-x.z/${m.mieHeight}.0);
   float cr=lhColumn(x.z,s.z,ts,${m.rayleighHeight}.0)+lhColumn(o.z,v.z,t,${m.rayleighHeight}.0);
   float cm=lhColumn(x.z,s.z,ts,${m.mieHeight}.0)+lhColumn(o.z,v.z,t,${m.mieHeight}.0);
   for(int k=0;k<15;k++)state.pathRadiance.channels[k]+=jac*lhE[k]*pow(${m.referenceDistance}.0/d,2.0)*exp(-lhR[k]*cr-lhM[k]*cm)*(lhR[k]*r*pR+lhM[k]*${m.albedo}*h*pM);
  }
 }
 for(int k=0;k<15;k++)state.transmittance.channels[k]=exp(-lhR[k]*lhColumn(o.z,v.z,end,${m.rayleighHeight}.0)-lhM[k]*lhColumn(o.z,v.z,end,${m.mieHeight}.0));
}`;
}
