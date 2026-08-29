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
	displayMode,
	pathIntervalCount,
	pathDistribution,
	objectShortening,
	sceneObjects,
	analyticSun,
	altitudeNodes,
	ledger,
	sourceDirection,
}) {
	const rgbR = RGB_WEIGHTS.map((row) => row[0]);
	const rgbG = RGB_WEIGHTS.map((row) => row[1]);
	const rgbB = RGB_WEIGHTS.map((row) => row[2]);
	const rowFirst = ledger.rows.map((row) => row.retainedZenith.firstIndex);
	const rowLast = ledger.rows.map((row) => row.retainedZenith.lastIndex);
	const rowBase = ledger.rows.map((row) => row.packed.firstRow);
	const densityLookup = `int packedRow(int altitudeIndex,int zenithIndex){if(zenithIndex<ROW_FIRST[altitudeIndex]||zenithIndex>ROW_LAST[altitudeIndex])return -1;return ROW_BASE[altitudeIndex]+zenithIndex-ROW_FIRST[altitudeIndex];}
float directionSample(vec3 d,int row,int channel){if(row<0)return 0.0;int fi;vec3 n,u,v;face(normalize(d),fi,n,u,v);float den=dot(d,n);float uc=clamp((dot(d,u)/den+1.0)*19.0,0.0,38.0);float vc=clamp((dot(d,v)/den+1.0)*19.0,0.0,38.0);int u0=int(floor(uc)),v0=int(floor(vc)),u1=min(u0+1,38),v1=min(v0+1,38);float fu=uc-float(u0),fv=vc-float(v0);int base=fi*1521;float a=texelFetch(uCache,ivec3(base+v0*39+u0,row,channel),0).r;float b=texelFetch(uCache,ivec3(base+v0*39+u1,row,channel),0).r;float c=texelFetch(uCache,ivec3(base+v1*39+u0,row,channel),0).r;float e=texelFetch(uCache,ivec3(base+v1*39+u1,row,channel),0).r;return mix(mix(a,b,fu),mix(c,e,fu),fv);}
void zenithStencil(float degrees,out int a,out int b,out float f){if(degrees<=0.5){a=0;b=0;f=0.0;return;}if(degrees>=179.5){a=179;b=179;f=0.0;return;}float q=degrees-0.5;a=int(floor(q));b=int(ceil(q));f=q-float(a);}
float density(vec3 d,vec3 p,int channel){float h=max(0.0,length(p)-BOTTOM_RADIUS);int a0,a1;float af;altitudeStencil(h,a0,a1,af);vec3 localUp=normalize(p);float mu=clamp(dot(localUp,SOURCE_DIRECTION),-1.0,1.0);float theta=degrees(acos(mu));int z0,z1;float zf;zenithStencil(theta,z0,z1,zf);vec3 xRaw=SOURCE_DIRECTION-mu*localUp;vec3 reference=abs(localUp.x)<0.8?vec3(1,0,0):vec3(0,1,0);vec3 xAxis=length(xRaw)>1e-7?normalize(xRaw):normalize(reference-dot(reference,localUp)*localUp);vec3 yAxis=normalize(cross(localUp,xAxis));vec3 localDirection=vec3(dot(d,xAxis),dot(d,yAxis),dot(d,localUp));float v00=directionSample(localDirection,packedRow(a0,z0),channel);float v01=directionSample(localDirection,packedRow(a0,z1),channel);float v10=directionSample(localDirection,packedRow(a1,z0),channel);float v11=directionSample(localDirection,packedRow(a1,z1),channel);return mix(mix(v00,v01,zf),mix(v10,v11,zf),af);}`;
	const displayExpression = displayMode === 'retained'
		? `vec3 mapped=clamp(vec3(1.0)-exp(-max(rgb,vec3(0.0))*(1.0/(5.0*683.0))),vec3(0),vec3(1));float y=dot(mapped,vec3(0.2126,0.7152,0.0722));if(y>0.0){float gain=min(pow(y,${Number(luminanceLiftGamma - 1).toExponential(17)}),${Number(maximumLuminanceGain).toExponential(17)});mapped=clamp(mapped*gain,vec3(0),vec3(1));}`
		: displayMode === 'linear-quarter-exposure'
			? 'vec3 mapped=clamp(max(rgb,vec3(0.0))*(0.25/(5.0*683.0)),vec3(0),vec3(1));'
			: 'vec3 positiveRgb=max(rgb,vec3(0.0));float peak=max(positiveRgb.r,max(positiveRgb.g,positiveRgb.b));vec3 mapped=peak>0.0?positiveRgb/peak:vec3(0.0);';
	const segmentSource = pathDistribution === 'uniform'
		? `float startDistance=float(i)*lengthMeters/${Number(pathIntervalCount).toFixed(1)};float endDistance=float(i+1)*lengthMeters/${Number(pathIntervalCount).toFixed(1)};`
		: `float u0=float(i)/${Number(pathIntervalCount).toFixed(1)};float u1=float(i+1)/${Number(pathIntervalCount).toFixed(1)};float startDistance=lengthMeters*u0*u0;float endDistance=lengthMeters*u1*u1;`;
	const sceneObjectSource = (sceneObjects ?? []).map((object) =>
		`sceneObjectDistance=min(sceneObjectDistance,boxHit(o,d,${Number(object.distanceMeters).toExponential(17)},${Number(object.lateralMeters).toExponential(17)},vec3(${glsl([object.widthMeters / 2, object.depthMeters / 2, object.heightMeters / 2])})));`).join('');
	return `#version 300 es
precision highp float;
precision highp int;
uniform highp sampler2DArray uCache;
uniform highp usampler2D uCelestialMatrix;
uniform highp sampler2D uCelestialPalette;
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
const int ALTITUDE_COUNT=${altitudeNodes.length};
const float ALTITUDES[${altitudeNodes.length}]=float[${altitudeNodes.length}](${glsl(altitudeNodes)});
const int ROW_FIRST[48]=int[48](${rowFirst.join(',')});
const int ROW_LAST[48]=int[48](${rowLast.join(',')});
const int ROW_BASE[48]=int[48](${rowBase.join(',')});
const vec3 SOURCE_DIRECTION=vec3(${glsl(sourceDirection)});
const bool OBJECT_SHORTENING_ENABLED=${objectShortening?.enabled ? 'true' : 'false'};
const float OBJECT_DISTANCE_METERS=${Number(objectShortening?.distanceMeters ?? 0).toExponential(17)};
const vec4 OBJECT_SCREEN_RECT=vec4(${glsl(objectShortening?.screenRect ?? [0,0,0,0])});

vec2 roots(vec3 o, vec3 d, float r){float b=dot(o,d);float q=b*b-(dot(o,o)-r*r);if(q<0.0)return vec2(1e30);float s=sqrt(max(0.0,q));return vec2(-b-s,-b+s);}
float positiveRoot(vec2 r){if(r.x>1e-3)return r.x;if(r.y>1e-3)return r.y;return 1e30;}
float boxHit(vec3 o,vec3 d,float distanceMeters,float lateralMeters,vec3 halfSize){vec3 z=vec3(0,0,1);vec3 horizontalForward=normalize(vec3(CAMERA_FORWARD.xy,0));vec3 horizontalRight=normalize(vec3(CAMERA_RIGHT.xy,0));vec3 horizontalCenter=vec3(0,0,BOTTOM_RADIUS+1.7)+horizontalForward*distanceMeters+horizontalRight*lateralMeters;float groundZ=sqrt(max(0.0,BOTTOM_RADIUS*BOTTOM_RADIUS-dot(horizontalCenter.xy,horizontalCenter.xy)));vec3 center=vec3(horizontalCenter.xy,groundZ+halfSize.z);vec3 q=o-center;vec3 ro=vec3(dot(q,horizontalRight),dot(q,horizontalForward),q.z);vec3 rd=vec3(dot(d,horizontalRight),dot(d,horizontalForward),d.z);vec3 inv=1.0/rd;vec3 a=(-halfSize-ro)*inv;vec3 b=(halfSize-ro)*inv;vec3 lo=min(a,b),hi=max(a,b);float near=max(lo.x,max(lo.y,lo.z));float far=min(hi.x,min(hi.y,hi.z));if(far<max(near,1e-3))return 1e30;return near>1e-3?near:far;}
void altitudeStencil(float h,out int a,out int b,out float f){if(h<=ALTITUDES[0]){a=0;b=0;f=0.0;return;}if(h>=ALTITUDES[ALTITUDE_COUNT-1]){a=ALTITUDE_COUNT-1;b=a;f=0.0;return;}for(int i=0;i<ALTITUDE_COUNT-1;i++){float low=ALTITUDES[i],high=ALTITUDES[i+1];if(h<=high){a=i;b=i+1;f=clamp((h-low)/(high-low),0.0,1.0);return;}}a=ALTITUDE_COUNT-1;b=a;f=0.0;}
void face(vec3 d,out int fi,out vec3 n,out vec3 u,out vec3 v){fi=0;n=vec3(1,0,0);u=vec3(0,1,0);v=vec3(0,0,1);float s=dot(d,n);float p=-d.x;if(p>s){fi=1;s=p;n=vec3(-1,0,0);u=vec3(0,-1,0);v=vec3(0,0,1);}p=d.y;if(p>s){fi=2;s=p;n=vec3(0,1,0);u=vec3(-1,0,0);v=vec3(0,0,1);}p=-d.y;if(p>s){fi=3;s=p;n=vec3(0,-1,0);u=vec3(1,0,0);v=vec3(0,0,1);}p=d.z;if(p>s){fi=4;s=p;n=vec3(0,0,1);u=vec3(1,0,0);v=vec3(0,1,0);}p=-d.z;if(p>s){fi=5;n=vec3(0,0,-1);u=vec3(-1,0,0);v=vec3(0,1,0);}}
${densityLookup}
float extinction(float h,int channel){float um=WAVELENGTHS[channel]/1000.0;float ray=0.00000124062*pow(um,-4.0)*exp(-h/8000.0);float mie=(0.04/1200.0)*pow(um,-0.8)*exp(-h/1200.0);float od=h<=10000.0||h>=40000.0?0.0:(h<=25000.0?(h-10000.0)/15000.0:(40000.0-h)/15000.0);return ray+mie+5.374e18*OZONE[channel]*od;}
void main(){
	vec2 ndc=(2.0*(gl_FragCoord.xy-vec2(0.5))/vec2(WIDTH,HEIGHT)-1.0);
	float t=tan(radians(78.0)*0.5);vec3 d=normalize(CAMERA_FORWARD+CAMERA_RIGHT*(ndc.x*t*float(WIDTH)/float(HEIGHT))+CAMERA_UP*(ndc.y*t));
	vec3 o=vec3(0.0,0.0,BOTTOM_RADIUS+1.7);float top=positiveRoot(roots(o,d,TOP_RADIUS));float ground=positiveRoot(roots(o,d,BOTTOM_RADIUS));bool groundHit=ground<top;float lengthMeters=min(top,ground);float screenY=float(HEIGHT)-gl_FragCoord.y;bool objectHit=OBJECT_SHORTENING_ENABLED&&gl_FragCoord.x>=OBJECT_SCREEN_RECT.x&&gl_FragCoord.x<OBJECT_SCREEN_RECT.z&&screenY>=OBJECT_SCREEN_RECT.y&&screenY<OBJECT_SCREEN_RECT.w&&OBJECT_DISTANCE_METERS<lengthMeters;if(objectHit)lengthMeters=OBJECT_DISTANCE_METERS;float sceneObjectDistance=1e30;${sceneObjectSource}if(sceneObjectDistance<lengthMeters){lengthMeters=sceneObjectDistance;objectHit=true;}if(lengthMeters>=1e29){outputColor=vec4(0,0,0,1);return;}
	float radiance[15];float trans[15];for(int c=0;c<15;c++){radiance[c]=0.0;trans[c]=1.0;}
	for(int i=0;i<${pathIntervalCount};i++){${segmentSource}float stepMeters=endDistance-startDistance;float distance=0.5*(startDistance+endDistance);vec3 p=o+d*distance;float h=max(0.0,length(p)-BOTTOM_RADIUS);for(int c=0;c<15;c++){float ext=extinction(h,c);trans[c]*=exp(-0.5*ext*stepMeters);radiance[c]+=trans[c]*density(d,p,c)*stepMeters;trans[c]*=exp(-0.5*ext*stepMeters);}}
	ivec2 matrixPixel=ivec2(int(gl_FragCoord.x),HEIGHT-1-int(gl_FragCoord.y));uint entry=texelFetch(uCelestialMatrix,matrixPixel,0).r;
	bool insideSun=ANALYTIC_SUN_ENABLED&&!groundHit&&!objectHit&&dot(d,ANALYTIC_SUN_DIRECTION)>=ANALYTIC_SUN_COSINE;
	vec3 rgb=vec3(0.0);for(int c=0;c<15;c++){float celestial=!groundHit&&entry>0u?texelFetch(uCelestialPalette,ivec2(c,int(entry)),0).r:0.0;if(insideSun)celestial=ANALYTIC_SUN_RADIANCE[c];float total=radiance[c]+trans[c]*celestial;rgb+=total*vec3(RGB_R[c],RGB_G[c],RGB_B[c]);}
	${displayExpression}outputColor=vec4(mapped,1.0);
}`;
}

