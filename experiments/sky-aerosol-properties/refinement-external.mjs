import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readdirSync,rmSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createRun,read,identity,checked,repository,output} from './io.mjs';
import {parents,medium,centers,queries} from './refinement-common.mjs';

/** Accurate normalized Cornette–Shanks Legendre moments. @param {number} g */
function moments(g){return Array.from({length:256},(_,l)=>{const a=(l+1)*(l+2)/((2*l+1)*(2*l+3)),b=(l+1)**2/((2*l+1)*(2*l+3))+(l?l*l/((2*l+1)*(2*l-1)):0),c=l>=2?l*(l-1)/((2*l+1)*(2*l-1)):0;return 3/(2*(2+g*g))*(g**l*(1+b)+a*g**(l+2)+(c?c*g**(l-2):0));});}
/** Generate exact-column layer files, preserving independent solver inputs. @param {AerosolMedium} m @param {any} c */
function bundle(m,c){
 const levels=new Set([0,m.observerHeight,m.topAltitude]);for(const H of [m.rayleighHeight,m.mieHeight])for(let i=1;i<c.layers;i++)levels.add(-H*Math.log1p(-(1-i/c.layers)*-Math.expm1(-m.topAltitude/H)));
 const z=[...levels].sort((a,b)=>b-a),files=new Map(),phase=moments(m.g),header=z.map(v=>v/1000).join(' '),sca=[header],abs=[header],aerosol=[`${z[0]/1000} NULL`];
 for(const k of c.channels){sca.push([centers[k],...z.slice(1).map((lo,i)=>m.rayleigh[k]*m.rayleighHeight*(Math.exp(-lo/m.rayleighHeight)-Math.exp(-z[i]/m.rayleighHeight)))].join(' '));abs.push([centers[k],...z.slice(1).map(()=>0)].join(' '));}
 for(let i=1;i<z.length;i++){const lo=z[i],hi=z[i-1],f=m.mieHeight*(Math.exp(-lo/m.mieHeight)-Math.exp(-hi/m.mieHeight))/(hi-lo)*1000,name=`aerosol-${i}.txt`;files.set(name,c.channels.map(k=>[centers[k],m.mie[k]*f,m.albedo,...phase].join(' ')).join('\n')+'\n');aerosol.push(`${lo/1000} ${name}`);}
 files.set('scattering.txt',sca.join('\n')+'\n');files.set('absorption.txt',abs.join('\n')+'\n');files.set('aerosols.txt',aerosol.join('\n')+'\n');
 files.set('atmosphere.txt',z.map(v=>`${v/1000} ${1013*Math.exp(-v/m.rayleighHeight)} 288 ${2.545818e19*Math.exp(-v/m.rayleighHeight)}`).join('\n')+'\n');
 files.set('solar.txt',c.channels.map(k=>`${centers[k]} ${1000*m.sourceIrradiance[k]}`).join('\n')+'\n');files.set('wavelengths.txt',c.channels.map(k=>centers[k]).join('\n')+'\n');
 const ray=queries(m).find(r=>r.id===c.ray);assert.ok(ray);const elevation=Math.asin(ray.direction[2])*180/Math.PI;
 files.set('input.inp',[
 'data_files_path @LIBRADTRAN_DATA@/','atmosphere_file atmosphere.txt','source solar solar.txt per_nm','wavelength_grid_file wavelengths.txt','spline_file wavelengths.txt','mol_tau_file sca scattering.txt','mol_tau_file abs absorption.txt','mol_abs_param none','aerosol_default','aerosol_file explicit aerosols.txt','rayleigh_depol 0','earth_radius 6360','albedo 0',`zout ${m.observerHeight/1000}`,`sza ${Math.acos(m.sourceDirection[2])*180/Math.PI}`,'phi0 0',`umu ${-Math.sin(elevation*Math.PI/180)}`,`phi ${c.ray.startsWith('sun-')?0:180}`,'rte_solver mystic','mc_spherical 1D','mc_vroom off',`mc_photons ${c.photons}`,`mc_randomseed ${100003+104729*c.repeat}`,...(c.order?[`mc_maxscatters ${c.order}`]:[]),'output_user lambda uu','quiet',''].join('\n'));
 files.set('case.json',JSON.stringify({purpose:'Matched combo025 spherical scalar diffuse radiance',geometry:{medium:m,ray},quantity:'Directional spectral radiance',units:'Raw mW m^-2 sr^-1 nm^-1; divide by1000',limitations:['Photon and layer convergence must be measured','No measured-sky truth','N1-4 only when mc_maxscatters4 is accepted and independently checked'],configuration:c,phaseMoments:phase}));return files;
}
/** Existing unmodified tool worker in a nested, experiment-owned compatible boundary. @param {any} run @param {AerosolMedium} m @param {any} c */
async function execute(run,m,c){
 const name=`${c.ray}-n${c.order??'all'}-${c.repeat}`,scratch=`${output}/scratch/${run.relative.split('/').at(-1)}/.codex-tmp/libradtran/runs/${name}`;
 mkdirSync(checked(scratch,true),{recursive:true});const folder=checked(scratch);mkdirSync(checked(scratch+'/case',true));const files=bundle(m,c),inputs=[];
 for(const [name,contents]of files){writeFileSync(checked(scratch+'/case/'+name,true),contents,{flag:'wx'});const a=identity(scratch+'/case/'+name);inputs.push({path:'case/'+name,bytes:a.byteLength,sha256:a.sha256});}
 writeFileSync(checked(scratch+'/worker.py',true),read('scripts/libradtran/worker.py'),{flag:'wx'});
 const installation=JSON.parse(read('scripts/libradtran/installation.json').toString()),linux='/mnt/c/'+folder.slice(3).replaceAll('\\','/');
 const request={command:'run',installation,runDirectory:linux,inputs,case:JSON.parse(files.get('case.json')),timeoutSeconds:1200};writeFileSync(checked(scratch+'/request.json',true),JSON.stringify(request),{flag:'wx'});
 run.progress('reference',name);const started=Date.now();
 const launch=await new Promise((resolve,reject)=>{const p=spawn(installation.wslExecutable,['-d',installation.distribution,'--user',installation.user,'--cd',linux,'--exec','python3','-B',linux+'/worker.py',linux+'/request.json'],{windowsHide:true});let stdout='',stderr='';const deadline=setTimeout(()=>p.kill(),1320000);p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);p.on('error',reject);p.on('close',code=>{clearTimeout(deadline);resolve({code,stdout,stderr,milliseconds:Date.now()-started});});});
 run.write(name+'-launch.json',launch);
 const archive={};function collect(rel){for(const n of readdirSync(checked(scratch+rel),{withFileTypes:true})){const p=rel+'/'+n.name;if(n.isDirectory())collect(p);else archive[p.slice(1)]=read(scratch+p).toString('base64');}}collect('');run.write(name+'-bundle.json.gz',gzipSync(Buffer.from(JSON.stringify(archive))));
 assert.equal(launch.code,0,launch.stderr);const manifest=JSON.parse(read(scratch+'/manifest.json').toString());assert.equal(manifest.status,'succeeded');
 for(const a of manifest.artifacts){const actual=identity(scratch+'/'+a.path);assert.equal(actual.sha256,a.sha256);assert.equal(actual.byteLength,a.bytes);}
 const raw=read(scratch+'/execution/mc.rad.spc').toString(),rows=raw.trim().split(/\r?\n/).filter(s=>s.trim()&&!s.startsWith('#')).map(s=>s.trim().split(/\s+/).map(Number));assert.equal(rows.length,c.channels.length);
 const spectrum=rows.map((r,i)=>{assert.ok(Math.abs(r[0]-centers[c.channels[i]])<.001&&r[4]>=0&&Number.isFinite(r[4]));return r[4]/1000;});
 run.write(name+'-reading.json',{configuration:c,medium:m,spectrum,launch,solver:manifest.solver});
 // All case bytes, raw solver results and tool manifests survive in the authenticated bundle.
 const target=checked(`${output}/scratch/${run.relative.split('/').at(-1)}`);assert.ok(target.startsWith(checked(output+'/scratch')+'\\'));rmSync(target,{recursive:true});return {configuration:c,spectrum,milliseconds:Date.now()-started};
}
const run=createRun('refine-reference',[...parents(),identity('scripts/libradtran/worker.py'),identity('scripts/libradtran/installation.json')]);let failure=null;
try{
 const m=medium(),pilot=process.argv.includes('--pilot'),channels=pilot?[2,5,8]:centers.map((_,i)=>i),readings=[];
 const H=Number(process.argv[process.argv.indexOf('--height')+1])||1200;m.mieHeight=H;Object.assign(m,medium(H));
 run.write('registration.json',{medium:m,channels,pilot,projection:'Native15 midpoint optics, bin-average source',orderConvention:'mc_maxscatters upper cumulative bound; independently qualify',geometry:'mc_spherical1D, mc_vroom off',scope:'External solver operational pilot unless repeat/layer qualification passes'});
 for(const ray of ['h180-e0.05','sun-1'])for(let repeat=0;repeat<(pilot?1:4);repeat++)readings.push(await execute(run,m,{ray,channels,repeat,photons:pilot?10000:20000,layers:pilot?128:256,order:4}));
 run.write('readings.json',readings);console.log(JSON.stringify({run:run.relative,readings}));
}catch(e){failure=e;run.write('failure.json',{error:String(e)});console.error(e);}finally{run.finish(failure,{purpose:'Matched higher-order external pilot'});}if(failure)process.exitCode=1;
