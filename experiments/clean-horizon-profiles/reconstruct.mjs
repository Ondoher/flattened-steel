import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun, checked, identity} from './io.mjs';
import {physical, channels} from '../elevated-horizon-validation/physics.mjs';
import {inventory, optical, atWavelength} from '../elevated-horizon-validation/profile-model.mjs';
import {interpolate, adaptCompilerShader} from './profile-sampling.mjs';
import {ArmAtmosphere} from './ArmAtmosphere.js';
import {createDistantSunSceneCacheCommonShaderSource} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
import {DistantSunPointLocalCacheAerosolOptics as Aerosols} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheAerosolOptics.js';

const parent = 'tmp/experiments/clean-horizon-profiles/runs/00026-scene-data';
const run = createRun('reconstruction', 'S1 register ARM-informed central model and one-factor physical sensitivity variants before image generation', [identity(parent+'/manifest.json'),identity('experiments/elevated-horizon-validation/profile-model.mjs'),identity('tmp/experiments/elevated-horizon-validation/runs/00023-profile-acquire/manifest.json')]);
let failure;
try {
	const data = JSON.parse(readFileSync(checked(parent+'/interval-data.json'),'utf8'));
	const aod = data.AOD20.row, alpha = Number(aod['440-870_Angstrom_Exponent']);
	const aod550 = Number(aod.AOD_500nm) * (550/500)**(-alpha);
	const weather = data.pairedWeather, surface = data.surface.bands.find(b=>b.band==='G');
	assert.equal(surface.count,5); assert.ok(Math.abs(data.AOD20.timeDifferenceSeconds)<120);
	const sampleRH = weather.surface.RH_Neph_Dry.mean, ambientRH = weather.weather.rh_mean.mean;
	const dry = optical('waso',0), wet = optical('waso',50);
	const sca = table => {const o=atWavelength(table,529);return o.ext-o.abs;};
	const f = rh => sca(dry)+(sca(wet)-sca(dry))*rh/50;
	const growth = f(ambientRH)/f(sampleRH);
	const reference = inventory('continental_clean',0), humidBackground = inventory('continental_clean',50);
	const spectrumScale = wavelength => (wavelength/550)**(-alpha);
	const sourceSSA = data.SSA.row;
	const albedo = Number(sourceSSA['Single_Scattering_Albedo[440nm]'])+(550-440)/(675-440)*(Number(sourceSSA['Single_Scattering_Albedo[675nm]'])-Number(sourceSSA['Single_Scattering_Albedo[440nm]']));
	const pf = data.PFN.row;
	const angles=Object.keys(pf).flatMap(k=>{const m=/^([\d.]+)\[440nm\]$/u.exec(k);return m?[Number(m[1])]:[];});
	assert.equal(angles.length,83);
	const phaseAt = wavelength => {
		const rows=angles.map(angle=>({mu:Math.cos(angle*Math.PI/180),value:Number(pf[angle.toFixed(6)+'['+wavelength+'nm]'])})).sort((a,b)=>a.mu-b.mu);
		assert.ok(rows.every(r=>Number.isFinite(r.value)&&r.value>=0));rows[0].mu=-1;rows.at(-1).mu=1;
		const mass=rows.slice(1).reduce((s,r,i)=>s+(r.mu-rows[i].mu)*(r.value+rows[i].value)/2,0);
		return {mu:rows.map(r=>r.mu),pdf:rows.map(r=>r.value/mass),rawMuIntegral:mass};
	};
	const p440=phaseAt(440),p675=phaseAt(675),u=(550-440)/(675-440);
	const phase={mu:p440.mu,pdf:p440.pdf.map((v,i)=>v*(1-u)+p675.pdf[i]*u)};Aerosols.acceptTable(phase);
	const heights=[0,100,300,500,800,1000,1300,1600,2000,3000,4000,6000,8000,10000,11999,12000,34999,35000,60000];
	const n=15, xHeights=heights.slice(0,n), priorExt=h=>reference.layers.find(l=>h>=l.lower&&h<l.upper)?.ext??0;
	const fit = (label, growthFactor, bridge, backgroundInventory=reference, usedPhase=phase) => {
		const surfacePerKm=(surface.scatteringReferencePerMm*growthFactor+surface.absorptionReferencePerMm)*weather.densityRatio/1000/spectrumScale(529);
		const upper=backgroundInventory.layers.find(l=>l.lower===12000).ext*1000;
		const rows=[];
		const add=(coeff,target,scale,role)=>rows.push({coeff,target,scale,role});
		const at=h=>{const c=Array(n).fill(0);let lo=0;while(lo+1<n-1&&xHeights[lo+1]<h)lo++;const t=(h-xHeights[lo])/(xHeights[lo+1]-xHeights[lo]);c[lo]=1-t;c[lo+1]=t;return c;};
		for(let i=0;i<n;i++){
			const value=xHeights[i]<bridge?surfacePerKm:priorExt(xHeights[i])*1000;
			const c=Array(n).fill(0);c[i]=1;
			add(c,value,xHeights[i]<bridge?Math.max(surfacePerKm*.25,.0003):Math.max(value*3,.01),'model-prior');
		}
		for(const b of data.lidar.bins)if(b.heightKm>=.8&&b.count>0&&b.heightKm*1000<=xHeights.at(-1))
			add(at(b.heightKm*1000),b.extinction355PerKm/spectrumScale(355),Math.max(.005,Math.hypot(b.randomPerKm,b.maximumSystematicPerKm)/spectrumScale(355)),'355nm-lidar-bounded-penalty-not-statistical-likelihood');
		const column=Array(n).fill(0);
		for(let i=0;i<n-1;i++){const width=(xHeights[i+1]-xHeights[i])/1000;column[i]+=width/2;column[i+1]+=width/2;}
		add(column,aod550-upper*23,.01,'column-AOD-soft-constraint');
		for(let i=1;i<n-1;i++){const c=Array(n).fill(0);c[i]=1;c[i-1]=-.5;c[i+1]=-.5;add(c,0,.01,'weak-smoothness-prior');}
		const H=Array.from({length:n},()=>Array(n).fill(0)),g=Array(n).fill(0);
		for(const row of rows){const w=1/row.scale**2;for(let i=0;i<n;i++){g[i]+=row.coeff[i]*row.target*w;for(let j=0;j<n;j++)H[i][j]+=row.coeff[i]*row.coeff[j]*w;}}
		const x=xHeights.map(h=>h<bridge?surfacePerKm:priorExt(h)*1000);
		for(let iter=0;iter<3000;iter++)for(let i=0;i<n;i++)x[i]=Math.max(0,(g[i]-H[i].reduce((s,v,j)=>s+(i===j?0:v*x[j]),0))/H[i][i]);
		const values=[...x,upper,upper,0,0].map(v=>v/1000);
		assert.equal(values.length,heights.length);
		const column550=values.slice(1).reduce((s,v,i)=>s+(v+values[i])*.5*(heights[i+1]-heights[i]),0);
		return {id:label,altitudesMeters:heights,extinction550PerMeter:values,mie:channels.map(c=>values[0]*spectrumScale(c.center.value)),albedo,phase:usedPhase,alpha,
			fit:{column550,observedAod550:aod550,columnResidual:column550-aod550,surface550PerKm:surfacePerKm,growthFactor,wellMixedSurfaceBridgeMeters:bridge,objective:rows.reduce((s,r)=>s+((r.coeff.reduce((v,c,i)=>v+c*x[i],0)-r.target)/r.scale)**2,0),constraints:rows},
			assumptions:['Piecewise-linear height-dependent extinction, nonnegative constrained reconstruction, not observed every layer.', 'Dry surface humidity growth uses published OPAC water-soluble 0/50% RH optical interpolation as a proxy, not measured chemistry.', 'Column-derived Angstrom exponent and conditional 550 nm phase/SSA are held common with height and across the native visible bins; not uniquely inferred.', 'Free-troposphere shape and 12-35 km background use the published dry continental-clean extinction as a soft prior/background; no measured upper-column claim.', 'Published preset ends at35 km; zero aerosol above is a model extension, bracketed separately below, not a measurement.', 'Lidar maximum systematic uncertainty supplies a bounded penalty scale, not a Gaussian standard error or a probability interval.']};
	};
	const central=fit('arm-dec05-reconstruction-v1',growth,300);
	const near=fit('arm-bridge100-v1',growth,100);
	const dryVariant=fit('arm-no-growth-v1',1,300);
	const upper=fit('arm-opac50-upper-v1',growth,300,humidBackground);
	const gSurface=weather.surface.g_G.mean;
	const proxy={mu:phase.mu,pdf:phase.mu.map(mu=>.75*(1-gSurface*gSurface)/(2+gSurface*gSurface)*(1+mu*mu)/(1+gSurface*gSurface-2*gSurface*mu)**1.5)};
	const mass=proxy.mu.slice(1).reduce((s,mu,i)=>s+(mu-proxy.mu[i])*(proxy.pdf[i+1]+proxy.pdf[i])/2,0);proxy.pdf=proxy.pdf.map(v=>v/mass);
	const phaseVariant={...central,id:'arm-surface-phase-v1',phase:proxy};
	const extended={...central,id:'arm-upper-tail-v1',altitudesMeters:[...central.altitudesMeters.slice(0,17),35000,40000,50000,60000],extinction550PerMeter:[...central.extinction550PerMeter.slice(0,17),central.extinction550PerMeter[16],... [40000,50000,60000].map(h=>central.extinction550PerMeter[16]*Math.exp(-(h-35000)/5000))]};
	extended.assumptions=[...central.assumptions,'Additional sensitivity only: a 5 km e-fold tail beyond the preset boundary is an explicit analytical upper-completion assumption, not published/observed stratospheric data.'];
	const profiles=[central,near,dryVariant,upper,phaseVariant,extended];
	for(const profile of profiles){assert.ok(profile.extinction550PerMeter.every(v=>Number.isFinite(v)&&v>=0));Aerosols.acceptTable(profile.phase);
		const column550=profile.extinction550PerMeter.slice(1).reduce((s,v,i)=>s+(v+profile.extinction550PerMeter[i])*.5*(profile.altitudesMeters[i+1]-profile.altitudesMeters[i]),0);
		profile.fit={...profile.fit,column550,columnResidual:column550-aod550};
	}
	const atmosphere=new ArmAtmosphere(central);
	const errors=[];
	for(const h of [0,50,500,1500,2000,12000,34999,35000,40000,60000]){
		const actual=atmosphere.sampleMedium({altitude:{value:h,units:'meters'}});
		const expected=interpolate(central.altitudesMeters,central.extinction550PerMeter,h)/central.extinction550PerMeter[0];
		errors.push(Math.abs(actual.mieExtinction.values[6]/central.mie[6]-expected));
	}
	assert.ok(Math.max(...errors)<1e-10);
	const common=createDistantSunSceneCacheCommonShaderSource({wavelengthNanometers:channels[6].center.value,sourceIrradiance:physical().sourceIrradiance[6],ozoneCrossSection:0,mieExtinction:central.mie[6],miePhaseTable:phase});
	const adapted=adaptCompilerShader(common,central);
	assert.ok(adapted.includes('armAerosolDensity(altitudeMeters)')&&!adapted.includes('* exp(-altitudeMeters / MIE_SCALE_HEIGHT);'));
	run.write('model.json',central);run.write('variants.json',profiles.slice(1));
	run.write('feasibility.json',{maximumCpuSamplerError:Math.max(...errors),runtimeMediumUsesTable:atmosphere._runtimeMediumBlock().includes('armAerosolDensity(altitudeMeters)'),celestialMediumUsesTable:atmosphere._cacheMediumBlock(true).includes('armAerosolDensity(altitudeMeters)'),compilerUsesTable:true,gpuCompilationPending:true});
	run.write('representative-compiler.glsl',adapted);
	run.write('derivation.json',{sourceInterval:identity(parent+'/interval-data.json'),aodTimestamp:data.AOD20.row['Time(hh:mm:ss)'],aodDifferenceSeconds:data.AOD20.timeDifferenceSeconds,phaseTimestamp:data.PFN.row['Time(hh:mm:ss)'],sampleRH,ambientRH,humidityGrowthProxy:{species:'waso',humidityClasses:[0,50],scatteringGrowth: growth,parents:[dry.proof,wet.proof]},background:reference.optics,phaseMuIntegrals:{at440:p440.rawMuIntegral,at675:p675.rawMuIntegral},normalization:'Normalize each angular table by its trapezoidal cosine integral; interpolate normalized PDF at550nm; use per-steradian PDF/(2pi).',selection:'All models frozen before candidate images; no screenshot fitting.'});
	console.log(JSON.stringify({centralColumn550:central.fit.column550,observedAod550:aod550,surfaceExtinction550PerKm:central.fit.surface550PerKm,variants:profiles.slice(1).map(p=>({id:p.id,column:p.fit.column550})),albedo,alpha,phaseNodes:phase.mu.length}));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
run.finish(failure?'failed':'accepted',{failure});if(failure)process.exitCode=1;
