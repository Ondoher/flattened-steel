import assert from 'node:assert/strict';
import path from 'node:path';
import {createRun,verifyRun,identity,readRepository,storage} from '../io/files.mjs';
import {colorimetry,xyzToRgb,ciePath} from './diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';

// Exact inverse of the independent D65 XYZ-to-sRGB matrix in diagnosis-color.mjs.
const toXyz=[[506752/1228815,87881/245763,12673/70218],[87098/409605,175762/245763,12673/175545],[7918/409605,87881/737289,1001167/1053270]];
const equalY=0.35;

/** Describe a strictly positive-Y signed linear RGB color without clipping or white balancing.
 * @param {readonly number[]} rgb Linear channels; units are supplied by the caller's stage.
 * @returns {HorizonTintColor} XYZ, xy and R/B; malformed/nonfinite or zero-blue input rejects.
 */
function describe(rgb){
	assert.equal(rgb.length,3);assert.ok(rgb.every(Number.isFinite));assert.notEqual(rgb[2],0);
	const xyz=toXyz.map(row=>row.reduce((sum,c,k)=>sum+c*rgb[k],0)),sum=xyz.reduce((a,b)=>a+b,0);
	assert.ok(xyz[1]>0&&sum>0);return {rgb:[...rgb],xyz,xy:[xyz[0]/sum,xyz[1]/sum],redBlueRatio:rgb[0]/rgb[2]};
}

/** Decode nominal sRGB image code values to relative screen-linear intensity.
 * @param {number} x Nonnegative code value. @returns {number} Relative linear channel.
 */
function decode(x){return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;}

/** Encode a relative linear channel for the diagnostic sRGB SVG swatches.
 * @param {number} x Gamut-checked nonnegative linear value. @returns {number} sRGB code value.
 */
function encode(x){return x<=0.0031308?12.92*x:1.055*x**(1/2.4)-0.055;}

/** Make a same-Y hue swatch; reject out-of-gamut inputs instead of silently changing the color.
 * @param {HorizonTintColor} color Physical or decoded nominal-screen stage.
 * @returns {string} CSS hex with no production tone mapping applied.
 */
function swatch(color){const rgb=color.rgb.map(x=>x*equalY/color.xyz[1]);assert.ok(rgb.every(x=>x>=0&&x<=1));return '#'+rgb.map(x=>Math.round(255*encode(x)).toString(16).padStart(2,'0')).join('');}

/** Reproduce physical/display color stages from accepted spectra and emit immutable comparison evidence.
 * @returns {void} Accepted new run, or sealed failure and thrown error; earlier runs remain unchanged.
 */
