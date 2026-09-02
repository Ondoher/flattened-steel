#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256File,
} from '../../harness/lib/hashes.js';
import {
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';
import {loadPicklesV1998, loadSvoJohnsonFilter} from '../../catalogs/stellar-photometry-inputs.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {
	CR6F_SPECTRAL_MATERIALIZATION_CONTRACT,
	materializeCr6fBrightest2000Spectra,
} from '../stellar/Cr6fBrightest2000SpectralMaterialization.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND =
	'node scripts/extraterrestrial/color-reset/runners/run-cr6f-brightest-2000-spectral-materialization.js';
const FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr6f-brightest-2000-spectral-materialization-v1.json';
const BUILDER_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/stellar/Cr6fBrightest2000SpectralMaterialization.js';
const LOADER_RELATIVE_PATH = 'scripts/extraterrestrial/catalogs/stellar-photometry-inputs.js';
const PICKLES_RELATIVE_PATH = 'scripts/extraterrestrial/catalogs/pickles-v1998/dat.tar.gz';
const JOHNSON_B_RELATIVE_PATH =
	'scripts/extraterrestrial/catalogs/svo-johnson/generic-johnson-b.xml';
const JOHNSON_V_RELATIVE_PATH =
	'scripts/extraterrestrial/catalogs/svo-johnson/generic-johnson-v.xml';
const PARENT_RUN_ID = '000047-cr6b-brightest-2000-catalog-proof';
const PARENT_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'color-reset',
	'runs',
	PARENT_RUN_ID,
);
const ROSTER_RELATIVE_PATH = 'data/cr6b-brightest-2000-roster.json';
const OUTPUTS = Object.freeze({
	packets: 'data/cr6f-brightest-2000-native15-packets.json',
	proof: 'evidence/cr6f-spectral-materialization-proof.json',
	proxyFigure: 'figures/cr6f-seven-proxy-spectra.svg',
	reconstructionFigure: 'figures/cr6f-bv-reconstruction.svg',
	summaryFigure: 'figures/cr6f-materialization-summary.svg',
});

function repositoryPath(relativePath) {
	return path.join(REPOSITORY_ROOT, ...relativePath.split('/'));
}

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function escapeXml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function svgDocument({title, subtitle, body, width = 1200, height = 720}) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#07111f"/>
<text x="34" y="48" fill="#f5f7ff" font-family="sans-serif" font-size="28" font-weight="700">${escapeXml(title)}</text>
<text x="34" y="76" fill="#9fb7d8" font-family="sans-serif" font-size="15">${escapeXml(subtitle)}</text>
${body}
</svg>`;
}

function proxySpectraSvg(proxyPackets) {
	const colors = ['#62d4ff', '#ffbf69', '#b8f28b', '#ff708d', '#d6a2ff', '#75e6c4', '#ffd166'];
	const maximum = Math.max(...proxyPackets.flatMap(({spectralIrradiance}) => spectralIrradiance));
	const lines = proxyPackets.map((packet, packetIndex) => {
		const points = packet.spectralIrradiance.map((value, index) => {
			const x = 90 + index / 14 * 1020;
			const y = 610 - value / maximum * 470;
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		}).join(' ');
		return `<polyline fill="none" stroke="${colors[packetIndex]}" stroke-width="3" points="${points}"/>
