/** Fixed GPU matrix; the only ray-shader loop is the outer viewing-ray march.
 * @type {SkyTargetedShaders}
 */
export const targetedShaders = {
	vertex: `#version 300 es
void main(){ vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2); gl_Position=vec4(p*2.0-1.0,0,1); }`,
	columns: `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uAnchors;
uniform vec4 uPlanet;
out vec4 result;
void main(){
 int x=int(gl_FragCoord.x), row=int(gl_FragCoord.y), count=row==0?80:160;
 vec2 a=texelFetch(uAnchors,ivec2(x,0),0).xy;
 float h=a.x,mu=a.y,r=uPlanet.x+h,p=r*mu;
 float term=(h-uPlanet.y)*(r+uPlanet.x+uPlanet.y);
 float length=-term/(p+sqrt(p*p-term)),step=length/float(count);
 vec2 columns=vec2(0);
 for(int j=0;j<=160;j++){
  if(j>count)break;
  float d=float(j)*step,delta=d*(2.0*p+d);
  float height=h+delta/(sqrt(r*r+delta)+r);
  columns+=(j==0||j==count?0.5:1.0)*step*exp(-height/uPlanet.zw);
 }
 vec2 normalized=columns*exp(h/uPlanet.zw)+uPlanet.zw/mu*exp((h-uPlanet.y)/uPlanet.zw);
 result=vec4(columns,normalized);
}`,
	rays: `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uSamples,uRays,uColumns,uSpectra;
uniform vec4 uPlanet;
out vec4 result;
vec4 sampleTex(int i){return texelFetch(uSamples,ivec2(i%1024,i/1024),0);}
float harmonic(float a,float b){
 if(a==0.0||b==0.0||sign(a)!=sign(b))return 0.0;
 float lo=min(abs(a),abs(b)),hi=max(abs(a),abs(b));
 return sign(a)*2.0*lo/(1.0+lo/hi);
}
float cubic(float p,float l,float u,float n,float f,vec2 edge){
 if(f==0.0)return l;if(f==1.0)return u;
 float sec=u-l,sl=edge.x>0.5?sec:harmonic(l-p,sec),su=edge.y>0.5?sec:harmonic(sec,n-u);
 float f2=f*f,f3=f2*f;
 return (2.0*f3-3.0*f2+1.0)*l+(f3-2.0*f2+f)*sl+(-2.0*f3+3.0*f2)*u+(f3-f2)*su;
}
vec2 cubic2(vec2 p,vec2 l,vec2 u,vec2 n,float f,vec2 e){
 return vec2(cubic(p.x,l.x,u.x,n.x,f,e),cubic(p.y,l.y,u.y,n.y,f,e));
}
vec2 product(vec4 tap,vec4 col,vec4 spec,vec2 queryBeta,vec2 queryPhase,bool density,bool phase,bool transmission){
 vec2 beta=density?queryBeta:exp(-tap.y/uPlanet.zw)*vec2(spec.x,spec.y*spec.w);
 vec2 ph=phase?queryPhase:tap.zw;
 return beta*ph*(transmission?exp(-dot(col.xy,spec.xy)):1.0);
}
float evaluateSample(int index,int source,int mode,vec4 spec,vec2 ph){
 int b=index*10;
 vec4 meta=sampleTex(b),extra=sampleTex(b+1);
 vec4 a=sampleTex(b+2),c=sampleTex(b+3),d=sampleTex(b+4),e=sampleTex(b+5);
 vec4 f=sampleTex(b+6),g=sampleTex(b+7),h=sampleTex(b+8),j=sampleTex(b+9);
 vec4 ca=texelFetch(uColumns,ivec2(int(a.x),source),0),cc=texelFetch(uColumns,ivec2(int(c.x),source),0);
 vec4 cd=texelFetch(uColumns,ivec2(int(d.x),source),0),ce=texelFetch(uColumns,ivec2(int(e.x),source),0);
 vec4 cf=texelFetch(uColumns,ivec2(int(f.x),source),0),cg=texelFetch(uColumns,ivec2(int(g.x),source),0);
 vec4 ch=texelFetch(uColumns,ivec2(int(h.x),source),0),cj=texelFetch(uColumns,ivec2(int(j.x),source),0);
 int bits=mode<8?mode:(mode<12?mode-8:0);
 bool density=(bits&1)!=0,phase=(bits&2)!=0,separate=mode>=4&&mode<12;
 vec2 beta=exp(-meta.x/uPlanet.zw)*vec2(spec.x,spec.y*spec.w);
 vec2 pa=product(a,ca,spec,beta,ph,density,phase,!separate),pc=product(c,cc,spec,beta,ph,density,phase,!separate);
 vec2 pd=product(d,cd,spec,beta,ph,density,phase,!separate),pe=product(e,ce,spec,beta,ph,density,phase,!separate);
 vec2 pf=product(f,cf,spec,beta,ph,density,phase,!separate),pg=product(g,cg,spec,beta,ph,density,phase,!separate);
 vec2 pi=product(h,ch,spec,beta,ph,density,phase,!separate),pj=product(j,cj,spec,beta,ph,density,phase,!separate);
 float value;
 if(mode==12){
  value=mix(cubic(pa.x+pa.y,pc.x+pc.y,pd.x+pd.y,pe.x+pe.y,meta.z,extra.xy),
            cubic(pf.x+pf.y,pg.x+pg.y,pi.x+pi.y,pj.x+pj.y,meta.z,extra.xy),meta.w);
 }else{
  vec2 v=mix(cubic2(pa,pc,pd,pe,meta.z,extra.xy),cubic2(pf,pg,pi,pj,meta.z,extra.xy),meta.w);
  value=v.x+v.y;
 }
 if(separate){
  float transmission;
  if(mode<8){
   vec2 normalized=mix(cubic2(ca.zw,cc.zw,cd.zw,ce.zw,meta.z,extra.xy),cubic2(cf.zw,cg.zw,ch.zw,cj.zw,meta.z,extra.xy),meta.w);
   vec2 columns=normalized*exp(-meta.x/uPlanet.zw)-uPlanet.zw/extra.z*exp(-uPlanet.y/uPlanet.zw);
   transmission=exp(-dot(max(columns,vec2(0)),spec.xy));
  }else{
   transmission=mix(cubic(exp(-dot(ca.xy,spec.xy)),exp(-dot(cc.xy,spec.xy)),exp(-dot(cd.xy,spec.xy)),exp(-dot(ce.xy,spec.xy)),meta.z,extra.xy),
    cubic(exp(-dot(cf.xy,spec.xy)),exp(-dot(cg.xy,spec.xy)),exp(-dot(ch.xy,spec.xy)),exp(-dot(cj.xy,spec.xy)),meta.z,extra.xy),meta.w);
  }
  value*=transmission;
 }
 return value*spec.z;
}
void main(){
 int x=int(gl_FragCoord.x),y=int(gl_FragCoord.y),channel=x/26,source=(x%26)/13,mode=x%13;
 vec4 ray=texelFetch(uRays,ivec2(y,0),0),spec=texelFetch(uSpectra,ivec2(channel,0),0);
 float trans=1.0,value=0.0;
 for(int i=0;i<768;i++){
  if(i>=int(ray.y))break;
  int index=int(ray.x)+i;vec4 meta=sampleTex(index*10);
  float extinction=dot(exp(-meta.x/uPlanet.zw),spec.xy),halfStep=exp(-0.5*extinction*meta.y);
  trans*=halfStep;value+=trans*evaluateSample(index,source,mode,spec,ray.zw)*meta.y;trans*=halfStep;
 }
 result=vec4(value,ray.y,trans,1.0);
}`,
};
