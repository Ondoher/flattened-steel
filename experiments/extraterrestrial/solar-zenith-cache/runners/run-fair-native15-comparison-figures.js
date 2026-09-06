#!/usr/bin/env node
import {execFile} from 'node:child_process';import path from 'node:path';import {promisify} from 'node:util';
import {sha256File} from '../../harness/lib/hashes.js';import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';import {verifyRun} from '../../runners/verify-run.js';
import {beginContainedEvidence,finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';
const ENTRY='solar-zenith-cache/runners/run-fair-native15-comparison-figures.js',PARENT='000558-previous-model-b1-native15-comparison';
const executeFile=promisify(execFile),requireCondition=(v,m)=>{if(!v)throw new Error(m);},xml=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;');
function chart({title,subtitle,series,bars=false}){const W=1200,H=650,L=90,R=30,T=75,B=100,pw=W-L-R,ph=H-T-B,max=Math.ceil(Math.max(...series.flatMap(s=>s.values),1)/5)*5;
	const x=(i,n)=>L+(n===1?pw/2:i*pw/(n-1)),y=v=>T+ph*(1-v/max);let body='';
	for(let i=0;i<6;i++){const v=max*i/5;body+=`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" stroke="#ddd"/><text x="${L-10}" y="${y(v)+4}" text-anchor="end">${v.toFixed(0)}</text>`;}
	if(bars){const bw=150,gap=90,start=L+75;series.forEach((s,i)=>{const bx=start+i*(bw+gap),by=y(s.values[0]);body+=`<rect x="${bx}" y="${by}" width="${bw}" height="${T+ph-by}" fill="${s.color}"/><text x="${bx+bw/2}" y="${by-8}" text-anchor="middle">${s.values[0].toFixed(6)}</text><text x="${bx+bw/2}" y="${H-B+28}" text-anchor="middle">${xml(s.label)}</text>`;});}
	else{series.forEach((s,i)=>{body+=`<polyline fill="none" stroke="${s.color}" stroke-width="3" points="${s.values.map((v,j)=>`${x(j,s.values.length)},${y(v)}`).join(' ')}"/>`;
		body+=`<line x1="${L+i*275}" y1="${H-28}" x2="${L+32+i*275}" y2="${H-28}" stroke="${s.color}" stroke-width="4"/><text x="${L+40+i*275}" y="${H-23}">${xml(s.label)}</text>`;});
		series[0].times.forEach((time,i)=>body+=`<text x="${x(i,series[0].times.length)}" y="${H-B+22}" text-anchor="middle" transform="rotate(45 ${x(i,series[0].times.length)} ${H-B+22})">${time}</text>`);}
	return `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><style>text{font-family:Arial;fill:#222;font-size:13px}</style><text x="${L}" y="34" font-size="23" font-weight="bold">${xml(title)}</text><text x="${L}" y="57">${xml(subtitle)}</text>${body}<line x1="${L}" y1="${T+ph}" x2="${W-R}" y2="${T+ph}" stroke="#222"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T+ph}" stroke="#222"/></svg>`;}
async function render(paths,provenance){const source=String.raw`
import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';
import {FIGURE5_SCENES,loadPublishedFigure5Panels,renderAlgorithm32Figure5Panel,renderFigure5ComparisonSvg} from './scripts/experiments/b1-directional-sky-radiance/figure5.js';
import {computeB1Scores,parseMeasurementPacketBoundary,renderB1PerTimeFigure} from './scripts/experiments/generate-benchmark-figures.js';import{readFileSync}from'node:fs';
const [prevD,prevN,pointD,pointN,measure,published,prov]=process.argv.slice(1),dataset=loadKiderDataset();
const tables={previousDirect:parseSpectraTsv(prevD),previousNative:parseSpectraTsv(prevN),pointDirect:parseSpectraTsv(pointD),pointNative:parseSpectraTsv(pointN)};
const scores=Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,scoreModels(dataset,v).get('proposed')]));const files={};
for(const [key,label] of [['previousNative','previous-native15'],['pointNative','point-native15']]){const model=tables[key].get('proposed');const panels=FIGURE5_SCENES.map(scene=>renderAlgorithm32Figure5Panel(model.get(scene.time),dataset.conditions.find(c=>c.time===scene.time).grid,scene));
	panels.forEach((p,i)=>files[label+'-figure5-'+FIGURE5_SCENES[i].fileTime+'-z'+FIGURE5_SCENES[i].roundedSolarZenithDegrees+'.png']=p.png.toString('base64'));
	files[label+'-figure5-relative-error-domes.svg']=Buffer.from(renderFigure5ComparisonSvg(loadPublishedFigure5Panels(),panels,{generator:'fair Native15 derivative',candidateRunId:'${PARENT}',candidateBoundary:key})).toString('base64');}
const measurements=parseMeasurementPacketBoundary(readFileSync(measure,'utf8'),measure),publishedScores=computeB1Scores(measurements,parseSpectraTsv(published));
for(const [key,label] of [['previousNative','previous-native15'],['pointNative','point-native15']])files[label+'-full-model-per-time-rmse.svg']=Buffer.from(renderB1PerTimeFigure(publishedScores,computeB1Scores(measurements,tables[key],['proposed']).get('proposed'),{...JSON.parse(prov),candidateLabel:label})).toString('base64');
process.stdout.write(JSON.stringify({scores,files}));`;
	const r=await executeFile(process.execPath,['--input-type=module','-e',source,...paths,JSON.stringify(provenance)],{cwd:process.cwd(),windowsHide:true,maxBuffer:32*1024*1024});return JSON.parse(r.stdout);}
async function main(){const state=await beginContainedEvidence(ENTRY),parent=await verifyRun(PARENT);requireCondition(parent.verified&&parent.conclusion==='accepted','Fair comparison parent unavailable.');
	const paths=[path.join(RUNS_ROOT,'000479-b1-reflection-completed-fibonacci68-full-figures','generated','b1-directional-sky-radiance','gpu','algorithm32-current-production-gpu-j4.tsv'),
		path.join(RUNS_ROOT,PARENT,'generated','b1-previous-model-native15-reconstructed-direct40.tsv'),path.join(RUNS_ROOT,'000545-point-local-scene-cache-b1-non-regression','generated','b1-point-local-direct40-w27-q30.tsv'),
		path.join(RUNS_ROOT,'000549-point-local-scene-cache-b1-native15-retention','generated','b1-point-local-native15-reconstructed-direct40-w27-q30.tsv'),
		path.resolve('references/results/experiments/b1-directional-sky-radiance/measurement-boundary.tsv'),path.resolve('references/results/experiments/b1-directional-sky-radiance/published-models.tsv')];
	const hashes=await Promise.all(paths.map(sha256File)),run=await initializeRunRecord({slug:'fair-native15-comparison-figures',command:`node experiments/extraterrestrial/${ENTRY}`,
		inputs:{schemaId:'fair-native15-figures-inputs-v1',parentRunId:PARENT,sourceHashes:hashes},provenance:{schemaId:'fair-native15-figures-provenance-v1',parent,
			operation:'derive unconditional four-way RMSE, penalty, Figure 5, and canonical full-model figures from sealed matched tables'},environment:{node:process.version,platform:process.platform},references:{parent}});
	try{const rendered=await render(paths,{profileFamily:'fair-direct40-native15-comparison',selectedMaximumScatteringOrder:4}),s=rendered.scores,times=s.previousDirect.conditionScores.map(v=>v.time);
		const lineSeries=[['Previous Direct40','#777',s.previousDirect],['Previous Native15','#b36b00',s.previousNative],['Point-local Direct40','#2869a8',s.pointDirect],['Point-local Native15','#c43d2f',s.pointNative]].map(([label,color,score])=>({label,color,times,values:score.conditionScores.map(v=>v.rmseMilliwatt)}));
		const files={'fair-four-way-per-time-rmse.svg':Buffer.from(chart({title:'Fair B1 Direct40 / Native15 comparison',subtitle:'Both models use identical physical inputs and reconstruction within each spectral representation',series:lineSeries})),
			'fair-four-way-aggregate-rmse.svg':Buffer.from(chart({title:'Fair B1 aggregate RMSE',subtitle:'Lower is better',bars:true,series:lineSeries.map(v=>({...v,values:[s[v.label.replace('Previous ','previous').replace('Point-local ','point').replace('Direct40','Direct').replace('Native15','Native')]?.aggregate?.rmseMilliwatt??v.values[0]]}))})),
			'fair-native15-penalty-per-time.svg':Buffer.from(chart({title:'Native15 spectral-reduction penalty by time',subtitle:'Native15 RMSE minus matched Direct40 RMSE',series:[{label:'Previous penalty',color:'#b36b00',times,values:s.previousNative.conditionScores.map((v,i)=>v.rmseMilliwatt-s.previousDirect.conditionScores[i].rmseMilliwatt)},{label:'Point-local penalty',color:'#c43d2f',times,values:s.pointNative.conditionScores.map((v,i)=>v.rmseMilliwatt-s.pointDirect.conditionScores[i].rmseMilliwatt)}]})),
			...Object.fromEntries(Object.entries(rendered.files).map(([n,v])=>[n,Buffer.from(v,'base64')]))};
		const figures=[];for(const [name,bytes]of Object.entries(files)){await run.writeArtifact(`figures/${name}`,bytes);figures.push({name,byteLength:bytes.length,sha256:await sha256File(path.join(run.runDirectory,'figures',name))});}
		const evidence={schemaId:'fair-native15-comparison-figure-set-v1',accepted:true,parentRunId:PARENT,aggregates:Object.fromEntries(Object.entries(s).map(([k,v])=>[k,v.aggregate.rmseMilliwatt])),figures};
		await run.writeJsonArtifact('evidence/figure-set.json',evidence);await run.writeJsonArtifact('evidence/source-identities.json',await finishContainedEvidence(state,[ENTRY]));
		const terminal=await run.finalize({conclusion:'accepted',result:evidence,report:`# Fair Native15 comparison figures\n\nAll ${figures.length} figures preserved.\n`});process.stdout.write(JSON.stringify({runId:run.runId,artifactSetSha256:terminal.artifactSetSha256,...evidence},null,2));
	}catch(error){await run.writeJsonArtifact('evidence/failure.json',{message:error.message,stack:error.stack});await run.finalize({conclusion:'failed',result:{accepted:false,error:error.message},report:`# Figure failure\n\n${error.message}\n`});throw error;}}
await main();
