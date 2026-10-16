import assert from 'node:assert/strict';
import {createRun,verifyRun,readRepository} from '../io/files.mjs';

/** Derive reviewable physical plots from qualified evidence; performs no new transport calculation.
 * @returns {void} Fresh sealed figures, preserving all source runs and original images.
 */
function main(){
	const root='tmp/experiments/sky-accuracy-dials/runs/',report=root+'00284-h36-h37-report',qualification=root+'00285-h37-qualify';
	const parents=[verifyRun(report),verifyRun(qualification)],q=/** @type {LocalHorizonQualification} */(JSON.parse(readRepository(qualification+'/qualification.json').toString()));
	assert.equal(q.source,root+'00281-h34-h37-local');
	const data=/** @type {LocalHorizonPresentation} */(JSON.parse(readRepository(report+'/evaluation.json').toString()));
	const run=createRun('h37-figures',{parents,operation:'Plot retained independent/current N1 physical luminance and chromaticity alongside compatible sparse all-order expectations. Lines guide the eye between sampled rays; no synthesized all-order scene image.',parameters:{report,qualification}});
	let sealed=false;
	try{
		const colors={toward:'#b14b12',cross:'#267342',away:'#2755a3'};
		const sx=e=>60+600*Math.log1p(e/0.05)/Math.log1p(20/0.05),sy=y=>390-y/5000*310;
		const axes=[0,1000,2000,3000,4000,5000].map(y=>`<line x1="60" x2="660" y1="${sy(y)}" y2="${sy(y)}" stroke="#ddd"/><text x="8" y="${sy(y)+4}">${y}</text>`).join('');
		const ticks=[0.05,0.25,1,3,10,20].map(e=>`<text x="${sx(e)-9}" y="414">${e}°</text>`).join('');
		const curves=Object.entries(colors).map(([heading,color])=>{
			const rows=data.rows.filter(x=>x.heading===heading);
			return `<polyline fill="none" stroke="${color}" points="${rows.map(r=>`${sx(r.elevation)},${sy(r.referenceColor.luminanceCdPerM2)}`).join(' ')}"/>`+rows.map(r=>`<circle cx="${sx(r.elevation)}" cy="${sy(r.referenceColor.luminanceCdPerM2)}" r="4" fill="${color}"/><path d="M ${sx(r.elevation)-4} ${sy(r.appColor.luminanceCdPerM2)-4} l 8 8 m -8 0 l 8 -8" stroke="black"/>`).join('');
		}).join('');
		const mc=data.allOrders.map(r=>{const o=r.orders[0],x=sx(r.elevation),y=sy(o.Y.mean),h=o.Y.halfWidth95*310/5000;return `<line x1="${x}" x2="${x}" y1="${y-h}" y2="${y+h}" stroke="#a01988"/><rect x="${x-4}" y="${y-4}" width="8" height="8" fill="#a01988"/>`;}).join('');
		run.write('luminance.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="740" height="490"><rect width="740" height="490" fill="white"/><g font-family="sans-serif" font-size="13"><text x="20" y="25" font-size="18">Physical horizon brightness, before display</text><text x="20" y="49">Y (cd/m²); x-axis uses log(1 + elevation / 0.05°)</text>${axes}${ticks}${curves}${mc}<text x="20" y="444">N1: orange=toward, green=cross, blue=away; black crosses=current app</text><text x="20" y="465">Magenta squares: independent all-order away rays, marginal 95% sampling bars</text><text x="20" y="484">Lines guide the eye; only markers are computed observations. Domains differ for all-order.</text></g></svg>`);
		const px=x=>65+(x-0.23)/0.11*580,py=y=>390-(y-0.24)/0.12*310;
		const xyPoints=data.rows.map(r=>`<circle cx="${px(r.referenceColor.xy[0])}" cy="${py(r.referenceColor.xy[1])}" r="4" fill="${colors[r.heading]}"/><text x="${px(r.referenceColor.xy[0])+6}" y="${py(r.referenceColor.xy[1])-5}" font-size="10">${r.elevation}° ${r.heading}</text>`).join('');
		const xyMc=data.allOrders.map(r=>`<rect x="${px(r.orders[0].x.mean)-4}" y="${py(r.orders[0].y.mean)-4}" width="8" height="8" fill="#a01988"/><text x="${px(r.orders[0].x.mean)+7}" y="${py(r.orders[0].y.mean)+5}">${r.elevation}° all</text>`).join('');
		run.write('chromaticity.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="740" height="480"><rect width="740" height="480" fill="white"/><g font-family="sans-serif" font-size="13"><text x="20" y="25" font-size="18">Physical chromaticity, independent of exposure</text><text x="20" y="49">CIE x horizontally (0.23–0.34), y vertically (0.24–0.36)</text><path d="M65 70 V390 H645" fill="none" stroke="black"/>${xyPoints}${xyMc}<text x="20" y="435">N1 circles: toward/cross/away; all-order squares: sparse away rays</text><text x="20" y="459">Marker colors identify datasets, not predicted sky colors. Sampling intervals are in evaluation.json.</text></g></svg>`);
		run.finish('accepted',{plots:2,noTransportRerun:true});sealed=true;verifyRun(run.path);assert.equal(JSON.parse(readRepository(run.path+'/sealed.json').toString()).state,'accepted');console.log(run.path);
	}catch(error){if(!sealed)run.finish('failed',{error:String(error)});throw error;}
}

main();
