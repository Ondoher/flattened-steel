#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {zstdDecompressSync} from 'node:zlib';
import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const controlPath = 'experiments/gpu-resident-shared-block-cache/controls/s0-s2-animation-atlas-contract-v2.json';
const candidateRoot = 'tmp/experiments/distant-sun-cache-optimization/runs/000041-e1-format-compression/candidate';
const sha = (value) => createHash('sha256').update(value).digest('hex');
const fail = (value, message) => { if (!value) throw new Error(message); };
const inverse = (source) => { const output = Buffer.allocUnsafe(source.byteLength); const count = source.byteLength / 4; for (let index = 0; index < count; index += 1) for (let lane = 0; lane < 4; lane += 1) output[index * 4 + lane] = source[lane * count + index]; return output; };
const control = JSON.parse(await readFile(path.join(REPOSITORY_ROOT, ...controlPath.split('/'))));
const indexPath = control.parents.e1.blockIndex.path.replace(/^.*candidate\//u, '');
const indexBytes = await readFile(path.join(REPOSITORY_ROOT, ...candidateRoot.split('/'), ...indexPath.split('/')));
fail(sha(indexBytes) === control.parents.e1.blockIndex.sha256, 'Pinned E1 block index changed.');
const block = JSON.parse(indexBytes).blocks[10];
const encoded = await readFile(path.join(REPOSITORY_ROOT, ...candidateRoot.split('/'), ...block.path.split('/')));
fail(sha(encoded) === block.encodedSha256, 'Pinned E1 block changed.');
const decoded = inverse(zstdDecompressSync(encoded, {maxOutputLength: block.decodedByteLength}));
fail(sha(decoded) === block.decodedSha256, 'Decoded E1 block identity failed.');
await mkdir(path.join(OUTPUT_ROOT, 'runs'), {recursive: true});
const runId = `${Date.now()}-s5-shader-lookup-benchmark-v2`; const run = path.join(OUTPUT_ROOT, 'runs', runId); await mkdir(run);
await Promise.all(['command.txt', 'inputs.json', 'provenance.json', 'environment.json'].map((name) => writeFile(path.join(run, name), `${JSON.stringify({runId, controlPath, blockIndex: 10, decodedSha256: sha(decoded)}, null, 2)}\n`)));
const page = `<!doctype html><canvas width="1024" height="1024"></canvas><script type="module">
try { const gl=document.querySelector('canvas').getContext('webgl2'); const fail=(v,m)=>{if(!v)throw Error(m)}; fail(gl,'WebGL2 unavailable');
const bytes=await fetch('/block').then(r=>r.arrayBuffer()); const values=new Float32Array(bytes);
const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);fail(gl.getShaderParameter(shader,gl.COMPILE_STATUS),gl.getShaderInfoLog(shader));return shader};
const vertex=compile(gl.VERTEX_SHADER,'#version 300 es\\nvoid main(){vec2 p=vec2((gl_VertexID&1)*4-1,(gl_VertexID&2)*2-1);gl_Position=vec4(p,0.,1.);}');
const program=(source)=>{const p=gl.createProgram();gl.attachShader(p,vertex);gl.attachShader(p,compile(gl.FRAGMENT_SHADER,source));gl.linkProgram(p);fail(gl.getProgramParameter(p,gl.LINK_STATUS),gl.getProgramInfoLog(p));return p};
const dense=program('#version 300 es\\nprecision highp float;precision highp sampler2D;uniform sampler2D cache;out vec4 outColor;void main(){int x=int(gl_FragCoord.x)%4058;int row=int(gl_FragCoord.y)%64;float s=0.;for(int c=0;c<15;c++)s+=texelFetch(cache,ivec2(x,row*15+c),0).r;outColor=vec4(s);}');
const atlas=program('#version 300 es\\nprecision highp float;precision highp sampler2DArray;uniform sampler2DArray cache;out vec4 outColor;void main(){int x=int(gl_FragCoord.x)%4058;int row=int(gl_FragCoord.y)%64;float s=0.;for(int c=0;c<15;c++)s+=texelFetch(cache,ivec3(x,row*15+c,0),0).r;outColor=vec4(s);}');
const configure=(target,texture)=>{gl.bindTexture(target,texture);gl.texParameteri(target,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(target,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(target,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(target,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)};
const denseTexture=gl.createTexture();configure(gl.TEXTURE_2D,denseTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,4058,960,0,gl.RED,gl.FLOAT,values);
const atlasTexture=gl.createTexture();configure(gl.TEXTURE_2D_ARRAY,atlasTexture);gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,gl.R32F,4058,960,1,0,gl.RED,gl.FLOAT,values);
const measure=(p,target,texture)=>{gl.useProgram(p);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(target,texture);gl.uniform1i(gl.getUniformLocation(p,'cache'),0);gl.viewport(0,0,1024,1024);for(let i=0;i<8;i++)gl.drawArrays(gl.TRIANGLES,0,3);gl.finish();const started=performance.now();for(let i=0;i<32;i++)gl.drawArrays(gl.TRIANGLES,0,3);gl.finish();return performance.now()-started};
await fetch('/result',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accepted:true,resolution:[1024,1024],draws:32,spectralFetchesPerFragment:15,denseMilliseconds:measure(dense,gl.TEXTURE_2D,denseTexture),atlasMilliseconds:measure(atlas,gl.TEXTURE_2D_ARRAY,atlasTexture)})});
} catch (error) { await fetch('/result',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accepted:false,error:{name:error.name,message:error.message}})}); }
</script>`;
let resolve; const resultPromise = new Promise((done) => { resolve = done; });
const server = createServer(async (request, response) => { if (request.url === '/') { response.writeHead(200, {'content-type':'text/html'}); response.end(page); return; } if (request.url === '/block') { response.writeHead(200, {'content-type':'application/octet-stream'}); response.end(decoded); return; } if (request.url === '/result' && request.method === 'POST') { let body=''; for await (const chunk of request) body += chunk; resolve(JSON.parse(body)); response.end(); return; } response.writeHead(404); response.end(); });
await new Promise((done) => server.listen(0,'127.0.0.1',done)); const port = server.address().port; const child = spawn(CHROME_EXECUTABLE,['--headless=new','--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11',`http://127.0.0.1:${port}/`],{windowsHide:true}); const timeout=setTimeout(()=>resolve({accepted:false,error:{name:'TimeoutError',message:'Browser did not post a benchmark result.'}}),60000); const result=await resultPromise; clearTimeout(timeout); child.kill(); await new Promise((done)=>server.close(done)); await writeFile(path.join(run,'browser-result.json'),`${JSON.stringify(result,null,2)}\n`); await writeFile(path.join(run,'result.json'),`${JSON.stringify({runId,accepted:result.accepted,browser:result},null,2)}\n`); await writeFile(path.join(run,'progress.jsonl'),`${JSON.stringify({timestamp:new Date().toISOString(),phase:'terminal',message:'Shader lookup benchmark completed.',state:result.accepted?'accepted':'failed'})}\n`); if(!result.accepted)throw new Error(`${result.error.name}: ${result.error.message}`); process.stdout.write(`${JSON.stringify({runId,result},null,2)}\n`);
