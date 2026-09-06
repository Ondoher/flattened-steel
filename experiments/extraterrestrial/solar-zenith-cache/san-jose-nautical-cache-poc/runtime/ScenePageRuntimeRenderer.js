const VERTEX_SOURCE = `#version 300 es
void main() {
	vec2 p = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0);
	gl_Position = vec4(p, 0.0, 1.0);
}`;

const WAVELENGTHS = [375.6666666666667,407,438.3333333333333,469.66666666666663,501,532.3333333333333,563.6666666666666,595,626.3333333333333,657.6666666666666,689,720.3333333333333,751.6666666666666,783,814.3333333333333];
const RGB_WEIGHTS = [
	[14.749358550069186,-12.461809444307793,87.0946400969207],[526.2783136675116,-458.55532519841455,3237.2612774897575],[4860.670464118019,-4772.7836927559265,39151.920333292415],[-3060.0889637085575,630.8578131011398,29358.021601771536],[-13632.173462494251,13736.143434391024,4381.701642849098],[-16218.356823408865,31693.381438654007,-2831.7761080281125],[13090.311666839618,25900.771554214934,-3445.8601281741517],[50412.333624759995,5985.729871526668,-1751.5249369399994],[40037.66348377322,-2711.74301170623,-470.97288279674353],[10784.85206753291,-1100.5301263483966,-80.95993013896909],[1404.8097211248464,-151.91580336427623,-9.471889119435332],[162.89272907807108,-17.68227705091523,-1.089886496392673],[17.002541340620876,-1.8456545849604458,-0.1137609522231646],[1.938132985276144,-0.21038756748325607,-0.012967705204170663],[0.21580616718156756,-0.02342611824797461,-0.0014439210507229407],
];

function requireCondition(value, message) { if (!value) throw new Error(message); }
function glsl(values) { return values.map((value) => Number(value).toExponential(17)).join(','); }

