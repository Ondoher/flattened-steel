import assert from 'node:assert/strict';
import {aerosolBundle} from './aerosol-reference.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';

/** Encode a bounded, nonrecord CDF-1 file for the installed solver's documented optical-library reader.
 * @param {Record<string,number>} dimensions Fixed dimension lengths.
 * @param {{name:string,dims:string[],type:number,values:number[]}[]} variables Numeric variables in row-major order.
 * @returns {Buffer} NetCDF classic bytes, with explicit version attribute; unsupported types reject.
 */
function netcdf(dimensions,variables){
	const u=n=>{const b=Buffer.alloc(4);b.writeUInt32BE(n);return b;},pad=b=>Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]),name=s=>Buffer.concat([u(Buffer.byteLength(s)),pad(Buffer.from(s))]);
	const names=Object.keys(dimensions),dims=Buffer.concat([u(10),u(names.length),...names.flatMap(n=>[name(n),u(dimensions[n])])]);
	const attrs=Buffer.concat([u(12),u(1),name('version'),u(4),u(1),u(20110101)]);
	const data=variables.map(v=>{assert.ok([4,5,6].includes(v.type));assert.equal(v.values.length,v.dims.reduce((n,d)=>n*dimensions[d],1));const b=Buffer.alloc(v.values.length*(v.type===6?8:4));v.values.forEach((x,i)=>{assert.ok(Number.isFinite(x));if(v.type===6)b.writeDoubleBE(x,i*8);else if(v.type===5)b.writeFloatBE(x,i*4);else b.writeInt32BE(x,i*4);});return pad(b);});
	const header=offset=>{let cursor=offset;return Buffer.concat([Buffer.from([67,68,70,1]),u(0),dims,attrs,u(11),u(variables.length),...variables.map((v,i)=>{const b=Buffer.concat([name(v.name),u(v.dims.length),...v.dims.map(d=>u(names.indexOf(d))),u(0),u(0),u(v.type),u(data[i].length),u(cursor)]);cursor+=data[i].length;return b;})]);};
	const length=header(0).length;return Buffer.concat([header(length),...data]);
}

/** Independently decode the emitted classic NetCDF fields and check physical optical values.
 * @param {Buffer} bytes Actual library bytes passed to the external solver.
 * @param {HorizonReferenceMedium} medium Frozen physical extinction.
 * @param {HorizonAerosolMaterial} material Frozen measured phase/SSA.
 * @returns {{maximumRelativePhaseError:number,maximumRelativeMassError:number}} Binary projection/normalization proof.
 */
