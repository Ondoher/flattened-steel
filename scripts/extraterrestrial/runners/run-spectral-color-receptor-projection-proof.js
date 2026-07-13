import {createHash} from 'node:crypto';
import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';

import FIXTURE from '../fixtures/spectral-color-receptor-projection-v1.json' with {type: 'json'};
import PARAMETERS from '../fixtures/spectral-color-receptor-parameter-v1.json' with {type: 'json'};
import {createProjectionMatrix, invert3, multiply, normalizeLmsMatrix, parseCieLms, parseCieXyz} from '../color/ReceptorSpectralProjection.js';
import {assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-spectral-color-receptor-projection-proof.js';
const LMS_PATH = path.join(EXPERIMENT_ROOT, 'references', 'cie-2006-lms-2deg', 'CIE_lms_cf_2deg.csv');
const XYZ_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const maxAbs = (a, b) => Math.max(...a.map((value, index) => Math.abs(value - b[index])));
const maxRel = (a, b) => Math.max(...a.map((value, index) => Math.abs(value - b[index]) / Math.max(1e-30, Math.abs(b[index]))));
const FL = (LA) => { const k = 1 / (5 * LA + 1); const k4 = k ** 4; return 0.2 * k4 * 5 * LA + 0.1 * (1 - k4) ** 2 * (5 * LA) ** (1 / 3); };
const sigma = (LA) => PARAMETERS.primaryResponse.halfSaturation.cam16HalfSaturationNumerator / FL(LA);
const response = (value, LA) => { const n = PARAMETERS.primaryResponse.exponent; const p = Math.max(0, value) ** n; return p / (p + sigma(LA) ** n); };

async function loadLedger() {
	const root = path.join(RUNS_ROOT, FIXTURE.input.runId); await lstat(root); await assertNoReparseEntries(root, 'Projection input run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === FIXTURE.input.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === FIXTURE.input.artifactSetSha256, 'Projection input run identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === FIXTURE.input.ledgerPath); const bytes = await readFile(path.join(root, FIXTURE.input.ledgerPath));
	requireCondition(entry?.sha256 === FIXTURE.input.ledgerSha256 && entry.byteLength === bytes.byteLength && sha256(bytes) === entry.sha256, 'Projection input ledger identity changed.');
	return {ledger: JSON.parse(bytes.toString('utf8')), manifest};
}

function solve3(matrix, target) { return multiply(invert3(matrix), target); }
function columns(matrix, indices) { return matrix.map((row) => indices.map((index) => row[index])); }
function combinations4(count) { const result = []; for (let a = 0; a < count - 3; a += 1) for (let b = a + 1; b < count - 2; b += 1) for (let c = b + 1; c < count - 1; c += 1) for (let d = c + 1; d < count; d += 1) result.push([a,b,c,d]); return result; }

function metamerWitness(matrix, LA) {
	const baseValue = sigma(LA) / (multiply(matrix, Array(15).fill(1)).reduce((sum, value) => sum + value, 0) / 3); let best = null;
	for (const indices of combinations4(15)) {
		let dependent; try { dependent = solve3(columns(matrix, indices.slice(0, 3)), matrix.map((row) => -row[indices[3]])); } catch { continue; }
		const delta = Array(15).fill(0); for (let index = 0; index < 3; index += 1) delta[indices[index]] = dependent[index]; delta[indices[3]] = 1;
		const scale = FIXTURE.metamer.relativePerturbation * baseValue / Math.max(...delta.map(Math.abs)); const scaled = delta.map((value) => value * scale);
		const left = scaled.map((value) => baseValue - value); const right = scaled.map((value) => baseValue + value); if ([...left, ...right].some((value) => value < 0)) continue;
		const leftLms = multiply(matrix, left); const rightLms = multiply(matrix, right); const linearRelative = maxRel(leftLms, rightLms);
		const leftResponse = leftLms.map((value) => response(value, LA)); const rightResponse = rightLms.map((value) => response(value, LA));
		const wrongLeft = multiply(matrix, left.map((value) => response(value, LA))); const wrongRight = multiply(matrix, right.map((value) => response(value, LA))); const wrongDifference = maxRel(wrongLeft, wrongRight);
		const candidate = {indices, left, right, leftLms, rightLms, linearRelative, leftResponse, rightResponse, responseAbsolute: maxAbs(leftResponse, rightResponse), wrongOrderLeft: wrongLeft, wrongOrderRight: wrongRight, wrongOrderRelativeDifference: wrongDifference, maximumSpectralDifference: maxAbs(left, right)};
		if (!best || candidate.wrongOrderRelativeDifference > best.wrongOrderRelativeDifference) best = candidate;
	}
	requireCondition(best, 'No nonnegative native-15 metamer witness could be constructed.'); return best;
}

function uv1976(xyz) { const denominator = xyz[0] + 15 * xyz[1] + 3 * xyz[2]; return denominator > 0 ? [4 * xyz[0] / denominator, 9 * xyz[1] / denominator] : [0, 0]; }
function diskRows(ledger) { const rows = []; for (const family of [ledger.spherical, ledger.flat]) for (const condition of family.conditions) { const sample = condition.samples.find((item) => item.role === FIXTURE.input.sampleRole); if (sample?.colorInputEligibility === FIXTURE.input.eligibility) rows.push({key: `${family.family}/${condition.id}`, spectrum: sample.celestialRadiance, acceptedXyz1931: sample.derived.celestialRadiance.xyz}); } return rows; }

async function main() {
	const run = await initializeRunRecord({slug:'spectral-color-receptor-projection-proof',command:COMMAND,inputs:{fixture:'scripts/extraterrestrial/fixtures/spectral-color-receptor-projection-v1.json',parameterFixture:FIXTURE.parameterFixture,measuredInputRunId:FIXTURE.input.runId,scope:'native-15 LMS projection, one-nanometer convergence, and constructed metamer ordering; no atmosphere, cache, framebuffer, image, or display transform'},provenance:{observer:'CIE 2006 LMS 2-degree energy fundamentals',projection:'exact piecewise-linear fundamental integration over contiguous native bins',metamer:'four-bin null-space construction with prohibited wrong-order negative control'},environment:{node:process.version,platform:process.platform},references:{research:'agents/topics/extraterrestrial/receptor-response-parameter-research.md',plan:'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md#receptor-response-normal-plan'}});
	try {
		await assertRepositoryIdentity(); const policy = await loadContainmentPolicy(); const before = await createProtectedTrackedInventory(policy); await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const [{ledger, manifest}, lmsBytes, xyzBytes] = await Promise.all([loadLedger(), readFile(LMS_PATH), readFile(XYZ_PATH)]); const lmsRows = parseCieLms(lmsBytes.toString('utf8')); const xyzRows = parseCieXyz(xyzBytes.toString('utf8'));
		requireCondition(sha256(lmsBytes) === PARAMETERS.spectralObserver.datasetSha256, 'Pinned LMS dataset identity changed.');
		const exactRaw = createProjectionMatrix(lmsRows, ledger.spectralBasis); const oneNmRaw = createProjectionMatrix(lmsRows, ledger.spectralBasis, {referenceStepNanometers: 1});
		const exactNormalized = normalizeLmsMatrix(exactRaw, PARAMETERS.absoluteNormalization.lmsToCie2015XyzF, PARAMETERS.absoluteNormalization.d65XyzRelative); const oneNmNormalized = normalizeLmsMatrix(oneNmRaw, PARAMETERS.absoluteNormalization.lmsToCie2015XyzF, PARAMETERS.absoluteNormalization.d65XyzRelative);
		const matrixAbsolute = maxAbs(exactRaw.flat(), oneNmRaw.flat()); const matrixRelative = maxRel(exactRaw.flat(), oneNmRaw.flat()); const witness = metamerWitness(exactNormalized.matrix, FIXTURE.metamer.adaptationLuminanceCdPerSquareMeter);
		const xyz1931Matrix = createProjectionMatrix(xyzRows, ledger.spectralBasis); const measured = diskRows(ledger).map((row) => { const rawLms = multiply(exactRaw, row.spectrum); const xyzF = multiply(PARAMETERS.absoluteNormalization.lmsToCie2015XyzF, rawLms); const recoveredLms = multiply(invert3(PARAMETERS.absoluteNormalization.lmsToCie2015XyzF), xyzF); const xyz1931Exact = multiply(xyz1931Matrix, row.spectrum); return {...row, rawLms, xyzF, recoveredLms, xyzRoundTripRelative:maxRel(recoveredLms, rawLms), xyz1931Exact, cieObserverDiagnostic:{relativeY:(xyzF[1]-xyz1931Exact[1])/xyz1931Exact[1],deltaUv:Math.hypot(...uv1976(xyzF).map((value,index)=>value-uv1976(xyz1931Exact)[index])),acceptedCenterProjectionRelativeY:(xyzF[1]-row.acceptedXyz1931[1])/row.acceptedXyz1931[1],acceptedCenterProjectionDeltaUv:Math.hypot(...uv1976(xyzF).map((value,index)=>value-uv1976(row.acceptedXyz1931)[index]))}}; });
		const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(exactRaw.length === 3 && exactRaw.every((row) => row.length === 15 && row.every((value) => Number.isFinite(value) && value >= 0)), 'The exact native-15-to-LMS matrix is finite, nonnegative, and has three by fifteen weights.');
		check(matrixRelative <= FIXTURE.proofGates.matrixMaximumRelativeOneNanometer && matrixAbsolute <= FIXTURE.proofGates.matrixMaximumAbsoluteOneNanometer, 'Exact bin-integrated LMS weights converge to the independent one-nanometer construction.');
		check(measured.length === FIXTURE.input.expectedSampleCount && measured.every((row) => row.spectrum.length === 15), 'The projection reconciles all 25 eligible disk-center spectra without display transformation.');
		check(Math.max(...measured.map((row) => row.xyzRoundTripRelative)) <= FIXTURE.proofGates.xyzRoundTripMaximumRelative, 'Every measured LMS vector round-trips through the declared CIE 2015 XYZ_F matrix.');
		check(witness.maximumSpectralDifference >= FIXTURE.proofGates.minimumMetamerSpectralDifference, 'The constructed metamer spectra are materially different.');
		check(witness.linearRelative <= FIXTURE.proofGates.metamerLinearLmsMaximumRelative, 'The different spectra integrate to equal overlapping LMS catches.');
		check(witness.responseAbsolute <= FIXTURE.proofGates.metamerResponseMaximumAbsolute, 'Equal LMS catches remain identical after the nonlinear receptor response.');
		check(witness.wrongOrderRelativeDifference >= FIXTURE.proofGates.minimumWrongOrderResponseDifference, 'The prohibited wavelength-first nonlinear ordering separates the constructed metamers.');
		check(measured.every((row) => [...row.rawLms, ...row.xyzF, ...row.xyz1931Exact, ...Object.values(row.cieObserverDiagnostic)].every(Number.isFinite)), 'The CIE 2015 versus accepted CIE 1931 observer-basis diagnostic is finite for every measured spectrum.');
		const summary = {assertionCount:assertions.length,measuredSpectrumCount:measured.length,matrixMaximumAbsoluteOneNanometer:matrixAbsolute,matrixMaximumRelativeOneNanometer:matrixRelative,maximumXyzRoundTripRelative:Math.max(...measured.map((row)=>row.xyzRoundTripRelative)),metamerLinearLmsMaximumRelative:witness.linearRelative,metamerResponseMaximumAbsolute:witness.responseAbsolute,wrongOrderResponseRelativeDifference:witness.wrongOrderRelativeDifference,cie2015VsCie1931ExactMaximumAbsoluteRelativeY:Math.max(...measured.map((row)=>Math.abs(row.cieObserverDiagnostic.relativeY))),cie2015VsCie1931ExactMaximumDeltaUv:Math.max(...measured.map((row)=>row.cieObserverDiagnostic.deltaUv))};
		await run.writeJsonArtifact('evidence/receptor-projection.json',{schemaId:'spectral-color-receptor-projection-result-v1',input:{runId:manifest.runId,artifactSetSha256:manifest.artifactSetSha256,ledgerSha256:FIXTURE.input.ledgerSha256},configuration:FIXTURE.projection,matrices:{exactRawLms:exactRaw,oneNanometerRawLms:oneNmRaw,d65NormalizedLms:exactNormalized.matrix,d65Lms:exactNormalized.d65Lms,channelScale:exactNormalized.channelScale},metamer:witness,measured,claimLimit:FIXTURE.claim});
		const closure = await buildStaticModuleClosure({candidateRoot:EXPERIMENT_ROOT,entryFiles:['runners/run-spectral-color-receptor-projection-proof.js','color/ReceptorSpectralProjection.js'],packageJsonPath:EXPERIMENT_PACKAGE_PATH,nodeModulesRoot:EXPERIMENT_NODE_MODULES_ROOT,allowedNodeBuiltins:['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util']}); const after = await createProtectedTrackedInventory(policy); assertFileInventoriesEqual(before, after, 'Receptor projection protected inventory');
		const proof={proofId:'spectral-color-receptor-projection-v1',accepted:true,assertions,summary,claimLimit:FIXTURE.claim,remaining:['receptor curve sweeps','measured-spectrum numerical receptor proof','four-frame calibration review'],containment:{protectedFiles:after.fileCount,closureFileCount:closure.files.length,closureEdgeCount:closure.edges.length}}; await run.writeJsonArtifact('evidence/receptor-projection-acceptance.json',proof); const finalManifest=await run.finalize({conclusion:'accepted',result:proof,report:`# ${run.runId}: Receptor spectral projection proof\n\nConclusion: **accepted for native-15 LMS projection and nonlinear ordering**.\n\nExact bin-integrated CIE 2006 LMS weights agree with the independent one-nanometer construction to ${summary.matrixMaximumRelativeOneNanometer} maximum relative error. All ${summary.measuredSpectrumCount} eligible disk spectra round-trip through CIE 2015 XYZ_F. A materially different constructed spectral pair integrates to equal LMS and remains equal after receptor response; the prohibited wavelength-first nonlinearity separates it by ${summary.wrongOrderResponseRelativeDifference} relative. No display transform or image was generated.\n`}); process.stdout.write(`${JSON.stringify({runId:run.runId,conclusion:'accepted',artifactSetSha256:finalManifest.artifactSetSha256,summary},null,2)}\n`);
	} catch(error) { const detail={name:error.name,message:error.message,stack:error.stack}; try { await run.writeJsonArtifact('evidence/failure.json',detail); const manifest=await run.finalize({conclusion:'failed',result:{error:detail},report:`# ${run.runId}: Receptor spectral projection proof\n\nConclusion: **failed**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId:run.runId,conclusion:'failed',artifactSetSha256:manifest.artifactSetSha256,error:detail},null,2)}\n`); } catch {} process.exitCode=1; }
}

await main();