function shaderSource({
	forward,
	right,
	up,
	ozone,
	luminanceLiftGamma,
	maximumLuminanceGain,
	analyticSun,
	pageAltitudes,
	validityAware,
}) {
	const rgbR = RGB_WEIGHTS.map((row) => row[0]);
	const rgbG = RGB_WEIGHTS.map((row) => row[1]);
	const rgbB = RGB_WEIGHTS.map((row) => row[2]);
	const validityUniform = validityAware
		? 'uniform highp usampler2D uValidity;'
		: '';
	const densityLookup = validityAware
		? `void addValidTap(int index,int row,int channel,float weight,inout float value,inout float validWeight){if(weight<=0.0)return;if(texelFetch(uValidity,ivec2(index,row),0).r==0u)return;value+=weight*texelFetch(uPage,ivec3(index,row,channel),0).r;validWeight+=weight;}
void directionContribution(vec3 d,int row,int channel,out float value,out float validWeight){int fi;vec3 n,u,v;face(normalize(d),fi,n,u,v);float den=dot(d,n);float uc=clamp((dot(d,u)/den+1.0)*19.0,0.0,38.0);float vc=clamp((dot(d,v)/den+1.0)*19.0,0.0,38.0);int u0=int(floor(uc)),v0=int(floor(vc)),u1=min(u0+1,38),v1=min(v0+1,38);float fu=uc-float(u0),fv=vc-float(v0);int base=fi*1521;value=0.0;validWeight=0.0;addValidTap(base+v0*39+u0,row,channel,(1.0-fu)*(1.0-fv),value,validWeight);addValidTap(base+v0*39+u1,row,channel,fu*(1.0-fv),value,validWeight);addValidTap(base+v1*39+u0,row,channel,(1.0-fu)*fv,value,validWeight);addValidTap(base+v1*39+u1,row,channel,fu*fv,value,validWeight);}
float density(vec3 d,float h,int channel){int a,b;float f;altitudeStencil(h,a,b,f);float av,aw,bv,bw;directionContribution(d,a,channel,av,aw);directionContribution(d,b,channel,bv,bw);float wa=(1.0-f)*aw,wb=f*bw,total=wa+wb;return total>0.0?((1.0-f)*av+f*bv)/total:0.0;}`
		: `float directionSample(vec3 d,int row,int channel){int fi;vec3 n,u,v;face(normalize(d),fi,n,u,v);float den=dot(d,n);float uc=clamp((dot(d,u)/den+1.0)*19.0,0.0,38.0);float vc=clamp((dot(d,v)/den+1.0)*19.0,0.0,38.0);int u0=int(floor(uc)),v0=int(floor(vc)),u1=min(u0+1,38),v1=min(v0+1,38);float fu=uc-float(u0),fv=vc-float(v0);int base=fi*1521;float a=texelFetch(uPage,ivec3(base+v0*39+u0,row,channel),0).r;float b=texelFetch(uPage,ivec3(base+v0*39+u1,row,channel),0).r;float c=texelFetch(uPage,ivec3(base+v1*39+u0,row,channel),0).r;float e=texelFetch(uPage,ivec3(base+v1*39+u1,row,channel),0).r;return mix(mix(a,b,fu),mix(c,e,fu),fv);}
float density(vec3 d,float h,int channel){int a,b;float f;altitudeStencil(h,a,b,f);return mix(directionSample(d,a,channel),directionSample(d,b,channel),f);}`;
	return `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2DArray uPage;
uniform highp usampler2D uCelestialMatrix;
uniform highp sampler2D uCelestialPalette;
${validityUniform}
layout(location=0) out vec4 outputColor;
const float PI=3.14159265358979323846;
const float BOTTOM_RADIUS=6360000.0;
const float TOP_RADIUS=6420000.0;
const int WIDTH=640;
const int HEIGHT=400;
const float WAVELENGTHS[15]=float[15](${glsl(WAVELENGTHS)});
const float OZONE[15]=float[15](${glsl(ozone)});
const float RGB_R[15]=float[15](${glsl(rgbR)});
const float RGB_G[15]=float[15](${glsl(rgbG)});
const float RGB_B[15]=float[15](${glsl(rgbB)});
const vec3 CAMERA_FORWARD=vec3(${glsl(forward)});
const vec3 CAMERA_RIGHT=vec3(${glsl(right)});
const vec3 CAMERA_UP=vec3(${glsl(up)});
const bool ANALYTIC_SUN_ENABLED=${analyticSun?.enabled ? 'true' : 'false'};
const vec3 ANALYTIC_SUN_DIRECTION=vec3(${glsl(analyticSun?.direction ?? [1, 0, 0])});
const float ANALYTIC_SUN_COSINE=${Number(Math.cos(analyticSun?.angularRadiusRadians ?? 0.004675)).toExponential(17)};
const float ANALYTIC_SUN_RADIANCE[15]=float[15](${glsl(analyticSun?.radiance ?? new Array(15).fill(0))});
const int PAGE_ALTITUDE_COUNT=${pageAltitudes.length};
const float PAGE_ALTITUDES[${pageAltitudes.length}]=float[${pageAltitudes.length}](${glsl(pageAltitudes)});

vec2 roots(vec3 o, vec3 d, float r){float b=dot(o,d);float q=b*b-(dot(o,o)-r*r);if(q<0.0)return vec2(1e30);float s=sqrt(max(0.0,q));return vec2(-b-s,-b+s);}
float positiveRoot(vec2 r){if(r.x>1e-3)return r.x;if(r.y>1e-3)return r.y;return 1e30;}
void altitudeStencil(float h,out int a,out int b,out float f){if(h<=PAGE_ALTITUDES[0]){a=0;b=0;f=0.0;return;}if(h>=PAGE_ALTITUDES[PAGE_ALTITUDE_COUNT-1]){a=PAGE_ALTITUDE_COUNT-1;b=a;f=0.0;return;}for(int i=0;i<PAGE_ALTITUDE_COUNT-1;i++){float low=PAGE_ALTITUDES[i],high=PAGE_ALTITUDES[i+1];if(h<=high){a=i;b=i+1;f=clamp((h-low)/(high-low),0.0,1.0);return;}}a=PAGE_ALTITUDE_COUNT-1;b=a;f=0.0;}
void face(vec3 d,out int fi,out vec3 n,out vec3 u,out vec3 v){fi=0;n=vec3(1,0,0);u=vec3(0,1,0);v=vec3(0,0,1);float s=dot(d,n);float p=-d.x;if(p>s){fi=1;s=p;n=vec3(-1,0,0);u=vec3(0,-1,0);v=vec3(0,0,1);}p=d.y;if(p>s){fi=2;s=p;n=vec3(0,1,0);u=vec3(-1,0,0);v=vec3(0,0,1);}p=-d.y;if(p>s){fi=3;s=p;n=vec3(0,-1,0);u=vec3(1,0,0);v=vec3(0,0,1);}p=d.z;if(p>s){fi=4;s=p;n=vec3(0,0,1);u=vec3(1,0,0);v=vec3(0,1,0);}p=-d.z;if(p>s){fi=5;n=vec3(0,0,-1);u=vec3(-1,0,0);v=vec3(0,1,0);}}
${densityLookup}
float extinction(float h,int channel){float um=WAVELENGTHS[channel]/1000.0;float ray=0.00000124062*pow(um,-4.0)*exp(-h/8000.0);float mie=(0.04/1200.0)*pow(um,-0.8)*exp(-h/1200.0);float od=h<=10000.0||h>=40000.0?0.0:(h<=25000.0?(h-10000.0)/15000.0:(40000.0-h)/15000.0);return ray+mie+5.374e18*OZONE[channel]*od;}
void main(){
	vec2 ndc=(2.0*(gl_FragCoord.xy-vec2(0.5))/vec2(WIDTH,HEIGHT)-1.0);
	float t=tan(radians(78.0)*0.5);vec3 d=normalize(CAMERA_FORWARD+CAMERA_RIGHT*(ndc.x*t*float(WIDTH)/float(HEIGHT))+CAMERA_UP*(ndc.y*t));
	vec3 o=vec3(0.0,0.0,BOTTOM_RADIUS+1.7);float top=positiveRoot(roots(o,d,TOP_RADIUS));float ground=positiveRoot(roots(o,d,BOTTOM_RADIUS));bool groundHit=ground<top;float lengthMeters=min(top,ground);if(lengthMeters>=1e29){outputColor=vec4(0,0,0,1);return;}
	float radiance[15];float trans[15];for(int c=0;c<15;c++){radiance[c]=0.0;trans[c]=1.0;}
	float stepMeters=lengthMeters/15.0;
	for(int i=0;i<15;i++){float distance=(float(i)+0.5)*stepMeters;vec3 p=o+d*distance;float h=max(0.0,length(p)-BOTTOM_RADIUS);for(int c=0;c<15;c++){float ext=extinction(h,c);trans[c]*=exp(-0.5*ext*stepMeters);radiance[c]+=trans[c]*density(d,h,c)*stepMeters;trans[c]*=exp(-0.5*ext*stepMeters);}}
	ivec2 matrixPixel=ivec2(int(gl_FragCoord.x),HEIGHT-1-int(gl_FragCoord.y));uint entry=texelFetch(uCelestialMatrix,matrixPixel,0).r;
	bool insideSun=ANALYTIC_SUN_ENABLED&&!groundHit&&dot(d,ANALYTIC_SUN_DIRECTION)>=ANALYTIC_SUN_COSINE;
	vec3 rgb=vec3(0.0);for(int c=0;c<15;c++){float celestial=!groundHit&&entry>0u?texelFetch(uCelestialPalette,ivec2(c,int(entry)),0).r:0.0;if(insideSun)celestial=ANALYTIC_SUN_RADIANCE[c];float total=radiance[c]+trans[c]*celestial;rgb+=total*vec3(RGB_R[c],RGB_G[c],RGB_B[c]);}
	vec3 mapped=clamp(vec3(1.0)-exp(-max(rgb,vec3(0.0))*(1.0/(5.0*683.0))),vec3(0),vec3(1));float y=dot(mapped,vec3(0.2126,0.7152,0.0722));if(y>0.0){float gain=min(pow(y,${Number(luminanceLiftGamma - 1).toExponential(17)}),${Number(maximumLuminanceGain).toExponential(17)});mapped=clamp(mapped*gain,vec3(0),vec3(1));}outputColor=vec4(mapped,1.0);
}`;
}

