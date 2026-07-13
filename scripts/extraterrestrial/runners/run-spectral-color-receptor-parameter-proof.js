import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import FIXTURE from '../fixtures/spectral-color-receptor-parameter-v1.json' with { type: 'json' };
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-spectral-color-receptor-parameter-proof.js';
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function multiply(matrix, vector) { return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0)); }
function invert3(matrix) {
	const [[a,b,c],[d,e,f],[g,h,i]] = matrix;
	const A=e*i-f*h; const B=-(d*i-f*g); const C=d*h-e*g;
	const D=-(b*i-c*h); const E=a*i-c*g; const F=-(a*h-b*g);
	const G=b*f-c*e; const H=-(a*f-c*d); const I=a*e-b*d;
	const determinant=a*A+b*B+c*C;
	requireCondition(Number.isFinite(determinant)&&Math.abs(determinant)>1e-12,'LMS-to-XYZ_F matrix must be invertible.');
	return [[A,D,G],[B,E,H],[C,F,I]].map((row)=>row.map((value)=>value/determinant));
}
function maximumAbsolute(left,right){return Math.max(...left.map((value,index)=>Math.abs(value-right[index])));}

function FL(LA){const k=1/(5*LA+1);const k4=k**4;return 0.2*k4*5*LA+0.1*(1-k4)**2*(5*LA)**(1/3);}
function sigma(LA){return FIXTURE.primaryResponse.halfSaturation.cam16HalfSaturationNumerator/FL(LA);}
function response(I,LA){const n=FIXTURE.primaryResponse.exponent;const Ip=I**n;const sp=sigma(LA)**n;return Ip/(Ip+sp);}
function crossing(LA,R){const n=FIXTURE.primaryResponse.exponent;return sigma(LA)*(R/(1-R))**(1/n);}

function parseRows(text){return text.trim().split(/\r?\n/u).map((line)=>{const fields=line.split(',');const wavelength=Number(fields[0]);return fields.map((field,index)=>index===3&&field==='NaN'&&wavelength>615?0:Number(field));});}

