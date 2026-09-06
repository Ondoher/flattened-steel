#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {lstat, mkdir, readFile, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {deflateSync} from 'node:zlib';

import {BrunetonColorDisplayModel} from '../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {FIGURE1_DISPLAY_CONSTANTS} from '../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/bruneton-color/consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/profiles/native-15/native-15-profile.js';
import ADAPTATION_FIXTURE from '../fixtures/bruneton-light-adaptation-reference-sweep-v1.json' with {type: 'json'};
import RECEPTOR_PARAMETERS from '../fixtures/spectral-color-receptor-parameter-v1.json' with {type: 'json'};
import {CAM16_DIM_SURROUND, forwardCam16} from '../color/Cam16Reference.js';
import {ScalarLuminanceRgbPreservingTransform} from '../color/ScalarLuminanceRgbPreservingTransform.js';
import {createProjectionMatrix, parseCieLms} from '../color/ReceptorSpectralProjection.js';
import {assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {BASELINE_ROOT, CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, 'production-snapshots', 'sun-appearance-step-5-v1');
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-appearance-gpu-visual-v1.json');
const LMS_PATH = path.join(EXPERIMENT_ROOT, 'references', 'cie-2006-lms-2deg', 'CIE_lms_cf_2deg.csv');
const CONDITIONS = [
	{id: 'solar-noon', index: 1},
	{id: 'sunset-minus-30-minutes', index: 2},
	{id: 'sunset-minus-10-minutes', index: 4},
	{id: 'sunset', index: 5},
];
const COMPARE_CANDIDATE = process.argv.includes('--compare-candidate');
const SCALAR_CANDIDATE = process.argv.includes('--scalar-candidate');
const LUMINANCE_HIGHLIGHT_CANDIDATE = process.argv.includes('--luminance-highlight-candidate');
const LIGHT_ADAPTED_LOG_CANDIDATE = process.argv.includes('--light-adapted-log-candidate');
requireCondition([COMPARE_CANDIDATE,SCALAR_CANDIDATE,LUMINANCE_HIGHLIGHT_CANDIDATE,LIGHT_ADAPTED_LOG_CANDIDATE].filter(Boolean).length<=1, 'Candidate modes are mutually exclusive.');
const VIEW = process.argv.includes('--wide')
	? {id: 'wide', slug: 'spectral-color-production-wide-replay-proof', width: 641, height: 401, verticalFovDegrees: 78}
	: {id: 'sun-focused', slug: 'spectral-color-production-sun-focused-replay-proof', width: 641, height: 401, verticalFovDegrees: 15};
const LINEAR_RELATIVE_TOLERANCE = 5e-5;
const MAPPER_ABSOLUTE_TOLERANCE = 2e-6;
const FRAMEBUFFER_CODE_TOLERANCE = 1;

function requireCondition(value, message) { if (!value) throw new Error(message); }
function contentType(filePath) { return filePath.endsWith('.js') ? 'text/javascript; charset=utf-8' : filePath.endsWith('.json') ? 'application/json; charset=utf-8' : filePath.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'; }
function pngBytes(dataUrl) { const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/u.exec(dataUrl); requireCondition(match, 'Production framebuffer is not a PNG data URL.'); return Buffer.from(match[1], 'base64'); }
function decodeFloat32(base64) { const bytes = Buffer.from(base64, 'base64'); requireCondition(bytes.byteLength % 4 === 0, 'Float32 readback byte length is invalid.'); const copy = new Uint8Array(bytes.byteLength); copy.set(bytes); return {bytes, values: new Float32Array(copy.buffer)}; }
function clamp01(value) { return Math.max(0, Math.min(1, value)); }

const CRC_TABLE = (() => { const table = new Uint32Array(256); for (let index = 0; index < 256; index += 1) { let value = index; for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1; table[index] = value >>> 0; } return table; })();
function crc32(buffer) { let value = 0xffffffff; for (const byte of buffer) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; }
function pngChunk(type, data = Buffer.alloc(0)) { const typeBytes = Buffer.from(type, 'ascii'); const output = Buffer.alloc(12 + data.length); output.writeUInt32BE(data.length, 0); typeBytes.copy(output, 4); data.copy(output, 8); output.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length); return output; }
function encodePng(width, height, rgbaBottomUp) { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6; const rows = Buffer.alloc((width * 4 + 1) * height); for (let y = 0; y < height; y += 1) { const targetOffset = y * (width * 4 + 1); rows[targetOffset] = 0; const sourceOffset = (height - 1 - y) * width * 4; rgbaBottomUp.copy(rows, targetOffset + 1, sourceOffset, sourceOffset + width * 4); } return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(rows, {level: 9})), pngChunk('IEND')]); }

function browserHtml(condition) {
	const shard = {id: `distant-${condition.id}`, family: 'distant', conditionId: condition.id, conditionIndex: condition.index, conditionCount: 8};
	return `<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">
const target=document.querySelector('#result');
try {
	const [{runProductionSunAppearanceGpuVisualScene}, authored] = await Promise.all([import('/harness/production-sun-appearance-gpu-visual-browser-entry.js'),fetch('/fixtures/production-sun-appearance-gpu-visual-v1.json').then(response=>response.json())]);
	const fixture=structuredClone(authored);
	fixture.viewports=[{...fixture.viewports[0],id:${JSON.stringify(`camera-${VIEW.id}`)},width:${VIEW.width},height:${VIEW.height},verticalFovDegrees:${VIEW.verticalFovDegrees}}]; fixture.sampling.requiredViewportCount=1;
	for (const item of fixture.distant.conditions) { item.requiredPreview=item.id===${JSON.stringify(condition.id)}; if (item.id===${JSON.stringify(condition.id)}) item.radialOrientations=['zenithward']; }
	const value=await runProductionSunAppearanceGpuVisualScene(fixture, async()=>{}, ${JSON.stringify(shard)}); const preview=value.condition.preview;
	if (!preview?.productionMapperPngDataUrl || !preview?.preDisplayPacketDataBase64 || !preview?.dataBase64 || !preview?.mapperDataBase64 || !preview?.productionFramebufferRgba8Base64) throw new Error('A required production seam readback is absent.');
	const centerSample=value.condition.viewports[0].samples.find((sample)=>sample.id==='disk-center');
	if(!centerSample?.celestialRadiance?.values) throw new Error('Production disk-center direct celestial spectrum is absent.');
	const result={schemaId:'spectral-color-production-replay-capture-v1',conditionId:value.condition.id,productionPath:value.productionPath,shaderSourceHash:value.condition.shaderSourceHash,renderer:value.renderer,sceneScale:value.condition.sceneScale,observation:value.condition.observation,source:value.condition.source,directCenterSpectrum:centerSample.celestialRadiance.values,preview};
	target.textContent='submitted'; await fetch('/result/${condition.id}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(result)});
} catch(error) { await fetch('/result/${condition.id}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}})}); }
</script>`;
}

