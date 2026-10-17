import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {identity, readRepository} from '../io/files.mjs';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';

/** Authenticate actual inputs and raw radiance, independently checking both optical grids.
 * @param {readonly HorizonLibReading[]} readings Finalized external observations.
 * @param {HorizonLibParent} physical Frozen physical target.
 * @param {HorizonProductionControl} control Actual production request.
 * @param {DialFileIdentity[]} parents Receives immutable source identities.
 * @param {(message:string)=>void} progress Owning run's progress publication.
 * @returns {HorizonAerosolInputProof} Physical matching checks; any mismatch throws.
 */
export function qualifyInputs(readings, physical, control, parents, progress) {
	const m=physical.medium, spec=control.request.transportSpec, centers=NATIVE_15_SPECTRAL_BASIS.channels.map(c=>c.center.value);
	assert.equal(spec.planet.bottomRadiusMeters,m.radius);assert.equal(spec.planet.topRadiusMeters,m.radius+m.topAltitude);
	assert.equal(spec.atmosphere.miePhaseFunctionG,m.g);assert.equal(spec.atmosphere.mieSingleScatteringAlbedo,m.albedo);assert.equal(spec.atmosphere.mieScaleHeightMeters,m.mieHeight);assert.equal(spec.atmosphere.rayleighScaleHeightMeters,m.rayleighHeight);
	spec.domains.spectrum.channels.forEach((c,i)=>{assert.equal(c.mieExtinctionPerMeter,m.mie[i]);assert.equal(c.rayleighScatteringPerMeter,m.rayleigh[i]);assert.equal(c.groundAlbedo,0);assert.equal(c.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,m.sourceIrradiance[i]*m.incidentScale);});
	const grids=/** @type {HorizonAerosolGridProof[]} */([]), opticalIdentities=new Map();
	for(const reading of readings) {
		progress(`Authenticate ${reading.configuration.id}, seed ${reading.configuration.repeat}.`);
		const t=reading.toolRun;assert.ok(t.startsWith('.codex-tmp/libradtran/runs/'));
		const manifestPath=t+'/manifest.json',mf=/** @type {HorizonLibManifest} */(JSON.parse(readRepository(manifestPath).toString()));assert.equal(mf.status,'succeeded');parents.push(identity(manifestPath));
		const artifacts=new Map(mf.artifacts.map(a=>[a.path,a]));
		/** Read authenticated original input. @param {string} name @returns {string} Exact input text. */
		function original(name){const a=artifacts.get('case/'+name);assert.ok(a);return readRepository(t+'/case/'+name,a.sha256).toString();}
		const deckA=artifacts.get('execution/input.inp');assert.ok(deckA);const deck=readRepository(t+'/execution/input.inp',deckA.sha256).toString();parents.push(identity(t+'/execution/input.inp'));
		for(const line of ['rte_solver mystic','mc_spherical 1D','mc_vroom off','rayleigh_depol 0','albedo 0','phi0 0','phi 180','zout 0.005','mol_abs_param none','mol_tau_file sca scattering.txt','mol_tau_file abs absorption.txt','aerosol_file explicit aerosols.txt','source solar solar.txt per_nm','atmosphere_file atmosphere.txt','wavelength_grid_file wavelengths.txt','spline_file wavelengths.txt'])assert.ok(deck.split(/\r?\n/).includes(line),line);
		assert.ok(!/no_absorption|aerosol_modify|mc_maxscatters|mc_minscatters|pseudospherical/.test(deck));
		assert.ok(Math.abs(Math.cos(Number(deck.match(/^sza (.+)$/m)?.[1])*Math.PI/180)-m.sourceDirection[2])<1e-12);
		assert.ok(Math.abs(Number(deck.match(/^umu (.+)$/m)?.[1])+Math.sin(reading.configuration.elevation*Math.PI/180))<1e-12);
		assert.equal(Number(deck.match(/^earth_radius (.+)$/m)?.[1]),m.radius/1000);assert.equal(Number(deck.match(/^mc_photons (.+)$/m)?.[1]),reading.configuration.photons);
		assert.equal(Number(deck.match(/^mc_randomseed (.+)$/m)?.[1]),100003+104729*reading.configuration.repeat);
		const metadata=/** @type {HorizonAerosolCaseMetadata} */(JSON.parse(original('case.json')));assert.deepEqual(metadata.medium,m);assert.deepEqual(metadata.configuration,reading.configuration);parents.push(identity(t+'/case/case.json'));
		const raw=artifacts.get('execution/mc.rad.spc');assert.ok(raw);const rawBytes=readRepository(t+'/'+raw.path,raw.sha256);parents.push(identity(t+'/'+raw.path));
		const parsed=rawBytes.toString().trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.equal(parsed.length,15);
		parsed.forEach((r,c)=>{assert.ok(Math.abs(r[0]-centers[c])<0.001);assert.equal(r[4]/1000,reading.spectrum[c]);});
		for(const a of mf.artifacts.filter(a=>a.path.startsWith('case/')&&a.path!=='case/input.inp')){const b=artifacts.get('execution/'+a.path.slice(5));assert.ok(b);assert.equal(a.sha256,b.sha256);}
		const optics=mf.artifacts.filter(a=>a.path.startsWith('case/')&&!['case/input.inp','case/case.json'].includes(a.path)).map(a=>[a.path,a.sha256]).sort((a,b)=>a[0].localeCompare(b[0]));
		const opticalHash=createHash('sha256').update(JSON.stringify(optics)).digest('hex');
		if(opticalIdentities.has(reading.configuration.layers)){assert.equal(opticalHash,opticalIdentities.get(reading.configuration.layers));continue;}
		opticalIdentities.set(reading.configuration.layers,opticalHash);
		const index=original('aerosols.txt').trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/)),z=index.map(r=>Number(r[0])*1000);
		assert.equal(z[0],m.topAltitude);assert.equal(z.at(-1),0);assert.equal(index[0][1],'NULL');assert.ok(z.includes(5));
		const molecular=original('scattering.txt').trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.deepEqual(molecular[0],z.map(x=>x/1000));
		const atmosphere=original('atmosphere.txt').trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.deepEqual(atmosphere.map(r=>r[0]),molecular[0]);
		const absorption=original('absorption.txt').trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.deepEqual(absorption[0],molecular[0]);assert.ok(absorption.slice(1).every(r=>r.slice(1).every(x=>x===0)));
		const solar=original('solar.txt').trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.equal(solar.length,15);
		solar.forEach((r,c)=>{assert.equal(r[0],centers[c]);assert.ok(Math.abs(r[1]/(1000*m.sourceIrradiance[c]*m.incidentScale)-1)<1e-12);});
		let maximumAerosolLayerRelativeError=0,maximumMolecularLayerRelativeError=0,maximumPhaseRelativeError=0;
		for(let i=1;i<z.length;i++) {
			if(i%32===0)progress(`Check optical grid: layer ${i}/${z.length-1}.`);
			const layer=original(index[i][1]).trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));assert.equal(layer.length,15);
			layer.forEach((r,c)=>{
				assert.equal(r.length,99);assert.equal(r[0],centers[c]);assert.equal(r[2],m.albedo);assert.equal(r[3],1);assert.deepEqual(r.slice(3),metadata.phase.moments);
				const tau=r[1]*(z[i-1]-z[i])/1000,expected=m.mie[c]*m.mieHeight*(Math.exp(-z[i]/m.mieHeight)-Math.exp(-z[i-1]/m.mieHeight));maximumAerosolLayerRelativeError=Math.max(maximumAerosolLayerRelativeError,Math.abs(tau/expected-1));
				const target=m.rayleigh[c]*m.rayleighHeight*(Math.exp(-z[i]/m.rayleighHeight)-Math.exp(-z[i-1]/m.rayleighHeight));maximumMolecularLayerRelativeError=Math.max(maximumMolecularLayerRelativeError,Math.abs(molecular[c+1][i]/target-1));
				if(i===1)for(const mu of [-1,-0.75,-0.25,0,0.25,0.75,1]){
					let p0=1,p1=mu,value=r[3]+3*r[4]*mu;for(let l=2;l<96;l++){const p=((2*l-1)*mu*p1-(l-1)*p0)/l;value+=(2*l+1)*r[3+l]*p;p0=p1;p1=p;}
					const phase=1.5*(1-m.g*m.g)/(2+m.g*m.g)*(1+mu*mu)/(1+m.g*m.g-2*m.g*mu)**1.5;maximumPhaseRelativeError=Math.max(maximumPhaseRelativeError,Math.abs(value/phase-1));
				}
			});
		}
		assert.ok(maximumAerosolLayerRelativeError<1e-10&&maximumMolecularLayerRelativeError<1e-10&&maximumPhaseRelativeError<1e-8);
		grids.push({toolRun:t,layers:z.length-1,opticalInputIdentity:opticalHash,maximumAerosolLayerRelativeError,maximumMolecularLayerRelativeError,maximumPhaseRelativeError});
	}
	return {cases:readings.length,grids,productionPhysicalCoefficientsMatched:true};
}
