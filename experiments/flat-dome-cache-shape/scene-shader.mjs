import {gauss} from './math.mjs';

/**
 * Adapts the authenticated dome evaluator to the existing Three runtime pass.
 * Camera reconstruction follows FlatGeometryShaderContributor; scene hit/distance
 * binding follows ShaderRuntimePass, with FP32 distances and spectral endpoints.
 *
 * @param {DomeShaderSources} candidate - Existing tested build/query shaders.
 * @param {number[][]} weights - Authenticated CIE XYZ bin integrals.
 * @param {number[]} ground - Declared Native15 ground endpoint radiance.
 * @returns {{scene: string, ground: string, groundVertex: string}} - Complete GLSL3 sources.
 */
export function sceneShaders(candidate, weights, ground) {
	const common = candidate.build.slice(0, candidate.build.indexOf('layout(location=0)out'));
	const floats = (values) => values.map((v) => Number(v).toExponential(16)).join(',');
	const packed = (values) =>
		Array.from(
			{length: 4},
			(_, g) => `vec4(${floats(Array.from({length: 4}, (_, k) => values[g * 4 + k] ?? 0))})`,
		).join(',');
	const camera = `
uniform mat4 uInverseProjectionMatrix,uInverseViewMatrix;
uniform vec3 uCameraWorldPositionMeters;uniform vec2 uViewportSizePixels;
vec3 reconstructViewRay(){
 vec2 uv=gl_FragCoord.xy/uViewportSizePixels;
 vec4 clip=vec4(uv*2.0-1.0,1.0,1.0),view=uInverseProjectionMatrix*clip;
 view.xyz/=max(view.w,0.000001);
 vec3 sceneDirection=normalize((uInverseViewMatrix*vec4(normalize(view.xyz),0.0)).xyz);
 return normalize(vec3(sceneDirection.x,-sceneDirection.z,sceneDirection.y));
}
`;
	const boundary = `
vec2 capInterval(vec3 p,vec3 v){
 vec2 xy=p.xy/R;float k=H/R,z=p.z/H;
 float a=k*k*dot(v,v),b=k*dot(xy,v.xy)+v.z*(0.5*(1.0-k*k)+k*k*z);
 float rn=length(xy),c=(rn-1.0)*(rn+1.0)+z*(1.0+k*k*(z-1.0)),disc=b*b-a*c;
 if(disc<0.0)return vec2(0);float root=sqrt(max(0.0,disc)),q=-b-(b<0.0?-root:root);
 float t0=q==0.0?0.0:q/a,t1=q==0.0?0.0:c/q;
 float entry=max(0.0,min(t0,t1)*H),end=max(t0,t1)*H;
 if(v.z<0.0)end=min(end,-p.z/v.z);
 else if(v.z>0.0)entry=max(entry,-p.z/v.z);
 else if(p.z<0.0)return vec2(0);
 return end>entry?vec2(entry,end):vec2(0);
}
`;
	const rule = gauss(64);
	const scene =
		common +
		camera +
		boundary +
		`
uniform sampler2D uSceneHitDistance;uniform int uDiagnostic,uGroup,uDisableCache,uVacuum;
out vec4 sceneOutput;
const float P[64]=float[64](${floats(rule.nodes)}),W[64]=float[64](${floats(rule.weights)});
const vec4 CX[4]=vec4[4](${packed(weights.map((w) => w[0]))});
const vec4 CY[4]=vec4[4](${packed(weights.map((w) => w[1]))});
const vec4 CZ[4]=vec4[4](${packed(weights.map((w) => w[2]))});
const vec4 GROUND[4]=vec4[4](${packed(ground)});
vec3 srgb(vec3 v){vec3 low=12.92*max(v,vec3(0));vec3 high=1.055*pow(clamp(v,vec3(0),vec3(1)),vec3(1.0/2.4))-0.055;return mix(high,low,lessThanEqual(v,vec3(0.0031308)));}
void main(){
 vec3 direction=reconstructViewRay(),origin=uCameraWorldPositionMeters;
 vec4 sceneHit=texelFetch(uSceneHitDistance,ivec2(gl_FragCoord.xy),0);
 vec2 bounds=capInterval(origin,direction);if(sceneHit.y>0.5)bounds.y=min(bounds.y,sceneHit.x);
 float lengthMeters=max(0.0,bounds.y-bounds.x);vec3 start=origin+bounds.x*direction;
 if(uVacuum!=0)lengthMeters=0.0;
 if(uDiagnostic==3){sceneOutput=vec4(bounds,sceneHit.y,sceneHit.x);return;}
 if(uDiagnostic==4){sceneOutput=vec4(direction,1);return;}
 vec3 scores=vec3(-2);ivec3 indices=ivec3(0);
 for(int k=0;k<DC;k++){float score=dot(direction,DIR[k]);if(score>scores.x){scores=vec3(score,scores.xy);indices=ivec3(k,indices.xy);}else if(score>scores.y){scores.yz=vec2(score,scores.y);indices.yz=ivec2(k,indices.y);}else if(score>scores.z){scores.z=score;indices.z=k;}}
 vec3 aw=1.0/max(vec3(1e-8),vec3(1)-scores);aw/=dot(aw,vec3(1));
 vec3 xyz=vec3(0);float logEnd=log(1.0+lengthMeters/1000.0);
 for(int g=0;g<4;g++){
  if(uDiagnostic>0&&g!=uGroup)continue;
  vec4 air=vec4(0);
  if(lengthMeters>0.0){for(int j=0;j<64;j++){
   float distance=1000.0*(exp(logEnd*P[j])-1.0);vec3 p=start+distance*direction;
   vec4 measure=W[j]*(distance+1000.0)*logEnd*transmission(start,direction,distance,g)*extinction(p,g);
   vec4 higher=vec4(0);if(uDisableCache==0)higher=aw.x*fieldSample(uSecond,p,indices.x,g)+aw.y*fieldSample(uSecond,p,indices.y,g)+aw.z*fieldSample(uSecond,p,indices.z,g);
   air+=measure*(firstSource(p,direction,g)+higher);
  }}
  vec4 tr=transmission(start,direction,lengthMeters,g);
  vec4 radiance=air+(sceneHit.y>0.5&&sceneHit.z>0.5?tr*GROUND[g]:vec4(0));
  if(uDiagnostic==1){sceneOutput=air;return;}
  if(uDiagnostic==2){sceneOutput=tr;return;}
  if(uDiagnostic==5){sceneOutput=radiance;return;}
  xyz+=vec3(dot(radiance,CX[g]),dot(radiance,CY[g]),dot(radiance,CZ[g]));
 }
 vec3 rgb=vec3(dot(xyz,vec3(3.2404542,-1.5371385,-0.4985314)),dot(xyz,vec3(-0.969266,1.8760108,0.041556)),dot(xyz,vec3(0.0556434,-0.2040259,1.0572252)))*0.06;
 sceneOutput=vec4(srgb(rgb),1);
}
`;
	const groundVertex = `#version 300 es
precision highp float;in vec3 position;uniform mat4 projectionMatrix,modelViewMatrix;
void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}`;
	const groundShader = `#version 300 es
precision highp float;${camera}
uniform float uDistanceInside;out vec4 groundOutput;
void main(){vec3 v=reconstructViewRay();if(v.z>=0.0)discard;
 float distance=-uCameraWorldPositionMeters.z/v.z;
 vec2 local=distance*v.xy;float r=20015114.442035925;
 // Factored disk equation in observer-local meters, avoiding world-radius cancellation.
 float residual=(uDistanceInside-local.x)*(2.0*r-uDistanceInside+local.x)-local.y*local.y;
 if(residual<0.0)discard;groundOutput=vec4(distance,1,1,1);}`;
	return {scene, ground: groundShader, groundVertex};
}