function candidateBrowserHtml() {
	const conditionIds = ['noon', 'sunset-minus-30', 'sunset-minus-10', 'sunset'];
	return `<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">
const target=document.querySelector('#result');
try {
	const [{runReceptorFullFrameContext}, stage1] = await Promise.all([import('/harness/spectral-color-receptor-full-frame-browser-entry.js'),fetch('/fixtures/spectral-color-stage1-ledger-v1.json').then(response=>response.json())]);
	const review={conditions:${JSON.stringify(conditionIds)},viewport:{widthPixels:${VIEW.width},heightPixels:${VIEW.height},verticalFieldOfViewDegrees:${VIEW.verticalFovDegrees}},includeSignedLinearReadback:true};
	const result=await runReceptorFullFrameContext(stage1,review); target.textContent='submitted'; await fetch('/result/current-candidate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(result)});
} catch(error) { await fetch('/result/current-candidate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}})}); }
</script>`;
}

async function serve(run) {
	const waiters = new Map();
	const roots = new Map([['/browser/', path.join(run.runDirectory, 'browser')],['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],['/candidate/', CANDIDATE_ROOT],['/baseline/', BASELINE_ROOT],['/snapshot/', SNAPSHOT_ROOT],['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT]]);
	const server = createServer(async (request, response) => { try { const pathname = new URL(request.url, 'http://127.0.0.1').pathname; if (request.method === 'POST' && pathname.startsWith('/result/')) { const id=pathname.slice('/result/'.length); const chunks=[]; let length=0; for await (const chunk of request) { length+=chunk.length; if (length > 128*1024*1024) throw new Error('Result body is too large.'); chunks.push(chunk); } const waiter=waiters.get(id); if (!waiter) throw new Error('Unexpected result id.'); waiters.delete(id); waiter.resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); response.writeHead(204); response.end(); return; } const root=[...roots.entries()].find(([prefix])=>pathname.startsWith(prefix)); if (!root) throw new Error('Unsupported path.'); const relative=pathname.slice(root[0].length); if (!relative || relative.includes('..') || path.isAbsolute(relative)) throw new Error('Unsafe path.'); const resolved=path.resolve(root[1],relative); if (!resolved.startsWith(`${path.resolve(root[1])}${path.sep}`)) throw new Error('Escaped root.'); response.writeHead(200,{'content-type':contentType(resolved)}); response.end(await readFile(resolved)); } catch { response.writeHead(404); response.end('not found'); } });
	await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
	return {url:`http://127.0.0.1:${server.address().port}`,waitForResult(id){return new Promise((resolve,reject)=>{const timeoutMilliseconds=id==='current-candidate'?1200000:720000;const timeout=setTimeout(()=>{waiters.delete(id);reject(new Error(`${id} GPU browser result timed out after ${timeoutMilliseconds} ms.`));},timeoutMilliseconds);waiters.set(id,{resolve:(value)=>{clearTimeout(timeout);resolve(value);}});});},close:()=>new Promise((resolve)=>server.close(resolve))};
}

function replay(preview) {
	const pixelCount = preview.width * preview.height;
	requireCondition(preview.width === VIEW.width && preview.height === VIEW.height, 'GPU viewport differs from requested replay viewport.');
	requireCondition(preview.preDisplayPacketDataBase64.length === 4, 'Native-15 readback requires four RGBA packets.');
	const packets = preview.preDisplayPacketDataBase64.map((value) => decodeFloat32(value));
	const gpuLinear = decodeFloat32(preview.dataBase64);
	const gpuMapper = decodeFloat32(preview.mapperDataBase64);
	const framebuffer = Buffer.from(preview.productionFramebufferRgba8Base64, 'base64');
	for (const packet of [...packets, gpuLinear, gpuMapper]) requireCondition(packet.values.length === pixelCount * 4, 'GPU Float32 readback length is inconsistent with viewport.');
	requireCondition(framebuffer.length === pixelCount * 4, 'Production framebuffer byte length is inconsistent with viewport.');
	const color = new BrunetonColorDisplayModel();
	const weights = color._displayLinearSrgbByChannel;
	const rows = [weights.r, weights.g, weights.b];
	const replayRgba = Buffer.alloc(pixelCount * 4);
	let maxLinearRelativeError=0, maxLinearAbsoluteError=0, maxMapperAbsoluteError=0, maxFramebufferCodeError=0, framebufferChannelsOutsideTolerance=0, finite=true;
	const centerPixel = Math.floor(preview.height / 2) * preview.width + Math.floor(preview.width / 2);
	let center = null;
	for (let pixel=0; pixel<pixelCount; pixel+=1) {
		const spectrum = new Array(15);
		for (let channel=0; channel<15; channel+=1) spectrum[channel]=packets[Math.floor(channel/4)].values[pixel*4+(channel%4)];
		const linear=[0,0,0];
		for (let rgb=0; rgb<3; rgb+=1) for (let channel=0; channel<15; channel+=1) linear[rgb]+=spectrum[channel]*rows[rgb][channel];
		const mapped=color.linearSrgbToDisplayRgb(linear);
		for (let rgb=0; rgb<3; rgb+=1) {
			const gpuLinearValue=gpuLinear.values[pixel*4+rgb]; const linearAbsolute=Math.abs(linear[rgb]-gpuLinearValue); const linearRelative=linearAbsolute/Math.max(1,Math.abs(linear[rgb]),Math.abs(gpuLinearValue));
			const mapperAbsolute=Math.abs(mapped[rgb]-gpuMapper.values[pixel*4+rgb]); const code=Math.round(clamp01(mapped[rgb])*255); const codeError=Math.abs(code-framebuffer[pixel*4+rgb]);
			finite &&= Number.isFinite(linear[rgb]) && Number.isFinite(mapped[rgb]) && Number.isFinite(gpuLinearValue) && Number.isFinite(gpuMapper.values[pixel*4+rgb]);
			maxLinearAbsoluteError=Math.max(maxLinearAbsoluteError,linearAbsolute); maxLinearRelativeError=Math.max(maxLinearRelativeError,linearRelative); maxMapperAbsoluteError=Math.max(maxMapperAbsoluteError,mapperAbsolute); maxFramebufferCodeError=Math.max(maxFramebufferCodeError,codeError); if(codeError>FRAMEBUFFER_CODE_TOLERANCE) framebufferChannelsOutsideTolerance+=1; replayRgba[pixel*4+rgb]=code;
		}
		replayRgba[pixel*4+3]=255;
		if(pixel===centerPixel) center={spectrum, replayLinearRgb:linear, gpuLinearRgb:Array.from(gpuLinear.values.slice(pixel*4,pixel*4+3)), replayMappedRgb:mapped, gpuMappedRgb:Array.from(gpuMapper.values.slice(pixel*4,pixel*4+3)), replayRgba8:Array.from(replayRgba.slice(pixel*4,pixel*4+4)), productionFramebufferRgba8:Array.from(framebuffer.slice(pixel*4,pixel*4+4))};
	}
	const accepted=finite && maxLinearRelativeError<=LINEAR_RELATIVE_TOLERANCE && maxMapperAbsoluteError<=MAPPER_ABSOLUTE_TOLERANCE && maxFramebufferCodeError<=FRAMEBUFFER_CODE_TOLERANCE;
	return {accepted,replayRgba,raw:{packets:packets.map((packet)=>packet.bytes),gpuLinear:gpuLinear.bytes,gpuMapper:gpuMapper.bytes,framebuffer},summary:{pixelCount,finite,maxLinearAbsoluteError,maxLinearRelativeError,maxMapperAbsoluteError,maxFramebufferCodeError,framebufferChannelsOutsideTolerance,center}};
}

