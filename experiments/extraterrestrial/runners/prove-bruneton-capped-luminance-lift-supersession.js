#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	initializeRunRecord,
	resolveExistingRunDirectory,
	resolveRunRoots,
} from '../harness/lib/run-record.js';
import {verifyRun} from './verify-run.js';

const COMMAND = 'node experiments/extraterrestrial/runners/prove-bruneton-capped-luminance-lift-supersession.js';
const PREDECESSOR = Object.freeze({
	runId: '000464-bruneton-source-luminance-lift-spherical-comparison',
	artifactSetSha256: 'b22d8c6919f13d2b1e06f6163e641fada2cca176c22586557035db229cc4c01a',
	evidence: 'evidence/spherical-comparison.json',
	flaggedCapture: 'captures/source-exposure-sunset-plus-one-hour.png',
});
const CORRECTED = Object.freeze({
	runId: '000466-bruneton-source-luminance-lift-spherical-comparison',
	artifactSetSha256: '62f912ac0fdbfac432b58e3c094a76a3a792f6afbda12de2ee6af7a5fddbd250',
	evidence: 'evidence/spherical-comparison.json',
	correctedCapture: 'captures/source-exposure-sunset-plus-one-hour.png',
});
const FLAT_COMPANION = Object.freeze({
	runId: '000467-bruneton-source-luminance-lift-flat-local-comparison',
	artifactSetSha256: 'b6eda32ac4e3f185f23550c11a230b50ccfecab7df2126e692abed8da3ab803a',
	evidence: 'evidence/flat-local-comparison.json',
});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function meanDisplayLuminance(scene) {
	return scene.image.meanRgb[0] * 0.2126 + scene.image.meanRgb[1] * 0.7152 + scene.image.meanRgb[2] * 0.0722;
}

