/*
 * Standalone extraction of Color.js CAM16 algebra at commit
 * 349008c68d6273c61e1d3138936ad28a6c7f2b21. See provenance.json and LICENSE.
 * Variable names and the no-offset response formulation intentionally follow
 * the independent upstream implementation rather than project Cam16Reference.
 */
const CAT16=[[0.401288,0.650173,-0.051461],[-0.250268,1.204414,0.045854],[-0.002079,0.048952,0.953127]];
const CAT16_INV=[[1.8620678550872327,-1.0112546305316843,0.14918677544445175],[0.38752654323613717,0.6214474419314753,-0.008973985167612518],[-0.015841498849333856,-0.03412293802851557,1.0499644368778496]];
const M1=[[460,451,288],[460,-891,-261],[460,-220,-6300]];
const SURROUND={dark:[0.8,0.525,0.8],dim:[0.9,0.59,0.9],average:[1,0.69,1]};
const mul=(matrix,vector)=>matrix.map((row)=>row.reduce((sum,value,index)=>sum+value*vector[index],0));
const spow=(value,power)=>Math.sign(value)*Math.abs(value)**power;
const zdiv=(left,right)=>right===0?0:left/right;
const adapt=(values,fl)=>values.map((value)=>{const x=spow(fl*Math.abs(value)*0.01,0.42);return 400*Math.sign(value)*x/(x+27.13);});
const unadapt=(values,fl)=>values.map((value)=>Math.sign(value)*(100/fl)*((27.13*Math.abs(value))/(400-Math.abs(value)))**(1/0.42));

export function colorjsEnvironment({whiteXyz,adaptingLuminanceCdPerSquareMeter,backgroundRelativeY,surround='dim',discountIlluminant=false}){const [F,c,nc]=SURROUND[surround];const yw=whiteXyz[1];const rgbW=mul(CAT16,whiteXyz);const la=adaptingLuminanceCdPerSquareMeter;const k=1/(5*la+1);const k4=k**4;const fl=k4*la+0.1*(1-k4)**2*Math.cbrt(5*la);const n=backgroundRelativeY/yw;const nbb=0.725*n**-0.2;const d=discountIlluminant?1:Math.max(0,Math.min(1,F*(1-Math.exp((-la-42)/92)/3.6)));const dRgb=rgbW.map((value)=>1+d*(yw/value-1));const rgbAW=adapt(rgbW.map((value,index)=>value*dRgb[index]),fl);return{whiteXyz,la,yb:backgroundRelativeY,c,nc,fl,flRoot:fl**0.25,n,z:1.48+Math.sqrt(n),nbb,ncb:nbb,dRgb,dRgbInv:dRgb.map((value)=>1/value),aW:nbb*(2*rgbAW[0]+rgbAW[1]+0.05*rgbAW[2])};}

export function colorjsToCam16(xyz,env){const rgbA=adapt(mul(CAT16,xyz).map((value,index)=>value*env.dRgb[index]),env.fl);const a=rgbA[0]+(-12*rgbA[1]+rgbA[2])/11;const b=(rgbA[0]+rgbA[1]-2*rgbA[2])/9;const hr=((Math.atan2(b,a)%(2*Math.PI))+2*Math.PI)%(2*Math.PI);const et=0.25*(Math.cos(hr+2)+3.8);const t=(5e4/13)*env.nc*env.ncb*zdiv(et*Math.hypot(a,b),rgbA[0]+rgbA[1]+1.05*rgbA[2]+0.305);const alpha=spow(t,0.9)*(1.64-0.29**env.n)**0.73;const A=env.nbb*(2*rgbA[0]+rgbA[1]+0.05*rgbA[2]);const Jroot=spow(A/env.aW,0.5*env.c*env.z);const J=100*spow(Jroot,2);const Q=(4/env.c)*Jroot*(env.aW+4)*env.flRoot;const C=alpha*Jroot;const M=C*env.flRoot;return{J,Q,C,M,h:hr*180/Math.PI,s:50*spow(env.c*alpha/(env.aW+4),0.5)};}

export function colorjsFromCam16({Q,M,h},env){if(Q===0)return[0,0,0];const hr=((h%360)+360)%360*Math.PI/180;const cos=Math.cos(hr);const sin=Math.sin(hr);const Jroot=0.25*env.c*Q/((env.aW+4)*env.flRoot);const alpha=M/env.flRoot/Jroot;const t=spow(alpha*(1.64-0.29**env.n)**-0.73,10/9);const et=0.25*(Math.cos(hr+2)+3.8);const A=env.aW*spow(Jroot,2/env.c/env.z);const p1=(5e4/13)*env.nc*env.ncb*et;const p2=A/env.nbb;const r=23*(p2+0.305)*zdiv(t,23*p1+t*(11*cos+108*sin));const a=r*cos;const b=r*sin;const rgbC=unadapt(mul(M1,[p2,a,b]).map((value)=>value/1403),env.fl);return mul(CAT16_INV,rgbC.map((value,index)=>value*env.dRgbInv[index]));}
