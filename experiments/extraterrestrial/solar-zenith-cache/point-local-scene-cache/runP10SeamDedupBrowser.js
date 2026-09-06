const LOGICAL_WIDTH = 4374;
const HEIGHT = 617;
const LAYERS = 15;
const UNIQUE_WIDTH = 4058;

function requireCondition(value, message) { if (!value) throw new Error(message); }
function compile(gl, type, source) { const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader; }
function program(gl, compressed) {
	const vertex=compile(gl,gl.VERTEX_SHADER,'#version 300 es\nvoid main(){vec2 p=gl_VertexID==0?vec2(-1):gl_VertexID==1?vec2(3,-1):vec2(-1,3);gl_Position=vec4(p,0,1);}');
	const map=compressed?'int mapped=int(texelFetch(uIndex,ivec2(logical,0),0).r);':'int mapped=logical;';
	const fragment=compile(gl,gl.FRAGMENT_SHADER,`#version 300 es
precision highp float;precision highp int;uniform highp sampler2DArray uCache;uniform highp usampler2D uIndex;layout(location=0)out vec4 color;
void main(){float total=0.0;int row=int(mod(gl_FragCoord.y,617.0));int base=int(mod(gl_FragCoord.x,4370.0));for(int c=0;c<15;c++){for(int t=0;t<16;t++){int logical=(base+t*271)%4374;${map}total+=texelFetch(uCache,ivec3(mapped,row,c),0).r;}}color=vec4(total,total*0.5,total*0.25,1.0);}`);
	const value=gl.createProgram();gl.attachShader(value,vertex);gl.attachShader(value,fragment);gl.linkProgram(value);gl.deleteShader(vertex);gl.deleteShader(fragment);if(!gl.getProgramParameter(value,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(value));return value;
}
function textureArray(gl,width,payload){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,texture);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texStorage3D(gl.TEXTURE_2D_ARRAY,1,gl.R32F,width,HEIGHT,LAYERS);const layer=width*HEIGHT;for(let z=0;z<LAYERS;z++)gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,z,width,HEIGHT,1,gl.RED,gl.FLOAT,payload.subarray(z*layer,(z+1)*layer));gl.finish();requireCondition(gl.getError()===gl.NO_ERROR,'Codec cache upload failed.');return texture;}
function indexTexture(gl,index){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texImage2D(gl.TEXTURE_2D,0,gl.R16UI,LOGICAL_WIDTH,1,0,gl.RED_INTEGER,gl.UNSIGNED_SHORT,index);requireCondition(gl.getError()===gl.NO_ERROR,'Codec index upload failed.');return texture;}
function drawBatch(gl,cache,index,compressed){const p=program(gl,compressed),vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.useProgram(p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,cache);gl.uniform1i(gl.getUniformLocation(p,'uCache'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,index);gl.uniform1i(gl.getUniformLocation(p,'uIndex'),1);gl.viewport(0,0,640,400);for(let i=0;i<3;i++)gl.drawArrays(gl.TRIANGLES,0,3);gl.finish();for(let i=0;i<12;i++){gl.drawArrays(gl.TRIANGLES,0,3);gl.finish();}gl.deleteProgram(p);gl.deleteVertexArray(vao);}
function probe(gl,texture,width,x,y,z){const framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTextureLayer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,texture,0,z);requireCondition(gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE,'Codec probe framebuffer failed.');const value=new Float32Array(1);gl.readPixels(x,y,1,1,gl.RED,gl.FLOAT,value);gl.deleteFramebuffer(framebuffer);return value[0];}

export async function runP10SeamDedupBrowser(){
	const mark=async(stage)=>globalThis.pointLocalProgress?.(`p10-seam:${stage}`);
	const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;
	const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance'});if(!gl)throw new Error('WebGL2 is unavailable.');requireCondition(gl.getExtension('EXT_color_buffer_float'),'EXT_color_buffer_float is required.');
	const debug=gl.getExtension('WEBGL_debug_renderer_info');const gpu={api:gl.getParameter(gl.VERSION),renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
	const [rawBuffer,compressedBuffer,indexBuffer]=await Promise.all([
		fetch('/asset/cache/nautical-twilight-native15-c4-w27.f32').then(r=>r.arrayBuffer()),
		fetch('/codec/cache/nautical-twilight-native15-c4-w27-seam-dedup.f32').then(r=>r.arrayBuffer()),
		fetch('/codec/cache/w27-logical-to-unique.u16').then(r=>r.arrayBuffer())]);
	const raw=new Float32Array(rawBuffer),compressed=new Float32Array(compressedBuffer),index=new Uint16Array(indexBuffer);
	requireCondition(raw.length===LOGICAL_WIDTH*HEIGHT*LAYERS&&compressed.length===UNIQUE_WIDTH*HEIGHT*LAYERS&&index.length===LOGICAL_WIDTH,'Codec browser asset shapes changed.');
	const rawTexture=textureArray(gl,LOGICAL_WIDTH,raw),compressedTexture=textureArray(gl,UNIQUE_WIDTH,compressed),mapTexture=indexTexture(gl,index);
	const probes=[];for(const logical of [0,26,728,729,1457,2187,4373])for(const row of [0,308,616])for(const layer of [0,7,14]){const a=probe(gl,rawTexture,LOGICAL_WIDTH,logical,row,layer),b=probe(gl,compressedTexture,UNIQUE_WIDTH,index[logical],row,layer);probes.push({logical,unique:index[logical],row,layer,raw:a,decoded:b,exact:Object.is(a,b)});}
	await mark('raw-kernel-start');drawBatch(gl,rawTexture,mapTexture,false);await mark('raw-kernel-complete');
	await mark('codec-kernel-start');drawBatch(gl,compressedTexture,mapTexture,true);await mark('codec-kernel-complete');
	gl.deleteTexture(rawTexture);gl.deleteTexture(compressedTexture);gl.deleteTexture(mapTexture);
	return {schemaId:'point-local-p10-seam-dedup-browser-result-v1',gpu,probes,
		resources:{rawDeleted:!gl.isTexture(rawTexture),compressedDeleted:!gl.isTexture(compressedTexture),indexDeleted:!gl.isTexture(mapTexture)},webglError:gl.getError()};
}