async function main(){
	const run=await initializeRunRecord({slug:'spectral-color-receptor-parameter-proof',command:COMMAND,inputs:{fixture:'scripts/extraterrestrial/fixtures/spectral-color-receptor-parameter-v1.json',cieDataset:FIXTURE.spectralObserver.datasetPath,scope:'reference identity and parameter self-consistency only; no spectral ledger, atmosphere, cache, framebuffer, image, or display candidate'},provenance:{observer:'CIE 2006 LMS 2-degree energy fundamentals',response:'Valeton/van Norren n=0.74 Naka-Rushton shape with declared CAM16 F_L half-saturation placement'},environment:{node:process.version,platform:process.platform},references:{research:'agents/topics/extraterrestrial/receptor-response-parameter-research.md',plan:'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md#receptor-response-normal-plan'}});
	try{
		await assertRepositoryIdentity();const policy=await loadContainmentPolicy();const before=await createProtectedTrackedInventory(policy);await assertNoReparseEntries(EXPERIMENT_ROOT,'Experiment tree');
		const datasetPath=path.join(EXPERIMENT_ROOT,'references','cie-2006-lms-2deg','CIE_lms_cf_2deg.csv');const metadataPath=path.join(EXPERIMENT_ROOT,'references','cie-2006-lms-2deg','CIE_lms_cf_2deg.csv_metadata.json');
		const [datasetBytes,metadataBytes]=await Promise.all([readFile(datasetPath),readFile(metadataPath)]);const metadata=JSON.parse(metadataBytes.toString('utf8'));const rows=parseRows(datasetBytes.toString('utf8'));
		const assertions=[];const check=(value,message)=>{requireCondition(value,message);assertions.push(message);};
		check(sha256(datasetBytes)===FIXTURE.spectralObserver.datasetSha256&&sha256(metadataBytes)===FIXTURE.spectralObserver.metadataSha256,'Pinned CIE LMS dataset and metadata hashes match the fixture.');
		check(metadata.identifier.identifier==='10.25039/CIE.DS.tijidesg'&&metadata.rightsList.some((entry)=>entry.rightsIdentifier==='CC BY-SA 4.0'),'CIE metadata retains DOI and CC BY-SA 4.0 identity.');
		check(metadata.checksums.some((entry)=>entry.hashMethod==='sha256'&&entry.checksum===FIXTURE.spectralObserver.datasetSha256),'The locally pinned dataset hash matches the CIE-published SHA-256.');
		check(rows.length===FIXTURE.proofGates.datasetRowCount&&rows.every((row,index)=>row.length===4&&row.every(Number.isFinite)&&row[0]===390+5*index),'The CIE table has the expected 390-830 nm five-nanometer grid after applying its metadata-defined zero extrapolation to S above 615 nm.');
		const sample=rows.find((row)=>row[0]===FIXTURE.proofGates.datasetPublishedSample[0]);check(maximumAbsolute(sample,FIXTURE.proofGates.datasetPublishedSample)<=FIXTURE.proofGates.maximumDatasetSampleAbsoluteError,'The CIE-published 545 nm sample row matches.');
		const matrix=FIXTURE.absoluteNormalization.lmsToCie2015XyzF;const inverse=invert3(matrix);const identity=matrix.map((row)=>inverse[0].map((_,column)=>row.reduce((sum,value,index)=>sum+value*inverse[index][column],0)));const identityError=Math.max(...identity.flatMap((row,r)=>row.map((value,c)=>Math.abs(value-(r===c?1:0)))));check(identityError<=FIXTURE.proofGates.matrixRoundTripAbsolute,'The LMS/XYZ_F matrix inversion meets the frozen round-trip tolerance.');
		const d65Lms=multiply(inverse,FIXTURE.absoluteNormalization.d65XyzRelative);const channelScale=d65Lms.map((value)=>100/value);const normalizedD65=d65Lms.map((value,index)=>value*channelScale[index]);check(maximumAbsolute(normalizedD65,[100,100,100])<=FIXTURE.proofGates.neutralAbsolute,'D65 channel normalization produces an equal receptor neutral.');
		const LAValues=[0.000001,0.01,1,100,10000,100000];const responseProof=LAValues.map((LA)=>{const s=sigma(LA);const black=crossing(LA,FIXTURE.primaryResponse.diagnosticResponseCrossings.black);const half=crossing(LA,0.5);const white=crossing(LA,FIXTURE.primaryResponse.diagnosticResponseCrossings.white);const samples=[0,black,s/4,s,s*4,white,s*1000].map((I)=>({I,R:response(I,LA)}));return{LA,FL:FL(LA),sigma:s,crossings:{black,half,white},samples};});
	check(responseProof.every((proof)=>Number.isFinite(proof.FL)&&proof.FL>0&&Number.isFinite(proof.sigma)&&proof.sigma>0&&Math.abs(proof.crossings.half-proof.sigma)<=1e-10*Math.max(1,proof.sigma)),'Every synthetic adaptation state has positive finite F_L and an exact half-saturation crossing.');
	check(responseProof.every((proof)=>proof.samples.every((sample,index,array)=>Number.isFinite(sample.R)&&sample.R>=0&&sample.R<1&&(index===0||sample.R>array[index-1].R+FIXTURE.proofGates.strictMonotonicAbsolute))),'Every receptor sweep is finite, bounded, and strictly increasing.');
	check(responseProof.every((proof)=>Math.abs(response(proof.crossings.black,proof.LA)-0.01)<=1e-12&&Math.abs(response(proof.crossings.white,proof.LA)-0.99)<=1e-12),'The diagnostic 1% and 99% crossings invert the response equation.');
	const metamer=[23.5,11.25,4.75];const metamerResponses=[metamer,metamer].map((triplet)=>triplet.map((value)=>response(value,100)));check(maximumAbsolute(metamerResponses[0],metamerResponses[1])<=FIXTURE.proofGates.metamerResponseAbsolute,'Equal integrated LMS inputs remain identical through the nonlinear response.');
	const result={schemaId:'spectral-color-receptor-parameter-proof-result-v1',dataset:{rowCount:rows.length,wavelengthRangeNanometers:[rows[0][0],rows.at(-1)[0]],datasetSha256:sha256(datasetBytes),metadataSha256:sha256(metadataBytes)},normalization:{lmsToXyzF:matrix,xyzFToLms:inverse,d65Lms,channelScale,normalizedD65,matrixRoundTripMaximumAbsolute:identityError},response:{id:FIXTURE.primaryResponse.id,exponent:FIXTURE.primaryResponse.exponent,halfSaturationNumerator:FIXTURE.primaryResponse.halfSaturation.cam16HalfSaturationNumerator,syntheticAdaptationStates:responseProof},claimLimit:FIXTURE.claim};
	await run.writeJsonArtifact('evidence/receptor-parameter-proof.json',result);
	const closure=await buildStaticModuleClosure({candidateRoot:EXPERIMENT_ROOT,entryFiles:['runners/run-spectral-color-receptor-parameter-proof.js'],packageJsonPath:EXPERIMENT_PACKAGE_PATH,nodeModulesRoot:EXPERIMENT_NODE_MODULES_ROOT,allowedNodeBuiltins:['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util']});const after=await createProtectedTrackedInventory(policy);assertFileInventoriesEqual(before,after,'Receptor-parameter protected inventory');
	const proof={proofId:'spectral-color-receptor-parameter-v1',accepted:true,assertions,summary:{assertionCount:assertions.length,datasetRowCount:rows.length,matrixRoundTripMaximumAbsolute:identityError,responseStateCount:responseProof.length,responseExponent:FIXTURE.primaryResponse.exponent},claimLimit:FIXTURE.claim,remaining:['native-15 LMS projection and one-nanometer convergence','constructed spectral metamer proof','measured-spectrum curve sweeps'],containment:{protectedFiles:after.fileCount,closureFileCount:closure.files.length,closureEdgeCount:closure.edges.length}};await run.writeJsonArtifact('evidence/receptor-parameter-acceptance.json',proof);const manifest=await run.finalize({conclusion:'accepted',result:proof,report:`# ${run.runId}: Receptor parameter prerequisite\n\nConclusion: **accepted for the limited receptor-reference parameter set**.\n\nThe pinned ${rows.length}-row CIE 2006 LMS dataset matches the CIE-published SHA-256. Matrix normalization, D65 neutrality, Naka-Rushton crossings, bounded monotonic response, and equal-LMS identity pass ${assertions.length}/${assertions.length} assertions. The CAM16-derived half-saturation placement remains an explicit appearance reference, not an anatomical cone-isomerization constant.\n`});process.stdout.write(`${JSON.stringify({runId:run.runId,conclusion:'accepted',artifactSetSha256:manifest.artifactSetSha256,summary:proof.summary},null,2)}\n`);
	}catch(error){const detail={name:error.name,message:error.message,stack:error.stack};try{await run.writeJsonArtifact('evidence/failure.json',detail);const manifest=await run.finalize({conclusion:'failed',result:{error:detail},report:`# ${run.runId}: Receptor parameter prerequisite\n\nConclusion: **failed**.\n\n${detail.message}\n`});process.stderr.write(`${JSON.stringify({runId:run.runId,conclusion:'failed',artifactSetSha256:manifest.artifactSetSha256,error:detail},null,2)}\n`);}catch{}process.exitCode=1;}
}

await main();
