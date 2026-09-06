import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {createBrightest2000StellarCatalogDefinition} from '../../src/algorithm32/implementation/star-field/Brightest2000StellarCatalogPackage.js';
import {StellarPointSetSource} from '../../src/algorithm32/implementation/star-field/StellarPointSetSource.js';
import {
	STANDARD_STELLAR_MEMBER_DATA,
	createStellarPointSetCacheLayout,
} from '../../src/algorithm32/implementation/star-field/consts.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageRoot = path.join(repositoryRoot, 'server/flat32/data/brightest-2000-stellar-package-v1');
const bytes = Object.fromEntries(
	await Promise.all(
		[
			'manifest.json',
			'catalog-roster.json',
			'native15-packets.json',
			'members-rgba32f.bin',
			'spectra-r32f.bin',
		].map(async (name) => [name, await readFile(path.join(packageRoot, name))]),
	),
);
const manifest = JSON.parse(bytes['manifest.json'].toString('utf8'));
for (const artifact of Object.values(manifest.artifacts)) {
	const artifactBytes = bytes[artifact.path];
	const hash = createHash('sha256').update(artifactBytes).digest('hex');
	if (artifactBytes.byteLength !== artifact.byteLength || hash !== artifact.sha256) {
		throw new Error(`P5 production artifact ${artifact.path} differs from its manifest.`);
	}
}
const definition = createBrightest2000StellarCatalogDefinition({
	manifest,
	roster: JSON.parse(bytes['catalog-roster.json'].toString('utf8')),
	packets: JSON.parse(bytes['native15-packets.json'].toString('utf8')),
	memberTexels: new Float32Array(bytes['members-rgba32f.bin'].buffer, bytes['members-rgba32f.bin'].byteOffset, 8000),
	spectraTexels: new Float32Array(bytes['spectra-r32f.bin'].buffer, bytes['spectra-r32f.bin'].byteOffset, 30000),
});
for (let index = 0; index < 500; index += 1) {
	const expected = STANDARD_STELLAR_MEMBER_DATA[index];
	const actual = definition.members[index];
	if (
		actual.id !== expected.id ||
		actual.direction.some((value, component) => !Object.is(value, expected.direction[component])) ||
		actual.values.some((value, channel) => !Object.is(value, expected.values[channel]))
	) {
		throw new Error(`P5 exact production prefix differs at member ${index}.`);
	}
}
const source = new StellarPointSetSource({catalogDefinition: definition});
const table = source.createStellarGenerationSourceTable();
const layout = createStellarPointSetCacheLayout(2000);
if (
	table.layout.memberCount !== 2000 ||
	table.layout.memberComponentCount !== 4 ||
	table.layout.spectralChannelCount !== 15
)
	throw new Error('P5 split source layout differs.');
if (table.copyMemberValues().byteLength !== 32000 || table.copySpectralValues().byteLength !== 120000)
	throw new Error('P5 split source payload size differs.');
if (
	layout.capacity !== 2048 ||
	layout.storage.width !== 704 ||
	layout.storage.height !== 419 ||
	layout.storage.layers !== 15
)
	throw new Error('P5 tiled transport capacity differs.');
console.log(
	JSON.stringify(
		{
			accepted: true,
			memberCount: definition.members.length,
			firstMemberId: definition.members[0].id,
			prefixLastMemberId: definition.members[499].id,
			firstAddedMemberId: definition.members[500].id,
			lastMemberId: definition.members.at(-1).id,
			finiteNonnegativeSpectralValueCount: definition.members.reduce(
				(count, member) => count + member.values.filter((value) => Number.isFinite(value) && value >= 0).length,
				0,
			),
			retainedPolicyMemberCount: definition.members.length - definition.proxyMembers.length,
			proxyMemberCount: definition.proxyMembers.length,
			sourcePayloadBytes: table.copyMemberValues().byteLength + table.copySpectralValues().byteLength,
			transportStorage: layout.storage,
		},
		null,
		2,
	),
);