async function readRunJson(runId, relativePath) {
	const directory = await resolveExistingRunDirectory(runId, resolveRunRoots());
	return JSON.parse(await readFile(path.join(directory, ...relativePath.split('/')), 'utf8'));
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The supersession proof accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'bruneton-capped-luminance-lift-supersession-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'bruneton-capped-luminance-lift-supersession-input-v1',
			predecessor: PREDECESSOR,
			corrected: CORRECTED,
			flatCompanion: FLAT_COMPANION,
		},
		provenance: {
			schemaId: 'bruneton-capped-luminance-lift-supersession-provenance-v1',
			operation: 'verify immutable source runs; compare the flagged and corrected one-hour display statistics; prove Y_out = Y * min(Y^(gamma - 1), 32768) retains dark nonwhite varied stars; bind the gamma-one Flat/local companion',
			implementation: [
				'experiments/extraterrestrial/stellar-screen-palette/BrunetonSourceLuminanceLiftColorDisplayModel.js',
				'experiments/extraterrestrial/runners/prove-bruneton-capped-luminance-lift-supersession.js',
			],
			exclusions: ['image rewriting', 'source-kind branch', 'time or scene branch', 'scattered-light adaptation', 'production writes'],
		},
		environment: {
			schemaId: 'bruneton-capped-luminance-lift-supersession-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
		},
		references: {
			schemaId: 'bruneton-capped-luminance-lift-supersession-references-v1',
			activeTopic: 'agents/topics/active-topic.md',
			design: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md',
		},
	});
	try {
		const [predecessorVerification, correctedVerification, flatVerification] = await Promise.all([
			verifyRun(PREDECESSOR.runId),
			verifyRun(CORRECTED.runId),
			verifyRun(FLAT_COMPANION.runId),
		]);
		for (const [source, verification] of [[PREDECESSOR, predecessorVerification], [CORRECTED, correctedVerification], [FLAT_COMPANION, flatVerification]]) {
			requireCondition(verification.verified && verification.artifactSetSha256 === source.artifactSetSha256, `${source.runId} failed immutable source verification.`);
		}
		const [predecessorEvidence, correctedEvidence, correctedInputs, flatEvidence, flatInputs] = await Promise.all([
			readRunJson(PREDECESSOR.runId, PREDECESSOR.evidence),
			readRunJson(CORRECTED.runId, CORRECTED.evidence),
			readRunJson(CORRECTED.runId, 'inputs.json'),
			readRunJson(FLAT_COMPANION.runId, FLAT_COMPANION.evidence),
			readRunJson(FLAT_COMPANION.runId, 'inputs.json'),
		]);
		const scene = (evidence, id) => evidence.scenes.find((entry) => entry.id === id && entry.colorMode === 'source-exposure');
		const predecessorOneHour = scene(predecessorEvidence, 'sunset-plus-one-hour');
		const correctedThirtyMinutes = scene(correctedEvidence, 'sunset-plus-30-minutes');
		const correctedOneHour = scene(correctedEvidence, 'sunset-plus-one-hour');
		const correctedTwoHours = scene(correctedEvidence, 'sunset-plus-two-hours');
		const predecessorMean = meanDisplayLuminance(predecessorOneHour);
		const correctedThirtyMinuteMean = meanDisplayLuminance(correctedThirtyMinutes);
		const correctedOneHourMean = meanDisplayLuminance(correctedOneHour);
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(correctedInputs.luminanceLiftCurve.minimumGamma === 0.125 && correctedInputs.luminanceLiftCurve.maximumLuminanceGain === 32768, 'The corrected spherical model records gamma 0.125 with a global 32768 luminance-gain cap.');
		assert(correctedOneHourMean < predecessorMean * 0.4, 'The capped curve reduces the flagged one-hour mean display luminance by more than 60 percent.');
		assert(correctedOneHourMean <= correctedThirtyMinuteMean * 0.15, 'The corrected one-hour frame is a dark continuation of the 30-minute twilight frame.');
		assert([correctedOneHour, correctedTwoHours].every((entry) => entry.stellarImage.visibleCount >= 30 && entry.stellarImage.maximumChannel >= 50 && entry.stellarImage.exactWhiteCount === 0 && entry.stellarImage.distinctRgbCount >= 20), 'The corrected one- and two-hour frames retain at least 30 visible, nonwhite, brightness-varied stellar points.');
		assert(['solar-noon', 'sunset-minus-30-minutes', 'sunset'].every((id) => correctedEvidence.captureSha256[`bruneton:${id}`] === correctedEvidence.captureSha256[`source-exposure:${id}`]), 'The corrected spherical model remains byte-identical to Bruneton from solar noon through sunset.');
		assert(flatInputs.luminanceLiftCurve.maximumLuminanceGain === 32768, 'The Flat/local companion records the identical global gain cap.');
		assert(['flat-0', 'flat-90', 'flat-180'].every((id) => flatEvidence.hashes[`bruneton:${id}`] === flatEvidence.hashes[`source-luminance-lift:${id}`]), 'Flat/local Flat 0, 90, and 180 remain byte-identical to Bruneton.');
		const proof = {
			proofId: 'bruneton-capped-luminance-lift-supersession-proof-v1',
			accepted: true,
			sources: {
				predecessor: {...PREDECESSOR, verification: predecessorVerification, flaggedCaptureSha256: predecessorEvidence.captureSha256['source-exposure:sunset-plus-one-hour']},
				corrected: {...CORRECTED, verification: correctedVerification, correctedCaptureSha256: correctedEvidence.captureSha256['source-exposure:sunset-plus-one-hour']},
				flatCompanion: {...FLAT_COMPANION, verification: flatVerification},
			},
			equation: 'Y_out = Y * min(Y^(gamma - 1), maximumLuminanceGain)',
			parameters: correctedInputs.luminanceLiftCurve,
			comparison: {
				predecessorOneHourMeanDisplayLuminance: predecessorMean,
				correctedThirtyMinuteMeanDisplayLuminance: correctedThirtyMinuteMean,
				correctedOneHourMeanDisplayLuminance: correctedOneHourMean,
				correctedToPredecessorOneHourRatio: correctedOneHourMean / predecessorMean,
				correctedOneHourToThirtyMinuteRatio: correctedOneHourMean / correctedThirtyMinuteMean,
				correctedOneHourStellarImage: correctedOneHour.stellarImage,
				correctedTwoHourStellarImage: correctedTwoHours.stellarImage,
			},
			assertions,
		};
		await run.writeJsonArtifact('evidence/supersession-proof.json', proof);
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {proofId: proof.proofId, predecessor: PREDECESSOR.runId, corrected: CORRECTED.runId, flatCompanion: FLAT_COMPANION.runId},
			report: `# ${run.runId}: capped Bruneton luminance-lift supersession\n\nConclusion: **accepted**.\n\nRun ${CORRECTED.runId} supersedes the visually rejected one-hour frame in ${PREDECESSOR.runId}; ${FLAT_COMPANION.runId} proves the same model remains exact Bruneton for the required Flat/local controls.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, comparison: proof.comparison}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		await run.writeJsonArtifact('evidence/failure.json', detail);
		const manifest = await run.finalize({conclusion: 'failed', result: {proofId: 'bruneton-capped-luminance-lift-supersession-proof-v1', error: detail}, report: `# ${run.runId}: capped Bruneton luminance-lift supersession\n\nConclusion: **failed**.\n\n${detail.message}\n`});
		process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		process.exitCode = 1;
	}
}

await main();