function nativeSpectrumAt(packets, pixel) {
	return Array.from({length: 15}, (_, channel) => {
		const values = new Float32Array(packets[Math.floor(channel / 4)].buffer, packets[Math.floor(channel / 4)].byteOffset, packets[Math.floor(channel / 4)].byteLength / 4);
		const value = values[pixel * 4 + channel % 4];
		requireCondition(Number.isFinite(value) && value >= -1e-6, 'Production spectrum contains an invalid negative or non-finite value.');
		return Math.max(0, value);
	});
}

function renderScalarCandidate(packets, transform) {
	const pixelCount = VIEW.width * VIEW.height;
	const rgba = Buffer.alloc(pixelCount * 4);
	const centerPixel = Math.floor(VIEW.height / 2) * VIEW.width + Math.floor(VIEW.width / 2);
	let exactWhiteCount = 0, saturatedCount = 0, blackCount = 0, gamutLimitedCount = 0, encodedLuminanceSum = 0, center = null;
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const mapped = transform.transformSpectrum(nativeSpectrumAt(packets, pixel), 1);
		const rgb = mapped.encodedSrgb;
		requireCondition(rgb.every((value) => Number.isFinite(value) && value >= -1e-12 && value <= 1 + 1e-12), 'Scalar candidate escaped display bounds.');
		if (rgb.every((value) => value === 1)) exactWhiteCount += 1;
		if (rgb.some((value) => value >= 254 / 255)) saturatedCount += 1;
		if (rgb.every((value) => value <= 1 / 255)) blackCount += 1;
		if (mapped.gamutLimited) gamutLimitedCount += 1;
		encodedLuminanceSum += 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
		for (let channel = 0; channel < 3; channel += 1) rgba[pixel * 4 + channel] = Math.round(clamp01(rgb[channel]) * 255);
		rgba[pixel * 4 + 3] = 255;
		if (pixel === centerPixel) center = {spectrum: mapped.spectrum, signedLinearRec709: mapped.signedLinearRec709, encodedSrgb: rgb, warmth: (rgb[0] - rgb[2]) / Math.max(1e-15, rgb[0] + rgb[1] + rgb[2]), sourceY: mapped.sourceY, mappedY: mapped.mappedY};
	}
	return {rgba, summary: {pixelCount, exactWhiteCount, saturatedCount, blackCount, gamutLimitedCount, meanEncodedLuminance: encodedLuminanceSum / pixelCount, center}};
}

function renderBrunetonLuminanceHighlightCandidate(packets) {
	const pixelCount=VIEW.width*VIEW.height;const rgba=Buffer.alloc(pixelCount*4);const color=new BrunetonColorDisplayModel();const weights=color._displayLinearSrgbByChannel;const projectionRows=[weights.r,weights.g,weights.b];const coefficient=FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK;const centerPixel=Math.floor(VIEW.height/2)*VIEW.width+Math.floor(VIEW.width/2);
	let exactWhiteCount=0,saturatedCount=0,blackCount=0,gamutLimitedCount=0,negativeChannelPixelCount=0,encodedLuminanceSum=0,center=null;
	for(let pixel=0;pixel<pixelCount;pixel+=1){const spectrum=nativeSpectrumAt(packets,pixel);const linear=[0,0,0];for(let rgb=0;rgb<3;rgb+=1)for(let channel=0;channel<15;channel+=1)linear[rgb]+=spectrum[channel]*projectionRows[rgb][channel];const sourceY=0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2];let mappedY=0,commonGain=0,gamutScale=1;let output=[0,0,0];if(sourceY>0){mappedY=1-Math.exp(-sourceY*coefficient);commonGain=mappedY/sourceY;const positive=linear.map((value)=>Math.max(0,value*commonGain));if(linear.some((value)=>value<0))negativeChannelPixelCount+=1;const peak=Math.max(...positive);gamutScale=peak>1?1/peak:1;output=positive.map((value)=>value*gamutScale);}requireCondition(output.every((value)=>Number.isFinite(value)&&value>=0&&value<=1+1e-12),'Luminance-highlight output escaped display bounds.');if(output.every((value)=>value===1))exactWhiteCount+=1;if(output.some((value)=>value>=254/255))saturatedCount+=1;if(output.every((value)=>value<=1/255))blackCount+=1;if(gamutScale<1)gamutLimitedCount+=1;encodedLuminanceSum+=0.2126*output[0]+0.7152*output[1]+0.0722*output[2];for(let channel=0;channel<3;channel+=1)rgba[pixel*4+channel]=Math.round(clamp01(output[channel])*255);rgba[pixel*4+3]=255;if(pixel===centerPixel)center={spectrum,brunetonLinearRgb:linear,sourceY,mappedY,commonGain,gamutScale,displayRgb:output,warmth:(output[0]-output[2])/Math.max(1e-15,output[0]+output[1]+output[2])};}
	return{rgba,summary:{pixelCount,exactWhiteCount,saturatedCount,blackCount,gamutLimitedCount,negativeChannelPixelCount,meanDisplayLuminance:encodedLuminanceSum/pixelCount,center}};
}