function compile(gl, type, source) { const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader); if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)); return shader; }
function program(gl, fragment) { const p=gl.createProgram(); const v=compile(gl,gl.VERTEX_SHADER,VERTEX_SOURCE); const f=compile(gl,gl.FRAGMENT_SHADER,fragment); gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p; }
function normalize(v){const l=Math.hypot(...v);return v.map(x=>x/l);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

/** Upload one complete page and render it through page-only cache access. */
export function renderScenePage({gl, canvas, buildRequest, wavelengthLayers,
	celestialMatrix, celestialPalette, paletteEntryCount,
	luminanceLiftGamma = 0.125, maximumLuminanceGain = 32768,
	scenePageIndex = 0, analyticSunEnabled = false,
	analyticSunAngularRadiusRadians = 0.004675, validityMask = null}) {
	requireCondition(Number.isFinite(luminanceLiftGamma)
		&& luminanceLiftGamma > 0 && luminanceLiftGamma <= 1,
		'luminanceLiftGamma must be in (0, 1].');
	requireCondition(Number.isFinite(maximumLuminanceGain)
		&& maximumLuminanceGain >= 1,
		'maximumLuminanceGain must be finite and at least one.');
	const page=buildRequest.scenePageRequests[scenePageIndex];
	requireCondition(page, 'scenePageIndex is outside the build request.');
	requireCondition(wavelengthLayers.length===15,'Runtime requires all Native15 page layers.');
	const pageAltitudeCount=page.domains.position.count;
	const pageAltitudes=page.domains.position.nodes.map((node)=>node.altitudeMeters);
	const scalarCount=9126*pageAltitudeCount;
	if(validityMask!==null)requireCondition(validityMask instanceof Uint8Array&&validityMask.length===scalarCount,'Validity mask shape changed.');
	const packed=new Float32Array(scalarCount*15);
	for(let c=0;c<15;c++){requireCondition(wavelengthLayers[c].length===scalarCount,`Layer ${c} shape changed.`);packed.set(wavelengthLayers[c],c*scalarCount);}
	const pageTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,pageTexture);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,gl.R32F,9126,pageAltitudeCount,15,0,gl.RED,gl.FLOAT,packed);
	let validityTexture=null;if(validityMask!==null){validityTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,validityTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8UI,9126,pageAltitudeCount,0,gl.RED_INTEGER,gl.UNSIGNED_BYTE,validityMask);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);}
	const matrixTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,matrixTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texImage2D(gl.TEXTURE_2D,0,gl.R16UI,640,400,0,gl.RED_INTEGER,gl.UNSIGNED_SHORT,celestialMatrix);
	const paletteTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,paletteTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,15,paletteEntryCount,0,gl.RED,gl.FLOAT,celestialPalette);
	const scene=page.scene;const az=scene.camera.viewAzimuthDegrees*Math.PI/180;const el=scene.camera.viewElevationDegrees*Math.PI/180;const uen=[Math.sin(el),Math.sin(az)*Math.cos(el),Math.cos(az)*Math.cos(el)];const frame=page.canonicalFrame;const canonical=[dot(uen,frame.xAxisUpEastNorth),dot(uen,frame.yAxisUpEastNorth),dot(uen,frame.zAxisUpEastNorth)];const forward=normalize(canonical);const right=normalize(cross(forward,[0,0,1]));const cameraUp=normalize(cross(right,forward));
	const table=buildRequest.transportSpec.atmosphere.ozone.crossSectionTable;const ozone=WAVELENGTHS.map((w)=>{const q=(w-table.minimumNanometers)/table.spacingNanometers;const a=Math.floor(q),b=Math.min(table.values.length-1,a+1),f=q-a;return table.values[a]*(1-f)+table.values[b]*f;});
	const projectedSolidAngle=Math.PI*Math.sin(analyticSunAngularRadiusRadians)**2;const analyticSun={enabled:analyticSunEnabled,direction:page.canonicalFrame.directionToSourceCanonical,angularRadiusRadians:analyticSunAngularRadiusRadians,radiance:buildRequest.transportSpec.source.spectralIrradianceDensity.map((value)=>value/projectedSolidAngle)};
	canvas.width=640;canvas.height=400;const p=program(gl,shaderSource({forward,right,up:cameraUp,ozone,luminanceLiftGamma,maximumLuminanceGain,analyticSun,pageAltitudes,validityAware:validityMask!==null}));const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.useProgram(p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,pageTexture);gl.uniform1i(gl.getUniformLocation(p,'uPage'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,matrixTexture);gl.uniform1i(gl.getUniformLocation(p,'uCelestialMatrix'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,paletteTexture);gl.uniform1i(gl.getUniformLocation(p,'uCelestialPalette'),2);if(validityTexture!==null){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,validityTexture);gl.uniform1i(gl.getUniformLocation(p,'uValidity'),3);}gl.viewport(0,0,640,400);gl.drawArrays(gl.TRIANGLES,0,3);gl.finish();
	const pixels=new Uint8Array(640*400*4);gl.readPixels(0,0,640,400,gl.RGBA,gl.UNSIGNED_BYTE,pixels);const errors=[];for(let e=gl.getError();e!==gl.NO_ERROR;e=gl.getError())errors.push(e);let nonBlack=0,max=0;const sums=[0,0,0],upperSums=[0,0,0];for(let i=0;i<pixels.length;i+=4){if(pixels[i]||pixels[i+1]||pixels[i+2])nonBlack++;const pixel=i/4,row=Math.floor(pixel/640);for(let channel=0;channel<3;channel++){const value=pixels[i+channel];sums[channel]+=value;if(row>=200)upperSums[channel]+=value;max=Math.max(max,value);}}
	const imagePngDataUrl=canvas.toDataURL('image/png');gl.deleteTexture(pageTexture);if(validityTexture!==null)gl.deleteTexture(validityTexture);gl.deleteTexture(matrixTexture);gl.deleteTexture(paletteTexture);gl.deleteProgram(p);gl.deleteVertexArray(vao);
	return {schemaId:'san-jose-nautical-scene-page-runtime-render-v1',cacheProvider:'generated-scene-page-only',lookup:`W39 canonical direction x ${page.domains.position.id} altitude x Native15`,validityAwareInterpolation:validityMask!==null,pathIntervalCount:15,celestial:analyticSunEnabled?'analytic distant-Sun disk for scattering-scene reproduction':'retained run-000493 screen palette',color:{model:'retained source-luminance-lift',luminanceLiftGamma,maximumLuminanceGain},imagePngDataUrl,image:{width:640,height:400,nonBlackPixelCount:nonBlack,maximumChannel:max,meanRgb:sums.map((sum)=>sum/(640*400)),upperHalfMeanRgb:upperSums.map((sum)=>sum/(640*200))},webglErrors:errors};
}
