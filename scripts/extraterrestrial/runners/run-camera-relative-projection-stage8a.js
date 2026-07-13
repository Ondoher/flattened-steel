#!/usr/bin/env node

import {execFile as execFileCallback, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

import FIXTURE from '../fixtures/camera-relative-projection-stage8a-v1.json' with {type:'json'};
import {NATIVE_15_SPECTRAL_BASIS} from '../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/profiles/native-15/native-15-profile.js';
import {assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, sha256, sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, REPOSITORY_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';
import {compileNativeWeights, fitSensorToXyz, multiplyMatrixVector, normalizedTriplet, projectSpectrum} from '../color/RelativeCameraSpectralProfile.js';

const execFile=promisify(execFileCallback);
const COMMAND='node scripts/extraterrestrial/runners/run-camera-relative-projection-stage8a.js';
const FIXTURE_PATH=path.join(EXPERIMENT_ROOT,'fixtures','camera-relative-projection-stage8a-v1.json');
const ORACLE_SCRIPT_PATH=path.join(REPOSITORY_ROOT,FIXTURE.oracle.script);
const PYTHON_PATH=path.join(REPOSITORY_ROOT,FIXTURE.oracle.pythonRelativePath);
const CONDITIONS=FIXTURE.conditions;
const XYZ_TO_REC709=[
	[3.2409699419045226,-1.537383177570094,-0.4986107602930034],
	[-0.9692436362808796,1.8759675015077202,0.04155505740717559],
	[0.05563007969699366,-0.20397695888897652,1.0569715142428786],
];

function requireCondition(value,message){if(!value)throw new Error(message);}
function maximumAbsolute(left,right){let maximum=0;for(let row=0;row<left.length;row+=1)for(let column=0;column<left[row].length;column+=1)maximum=Math.max(maximum,Math.abs(left[row][column]-right[row][column]));return maximum;}
function maximumRelative(left,right){let maximum=0;for(let row=0;row<left.length;row+=1)for(let column=0;column<left[row].length;column+=1){const a=left[row][column],b=right[row][column];maximum=Math.max(maximum,Math.abs(a-b)/Math.max(1e-15,Math.abs(a),Math.abs(b)));}return maximum;}
function vectorNorm(values){return Math.sqrt(values.reduce((sum,value)=>sum+value*value,0));}
function chromaticityDistance(left,right){return vectorNorm(left.map((value,index)=>value-right[index]));}
function decodeFloat32(bytes){requireCondition(bytes.byteLength%4===0,'Float32 readback byte length is invalid.');const copy=new Uint8Array(bytes.byteLength);copy.set(bytes);return new Float32Array(copy.buffer);}
function spectrumAt(packets,pixel){const values=[];for(let channel=0;channel<15;channel+=1)values.push(packets[Math.floor(channel/4)][pixel*4+(channel%4)]);return values;}
function relativeError(left,right){return Math.abs(left-right)/Math.max(1e-15,Math.abs(left),Math.abs(right));}

async function curlBytes(url){
	const {stdout}=await execFile('curl.exe',['-k','-L','--fail','--silent','--show-error',url],{encoding:'buffer',maxBuffer:8*1024*1024,windowsHide:true});
	return Buffer.from(stdout);
}

function parsePbrtResponse(source,name){
	const expression=new RegExp(`const\\s+Float\\s+${name}\\[\\]\\s*=\\s*\\{([\\s\\S]*?)\\};`,'u');
	const match=expression.exec(source);
	requireCondition(match,`PBRT response array ${name} is absent.`);
	const numbers=match[1].match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/gu)?.map(Number)??[];
	requireCondition(numbers.length===70,`PBRT response array ${name} does not contain 35 wavelength/value pairs.`);
	const pairs=[];for(let index=0;index<numbers.length;index+=2)pairs.push([numbers[index],numbers[index+1]]);
	requireCondition(pairs.every((pair,index)=>pair[0]===380+index*10&&Number.isFinite(pair[1])&&pair[1]>=0),`PBRT response array ${name} failed its wavelength/value audit.`);
	return pairs;
}

async function runOracle(payload){
	return await new Promise((resolve,reject)=>{
		const child=spawn(PYTHON_PATH,[ORACLE_SCRIPT_PATH],{cwd:REPOSITORY_ROOT,windowsHide:true,stdio:['pipe','pipe','pipe']});
		const stdout=[];const stderr=[];
		child.stdout.on('data',(chunk)=>stdout.push(chunk));child.stderr.on('data',(chunk)=>stderr.push(chunk));
		child.on('error',reject);child.on('close',(code)=>{if(code!==0){reject(new Error(`Colour oracle failed (${code}): ${Buffer.concat(stderr).toString('utf8')}`));return;}try{resolve({value:JSON.parse(Buffer.concat(stdout).toString('utf8')),stderr:Buffer.concat(stderr).toString('utf8')});}catch(error){reject(error);}});
		child.stdin.end(JSON.stringify(payload));
	});
}

async function loadInputView(input){
	const root=path.join(RUNS_ROOT,input.runId);
	await assertNoReparseEntries(root,`${input.viewId} source run`);
	const manifest=JSON.parse(await readFile(path.join(root,'artifact-manifest.json'),'utf8'));
	requireCondition(manifest.runId===input.runId&&manifest.conclusion==='accepted'&&manifest.artifactSetSha256===input.artifactSetSha256,`${input.viewId} source run identity changed.`);
	const packetsByCondition=new Map();const derivationArtifacts=[];
	for(const condition of CONDITIONS){
		const packets=[];
		for(let packet=0;packet<4;packet+=1){
			const relativePath=`readbacks/${condition}/pre-display-packet-${packet}.f32le`;
			const entry=manifest.artifacts.find((artifact)=>artifact.path===relativePath);
			requireCondition(entry,`${input.runId} lacks ${relativePath}.`);
			const absolutePath=path.join(root,...relativePath.split('/'));const digest=await sha256File(absolutePath);
			requireCondition(digest===entry.sha256,`${input.runId} ${relativePath} hash changed.`);
			const bytes=await readFile(absolutePath);packets.push(decodeFloat32(bytes));
			derivationArtifacts.push({runId:input.runId,artifactSetSha256:manifest.artifactSetSha256,path:relativePath,sha256:digest,byteLength:bytes.byteLength});
		}
		packetsByCondition.set(condition,packets);
	}
	return{input,manifest,packetsByCondition,derivationArtifacts};
}

function processView(view,cameraWeights,idealWeights,sensorToXyz){
	const pixelCount=view.input.widthPixels*view.input.heightPixels;
	const samplePixels={
		'disk-center':Math.floor(view.input.heightPixels/2)*view.input.widthPixels+Math.floor(view.input.widthPixels/2),
		'top-center':(view.input.heightPixels-1)*view.input.widthPixels+Math.floor(view.input.widthPixels/2),
		'upper-quarter':Math.floor(view.input.heightPixels*0.75)*view.input.widthPixels+Math.floor(view.input.widthPixels/2),
	};
	const conditions=[];
	for(const conditionId of CONDITIONS){
		const packets=view.packetsByCondition.get(conditionId);let nonFiniteCount=0,zeroSpectrumCount=0;const rawSum=[0,0,0],rawMinimum=[Infinity,Infinity,Infinity],rawMaximum=[-Infinity,-Infinity,-Infinity];const samples={};
		for(let pixel=0;pixel<pixelCount;pixel+=1){
			const spectrum=spectrumAt(packets,pixel);const raw=projectSpectrum(cameraWeights,spectrum);if(spectrum.every((value)=>value===0))zeroSpectrumCount+=1;
			if(!raw.every(Number.isFinite))nonFiniteCount+=1;
			for(let channel=0;channel<3;channel+=1){rawSum[channel]+=raw[channel];rawMinimum[channel]=Math.min(rawMinimum[channel],raw[channel]);rawMaximum[channel]=Math.max(rawMaximum[channel],raw[channel]);}
			for(const [sampleId,samplePixel] of Object.entries(samplePixels))if(pixel===samplePixel){const idealRaw=projectSpectrum(idealWeights,spectrum);const xyz=multiplyMatrixVector(sensorToXyz,raw);samples[sampleId]={pixelIndex:pixel,spectrum,cameraRaw:raw,cameraRawChromaticity:normalizedTriplet(raw),idealCie1931Raw:idealRaw,xyzD65:xyz,linearRec709D65:multiplyMatrixVector(XYZ_TO_REC709,xyz)};}
		}
		const center=samples['disk-center'];const sky=samples['top-center'];conditions.push({conditionId,pixelCount,nonFiniteCount,zeroSpectrumCount,cameraRawMean:rawSum.map((value)=>value/pixelCount),cameraRawMinimum:rawMinimum,cameraRawMaximum:rawMaximum,samples,diskToTopSkyRawRatio:center.cameraRaw.map((value,index)=>value/Math.max(1e-30,sky.cameraRaw[index]))});
	}
	return{viewId:view.input.viewId,widthPixels:view.input.widthPixels,heightPixels:view.input.heightPixels,verticalFovDegrees:view.input.verticalFovDegrees,conditions};
}

async function main(){
	const run=await initializeRunRecord({slug:'camera-relative-projection-stage8a',command:COMMAND,inputs:{fixture:'scripts/extraterrestrial/fixtures/camera-relative-projection-stage8a-v1.json',sourceRuns:FIXTURE.inputRuns.map(({runId,artifactSetSha256})=>({runId,artifactSetSha256})),scope:'relative camera spectral projection and characterization only; no atmosphere execution, exposure, clipping, physical sensor, automatic metering, or production change'},provenance:{method:'PBRT PixelSensor relative response and over-constrained color-chart least-squares structure',oracle:'pinned Colour 0.4.6 on Python 3.10',profile:FIXTURE.profile.id,derivationPolicy:'every parent, equation, implementation/tool identity, material parameter, and result path is retained'},environment:{node:process.version,platform:process.platform,pythonPath:FIXTURE.oracle.pythonRelativePath},references:{plan:'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md#stage-2-replacement-plan',research:'agents/topics/extraterrestrial/camera-spectral-color-prior-art-research.md',pbrtBook:'https://pbr-book.org/4ed/Cameras_and_Film/Film_and_Imaging'}});
	try{
		await assertRepositoryIdentity();const policy=await loadContainmentPolicy();const before=await createProtectedTrackedInventory(policy);await assertNoReparseEntries(EXPERIMENT_ROOT,'Experiment tree');
		const [pbrtSourceBytes,pbrtLicenseBytes,curlVersionResult,views]=await Promise.all([
			curlBytes(FIXTURE.profile.sourceUrl),curlBytes(FIXTURE.profile.licenseUrl),execFile('curl.exe',['--version'],{encoding:'utf8',windowsHide:true}),Promise.all(FIXTURE.inputRuns.map(loadInputView)),
		]);
		const pbrtSource=pbrtSourceBytes.toString('utf8');const responseNames=['r','g','b'];const responses=Object.fromEntries(responseNames.map((channel)=>[channel,parsePbrtResponse(pbrtSource,`${FIXTURE.profile.sensorName}_${channel}`)]));
		requireCondition(responseNames.every((channel)=>responses[channel].length===35),'The PBRT response profile is incomplete.');
		const nativeBins=NATIVE_15_SPECTRAL_BASIS.channels.map((channel)=>({id:channel.id,centerNanometers:channel.center.value,widthNanometers:channel.width.value}));
		const oracleInput={schemaId:'camera-stage8a-colour-oracle-input-v1',responses,nativeBins,spectralShape:FIXTURE.oracle.spectralShape,colourCheckerDataset:FIXTURE.profile.colourCheckerDataset,heldOutPatchIndicesZeroBased:FIXTURE.profile.heldOutPatchIndicesZeroBased};
		const oracleExecution=await runOracle(oracleInput);const oracle=oracleExecution.value;
		requireCondition(oracle.environment.colour===FIXTURE.oracle.version,'The Colour oracle version changed.');requireCondition(oracle.derived.fitRank===3,'The camera characterization fit is rank deficient.');
		const aligned=oracle.alignedData;const jsCameraWeights=compileNativeWeights(aligned.wavelengthsNanometers,aligned.sensorResponses,nativeBins);const jsIdealWeights=compileNativeWeights(aligned.wavelengthsNanometers,aligned.cie1931,nativeBins);const jsMatrix=fitSensorToXyz(oracle.derived.cameraPatchRows,oracle.derived.targetXyzRows,oracle.configuration.trainingPatchIndicesZeroBased);
		const cameraWeightError=maximumRelative(jsCameraWeights,oracle.derived.cameraNative15Weights);const idealWeightError=maximumRelative(jsIdealWeights,oracle.derived.idealCie1931Native15Weights);const matrixError=maximumAbsolute(jsMatrix,oracle.derived.sensorToXyzD65Matrix);
		const zero=projectSpectrum(jsCameraWeights,new Array(15).fill(0));const referenceSpectrum=views.find((view)=>view.input.viewId==='wide').packetsByCondition.get('sunset');const centerPixel=Math.floor(FIXTURE.inputRuns[1].heightPixels/2)*FIXTURE.inputRuns[1].widthPixels+Math.floor(FIXTURE.inputRuns[1].widthPixels/2);const source=spectrumAt(referenceSpectrum,centerPixel);const raw=projectSpectrum(jsCameraWeights,source);let linearityMaximumRelative=0;for(const scale of [0.25,0.5,2,4]){const scaled=projectSpectrum(jsCameraWeights,source.map((value)=>value*scale));for(let channel=0;channel<3;channel+=1)linearityMaximumRelative=Math.max(linearityMaximumRelative,relativeError(scaled[channel],raw[channel]*scale));}
		const processedViews=views.map((view)=>processView(view,jsCameraWeights,jsIdealWeights,jsMatrix));const wide=processedViews.find((view)=>view.viewId==='wide');const centerByCondition=Object.fromEntries(wide.conditions.map((condition)=>[condition.conditionId,condition.samples['disk-center']]));const noon=centerByCondition['solar-noon'];const sunset=centerByCondition.sunset;const noonToSunsetChromaticityDistance=chromaticityDistance(noon.cameraRawChromaticity,sunset.cameraRawChromaticity);const noonRedBlueRatio=noon.cameraRaw[0]/noon.cameraRaw[2];const sunsetRedBlueRatio=sunset.cameraRaw[0]/sunset.cameraRaw[2];const redBlueRatioFactor=sunsetRedBlueRatio/noonRedBlueRatio;
		const assertions=[];const check=(value,message)=>{requireCondition(value,message);assertions.push(message);};
		check(cameraWeightError<=FIXTURE.tolerances.compiledWeightMaximumRelative,`JavaScript and Colour Canon 3x15 weights agree (${cameraWeightError}).`);check(idealWeightError<=FIXTURE.tolerances.compiledWeightMaximumRelative,`JavaScript and Colour ideal CIE 3x15 weights agree (${idealWeightError}).`);check(matrixError<=FIXTURE.tolerances.fitMatrixMaximumAbsolute,`JavaScript and Colour D55-to-D65 3x3 fits agree (${matrixError}).`);check(zero.every((value)=>Math.abs(value)<=FIXTURE.tolerances.zeroMaximumAbsolute),'Zero spectrum maps to exact zero raw camera RGB.');check(linearityMaximumRelative<=FIXTURE.tolerances.linearityMaximumRelative,`Unclipped spectral scaling remains linear (${linearityMaximumRelative}).`);check(processedViews.every((view)=>view.conditions.every((condition)=>condition.nonFiniteCount===0)),'Every pixel in both four-frame fields produces finite raw camera RGB.');check(noonToSunsetChromaticityDistance>=FIXTURE.tolerances.minimumNoonToSunsetRawChromaticityDistance,`Noon and sunset remain chromatically distinct in raw camera RGB (${noonToSunsetChromaticityDistance}).`);check(redBlueRatioFactor>=FIXTURE.tolerances.minimumNoonToSunsetRedBlueRatioFactor,`Sunset preserves a stronger raw red/blue relationship than noon (${redBlueRatioFactor}x).`);
		const derivation={schemaId:'camera-stage8a-derivation-v1',parents:{sourceRuns:views.flatMap((view)=>view.derivationArtifacts),pbrt:{sourceUrl:FIXTURE.profile.sourceUrl,sourceSha256:sha256(pbrtSourceBytes),licenseUrl:FIXTURE.profile.licenseUrl,licenseSha256:sha256(pbrtLicenseBytes),responseArrays:responseNames.map((channel)=>`${FIXTURE.profile.sensorName}_${channel}`)}},operations:[{id:'profile-sampling',equation:'piecewise-linear PBRT response with constant endpoint extension over 360-830 nm'},{id:'native-compilation',equation:'K[c,i] = integral over native bin i of response[c](lambda) d lambda'},{id:'raw-projection',equation:'raw[c] = sum_i nativeBinAverageRadiance[i] * K[c,i]'},{id:'characterization',equation:'fixed 18-patch least squares from D55 sensor RGB to D65 CIE XYZ; six fixed held-out patches'},{id:'display-diagnostic',equation:'linear Rec.709 D65 = fixed XYZ-to-Rec.709 matrix * fitted XYZ; no clipping or encoding'}],implementations:{runner:{path:'scripts/extraterrestrial/runners/run-camera-relative-projection-stage8a.js',sha256:await sha256File(import.meta.filename)},profileHelper:{path:'scripts/extraterrestrial/color/RelativeCameraSpectralProfile.js',sha256:await sha256File(path.join(EXPERIMENT_ROOT,'color','RelativeCameraSpectralProfile.js'))},oracle:{path:FIXTURE.oracle.script,sha256:await sha256File(ORACLE_SCRIPT_PATH)},fixture:{path:'scripts/extraterrestrial/fixtures/camera-relative-projection-stage8a-v1.json',sha256:await sha256File(FIXTURE_PATH)}},tools:{node:process.version,python:oracle.environment.python,colour:oracle.environment.colour,numpy:oracle.environment.numpy,curl:curlVersionResult.stdout.split(/\r?\n/u)[0]},parameters:FIXTURE.profile,resultPaths:['evidence/pbrt-spectrum.cpp','evidence/pbrt-license.txt','evidence/extracted-camera-response.json','evidence/colour-oracle.json','evidence/compiled-camera-profile.json','evidence/full-field-relative-projection.json','evidence/stage8a-proof.json'],resultIdentityOwner:'artifact-manifest.json'};
		const compiledProfile={schemaId:'relative-camera-spectral-profile-v1',profileId:FIXTURE.profile.id,claimLimit:FIXTURE.claimLimit,nativeBasis:{id:NATIVE_15_SPECTRAL_BASIS.id,contentHash:NATIVE_15_SPECTRAL_BASIS.contentHash,bins:nativeBins},responseSemantics:FIXTURE.profile.responseSemantics,cameraNative15Weights:jsCameraWeights,idealCie1931Native15Weights:jsIdealWeights,sensorToXyzD65Matrix:jsMatrix,xyzToLinearRec709D65Matrix:XYZ_TO_REC709,characterization:{illuminant:'D55',targetIlluminant:'D65',dataset:FIXTURE.profile.colourCheckerDataset,trainingPatchIndicesZeroBased:oracle.configuration.trainingPatchIndicesZeroBased,heldOutPatchIndicesZeroBased:oracle.configuration.heldOutPatchIndicesZeroBased,fitXyzRmse:oracle.derived.fitXyzRmse,trainingMeanDeltaE2000:oracle.derived.trainingMeanDeltaE2000,trainingMaximumDeltaE2000:oracle.derived.trainingMaximumDeltaE2000,heldOutMeanDeltaE2000:oracle.derived.heldOutMeanDeltaE2000,heldOutMaximumDeltaE2000:oracle.derived.heldOutMaximumDeltaE2000}};
		const proof={proofId:'camera-relative-projection-stage8a-v1',accepted:true,assertions,summary:{processedPixelCount:processedViews.reduce((sum,view)=>sum+view.conditions.reduce((total,condition)=>total+condition.pixelCount,0),0),cameraWeightMaximumRelativeError:cameraWeightError,idealWeightMaximumRelativeError:idealWeightError,fitMatrixMaximumAbsoluteError:matrixError,linearityMaximumRelativeError:linearityMaximumRelative,noonToSunsetRawChromaticityDistance:noonToSunsetChromaticityDistance,noonRedBlueRatio,sunsetRedBlueRatio,redBlueRatioFactor,fitXyzRmse:oracle.derived.fitXyzRmse,trainingMeanDeltaE2000:oracle.derived.trainingMeanDeltaE2000,heldOutMeanDeltaE2000:oracle.derived.heldOutMeanDeltaE2000,heldOutMaximumDeltaE2000:oracle.derived.heldOutMaximumDeltaE2000},claimLimit:FIXTURE.claimLimit,nextStage:'8b fixed-exposure full-frame proof'};
		await run.writeArtifact('evidence/pbrt-spectrum.cpp',pbrtSourceBytes);await run.writeArtifact('evidence/pbrt-license.txt',pbrtLicenseBytes);await run.writeJsonArtifact('evidence/extracted-camera-response.json',{schemaId:'pbrt-camera-response-extract-v1',profileId:FIXTURE.profile.id,responses,sourceSha256:sha256(pbrtSourceBytes),sourceAttribution:pbrtSource.split(/\r?\n/u).slice(0,10)});await run.writeJsonArtifact('evidence/colour-oracle-input.json',oracleInput);await run.writeJsonArtifact('evidence/colour-oracle.json',oracle);if(oracleExecution.stderr.trim())await run.writeArtifact('evidence/colour-oracle-stderr.txt',oracleExecution.stderr);await run.writeJsonArtifact('evidence/compiled-camera-profile.json',compiledProfile);await run.writeJsonArtifact('evidence/full-field-relative-projection.json',{schemaId:'camera-stage8a-full-field-relative-projection-v1',views:processedViews});await run.writeJsonArtifact('evidence/derivation.json',derivation);await run.writeJsonArtifact('evidence/stage8a-proof.json',proof);
		const closure=await buildStaticModuleClosure({candidateRoot:EXPERIMENT_ROOT,entryFiles:['runners/run-camera-relative-projection-stage8a.js','color/RelativeCameraSpectralProfile.js'],packageJsonPath:EXPERIMENT_PACKAGE_PATH,nodeModulesRoot:EXPERIMENT_NODE_MODULES_ROOT,allowedNodeBuiltins:['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util']});const after=await createProtectedTrackedInventory(policy);assertFileInventoriesEqual(before,after,'Stage 8a protected inventory');proof.containment={protectedFiles:after.fileCount,closureFileCount:closure.files.length,closureEdgeCount:closure.edges.length};
		const manifest=await run.finalize({conclusion:'accepted',result:proof,report:`# ${run.runId}: relative spectral-camera projection\n\nConclusion: **accepted for Stage 8a relative camera projection**.\n\n- Profile: PBRT Canon EOS 5D Mark IV relative response, D55 characterization to D65 output.\n- Complete production pixels processed: ${proof.summary.processedPixelCount}.\n- Canon 3x15 Colour/JavaScript maximum relative difference: ${cameraWeightError}.\n- 3x3 fit maximum absolute difference: ${matrixError}.\n- Noon-to-sunset raw chromaticity distance: ${noonToSunsetChromaticityDistance}.\n- Sunset/noon raw red-blue ratio factor: ${redBlueRatioFactor}.\n- Held-out mean / maximum Delta E 2000: ${proof.summary.heldOutMeanDeltaE2000} / ${proof.summary.heldOutMaximumDeltaE2000}.\n\nThis accepts relative camera color only. It makes no physical sensor, exposure, clipping, or named-body saturation claim.\n`});process.stdout.write(`${JSON.stringify({runId:run.runId,conclusion:'accepted',artifactSetSha256:manifest.artifactSetSha256,summary:proof.summary},null,2)}\n`);
	}catch(error){const detail={name:error.name,message:error.message,stack:error.stack};try{await run.writeJsonArtifact('evidence/failure.json',detail);const manifest=await run.finalize({conclusion:'failed',result:{error:detail},report:`# ${run.runId}: relative spectral-camera projection\n\nConclusion: **failed**.\n\n${detail.message}\n`});process.stderr.write(`${JSON.stringify({runId:run.runId,conclusion:'failed',artifactSetSha256:manifest.artifactSetSha256,error:detail},null,2)}\n`);}catch{}process.exitCode=1;}
}

await main();
