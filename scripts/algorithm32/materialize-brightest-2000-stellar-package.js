import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRuns = {
	roster: {
		path: 'tmp/extraterrestrial/color-reset/runs/000047-cr6b-brightest-2000-catalog-proof/data/cr6b-brightest-2000-roster.json',
		sha256: '6316eff663c7e41b27eb969f557ae32f9617f67e3dd40cd8cf396e1d306a1f3c',
	},
	packets: {
		path: 'tmp/extraterrestrial/color-reset/runs/000055-cr6f-brightest-2000-spectral-materialization/data/cr6f-brightest-2000-native15-packets.json',
		sha256: '3bda4616b596fa72874a0dc47bade36bd2f079896d084e7af01297a4c5c43f48',
	},
	members: {
		path: 'tmp/extraterrestrial/color-reset/runs/000057-cr6g-brightest-2000-runtime-capacity/data/cr6g-members-rgba32f.bin',
		sha256: '14d72c452bbe8f794cce3cfd77634ae378842dedb3076c8f1a3f99de6811c4b2',
	},
	spectra: {
		path: 'tmp/extraterrestrial/color-reset/runs/000057-cr6g-brightest-2000-runtime-capacity/data/cr6g-spectra-r32f.bin',
		sha256: 'f52b44e1db1d01382fe48cb9967351b1a2f26d775237f7137416dbdb04a18128',
	},
};
const outputRoot = path.join(repositoryRoot, 'server/flat32/data/brightest-2000-stellar-package-v1');

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

const materialized = {};
for (const [key, source] of Object.entries(sourceRuns)) {
	const absoluteSource = path.join(repositoryRoot, source.path);
	const bytes = await readFile(absoluteSource);
	if (sha256(bytes) !== source.sha256) throw new Error(`P5 ${key} source hash mismatch.`);
	materialized[key] = {bytes, source};
}

const roster = JSON.parse(materialized.roster.bytes.toString('utf8'));
const packets = JSON.parse(materialized.packets.bytes.toString('utf8'));
if (roster.members.length !== 2000 || packets.packets.length !== 2000) {
	throw new Error('P5 authorities must contain exactly 2,000 ordered members.');
}
if (roster.members.some((member, index) => member.memberId !== packets.packets[index]?.memberId)) {
	throw new Error('P5 roster and packet member order differs.');
}

await mkdir(outputRoot, {recursive: true});
const outputs = {
	roster: 'catalog-roster.json',
	packets: 'native15-packets.json',
	members: 'members-rgba32f.bin',
	spectra: 'spectra-r32f.bin',
};
for (const [key, filename] of Object.entries(outputs)) {
	await writeFile(path.join(outputRoot, filename), materialized[key].bytes, {flag: 'wx'});
}

const proxyMembers = packets.packets
	.map((packet, canonicalIndex) => ({canonicalIndex, memberId: packet.memberId, derivation: packet.derivation}))
	.filter(({derivation}) => derivation.kind !== 'retained-bracketed-pickles');
const manifest = {
	schemaId: 'algorithm32-production-brightest-2000-stellar-package-v1',
	packageId: 'brightest-2000-stellar-package-v1',
	memberCount: 2000,
	spectralChannelCount: 15,
	selection: roster.contract.selection,
	selectionSha256: materialized.roster.source.sha256,
	photometryPolicy: packets.contract.policy,
	photometrySha256: materialized.packets.source.sha256,
	coveredPolicyMemberCount: 1993,
	proxyMemberCount: 7,
	proxyMembers,
	parents: {
		rosterRunId: '000047-cr6b-brightest-2000-catalog-proof',
		rosterArtifactSetSha256: 'ce50de53045f1e6f0ef33dcdc2b935a7023d5e28095b3d5f13add4980c370c57',
		packetsRunId: '000055-cr6f-brightest-2000-spectral-materialization',
		packetsArtifactSetSha256: 'a380716366661c7b9bddcd6b025bd1c111d9e60b8a03cde6445e6cd0a61649c4',
		runtimeRunId: '000057-cr6g-brightest-2000-runtime-capacity',
		runtimeArtifactSetSha256: 'ae7224f0b85859a08d896f32b7be24c33472b9b3e034f07b365f96024af90627',
	},
	artifacts: Object.fromEntries(Object.entries(outputs).map(([key, filename]) => [key, {
		path: filename,
		byteLength: materialized[key].bytes.byteLength,
		sha256: materialized[key].source.sha256,
	}])),
	runtime: {
		memberTexture: {format: 'RGBA32F', width: 2000, height: 1},
		spectraTexture: {format: 'R32F', width: 2000, height: 15},
		totalPayloadBytes: 152000,
	},
	redistribution: 'local-only-pending-source-and-license-clearance',
};
await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, {flag: 'wx'});
console.log(JSON.stringify({outputRoot, packageId: manifest.packageId, artifacts: manifest.artifacts}, null, 2));