function qualifyLibrary(bytes,medium,material){
	let at=4;assert.equal(bytes.subarray(0,4).toString('hex'),'43444601');
	const uint=()=>{const n=bytes.readUInt32BE(at);at+=4;return n;},name=()=>{const n=uint(),s=bytes.subarray(at,at+n).toString();at+=Math.ceil(n/4)*4;return s;},size=type=>type===6?8:4;
	const attributes=()=>{const tag=uint(),n=uint();assert.ok(tag===0||tag===12);for(let i=0;i<n;i++){name();const type=uint(),count=uint();at+=Math.ceil(size(type)*count/4)*4;}};
	assert.equal(uint(),0);assert.equal(uint(),10);const nd=uint(),dims=[];for(let i=0;i<nd;i++)dims.push({name:name(),count:uint()});attributes();assert.equal(uint(),11);const nv=uint(),fields=new Map();
	for(let i=0;i<nv;i++){const key=name(),n=uint(),d=Array.from({length:n},()=>uint());attributes();const type=uint(),length=uint(),offset=uint(),count=d.reduce((p,j)=>p*dims[j].count,1);assert.equal(length,count*size(type));const values=Array.from({length:count},(_,j)=>type===6?bytes.readDoubleBE(offset+j*8):type===5?bytes.readFloatBE(offset+j*4):bytes.readInt32BE(offset+j*4));fields.set(key,values);}
	const width=dims.find(d=>d.name==='nthetamax').count,angles=fields.get('theta'),phases=fields.get('phase');let maximumRelativePhaseError=0,maximumRelativeMassError=0;
	assert.ok(fields.get('wavelen')[0]*1000<Math.fround(NATIVE_15_SPECTRAL_BASIS.channels[0].center.value));assert.ok(fields.get('wavelen').at(-1)*1000>Math.fround(NATIVE_15_SPECTRAL_BASIS.channels.at(-1).center.value));
	for(let c=0;c<15;c++){
		const index=c+1;assert.equal(fields.get('wavelen')[index],NATIVE_15_SPECTRAL_BASIS.channels[c].center.value/1000);assert.equal(fields.get('ext')[index],medium.mie[c]*1000);assert.equal(fields.get('ssa')[index],material.albedos[c]);
		const count=fields.get('ntheta')[index],mu=angles.slice(index*width,index*width+count).map(t=>Math.cos(t*Math.PI/180)),p=phases.slice(index*width,index*width+count),table=material.phaseTables[c];let mass=0;
		assert.equal(angles[index*width],180);assert.equal(angles[index*width+count-1],0);
		for(let i=1;i<count;i++){assert.ok(mu[i]>mu[i-1]&&p[i]>0);mass+=(mu[i]-mu[i-1])*(p[i]+p[i-1])/2;}maximumRelativeMassError=Math.max(maximumRelativeMassError,Math.abs(mass/2-1));
		for(let j=0;j<=4096;j++){const x=-Math.cos(Math.PI*j/4096);let lo=0,hi=count-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(x>=mu[mid])lo=mid;else hi=mid;}const u=Math.max(0,Math.min(1,(x-mu[lo])/(mu[hi]-mu[lo]))),value=p[lo]*(1-u)+p[hi]*u,g=medium.g,target=table?4*Math.PI*aerosolPhase(table,x):1.5*(1-g*g)/(2+g*g)*(1+x*x)/(1+g*g-2*g*x)**1.5;maximumRelativePhaseError=Math.max(maximumRelativePhaseError,Math.abs(value/target-1));}
	}
	assert.ok(maximumRelativeMassError<0.0001&&maximumRelativePhaseError<0.0001);return {maximumRelativePhaseError,maximumRelativeMassError};
}

/** A direct angular optical library, avoiding per-layer Legendre expansion in legacy MYSTIC.
 * @param {HorizonReferenceMedium} medium Original canonical extinction and geometry.
 * @param {HorizonLibCase} config Actual external rays and counts.
 * @param {HorizonAerosolMaterial} material Retained measured phase/SSA.
 * @param {boolean} refined Whether to refine the direct angular representation independently.
 * @returns {Map<string,string|Buffer>} Self-contained case with an exact linear-table material above440nm.
 */
