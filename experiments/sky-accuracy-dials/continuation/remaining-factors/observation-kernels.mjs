import {targetedShaders} from '../targeted-improvements/kernels.mjs';

/** Same GPU source-column equation, with a corrected-only loop-free sample evaluator.
 * @type {SkyTargetedShaders}
 */
export const observationShaders = {
	vertex: targetedShaders.vertex,
	columns: targetedShaders.columns,
	rays: `#version 300 es
precision highp float;precision highp int;
uniform sampler2D uSamples,uRays,uColumns,uSpectra;
uniform vec4 uPlanet;
out vec4 result;
vec4 data(int i){return texelFetch(uSamples,ivec2(i%1024,i/1024),0);}
vec2 column(float index){return texelFetch(uColumns,ivec2(int(index),1),0).zw;}
float harmonic(float a,float b){if(a==0.0||b==0.0||sign(a)!=sign(b))return 0.0;float lo=min(abs(a),abs(b)),hi=max(abs(a),abs(b));return sign(a)*2.0*lo/(1.0+lo/hi);}
float cubic(float p,float l,float u,float n,float f,vec2 edge){
 if(f==0.0)return l;if(f==1.0)return u;
 float sec=u-l,sl=edge.x>0.5?sec:harmonic(l-p,sec),su=edge.y>0.5?sec:harmonic(sec,n-u),f2=f*f,f3=f2*f;
 return (2.0*f3-3.0*f2+1.0)*l+(f3-2.0*f2+f)*sl+(-2.0*f3+3.0*f2)*u+(f3-f2)*su;
}
vec2 cubic2(vec2 p,vec2 l,vec2 u,vec2 n,float f,vec2 e){return vec2(cubic(p.x,l.x,u.x,n.x,f,e),cubic(p.y,l.y,u.y,n.y,f,e));}
float density(int index,vec4 spec,vec2 phase){
 int b=index*4;vec4 m=data(b),e=data(b+1),a=data(b+2),c=data(b+3);
 vec2 normalized=mix(cubic2(column(a.x),column(a.y),column(a.z),column(a.w),m.z,e.xy),cubic2(column(c.x),column(c.y),column(c.z),column(c.w),m.z,e.xy),m.w);
 vec2 col=normalized*exp(-m.x/uPlanet.zw)-uPlanet.zw/e.z*exp(-uPlanet.y/uPlanet.zw);
 vec2 scatter=exp(-m.x/uPlanet.zw)*vec2(spec.x,spec.y*spec.w)*phase;
 return (scatter.x+scatter.y)*exp(-dot(max(col,vec2(0)),spec.xy))*spec.z;
}
void main(){
 int x=int(gl_FragCoord.x),y=int(gl_FragCoord.y);
 vec4 ray=texelFetch(uRays,ivec2(y,0),0),spec=texelFetch(uSpectra,ivec2(x,0),0);
 float trans=1.0,value=0.0;
 for(int i=0;i<768;i++){
  if(i>=int(ray.y))break;
  int index=int(ray.x)+i;vec4 m=data(index*4);
  float extinction=dot(exp(-m.x/uPlanet.zw),spec.xy),halfStep=exp(-0.5*extinction*m.y);
  trans*=halfStep;value+=trans*density(index,spec,ray.zw)*m.y;trans*=halfStep;
 }
 result=vec4(value,ray.y,trans,1.0);
}`,
};