function main(){
	const started=Date.now(),base='tmp/experiments/sky-accuracy-dials/runs/',local=base+'00287-h39-aerosol',distant=base+'00288-h40-distant';
	const parents=[verifyRun(local),verifyRun(distant)];
	/** Authenticate a recorded input and retain its identity for the new derivation.
	 * @param {string} p Repository-relative path. @param {DialFileIdentity} [expected] Optional original identity.
	 * @returns {unknown} Parsed JSON; path/hash/schema consumer failures propagate.
	 */
	function input(p,expected){const bytes=readRepository(p,expected);parents.push(identity(p,bytes));return JSON.parse(bytes.toString());}
	const localDefinition=/** @type {HorizonTintDefinition} */(input(local+'/definition.json'));
	const original=localDefinition.recipe.parents.find(p=>p.path.endsWith('/00281-h34-h37-local/registration.json'));assert.ok(original);
	const localRegistration=/** @type {LocalHorizonRegistration} */(input(original.path,original));
	const distantRegistration=/** @type {HorizonTintDistantRegistration} */(input(distant+'/registration.json'));
	const localUniforms=/** @type {Record<string,unknown>} */(localRegistration.observation.facts.uniforms);
	const selections=/** @type {readonly HorizonTintParent[]} */([
		{geometry:'local',root:local,lux:Number(localUniforms.uColorResetTotalHorizontalIlluminanceLux),cases:/** @type {LocalAerosolCase[]} */(input(local+'/rays.json'))},
		{geometry:'distant',root:distant,lux:distantRegistration.lux,cases:/** @type {LocalAerosolCase[]} */(input(distant+'/rays.json'))}]);
	const distantDefinition=/** @type {HorizonTintDefinition} */(input(distant+'/definition.json')),expected=new Map(distantDefinition.recipe.parents.map(p=>[p.path,p]));
	const seen=new Set();
	/** Verify the current display graph against the exact implementation recorded by H40.
	 * @param {string} p Repository-relative dependency. @returns {void} Unique authenticated identities, or rejection.
	 */
	function dependency(p){if(seen.has(p))return;seen.add(p);const recorded=expected.get(p);assert.ok(recorded,'Missing original display dependency');const b=readRepository(p,recorded);parents.push(identity(p,b));
		for(const match of b.toString().matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))dependency(path.posix.normalize(path.posix.join(path.posix.dirname(p),match[1])));}
	dependency('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js');parents.push(identity(ciePath));
	parents.push(identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/horizon-tint-results.md'));
	const display=new ColorResetSlope078P2ColorDisplayModel(),run=createRun('h41-tint',{parents,operation:'Reproduce accepted H39/H40 physical CIE color, achromatic p2 gain, per-channel mapping and nominal sRGB screen color. Normalize Y only for diagnostic swatches. No transport rerun or white balance change.',parameters:{equalY,display:display.id,screenAssumption:'Standard sRGB PNG/SVG; actual monitor/viewer adaptation unmeasured',fixedIlluminances:selections.map(p=>({geometry:p.geometry,lux:p.lux})),colorRule:'bin-integrated CIE1931 / precise D65 matrix',order:1}});
	let sealed=false;
	try{
		const rows=/** @type {HorizonTintReading[]} */([]),projections=/** @type {HorizonTintProjection[]} */([]);let reproduction=0,gainDrift=0,roundTrip=0,matrixResidual=0;
		for(const rgb of [[1,0,0],[0,1,0],[0,0,1],[0.2,0.4,0.8]]){
			const xyz=toXyz.map(row=>row.reduce((s,c,k)=>s+c*rgb[k],0));matrixResidual=Math.max(matrixResidual,...xyzToRgb(xyz).map((x,k)=>Math.abs(x-rgb[k])));}
		for(const x of [0,0.001,0.0031308,0.02,0.2,0.5,1])roundTrip=Math.max(roundTrip,Math.abs(decode(encode(x))-x));
		assert.ok(roundTrip<1e-12&&matrixResidual<1e-12);
		for(const parent of selections){
			assert.ok(Number.isFinite(parent.lux)&&parent.lux>0);const illuminance=/** @type {UnitValue<'lux'>} */({value:parent.lux,units:'lux'}),gain=display.displayGain(illuminance);
			const neutral=display.linearSrgbToDisplayRgb([4000,4000,4000],illuminance);assert.ok(neutral.every(x=>x===neutral[0]));
			for(const item of parent.cases){
				run.progress('derive',`${parent.geometry}, aerosol ${item.fraction}`,rows.length,126);
				const source=describe(colorimetry([...item.medium.sourceIrradiance],'bin-integrated').rgb);
				for(const row of item.rows){
					const physical=describe(colorimetry([...row.spectrum],'bin-integrated').rgb);
					reproduction=Math.max(reproduction,...physical.xyz.map((x,k)=>Math.abs(x-row.color.xyz[k])/Math.max(1e-10,Math.abs(row.color.xyz[k]))));
					const inputRgb=/** @type {HorizonLinearRgb} */([...physical.rgb]),gained=describe(display.applyPreToneGain(inputRgb,illuminance));
					gainDrift=Math.max(gainDrift,...physical.xy.map((x,k)=>Math.abs(x-gained.xy[k])));
					const encoded=display.linearSrgbToDisplayRgb(inputRgb,illuminance),screen=describe(encoded.map(decode));
					assert.ok(encoded.every(x=>x>=0&&x<=1));
					rows.push({geometry:parent.geometry,fraction:item.fraction,heading:row.heading,elevation:row.elevation,physical,gained,encoded,screen,source,gain,
						sourceRelativeRB:physical.redBlueRatio/source.redBlueRatio-1,displayRelativeRB:screen.redBlueRatio/physical.redBlueRatio-1});
					const production=describe(display._spectralRadianceValuesToLinearSrgb(row.spectrum,NATIVE_15_SPECTRAL_BASIS));
					const independentlyProjected=colorimetry([...row.spectrum],'midpoint',false).rgb;
					const parity=Math.max(...production.rgb.map((x,k)=>Math.abs(x-independentlyProjected[k])/Math.max(1e-10,Math.abs(x))));assert.ok(parity<1e-12);
					const productionEncoded=display.linearSrgbToDisplayRgb(/** @type {HorizonLinearRgb} */([...production.rgb]),illuminance);
					projections.push({geometry:parent.geometry,fraction:item.fraction,heading:row.heading,elevation:row.elevation,production,encoded:productionEncoded,screen:describe(productionEncoded.map(decode)),parity,relativeRB:production.redBlueRatio/physical.redBlueRatio-1});
				}
			}
		}
		assert.ok(reproduction<1e-12&&gainDrift<1e-12);assert.equal(rows.length,126);
		run.write('readings.json',rows);run.write('projection-controls.json',projections);run.write('controls.json',{reproduction,gainDrift,roundTrip,matrixResidual,neutralPreserved:true,productionProjectionParity:Math.max(...projections.map(p=>p.parity))});
		const witnesses=rows.filter(r=>r.heading==='away'&&((r.fraction===0&&[0.05,3,20].includes(r.elevation))||(r.fraction===1&&r.elevation===0.05)));
		run.write('summary.json',witnesses.map(r=>({geometry:r.geometry,fraction:r.fraction,elevation:r.elevation,Y:r.physical.xyz[1],physicalXY:r.physical.xy,screenXY:r.screen.xy,sourceXY:r.source.xy,physicalRB:r.physical.redBlueRatio,screenRB:r.screen.redBlueRatio,sourceRB:r.source.redBlueRatio,sourceRelativeRB:r.sourceRelativeRB,displayRelativeRB:r.displayRelativeRB,physicalEqualY:swatch(r.physical),screenEqualY:swatch(r.screen),actualDisplay:'#'+r.encoded.map(x=>Math.round(255*x).toString(16).padStart(2,'0')).join('')})));
		const reference=describe([1,1,1]),source=witnesses[0].source;
		const chips=witnesses.map((r,k)=>{const y=150+78*k;return `<text x="20" y="${y+20}">${r.geometry}, ${r.fraction*100}% aerosol, ${r.elevation} deg</text><text x="20" y="${y+42}" font-size="12">Physical Y ${r.physical.xyz[1].toFixed(1)} cd/m2</text><rect x="315" y="${y}" width="190" height="54" fill="${swatch(r.physical)}"/><rect x="525" y="${y}" width="190" height="54" fill="${swatch(r.screen)}"/><rect x="735" y="${y}" width="190" height="54" fill="#${r.encoded.map(x=>Math.round(255*x).toString(16).padStart(2,'0')).join('')}"/>`;}).join('');
		run.write('comparison.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="970" height="850"><rect width="970" height="850" fill="#20252b"/><g fill="white" font-family="sans-serif"><text x="20" y="29" font-size="20">Horizon tint: physical color versus display</text><text x="20" y="56" font-size="13">First two columns share nominal screen Y=${equalY}; last column retains original p2 brightness. All rays face away from Sun.</text><rect x="20" y="73" width="90" height="28" fill="${swatch(reference)}"/><text x="120" y="94" font-size="13">Neutral D65</text><rect x="315" y="73" width="90" height="28" fill="${swatch(source)}"/><text x="415" y="94" font-size="13">Source spectrum, equal Y (chromaticity only)</text><text x="315" y="133">Before display, equal Y</text><text x="525" y="133">After display, equal Y</text><text x="735" y="133">Actual p2 display RGB</text>${chips}<text x="20" y="808" font-size="13">Saved independent N1 spectra; standard-sRGB PNG/SVG interpretation. No monitor measurement, white balance or transport change.</text><text x="20" y="833" font-size="13">Source and neutral chips are references, not a proposed sky color. Swatches are sampled colors, not scene captures.</text></g></svg>`);
		run.finish('accepted',{elapsedMilliseconds:Date.now()-started,readings:rows.length,noTransportRerun:true});sealed=true;verifyRun(run.path);
		assert.equal(JSON.parse(readRepository(run.path+'/sealed.json').toString()).state,'accepted');console.log(JSON.stringify({run:run.path,elapsedMilliseconds:Date.now()-started,storage:storage()}));
	}catch(error){if(!sealed)run.finish('failed',{error:String(error)});throw error;}
}

main();