export function directBundle(medium,config,material,refined){
	const original=aerosolBundle(medium,config),files=/** @type {Map<string,string|Buffer>} */(new Map(original));
	const z=original.get('aerosols.txt').trim().split(/\r?\n/).map(s=>Number(s.split(' ')[0])*1000);
	for(const key of files.keys())if(/^aerosol-\d+\.txt$/.test(key)||key==='aerosols.txt')files.delete(key);
	const density=z.map((height,i)=>i===0?0:medium.mieHeight*(Math.exp(-height/medium.mieHeight)-Math.exp(-z[i-1]/medium.mieHeight))/(z[i-1]-height));
	files.set('species.txt',z.map((height,i)=>`${height/1000} ${density[i]}`).join('\n')+'\n');
	const tables=material.phaseTables.map(table=>{
		if(table){const mu=[...table.mu];if(refined)for(let i=1;i<table.mu.length;i++)mu.push((table.mu[i-1]+table.mu[i])/2);mu.sort((a,b)=>a-b);return {theta:mu.map(x=>Math.acos(x)*180/Math.PI),phase:mu.map(x=>4*Math.PI*aerosolPhase(table,x))};}
		const count=refined?3600:1800,theta=Array.from({length:count+1},(_,i)=>180-i*180/count),g=medium.g;
		return {theta,phase:theta.map(t=>{const x=Math.cos(t*Math.PI/180);return 1.5*(1-g*g)/(2+g*g)*(1+x*x)/(1+g*g-2*g*x)**1.5;})};
	});
	const maximum=Math.max(...tables.map(t=>t.theta.length)),pad=values=>[...values,...Array(maximum-values.length).fill(0)],guard=values=>[values[0],...values,values.at(-1)],guardTables=guard(tables),wavelengths=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value);
	const n=17,variables=[
		{name:'wavelen',dims:['nlam'],type:6,values:[wavelengths[0]-0.001,...wavelengths,wavelengths.at(-1)+0.001].map(w=>w/1000)},
		{name:'hum',dims:['nhum'],type:6,values:[0]},
		{name:'ext',dims:['nlam','nhum'],type:6,values:guard(medium.mie.map(x=>x*1000))},
		{name:'ssa',dims:['nlam','nhum'],type:6,values:guard(material.albedos)},
		{name:'nmom',dims:['nlam','nhum'],type:4,values:Array(n).fill(0)},
		{name:'ntheta',dims:['nlam','nhum','nphamat'],type:4,values:guardTables.map(t=>t.theta.length)},
		{name:'theta',dims:['nlam','nhum','nphamat','nthetamax'],type:5,values:guardTables.flatMap(t=>pad(t.theta))},
		{name:'phase',dims:['nlam','nhum','nphamat','nthetamax'],type:5,values:guardTables.flatMap(t=>pad(t.phase))},
	];
	const binary=netcdf({nlam:n,nhum:1,nphamat:1,nmommax:1,nthetamax:maximum},variables),binaryProof=qualifyLibrary(binary,medium,material);files.set('toronto.material.cdf',binary);
	files.set('input.inp',original.get('input.inp').replace('aerosol_file explicit aerosols.txt','aerosol_species_file species.txt toronto\naerosol_species_library ./'));
	const metadata=JSON.parse(original.get('case.json'));metadata.purpose='H45 independent Toronto phase/SSA material with direct angular optical library';metadata.material=material;metadata.phase={family:'83-node normalized linear cosine PDF above440nm; analytic CS sampled below',representation:'direct angular table, no Legendre truncation',refined,counts:tables.map(t=>t.theta.length)};
	metadata.opticalLibrary={extinctionUnits:'km^-1 per1g/m3; ext=sea-level coefficient*1000',density:'Analytic exponential layer-average shape in g/m3; normalization is an input convention, not a measured mass concentration.',tableNormalization:'p=4pi*phase=2*normalizedCosinePdf; source reader uses linear cosine interpolation.',spectralGuard:'Duplicate endpoint properties at native-domain edges +/-0.001nm to cover the native solver Float32 wavelength rounding. Interior15 centers remain exact; no new measured-band extrapolation.'};
	let maximumColumnRelativeError=0;
	for(let c=0;c<15;c++){const sum=z.slice(1).reduce((s,lower,i)=>s+medium.mie[c]*density[i+1]*(z[i]-lower),0),expected=medium.mie[c]*medium.mieHeight*-Math.expm1(-medium.topAltitude/medium.mieHeight);maximumColumnRelativeError=Math.max(maximumColumnRelativeError,Math.abs(sum/expected-1));}assert.ok(maximumColumnRelativeError<1e-12);
	metadata.maximumColumnRelativeError=maximumColumnRelativeError;metadata.actualBinaryOpticalProof=binaryProof;metadata.directTables=tables;files.set('case.json',JSON.stringify(metadata));return files;
}