<text x="90" y="${108 + packetIndex * 22}" fill="${colors[packetIndex]}" font-family="monospace" font-size="14">HR ${packet.hr}  B-V ${packet.bMinusV.toFixed(2)}  ${escapeXml(packet.derivation.kind)}</text>`;
	}).join('\n');
	return svgDocument({
		title: 'CR6F seven color-constrained red proxy spectra',
		subtitle: 'Absolute Native15 irradiance; catalog V and B-V are reconstructed exactly. Carbon molecular bands are unclaimed.',
		body: `<line x1="90" y1="610" x2="1110" y2="610" stroke="#7185a3"/>${lines}`,
	});
}

function reconstructionSvg(packets) {
	const maximumResidual = Math.max(...packets.map((packet) =>
		Math.abs(packet.reconstructedBMinusV - packet.bMinusV)));
	const proxy = packets.filter(({derivation}) => derivation.kind !== 'retained-bracketed-pickles');
	const points = proxy.map((packet, index) => {
		const x = 140 + (packet.bMinusV - 1.9) / 0.85 * 900;
		const y = 520 - (packet.reconstructedBMinusV - 1.9) / 0.85 * 400;
		return `<circle cx="${x}" cy="${y}" r="7" fill="#ffb454"/><text x="${x + 10}" y="${y - 8}" fill="#dce8ff" font-family="monospace" font-size="13">HR ${packet.hr}</text>`;
	}).join('\n');
	return svgDocument({
		title: 'CR6F Johnson B-V reconstruction',
		subtitle: `Seven proxies lie on catalog=reconstructed identity; maximum all-member residual ${maximumResidual.toExponential(3)} mag.`,
		body: `<line x1="140" y1="520" x2="1040" y2="120" stroke="#55d6be" stroke-width="2"/>${points}<text x="420" y="650" fill="#9fb7d8" font-family="sans-serif" font-size="16">catalog B-V →</text>`,
	});
}

function summarySvg({retainedCount, proxyCount, maximumVResidual, maximumBvResidual}) {
	const rows = [
		['Roster packets', '2,000 / 2,000'],
		['Exact retained Pickles equation', `${retainedCount} members`],
		['Predeclared red proxies', `${proxyCount} members`],
		['Maximum V residual', maximumVResidual.toExponential(3)],
		['Maximum B-V residual', maximumBvResidual.toExponential(3)],
		['Finite / nonnegative', 'all 30,000 scalars'],
	];
	const body = rows.map(([label, value], index) => `<rect x="90" y="${120 + index * 78}" width="1020" height="58" rx="8" fill="#102238"/><text x="120" y="${157 + index * 78}" fill="#c5d6ef" font-family="sans-serif" font-size="21">${escapeXml(label)}</text><text x="760" y="${157 + index * 78}" fill="#62e6b5" font-family="monospace" font-size="21">${escapeXml(value)}</text>`).join('\n');
	return svgDocument({
		title: 'CR6F complete 2,000-member spectral materialization',
		subtitle: 'Photometry-constrained Native15 packets; no member omitted or clamped.',
		body,
	});
}

async function captureProtected() {
	return {
		algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')),
		flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32')),
		inputs: await createSelectedFileInventory(EXPERIMENT_ROOT, [
			'catalogs/stellar-photometry-inputs.js',
			'catalogs/pickles-v1998/dat.tar.gz',
			'catalogs/svo-johnson/generic-johnson-b.xml',
			'catalogs/svo-johnson/generic-johnson-v.xml',
		]),
	};
}

function assertProtectedEqual(before, after) {
	for (const key of Object.keys(before)) {
		assertFileInventoriesEqual(before[key], after[key], `CR6F protected ${key}`);
	}
}

async function main() {
	const fixture = JSON.parse(await readFile(repositoryPath(FIXTURE_RELATIVE_PATH), 'utf8'));
	const run = await initializeColorResetRunRecord({
		slug: fixture.experiment.slug,
		command: COMMAND,
		inputs: {fixture: FIXTURE_RELATIVE_PATH, parentRunId: PARENT_RUN_ID},
		provenance: {
			purpose: fixture.experiment.question,
			policyId: fixture.policy.id,
			claimLimit: fixture.policy.claimLimit,
		},
		environment: {node: process.version, platform: process.platform},
		references: {
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md',
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
		},
	});
	let finalizationStarted = false;
	try {
		await assertRepositoryIdentity();
		const protectedBefore = await captureProtected();
		await run.writeJsonArtifact('evidence/protected-sources-before.json', protectedBefore);
		const parentVerification = await verifyColorResetRun(PARENT_RUN_ID);
		requireCondition(parentVerification.verified, 'CR6F parent run did not verify.');
		requireCondition(
			parentVerification.artifactSetSha256 === fixture.parent.artifactSetSha256,
			'CR6F parent artifact set changed.',
		);
		const rosterPath = path.join(PARENT_ROOT, ...ROSTER_RELATIVE_PATH.split('/'));
		requireCondition(
			await sha256File(rosterPath) === fixture.parent.rosterSha256,
			'CR6F roster artifact changed.',
		);
		const roster = JSON.parse(await readFile(rosterPath, 'utf8'));
		const [templates, johnsonB, johnsonV] = await Promise.all([
			loadPicklesV1998(repositoryPath(PICKLES_RELATIVE_PATH)),
			loadSvoJohnsonFilter(repositoryPath(JOHNSON_B_RELATIVE_PATH)),
			loadSvoJohnsonFilter(repositoryPath(JOHNSON_V_RELATIVE_PATH)),
		]);
		const materialized = materializeCr6fBrightest2000Spectra({
			members: roster.members,
			templates,
			johnsonB,
			johnsonV,
			proxyPolicy: fixture.redProxies,
		});
		const packets = materialized.packets;
		const proxyPackets = packets.filter(
			({derivation}) => derivation.kind !== 'retained-bracketed-pickles',
		);
		const retainedCount = packets.length - proxyPackets.length;
		const maximumVResidual = Math.max(...packets.map((packet) =>
			Math.abs(packet.reconstructedVisualMagnitude - packet.visualMagnitude)));
		const maximumBvResidual = Math.max(...packets.map((packet) =>
			Math.abs(packet.reconstructedBMinusV - packet.bMinusV)));
		const nonfiniteOrNegativeScalarCount = packets.reduce((sum, packet) => sum
			+ packet.spectralIrradiance.filter((value) => !Number.isFinite(value) || value < 0).length, 0);
		const packetArtifact = {
			schemaId: 'algorithm32-color-reset-cr6f-brightest-2000-native15-packets-v1',
			contract: CR6F_SPECTRAL_MATERIALIZATION_CONTRACT,
			parent: fixture.parent,
			policy: fixture.policy,
			packets,
		};
		await run.writeJsonArtifact(OUTPUTS.packets, packetArtifact);
		await run.writeArtifact(OUTPUTS.proxyFigure, proxySpectraSvg(proxyPackets));
		await run.writeArtifact(OUTPUTS.reconstructionFigure, reconstructionSvg(packets));
		await run.writeArtifact(OUTPUTS.summaryFigure, summarySvg({
			retainedCount,
			proxyCount: proxyPackets.length,
			maximumVResidual,
			maximumBvResidual,
		}));

		const protectedAfter = await captureProtected();
		assertProtectedEqual(protectedBefore, protectedAfter);
		const gates = {
			parentVerified: true,
			exactRosterOrder: packets.every((packet, index) =>
				packet.memberId === roster.members[index].memberId && packet.canonicalIndex === index),
			memberCount: packets.length === fixture.gates.memberCount,
			retainedPolicyCount: retainedCount === fixture.gates.retainedPolicyCount,
			proxyCount: proxyPackets.length === fixture.gates.proxyCount,
			proxySetExact: JSON.stringify(proxyPackets.map(({hr}) => hr).sort((a, b) => a - b))
				=== JSON.stringify(fixture.redProxies.map(({hr}) => hr).sort((a, b) => a - b)),
			finiteNonnegativePackets: nonfiniteOrNegativeScalarCount === 0,
			magnitudeReconstruction: maximumVResidual <= fixture.gates.maximumMagnitudeResidual,
			bMinusVReconstruction: maximumBvResidual <= fixture.gates.maximumBMinusVResidual,
			noOmissionOrClamp: packets.length === roster.members.length
				&& packets.every(({spectralIrradiance}) => spectralIrradiance.length === 15),
			protectedSourcesUnchanged: true,
		};
		for (const [name, passed] of Object.entries(gates)) {
			requireCondition(passed, `CR6F gate failed: ${name}`);
		}
		const proof = {
			schemaId: 'algorithm32-color-reset-cr6f-brightest-2000-spectral-materialization-proof-v1',
			accepted: true,
			gates,
			contract: CR6F_SPECTRAL_MATERIALIZATION_CONTRACT,
			parent: fixture.parent,
			implementation: {
				fixture: {path: FIXTURE_RELATIVE_PATH, sha256: await sha256File(repositoryPath(FIXTURE_RELATIVE_PATH))},
				builder: {path: BUILDER_RELATIVE_PATH, sha256: await sha256File(repositoryPath(BUILDER_RELATIVE_PATH))},
				runner: {path: COMMAND.slice('node '.length), sha256: await sha256File(repositoryPath(COMMAND.slice('node '.length)))},
				loader: {path: LOADER_RELATIVE_PATH, sha256: await sha256File(repositoryPath(LOADER_RELATIVE_PATH))},
			},
			summary: {
				memberCount: packets.length,
				retainedPolicyCount: retainedCount,
				proxyCount: proxyPackets.length,
				maximumVResidual,
				maximumBMinusVResidual: maximumBvResidual,
				nonfiniteOrNegativeScalarCount,
				proxyMembers: proxyPackets.map(({hr, memberId, bMinusV, spectralType, derivation}) => ({
					hr, memberId, bMinusV, spectralType, derivation,
				})),
			},
			claimBoundary: fixture.policy.claimLimit,
			outputs: OUTPUTS,
		};
		await run.writeJsonArtifact(OUTPUTS.proof, proof);
		const report = `# ${run.runId}: CR6F brightest-2,000 spectral materialization\n\nConclusion: **accepted**.\n\nAll 2,000 roster members have finite nonnegative Native15 packets. The existing bracketed Pickles equation is retained for 1,993 members; seven predeclared smooth red proxies reconstruct catalog Johnson B-V and V. Carbon molecular bands and variability are not claimed.\n`;
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion: 'accepted', result: proof, report});
		const verification = await verifyColorResetRun(run.runId);
		requireCondition(verification.verified, 'CR6F terminal verification failed.');
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: verification.verified,
			summary: proof.summary,
			gates,
		}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			await run.writeJsonArtifact('evidence/failure.json', {
				name: error instanceof Error ? error.name : 'Error',
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : null,
			});
			await run.finalize({
				conclusion: 'failed',
				result: {error: error instanceof Error ? error.message : String(error)},
				report: `# ${run.runId}: CR6F failed\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
	process.exitCode = 1;
});
