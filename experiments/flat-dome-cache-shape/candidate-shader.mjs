import {medium} from './physical.mjs';
import {altitudes} from './topology.mjs';

/**
 * Emits independently implemented deterministic Neumann-order transport for the new cache.
 *
 * @param {DomeDirection[]} angular - Frozen physical directions and solid-angle weights.
 * @param {SkyDirectRule} pathRule - Construction quadrature on logarithmic distance.
 * @param {SkyDirectRule} viewRule - Final-view quadrature on logarithmic distance.
 * @param {number} [betaCount] - Declared source-distance support for a separate diagnostic series.
 * @returns {DomeShaderSources} - Common, build, and physical-view GLSL source.
 */
export function candidateShader(angular, pathRule, viewRule, betaCount = 17) {
	const literal = (n) => Number(n).toExponential(16);
	const floats = (values) => values.map(literal).join(',');
	const packed = (values) =>
		Array.from(
			{length: 4},
			(_, g) => `vec4(${Array.from({length: 4}, (_, k) => literal(values[g * 4 + k] ?? 0)).join(',')})`,
		).join(',');
	const common = `#version 300 es
precision highp float;precision highp int;
uniform sampler2D uPositions,uRows,uPrevious,uSecond,uThird,uFourth,uQueries;
uniform float uSunRadius;uniform int uOrder;
const float PI=3.14159265358979323846,R=20015114.442035925,H=100000.0;
const float C=(H*H-R*R)/(2.0*H),S=H-C;
const int DC=${angular.length},ZC=${altitudes.length},BC=${betaCount};
const float Z[${altitudes.length}]=float[${altitudes.length}](${floats(altitudes)});
const vec4 BR[4]=vec4[4](${packed(medium.rayleigh)});
const vec4 BM[4]=vec4[4](${packed(medium.mie)});
const vec4 SOLAR[4]=vec4[4](${packed(medium.sourceIrradiance)});
const vec3 DIR[${angular.length}]=vec3[${angular.length}](${angular.map((d) => `vec3(${floats(d.vector)})`).join(',')});
const float DW[${angular.length}]=float[${angular.length}](${floats(angular.map((d) => d.weight))});
const int MIRROR[${angular.length}]=int[${angular.length}](${angular.map((d) => d.mirror).join(',')});
float column(float z,float vz,float distance,float scale){
 float a=vz*distance/scale;
 if(abs(a)<0.001)return exp(-max(0.0,z)/scale)*distance*(1.0-a*0.5+a*a/6.0-a*a*a/24.0);
 return scale*(exp(-max(0.0,z)/scale)-exp(-max(0.0,z+vz*distance)/scale))/vz;
}
vec4 extinction(vec3 p,int g){return BR[g]*exp(-max(0.0,p.z)/8000.0)+BM[g]*exp(-max(0.0,p.z)/1200.0);}
vec4 transmission(vec3 p,vec3 v,float d,int g){return exp(-BR[g]*column(p.z,v.z,d,8000.0)-BM[g]*column(p.z,v.z,d,1200.0));}
vec2 phases(float mu){return vec2(3.0*(1.0+mu*mu)/(16.0*PI),3.0*(1.0-0.49)*(1.0+mu*mu)/(8.0*PI*2.49*pow(1.49-1.4*mu,1.5)));}
float capDistance(vec3 p){
 float rn=length(p.xy)/R,Zp=p.z/H,k=H/R;
 float f=(1.0-rn)*(1.0+rn)-Zp*(1.0+k*k*(Zp-1.0));
 return f*(R/(S+length(vec2(length(p.xy),p.z-C))))*R;
}
float radiusAt(float z,float d){return sqrt(max(0.0,(H-z-d)*(S+z-C-d)));}
float capExit(vec3 p,vec3 v){
 vec2 xy=p.xy/R;float k=H/R,z=p.z/H;
 float a=k*k*dot(v,v),b=k*dot(xy,v.xy)+v.z*(0.5*(1.0-k*k)+k*k*z);
 float rn=length(xy),c=(rn-1.0)*(rn+1.0)+z*(1.0+k*k*(z-1.0));
 float discriminant=b*b-a*c;if(discriminant<0.0)return 0.0;
 float root=sqrt(max(0.0,discriminant)),q=-b-(b<0.0?-root:root);
 float t0=q==0.0?0.0:q/a,t1=q==0.0?0.0:c/q;
 float result=max(0.0,max(t0,t1)*H);
 // Callers supply cap-interior samples. A ground hit before sphere exit is
 // necessarily on the finite disk; a second rounded radius test loses rim contacts.
 if(v.z<0.0){float ground=-p.z/v.z;if(ground>=0.0&&ground<=result)result=ground;}
 return result;
}
vec4 firstSource(vec3 p,vec3 outgoing,int g){
 vec3 delta=vec3(uSunRadius,0.0,4828032.0)-p;
 float distance=length(delta);vec3 sun=delta/distance;
 float end=min(distance,capExit(p,sun));
 vec2 phase=phases(dot(sun,outgoing));
 vec4 density=BR[g]*exp(-max(0.0,p.z)/8000.0)*phase.x+0.8*BM[g]*exp(-max(0.0,p.z)/1200.0)*phase.y;
 return SOLAR[g]*pow(4800000.0/distance,2.0)*transmission(p,sun,end,g)*density/max(extinction(p,g),vec4(1e-30));
}
vec4 rowSample(sampler2D field,int zi,int bi,float gamma,int direction,int g){
 vec4 row=texelFetch(uRows,ivec2(bi,zi),0);int offset=int(row.x),count=int(row.y);
 float target=mix(row.z,row.w,gamma);int lo=0,hi=count-1;
 for(int iteration=0;iteration<16;iteration++){
  if(hi-lo<=1)break;int middle=(lo+hi)/2;
  if(texelFetch(uPositions,ivec2(0,offset+middle),0).w>=target)hi=middle;else lo=middle;
 }
 float dl=texelFetch(uPositions,ivec2(0,offset+lo),0).w;
 float dh=texelFetch(uPositions,ivec2(0,offset+hi),0).w;
 float weight=dh>dl?clamp((target-dl)/(dh-dl),0.0,1.0):0.0;
 return mix(texelFetch(field,ivec2(direction*4+g,offset+lo),0),texelFetch(field,ivec2(direction*4+g,offset+hi),0),weight);
}
vec4 fieldSample(sampler2D field,vec3 p,int direction,int g){
 if(p.y<0.0){p.y=-p.y;direction=MIRROR[direction];}
 float z=clamp(p.z,0.0,H),rmax=radiusAt(z,0.0);
 float rho=length(p.xy-vec2(uSunRadius,0.0));
 float rhoMin=max(0.0,uSunRadius-rmax),rhoMax=uSunRadius+rmax;
 float beta=rhoMax>rhoMin?clamp((rho-rhoMin)/(rhoMax-rhoMin),0.0,1.0):0.0;
 float rmin=abs(uSunRadius-rho),rhigh=min(rmax,uSunRadius+rho);
 float lower=max(0.0,capDistance(vec3(rhigh,0,z))),upper=max(lower,capDistance(vec3(rmin,0,z)));
 float gamma=upper>lower+1e-5?clamp((capDistance(p)-lower)/(upper-lower),0.0,1.0):0.0;
 int za=0,zb=0;for(int i=1;i<ZC;i++){if(z>=Z[i]){za=i;zb=i;}else{zb=i;break;}}
 float zw=zb>za?(z-Z[za])/(Z[zb]-Z[za]):0.0;
 float bi=beta*float(BC-1);int ba=int(floor(bi)),bb=min(ba+1,BC-1);float bw=bi-float(ba);
 vec4 lowerValue=mix(rowSample(field,za,ba,gamma,direction,g),rowSample(field,za,bb,gamma,direction,g),bw);
 vec4 upperValue=mix(rowSample(field,zb,ba,gamma,direction,g),rowSample(field,zb,bb,gamma,direction,g),bw);
 return mix(lowerValue,upperValue,zw);
}
vec4 angularSample(sampler2D field,vec3 p,vec3 v,int g){
 vec3 scores=vec3(-2);ivec3 indices=ivec3(0);
 for(int i=0;i<DC;i++){float score=dot(v,DIR[i]);if(score>scores.x){scores=vec3(score,scores.xy);indices=ivec3(i,indices.xy);}else if(score>scores.y){scores.yz=vec2(score,scores.y);indices.yz=ivec2(i,indices.y);}else if(score>scores.z){scores.z=score;indices.z=i;}}
 vec3 weights=1.0/max(vec3(1e-8),vec3(1)-scores);weights/=dot(weights,vec3(1));
 return weights.x*fieldSample(field,p,indices.x,g)+weights.y*fieldSample(field,p,indices.y,g)+weights.z*fieldSample(field,p,indices.z,g);
}
`;
	const build =
		common +
		`
layout(location=0)out vec4 outputValue;
const float P[${pathRule.nodes.length}]=float[${pathRule.nodes.length}](${floats(pathRule.nodes)});
const float W[${pathRule.nodes.length}]=float[${pathRule.nodes.length}](${floats(pathRule.weights)});
void main(){
 int columnIndex=int(gl_FragCoord.x),node=int(gl_FragCoord.y),direction=columnIndex/4,g=columnIndex%4;
 vec3 point=texelFetch(uPositions,ivec2(0,node),0).xyz,outgoing=DIR[direction];
 vec4 r=BR[g]*exp(-point.z/8000.0),m=BM[g]*exp(-point.z/1200.0),result=vec4(0);
 for(int k=0;k<DC;k++){
  vec3 incoming=DIR[k];float end=capExit(point,incoming),logEnd=log(1.0+end/1000.0);vec4 radiance=vec4(0);
  for(int j=0;j<${pathRule.nodes.length};j++){
   float distance=1000.0*(exp(logEnd*P[j])-1.0);vec3 samplePoint=point+distance*incoming;
   vec4 f=uOrder==2?firstSource(samplePoint,incoming,g):fieldSample(uPrevious,samplePoint,k,g);
   radiance+=W[j]*(distance+1000.0)*logEnd*transmission(point,incoming,distance,g)*extinction(samplePoint,g)*f;
  }
  vec2 phase=phases(dot(outgoing,incoming));result+=DW[k]*(r*phase.x+0.8*m*phase.y)*radiance;
 }
 outputValue=result/max(r+m,vec4(1e-30));
}
`;
	const view =
		common +
		`
layout(location=0)out vec4 o1;layout(location=1)out vec4 o2;layout(location=2)out vec4 o3;layout(location=3)out vec4 o4;
const float P[${viewRule.nodes.length}]=float[${viewRule.nodes.length}](${floats(viewRule.nodes)});
const float W[${viewRule.nodes.length}]=float[${viewRule.nodes.length}](${floats(viewRule.weights)});
void main(){
 int g=int(gl_FragCoord.x),index=int(gl_FragCoord.y);vec4 origin=texelFetch(uQueries,ivec2(0,index),0),direction=texelFetch(uQueries,ivec2(1,index),0);
 vec3 start=origin.xyz+origin.w*direction.xyz;float lengthMeters=max(0.0,direction.w-origin.w),logEnd=log(1.0+lengthMeters/1000.0);
 o1=vec4(0);o2=vec4(0);o3=vec4(0);o4=vec4(0);
 if(lengthMeters<=0.0)return;
 for(int j=0;j<${viewRule.nodes.length};j++){
  float distance=1000.0*(exp(logEnd*P[j])-1.0);vec3 p=start+distance*direction.xyz;
  vec4 measure=W[j]*(distance+1000.0)*logEnd*transmission(start,direction.xyz,distance,g)*extinction(p,g);
  o1+=measure*firstSource(p,direction.xyz,g);o2+=measure*angularSample(uSecond,p,direction.xyz,g);
  o3+=measure*angularSample(uThird,p,direction.xyz,g);o4+=measure*angularSample(uFourth,p,direction.xyz,g);
 }
}
`;
	return {build, view};
}