const RGB_TO_XYZ = [
	[0.4123907992659595, 0.35758433938387796, 0.1804807884018343],
	[0.21263900587151036, 0.7151686787677559, 0.07219231536073371],
	[0.01933081871559185, 0.11919477979462598, 0.9505321522496607],
];

function multiplyMatrixVector(matrix, vector) {
	return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function deriveFixedStimulusAdaptationExponent() {
	const stimulus = ADAPTATION_FIXTURE.stimuli.find((item) => item.id === 'warm-orange-18');
	requireCondition(stimulus, 'The authored warm-orange adaptation reference is absent.');
	const directionXyz = multiplyMatrixVector(RGB_TO_XYZ, stimulus.linearRec709Direction);
	const absoluteXyz = directionXyz.map((value) => value * stimulus.absoluteYAtReferenceCdPerSquareMeter / directionXyz[1]);
	const endpoints = [ADAPTATION_FIXTURE.adaptingLuminanceCdPerSquareMeter[0], ADAPTATION_FIXTURE.adaptingLuminanceCdPerSquareMeter.at(-1)];
	const brightness = endpoints.map((LA) => {
		const whiteLuminance = ADAPTATION_FIXTURE.viewingCondition.referenceWhiteToAdaptingLuminanceRatio * LA;
		const xyz = absoluteXyz.map((value) => 100 * value / whiteLuminance);
		return forwardCam16({
			xyz,
			whiteXyz: ADAPTATION_FIXTURE.viewingCondition.whiteXyzRelative,
			adaptingLuminanceCdPerSquareMeter: LA,
			backgroundRelativeY: ADAPTATION_FIXTURE.viewingCondition.backgroundRelativeY,
			surround: CAM16_DIM_SURROUND,
			discountIlluminant: ADAPTATION_FIXTURE.viewingCondition.discountIlluminant,
		}).Q;
	});
	const exponent = Math.log(brightness[1] / brightness[0]) / Math.log(endpoints[1] / endpoints[0]);
	requireCondition(Number.isFinite(exponent) && exponent < 0, 'The CIECAM16 fixed-stimulus adaptation exponent is invalid.');
	return {exponent, endpoints, brightness, brightnessRatio: brightness[1] / brightness[0]};
}

function projectBrunetonLinearRgb(spectrum, projectionRows) {
	return projectionRows.map((row) => row.reduce((sum, weight, channel) => sum + spectrum[channel] * weight, 0));
}

function rec709Luminance(rgb) {
	return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function visibleDiskFraction(source) {
	const elevation = Math.asin(Math.max(-1, Math.min(1, source.directionModel.reduce((sum, value, index) => sum + value * source.upModel[index], 0))));
	const radius = source.apparentRadiusRadians;
	if (elevation >= radius) return {elevationRadians: elevation, fraction: 1};
	if (elevation <= -radius) return {elevationRadians: elevation, fraction: 0};
	const normalized = elevation / radius;
	return {elevationRadians: elevation, fraction: (Math.acos(-normalized) + normalized * Math.sqrt(Math.max(0, 1 - normalized ** 2))) / Math.PI};
}

function containAtConstantLuminance(desiredRgb, mappedY) {
	let chromaScale = 1;
	for (const value of desiredRgb) {
		if (value > 1) chromaScale = Math.min(chromaScale, (1 - mappedY) / (value - mappedY));
		else if (value < 0) chromaScale = Math.min(chromaScale, (0 - mappedY) / (value - mappedY));
	}
	chromaScale = clamp01(chromaScale);
	return {rgb: desiredRgb.map((value) => mappedY + chromaScale * (value - mappedY)), chromaScale};
}

function renderLightAdaptedLogCandidate(packets, conditionState, adaptationReference) {
	const pixelCount = VIEW.width * VIEW.height;
	const rgba = Buffer.alloc(pixelCount * 4);
	const color = new BrunetonColorDisplayModel();
	const weights = color._displayLinearSrgbByChannel;
	const projectionRows = [weights.r, weights.g, weights.b];
	const sourceLinearRgb = projectBrunetonLinearRgb(conditionState.source.surfaceRadiance, projectionRows);
	const sourceWhiteY = rec709Luminance(sourceLinearRgb);
	const directLinearRgb = projectBrunetonLinearRgb(conditionState.directCenterSpectrum, projectionRows);
	const directY = Math.max(0, rec709Luminance(directLinearRgb));
	const support = visibleDiskFraction(conditionState.source);
	const fullDiskSolidAngle = 2 * Math.PI * (1 - Math.cos(conditionState.source.apparentRadiusRadians));
	const localDirectIlluminanceLux = directY * fullDiskSolidAngle * support.fraction;
	const localAdaptingLuminance = Math.max(1e-12, localDirectIlluminanceLux / Math.PI);
	const referenceAdaptingLuminance = sourceWhiteY * fullDiskSolidAngle / Math.PI;
	const adaptationFactor = (localAdaptingLuminance / referenceAdaptingLuminance) ** adaptationReference.exponent;
	const coefficient = FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK;
	const whiteResponse = Math.log1p(coefficient * sourceWhiteY);
	requireCondition(sourceWhiteY > 0 && whiteResponse > 0 && Number.isFinite(adaptationFactor), 'The mastering or adaptation state is invalid.');
	const centerPixel = Math.floor(VIEW.height / 2) * VIEW.width + Math.floor(VIEW.width / 2);
	let exactWhiteCount = 0, saturatedCount = 0, blackCount = 0, gamutLimitedCount = 0, luminanceErrorMaximum = 0, meanDisplayLuminance = 0, center = null;
	for (let pixel = 0; pixel < pixelCount; pixel += 1) {
		const spectrum = nativeSpectrumAt(packets, pixel);
		const linear = projectBrunetonLinearRgb(spectrum, projectionRows);
		const sourceY = rec709Luminance(linear);
		let mappedY = 0, chromaScale = 1, output = [0, 0, 0];
		if (sourceY > 0) {
			mappedY = clamp01(Math.log1p(coefficient * sourceY * adaptationFactor) / whiteResponse);
			const desired = linear.map((value) => value * mappedY / sourceY);
			const contained = containAtConstantLuminance(desired, mappedY);
			output = contained.rgb;
			chromaScale = contained.chromaScale;
		}
		requireCondition(output.every((value) => Number.isFinite(value) && value >= -1e-12 && value <= 1 + 1e-12), 'Light-adapted logarithmic output escaped display bounds.');
		const outputY = rec709Luminance(output);
		luminanceErrorMaximum = Math.max(luminanceErrorMaximum, Math.abs(outputY - mappedY));
		if (output.every((value) => value >= 1 - 1e-12)) exactWhiteCount += 1;
		if (output.some((value) => value >= 254 / 255)) saturatedCount += 1;
		if (output.every((value) => value <= 1 / 255)) blackCount += 1;
		if (chromaScale < 1 - 1e-12) gamutLimitedCount += 1;
		meanDisplayLuminance += outputY;
		for (let channel = 0; channel < 3; channel += 1) rgba[pixel * 4 + channel] = Math.round(clamp01(output[channel]) * 255);
		rgba[pixel * 4 + 3] = 255;
		if (pixel === centerPixel) center = {spectrum, brunetonLinearRgb: linear, sourceY, mappedY, displayRgb: output, chromaScale, warmth: (output[0] - output[2]) / Math.max(1e-15, output[0] + output[1] + output[2])};
	}
	return {rgba, summary: {pixelCount, exactWhiteCount, saturatedCount, blackCount, gamutLimitedCount, luminanceErrorMaximum, meanDisplayLuminance: meanDisplayLuminance / pixelCount, center, conditionState: {sourceWhiteY, directY, fullDiskSolidAngle, visibleDiskFraction: support.fraction, solarElevationRadians: support.elevationRadians, localDirectIlluminanceLux, localAdaptingLuminance, referenceAdaptingLuminance, adaptationFactor, adaptationExponent: adaptationReference.exponent}}};
}

async function launchBrowser(server, run, id, pageName) {
	const profile=path.join(run.runDirectory,`browser-profile-${id}`); await mkdir(profile);
	try {
		const resultPromise=server.waitForResult(id); const child=spawn(CHROME_PATH,['--headless=new',`--user-data-dir=${profile}`,'--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--disable-software-rasterizer','--disable-background-networking','--disable-gpu-shader-disk-cache','--no-first-run',`${server.url}/browser/${pageName}`],{windowsHide:true,stdio:'ignore'});
		try { return await resultPromise; } finally { child.kill(); await new Promise((resolve)=>{if(child.exitCode!==null)resolve();else{child.once('exit',resolve);setTimeout(resolve,5000);}}); }
	} finally { await rm(profile,{recursive:true,force:true}); }
}

function compareCandidateFrames(candidate, productionRaw) {
	const productionByCandidateId = new Map([['noon','solar-noon'],['sunset-minus-30','sunset-minus-30-minutes'],['sunset-minus-10','sunset-minus-10-minutes'],['sunset','sunset']]);
	const color = new BrunetonColorDisplayModel(); const weights=color._displayLinearSrgbByChannel; const rows=[weights.r,weights.g,weights.b]; const pixelCount=VIEW.width*VIEW.height; const centerPixel=Math.floor(VIEW.height/2)*VIEW.width+Math.floor(VIEW.width/2); const results=[];
	for(const frame of candidate.frames){const productionId=productionByCandidateId.get(frame.id);const production=productionRaw.get(productionId);requireCondition(production&&frame.timeIso,`Missing matched production condition for ${frame.id}.`);const candidatePackets=frame.spectralGroupsFloat32Base64.map((value)=>decodeFloat32(value));const candidateLinear=decodeFloat32(frame.signedLinearRgbaFloat32Base64);const productionPackets=production.packets.map((bytes)=>decodeFloat32(bytes.toString('base64')));let spectralSquaredError=0,spectralSquaredReference=0,maxSpectralRelativeError=0,maxCandidateProjectionRelativeError=0;const centerProductionSpectrum=[],centerCandidateSpectrum=[];
		for(let pixel=0;pixel<pixelCount;pixel+=1){for(let channel=0;channel<15;channel+=1){const packet=Math.floor(channel/4),component=channel%4,index=pixel*4+component;const p=productionPackets[packet].values[index],c=candidatePackets[packet].values[index],difference=c-p;spectralSquaredError+=difference*difference;spectralSquaredReference+=p*p;if(Math.max(Math.abs(p),Math.abs(c))>1e-6)maxSpectralRelativeError=Math.max(maxSpectralRelativeError,Math.abs(difference)/Math.max(Math.abs(p),Math.abs(c)));if(pixel===centerPixel){centerProductionSpectrum.push(p);centerCandidateSpectrum.push(c);}}
			for(let rgb=0;rgb<3;rgb+=1){let projected=0;for(let channel=0;channel<15;channel+=1)projected+=candidatePackets[Math.floor(channel/4)].values[pixel*4+(channel%4)]*rows[rgb][channel];const gpu=candidateLinear.values[pixel*4+rgb];maxCandidateProjectionRelativeError=Math.max(maxCandidateProjectionRelativeError,Math.abs(projected-gpu)/Math.max(1,Math.abs(projected),Math.abs(gpu)));}}
		let centerMaximumRelativeError=0;for(let channel=0;channel<15;channel+=1)centerMaximumRelativeError=Math.max(centerMaximumRelativeError,Math.abs(centerCandidateSpectrum[channel]-centerProductionSpectrum[channel])/Math.max(1e-12,Math.abs(centerCandidateSpectrum[channel]),Math.abs(centerProductionSpectrum[channel])));
		results.push({candidateConditionId:frame.id,productionConditionId:productionId,timeIso:frame.timeIso,centerMaximumSpectralRelativeError:centerMaximumRelativeError,fieldNormalizedSpectralRmse:Math.sqrt(spectralSquaredError/Math.max(spectralSquaredReference,1e-30)),fieldMaximumSpectralRelativeError:maxSpectralRelativeError,candidateProjectionMaximumRelativeError:maxCandidateProjectionRelativeError,centerProductionSpectrum,centerCandidateSpectrum});}
	const firstDivergentSeam=results.some((row)=>row.centerMaximumSpectralRelativeError>0.005||row.fieldNormalizedSpectralRmse>0.005)?'preDisplayRadiance':results.some((row)=>row.candidateProjectionMaximumRelativeError>LINEAR_RELATIVE_TOLERANCE)?'signed-linear-rgb':'none-detected-through-signed-linear-rgb';
	return {schemaId:'spectral-color-production-candidate-seam-comparison-v1',view:VIEW,firstDivergentSeam,results};
}

async function main() {
	const command=`node experiments/extraterrestrial/runners/run-spectral-color-production-replay-proof.js${VIEW.id==='wide'?' --wide':''}${COMPARE_CANDIDATE?' --compare-candidate':''}${SCALAR_CANDIDATE?' --scalar-candidate':''}${LUMINANCE_HIGHLIGHT_CANDIDATE?' --luminance-highlight-candidate':''}${LIGHT_ADAPTED_LOG_CANDIDATE?' --light-adapted-log-candidate':''}`;
	const slug=COMPARE_CANDIDATE?`spectral-color-production-${VIEW.id}-candidate-seam-proof`:SCALAR_CANDIDATE?`spectral-color-production-${VIEW.id}-scalar-candidate`:LUMINANCE_HIGHLIGHT_CANDIDATE?`spectral-color-production-${VIEW.id}-bruneton-luminance-highlight`:LIGHT_ADAPTED_LOG_CANDIDATE?`spectral-color-production-${VIEW.id}-light-adapted-log`:VIEW.slug;
	const run=await initializeRunRecord({slug,command,inputs:{fixture:'experiments/extraterrestrial/fixtures/production-sun-appearance-gpu-visual-v1.json',candidateFixture:COMPARE_CANDIDATE?'experiments/extraterrestrial/fixtures/spectral-color-stage1-ledger-v1.json':null,conditions:CONDITIONS.map(({id})=>id),viewport:{widthPixels:VIEW.width,heightPixels:VIEW.height,verticalFovDegrees:VIEW.verticalFovDegrees,aim:'disk-center'}},provenance:{gpu:'preserved production Algorithm32 normal path plus post-capture diagnostic readbacks',replay:'preserved production BrunetonColorDisplayModel CIE 1931 weights, Figure-1 mapper, and 8-bit framebuffer quantization',candidate:COMPARE_CANDIDATE?'current contained candidate Algorithm32 pre-display spectrum and signed-linear GPU readback':null},environment:{node:process.version,platform:process.platform,chromePath:CHROME_PATH},references:{plan:'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md'}});
	let server;
	try {
		await assertRepositoryIdentity(); const policy=await loadContainmentPolicy(); const before=await createProtectedTrackedInventory(policy); await Promise.all([lstat(CHROME_PATH),lstat(FIXTURE_PATH),assertNoReparseEntries(EXPERIMENT_ROOT,'Experiment tree')]);
		for(const condition of CONDITIONS) await run.writeArtifact(`browser/${condition.id}.html`,browserHtml(condition));
		if(COMPARE_CANDIDATE)await run.writeArtifact('browser/current-candidate.html',candidateBrowserHtml());
		server=await serve(run); const results=[]; const productionRaw=new Map();
		for(const condition of CONDITIONS){const result=await launchBrowser(server,run,condition.id,`${condition.id}.html`);if(result.error)throw new Error(`${condition.id}: ${result.error.name}: ${result.error.message}`);requireCondition(result.conditionId===condition.id&&result.productionPath.includes('Algorithm32.setupShader'),`${condition.id} returned another path.`);requireCondition(result.source?.surfaceRadiance?.length===15&&result.directCenterSpectrum?.length===15,`${condition.id} omitted the production source or direct center spectrum.`);const replayProof=replay(result.preview);await run.writeArtifact(`renders/production/${condition.id}.png`,pngBytes(result.preview.productionMapperPngDataUrl));await run.writeArtifact(`renders/replay/${condition.id}.png`,encodePng(VIEW.width,VIEW.height,replayProof.replayRgba));for(let packet=0;packet<4;packet+=1)await run.writeArtifact(`readbacks/${condition.id}/pre-display-packet-${packet}.f32le`,replayProof.raw.packets[packet]);await run.writeArtifact(`readbacks/${condition.id}/signed-linear-rgba.f32le`,replayProof.raw.gpuLinear);await run.writeArtifact(`readbacks/${condition.id}/mapper-rgba.f32le`,replayProof.raw.gpuMapper);await run.writeArtifact(`readbacks/${condition.id}/production-framebuffer.rgba8`,replayProof.raw.framebuffer);results.push({conditionId:condition.id,shaderSourceHash:result.shaderSourceHash,renderer:result.renderer,observation:result.observation,accepted:replayProof.accepted,...replayProof.summary});productionRaw.set(condition.id,{packets:replayProof.raw.packets,gpuLinear:replayProof.raw.gpuLinear,source:result.source,directCenterSpectrum:result.directCenterSpectrum});requireCondition(replayProof.accepted,`${condition.id} failed production replay parity.`);}
		await run.writeJsonArtifact('evidence/production-replay-seams.json',{schemaId:'spectral-color-production-replay-proof-v1',view:VIEW,tolerances:{linearRelative:LINEAR_RELATIVE_TOLERANCE,mapperAbsolute:MAPPER_ABSOLUTE_TOLERANCE,framebufferCode:FRAMEBUFFER_CODE_TOLERANCE},results});
		let candidateComparison=null;
		if(COMPARE_CANDIDATE){const candidate=await launchBrowser(server,run,'current-candidate','current-candidate.html');if(candidate.error)throw new Error(`current-candidate: ${candidate.error.name}: ${candidate.error.message}`);requireCondition(candidate.schemaId==='spectral-color-receptor-full-frame-readback-v1'&&candidate.frames.length===4,'Current candidate did not return four spectral frames.');candidateComparison=compareCandidateFrames(candidate,productionRaw);await run.writeJsonArtifact('evidence/production-candidate-seam-comparison.json',candidateComparison);for(const frame of candidate.frames){for(let packet=0;packet<4;packet+=1)await run.writeArtifact(`candidate-readbacks/${frame.id}/pre-display-packet-${packet}.f32le`,Buffer.from(frame.spectralGroupsFloat32Base64[packet],'base64'));await run.writeArtifact(`candidate-readbacks/${frame.id}/signed-linear-rgba.f32le`,Buffer.from(frame.signedLinearRgbaFloat32Base64,'base64'));}}
		let scalarCandidate=null;
		if(SCALAR_CANDIDATE){
			const projectionMatrix=createProjectionMatrix(parseCieLms(await readFile(LMS_PATH,'utf8')),NATIVE_15_SPECTRAL_BASIS);
			const noonPackets=productionRaw.get('solar-noon')?.packets;requireCondition(noonPackets,'Production noon spectrum is required to place the scalar renderer endpoints.');
			const noonSpectrum=nativeSpectrumAt(noonPackets,Math.floor(VIEW.height/2)*VIEW.width+Math.floor(VIEW.width/2));
			const provisional=new ScalarLuminanceRgbPreservingTransform({projectionMatrix,lmsToXyzF:RECEPTOR_PARAMETERS.absoluteNormalization.lmsToCie2015XyzF,referenceAdaptingLuminance:1,blackReference:1,whiteReference:2,endpointAdaptationSlope:0,id:'endpoint-calibration'});
			const noonY=provisional.transformSpectrum(noonSpectrum,1).sourceY;requireCondition(noonY>0,'Production noon center must have positive projected luminance.');
			const sceneDynamicRange=1e6,noonPeakLuminanceValue=0.75,blackReference=noonY/sceneDynamicRange,whiteReference=blackReference*Math.exp(Math.log(noonY/blackReference)/noonPeakLuminanceValue);
			const transform=new ScalarLuminanceRgbPreservingTransform({projectionMatrix,lmsToXyzF:RECEPTOR_PARAMETERS.absoluteNormalization.lmsToCie2015XyzF,referenceAdaptingLuminance:1,blackReference,whiteReference,endpointAdaptationSlope:0,id:'cie2015-scalar-luminance-rgb-preserving-dr6-a0-p075-production-rebased-v1'});
			const summaries=[];for(const condition of CONDITIONS){const rendered=renderScalarCandidate(productionRaw.get(condition.id).packets,transform);await run.writeArtifact(`renders/scalar-candidate/${condition.id}.png`,encodePng(VIEW.width,VIEW.height,rendered.rgba));summaries.push({conditionId:condition.id,...rendered.summary});}
			scalarCandidate={schemaId:'spectral-color-production-scalar-candidate-v1',view:VIEW,candidate:{legacyId:'dr6-a0-p075',sceneDynamicRange,noonPeakLuminanceValue,endpointAdaptationSlope:0,noonY,blackReference,whiteReference,description:transform.describe(),endpointBasis:'newly captured production noon center; no Stage 1 spectral or local-light value is consumed'},summaries};
			await run.writeJsonArtifact('evidence/scalar-candidate.json',scalarCandidate);
		}
		let luminanceHighlightCandidate=null;
		if(LUMINANCE_HIGHLIGHT_CANDIDATE){const summaries=[];for(const condition of CONDITIONS){const rendered=renderBrunetonLuminanceHighlightCandidate(productionRaw.get(condition.id).packets);await run.writeArtifact(`renders/bruneton-luminance-highlight/${condition.id}.png`,encodePng(VIEW.width,VIEW.height,rendered.rgba));summaries.push({conditionId:condition.id,...rendered.summary});}luminanceHighlightCandidate={schemaId:'spectral-color-production-bruneton-luminance-highlight-v1',view:VIEW,candidate:{id:'bruneton-cie1931-figure1-luminance-common-gain-v1',projection:'exact contained production Bruneton native-15 CIE 1931 projection',brightness:'existing Bruneton Figure-1 exponential evaluated once on Rec.709 luminance',chromaticity:'one common gain on signed Bruneton linear RGB; negative display channels clipped at the display boundary; one common peak scale when required',displayCoefficient:FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,localLightAdjustment:false,sourceSpecificRules:false},summaries};await run.writeJsonArtifact('evidence/bruneton-luminance-highlight.json',luminanceHighlightCandidate);}
		let lightAdaptedLogCandidate=null;
		if(LIGHT_ADAPTED_LOG_CANDIDATE){
			const adaptationReference=deriveFixedStimulusAdaptationExponent();const summaries=[];
			for(const condition of CONDITIONS){const state=productionRaw.get(condition.id);const rendered=renderLightAdaptedLogCandidate(state.packets,state,adaptationReference);await run.writeArtifact(`renders/light-adapted-log/${condition.id}.png`,encodePng(VIEW.width,VIEW.height,rendered.rgba));summaries.push({conditionId:condition.id,...rendered.summary});}
			requireCondition(summaries.every((row)=>row.luminanceErrorMaximum<=2e-12),'Constant-luminance gamut containment changed mapped luminance.');
			requireCondition(summaries.every((row,index)=>index===0||row.conditionState.localAdaptingLuminance<summaries[index-1].conditionState.localAdaptingLuminance),'Measured direct adapting luminance is not strictly ordered from noon to sunset.');
			lightAdaptedLogCandidate={schemaId:'spectral-color-production-light-adapted-log-v1',view:VIEW,candidate:{id:'bruneton-cie1931-light-adapted-log-constant-y-gamut-v1',projection:'exact contained production Bruneton native-15 CIE 1931 projection',baseResponse:'log1p(k * Y * adaptationFactor) normalized by log1p(k * unattenuatedSourceY)',lowEndScale:FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,masteringWhite:'production source-owner unattenuated boundary radiance projected by the same Bruneton CIE 1931 observer',localLight:'same-run direct celestial disk-center spectrum integrated over geometry-owned visible disk support; L_A = E_v / pi',adaptation:'single global exponent derived from authored warm-orange fixed-stimulus CIECAM16 Q endpoints',gamut:'linear interpolation toward neutral gray at fixed mapped Rec.709 luminance; no peak normalization',sourceSpecificPixelRules:false,adaptationReference},summaries};
			await run.writeJsonArtifact('evidence/light-adapted-log.json',lightAdaptedLogCandidate);
		}
		const closure=await buildStaticModuleClosure({candidateRoot:EXPERIMENT_ROOT,entryFiles:['runners/run-spectral-color-production-replay-proof.js',...(COMPARE_CANDIDATE?['harness/spectral-color-receptor-full-frame-browser-entry.js']:[])],packageJsonPath:EXPERIMENT_PACKAGE_PATH,nodeModulesRoot:EXPERIMENT_NODE_MODULES_ROOT,allowedNodeBuiltins:['node:child_process','node:crypto','node:fs','node:fs/promises','node:http','node:module','node:os','node:path','node:url','node:util','node:zlib']});const after=await createProtectedTrackedInventory(policy);assertFileInventoriesEqual(before,after,'Production replay protected inventory');
		const proof={proofId:`spectral-color-production-${VIEW.id}-${COMPARE_CANDIDATE?'candidate-seam':SCALAR_CANDIDATE?'scalar-candidate':LUMINANCE_HIGHLIGHT_CANDIDATE?'bruneton-luminance-highlight':LIGHT_ADAPTED_LOG_CANDIDATE?'light-adapted-log':'replay'}-v1`,accepted:true,assertions:['All production images and diagnostic seams were captured in the same qualifying GPU execution.','Native-15 CPU replay matches production GPU signed-linear RGB within the declared floating-point tolerance.','The production Figure-1 CPU replay matches the GPU mapper and every final RGB channel is within one 8-bit code value of the production framebuffer.',...(COMPARE_CANDIDATE?['The current candidate was reacquired at matching clock, viewport, field of view, and disk-center aim in this same immutable run.','The first divergent seam was classified from native-15 and signed-linear GPU readbacks without tuning Color.']:[]),...(SCALAR_CANDIDATE?['The dr6-a0-p075 scalar luminance/common-RGB-gain renderer consumed only the same-run production native-15 field.','Its absolute endpoints were placed from the same-run production noon center because the legacy Stage 1 spectrum is not a valid production reproduction input.']:[]),...(LUMINANCE_HIGHLIGHT_CANDIDATE?['The candidate starts from the exact Bruneton CIE 1931 projection and replaces only the final independent-channel Figure-1 operation.','The existing Figure-1 exponential is evaluated once on luminance and applied as one common RGB gain before common peak containment.','No local-light adjustment, source mask, Stage 1 spectrum, or prior experimental Color transform participates.']:[]),...(LIGHT_ADAPTED_LOG_CANDIDATE?['The candidate retains Bruneton CIE 1931 RGB and derives its mastering white from the production source owner rather than image statistics.','The one condition-wide adaptation state is direct spectral irradiance at the camera integrated over geometry-owned visible disk support.','The adaptation exponent is derived from the authored and independently verified CIECAM16 fixed-stimulus brightness relationship, not fitted from these images.','The logarithmic response preserves radiance ordering and the final gamut operation preserves mapped luminance exactly while reducing only the unavailable chroma.','No per-pixel peak normalization, source mask, Stage 1 spectrum, sky probe, or tuned display parameter participates.']:[])],summary:{view:VIEW,conditionCount:results.length,maximumLinearRelativeError:Math.max(...results.map((row)=>row.maxLinearRelativeError)),maximumMapperAbsoluteError:Math.max(...results.map((row)=>row.maxMapperAbsoluteError)),maximumFramebufferCodeError:Math.max(...results.map((row)=>row.maxFramebufferCodeError)),firstDivergentCandidateSeam:candidateComparison?.firstDivergentSeam??null,scalarCandidateCenters:scalarCandidate?.summaries.map((row)=>({conditionId:row.conditionId,encodedSrgb:row.center.encodedSrgb,warmth:row.center.warmth}))??null,luminanceHighlightCenters:luminanceHighlightCandidate?.summaries.map((row)=>({conditionId:row.conditionId,displayRgb:row.center.displayRgb,warmth:row.center.warmth,gamutScale:row.center.gamutScale}))??null,lightAdaptedLogCenters:lightAdaptedLogCandidate?.summaries.map((row)=>({conditionId:row.conditionId,displayRgb:row.center.displayRgb,mappedY:row.center.mappedY,warmth:row.center.warmth,chromaScale:row.center.chromaScale,localAdaptingLuminance:row.conditionState.localAdaptingLuminance,adaptationFactor:row.conditionState.adaptationFactor}))??null,renderer:results[0].renderer.webgl.unmaskedRenderer,closureFileCount:closure.files.length}};
		await run.writeJsonArtifact('evidence/production-replay-proof.json',proof);const manifest=await run.finalize({conclusion:'accepted',result:proof,report:`# ${run.runId}: production ${VIEW.id} ${COMPARE_CANDIDATE?'candidate seam comparison':SCALAR_CANDIDATE?'scalar candidate render':LUMINANCE_HIGHLIGHT_CANDIDATE?'Bruneton luminance-highlight render':LIGHT_ADAPTED_LOG_CANDIDATE?'light-adapted logarithmic render':'spectral replay'}\n\nConclusion: **accepted** as technical execution evidence. The production replay passes${COMPARE_CANDIDATE?` and the first candidate divergence is ${candidateComparison.firstDivergentSeam}`:''}${SCALAR_CANDIDATE?'; the generated scalar-candidate images await appearance review':''}${LUMINANCE_HIGHLIGHT_CANDIDATE?'; the internal Bruneton mapper candidate awaits appearance review':''}${LIGHT_ADAPTED_LOG_CANDIDATE?'; the evidence-derived light-adapted candidate awaits appearance review':''}.\n`});process.stdout.write(`${JSON.stringify({runId:run.runId,conclusion:'accepted',artifactSetSha256:manifest.artifactSetSha256,summary:proof.summary},null,2)}\n`);
	}catch(error){const detail={name:error.name,message:error.message,stack:error.stack};try{await run.writeJsonArtifact('evidence/failure.json',detail);const manifest=await run.finalize({conclusion:'failed',result:{error:detail},report:`# ${run.runId}: production ${VIEW.id} spectral replay\n\nConclusion: **failed**.\n\n${detail.message}\n`});process.stderr.write(`${JSON.stringify({runId:run.runId,conclusion:'failed',artifactSetSha256:manifest.artifactSetSha256,error:detail},null,2)}\n`);}catch{}process.exitCode=1;}finally{await server?.close().catch(()=>{});}
}

await main();