function compile(gl, type, source) { const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader); if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)); return shader; }
function program(gl, fragment) { const p=gl.createProgram(); const v=compile(gl,gl.VERTEX_SHADER,VERTEX_SOURCE); const f=compile(gl,gl.FRAGMENT_SHADER,fragment); gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p; }
function normalize(v){const l=Math.hypot(...v);return v.map(x=>x/l);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

/** Upload and render one complete point-local scene cache. */
export function renderP6Quadratic30Qualification({gl,canvas,buildRequest,payload,ledger,luminanceLiftGamma=1,maximumLuminanceGain=32768,displayMode='retained',pathIntervalCount=30,pathDistribution='quadratic-near-observer',objectShortening=null,sceneObjects=null,scenePageIndex=0,analyticSunAngularRadiusRadians=0.004675}){
 requireCondition(Number.isInteger(pathIntervalCount)&&pathIntervalCount>0&&pathIntervalCount<=60,'P6.4 path interval count is invalid.');requireCondition(pathDistribution==='uniform'||pathDistribution==='quadratic-near-observer','P6.4 path distribution is invalid.');
 const page=buildRequest.scenePageRequests[scenePageIndex];requireCondition(page,'Scene index is invalid.');const scalarCount=9126*ledger.retainedBlockCount*15;requireCondition(payload instanceof Float32Array&&payload.length===scalarCount,'Point-local payload shape changed.');
 const cacheTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,cacheTexture);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,gl.R32F,9126,ledger.retainedBlockCount,15,0,gl.RED,gl.FLOAT,payload);requireCondition(gl.getError()===gl.NO_ERROR,'Point-local cache upload failed.');
 const zeroMatrix=new Uint16Array(640*400),zeroPalette=new Float32Array(15);const matrixTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,matrixTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texImage2D(gl.TEXTURE_2D,0,gl.R16UI,640,400,0,gl.RED_INTEGER,gl.UNSIGNED_SHORT,zeroMatrix);const paletteTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,paletteTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,15,1,0,gl.RED,gl.FLOAT,zeroPalette);
 const scene=page.scene,az=scene.camera.viewAzimuthDegrees*Math.PI/180,el=scene.camera.viewElevationDegrees*Math.PI/180,uen=[Math.sin(el),Math.sin(az)*Math.cos(el),Math.cos(az)*Math.cos(el)],frame=page.canonicalFrame,canonical=[dot(uen,frame.xAxisUpEastNorth),dot(uen,frame.yAxisUpEastNorth),dot(uen,frame.zAxisUpEastNorth)],forward=normalize(canonical),right=normalize(cross(forward,[0,0,1])),cameraUp=normalize(cross(right,forward));
 const table=buildRequest.transportSpec.atmosphere.ozone.crossSectionTable,ozone=WAVELENGTHS.map((w)=>{const q=(w-table.minimumNanometers)/table.spacingNanometers,a=Math.floor(q),b=Math.min(table.values.length-1,a+1),f=q-a;return table.values[a]*(1-f)+table.values[b]*f;}),projectedSolidAngle=Math.PI*Math.sin(analyticSunAngularRadiusRadians)**2,analyticSun={enabled:true,direction:page.canonicalFrame.directionToSourceCanonical,angularRadiusRadians:analyticSunAngularRadiusRadians,radiance:buildRequest.transportSpec.source.spectralIrradianceDensity.map((value)=>value/projectedSolidAngle)};
 canvas.width=640;canvas.height=400;const pipeline=program(gl,shaderSource({forward,right,up:cameraUp,ozone,luminanceLiftGamma,maximumLuminanceGain,displayMode,pathIntervalCount,pathDistribution,objectShortening,sceneObjects,analyticSun,altitudeNodes:buildRequest.transportSpec.domains.position.nodes.map((node)=>node.altitudeMeters),ledger,sourceDirection:page.canonicalFrame.directionToSourceCanonical})),vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.useProgram(pipeline);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,cacheTexture);gl.uniform1i(gl.getUniformLocation(pipeline,'uCache'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,matrixTexture);gl.uniform1i(gl.getUniformLocation(pipeline,'uCelestialMatrix'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,paletteTexture);gl.uniform1i(gl.getUniformLocation(pipeline,'uCelestialPalette'),2);gl.viewport(0,0,640,400);gl.drawArrays(gl.TRIANGLES,0,3);gl.finish();
 const pixels=new Uint8Array(640*400*4);gl.readPixels(0,0,640,400,gl.RGBA,gl.UNSIGNED_BYTE,pixels);const errors=[];for(let e=gl.getError();e!==gl.NO_ERROR;e=gl.getError())errors.push(e);let nonBlack=0,maximumChannel=0;const sums=[0,0,0];for(let i=0;i<pixels.length;i+=4){if(pixels[i]||pixels[i+1]||pixels[i+2])nonBlack++;for(let c=0;c<3;c++){sums[c]+=pixels[i+c];maximumChannel=Math.max(maximumChannel,pixels[i+c]);}}
 const rowMean=(screenY)=>{const y=399-screenY,out=[0,0,0];for(let x=0;x<640;x++){const i=(y*640+x)*4;for(let c=0;c<3;c++)out[c]+=pixels[i+c];}return out.map((v)=>v/640);};const bandLuminance=(x0,x1,y0,y1)=>{let sum=0,count=0;for(let sy=y0;sy<y1;sy++){const y=399-sy;for(let x=x0;x<x1;x++){const i=(y*640+x)*4;sum+=(pixels[i]+pixels[i+1]+pixels[i+2])/3;count++;}}return sum/count;};
 const imagePngDataUrl=canvas.toDataURL('image/png');gl.deleteTexture(cacheTexture);gl.deleteTexture(matrixTexture);gl.deleteTexture(paletteTexture);gl.deleteProgram(pipeline);gl.deleteVertexArray(vao);
 return {schemaId:'point-local-scene-cache-p6-q30-qualification-render-v1',cacheProvider:'complete point-local scene cache only',lookup:'actual-point altitude x local solar zenith x local source-relative W39 x Native15',observerProjectionUsed:false,validityMaskUsed:false,additiveActualPointCorrectionUsed:false,pathIntervalCount,pathDistribution,objectShortening:objectShortening??{enabled:false},sceneObjects:sceneObjects??[],color:{model:displayMode,luminanceLiftGamma,maximumLuminanceGain},imagePngDataUrl,image:{width:640,height:400,nonBlackPixelCount:nonBlack,maximumChannel,meanRgb:sums.map((v)=>v/(640*400)),horizonRows:Object.fromEntries([180,200,220,240].map((y)=>[y,rowMean(y)])),sourceAxis:{center:bandLuminance(300,340,190,240),leftFlank:bandLuminance(220,260,190,240),rightFlank:bandLuminance(380,420,190,240)}},webglErrors:errors,resources:{cacheDeleted:!gl.isTexture(cacheTexture)}};
}
