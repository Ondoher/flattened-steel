const MEMBER_COUNT = 2000;
const CHANNEL_COUNT = 15;
const EXPECTED = Object.freeze({
	schemaId: 'algorithm32-production-brightest-2000-stellar-package-v1',
	packageId: 'brightest-2000-stellar-package-v1',
	rosterSha256: '6316eff663c7e41b27eb969f557ae32f9617f67e3dd40cd8cf396e1d306a1f3c',
	packetsSha256: '3bda4616b596fa72874a0dc47bade36bd2f079896d084e7af01297a4c5c43f48',
	membersSha256: '14d72c452bbe8f794cce3cfd77634ae378842dedb3076c8f1a3f99de6811c4b2',
	spectraSha256: 'f52b44e1db1d01382fe48cb9967351b1a2f26d775237f7137416dbdb04a18128',
});

function requireFiniteSeries(values, length, label) {
	if (!Array.isArray(values) || values.length !== length || values.some((value) => !Number.isFinite(value))) {
		throw new RangeError(`${label} must contain exactly ${length} finite values.`);
	}
}

/**
 * Validate and normalize the local-only production brightest-2,000 package.
 * @returns {Brightest2000StellarCatalogDefinition} Accepted production definition.
 */
export function createBrightest2000StellarCatalogDefinition(packageValue) {
	const {manifest, roster, packets, memberTexels, spectraTexels} = packageValue ?? {};
	if (manifest?.schemaId !== EXPECTED.schemaId || manifest.packageId !== EXPECTED.packageId) {
		throw new RangeError('Brightest-2,000 package identity is not accepted.');
	}
	const artifacts = manifest.artifacts;
	if (
		artifacts?.roster?.sha256 !== EXPECTED.rosterSha256 ||
		artifacts?.packets?.sha256 !== EXPECTED.packetsSha256 ||
		artifacts?.members?.sha256 !== EXPECTED.membersSha256 ||
		artifacts?.spectra?.sha256 !== EXPECTED.spectraSha256
	) {
		throw new RangeError('Brightest-2,000 package artifact identities are not accepted.');
	}
	if (manifest.memberCount !== MEMBER_COUNT || manifest.spectralChannelCount !== CHANNEL_COUNT) {
		throw new RangeError('Brightest-2,000 package dimensions are not accepted.');
	}
	if (roster?.members?.length !== MEMBER_COUNT || packets?.packets?.length !== MEMBER_COUNT) {
		throw new RangeError('Brightest-2,000 package requires a complete ordered roster and packet set.');
	}
	if (!(memberTexels instanceof Float32Array) || memberTexels.length !== MEMBER_COUNT * 4) {
		throw new RangeError('Brightest-2,000 member texture must be 2000x1 RGBA32F.');
	}
	if (!(spectraTexels instanceof Float32Array) || spectraTexels.length !== MEMBER_COUNT * CHANNEL_COUNT) {
		throw new RangeError('Brightest-2,000 spectra texture must be 2000x15 R32F.');
	}
	const members = roster.members.map((catalogMember, memberIndex) => {
		const packet = packets.packets[memberIndex];
		if (catalogMember.canonicalIndex !== memberIndex || packet?.canonicalIndex !== memberIndex || packet.memberId !== catalogMember.memberId) {
			throw new RangeError(`Brightest-2,000 package order differs at member ${memberIndex}.`);
		}
		requireFiniteSeries(catalogMember.direction, 3, `Brightest-2,000 member ${memberIndex} direction`);
		requireFiniteSeries(packet.spectralIrradiance, CHANNEL_COUNT, `Brightest-2,000 member ${memberIndex} packet`);
		if (packet.spectralIrradiance.some((value) => value < 0)) {
			throw new RangeError(`Brightest-2,000 member ${memberIndex} packet must be nonnegative.`);
		}
		for (let component = 0; component < 3; component += 1) {
			if (!Object.is(memberTexels[memberIndex * 4 + component], Math.fround(catalogMember.direction[component]))) {
				throw new RangeError(`Brightest-2,000 member ${memberIndex} GPU direction differs.`);
			}
		}
		for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
			if (!Object.is(spectraTexels[channel * MEMBER_COUNT + memberIndex], Math.fround(packet.spectralIrradiance[channel]))) {
				throw new RangeError(`Brightest-2,000 member ${memberIndex} GPU spectrum differs.`);
			}
		}
		return Object.freeze({
			id: catalogMember.memberId,
			direction: Object.freeze([...catalogMember.direction]),
			values: Object.freeze([...packet.spectralIrradiance]),
			visualMagnitude: catalogMember.visualMagnitude,
			derivation: Object.freeze({...packet.derivation}),
		});
	});
	const proxyMembers = members.filter(({derivation}) => derivation.kind !== 'retained-bracketed-pickles');
	if (proxyMembers.length !== 7 || members.length - proxyMembers.length !== 1993) {
		throw new RangeError('Brightest-2,000 package must retain the accepted 1,993/7 partition.');
	}
	return Object.freeze({
		catalog: Object.freeze({
			catalogId: 'cds-v50-bright-star-catalogue-5th-revised',
			catalogVersion: 'V/50/catalog; Bright Star Catalogue, 5th Revised Edition',
			catalogSha256: 'sha256:d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759',
			selectionId: manifest.selection,
			selectionSha256: `sha256:${EXPECTED.rosterSha256}`,
			frame: 'fk5-j2000-mean-equatorial-rh-v1',
			epoch: Object.freeze({instant: '2000-01-01T12:00:00Z', timeScale: 'utc'}),
		}),
		photometryIdentity: `sha256:${EXPECTED.packetsSha256}`,
		members: Object.freeze(members),
		memberTexels: new Float32Array(memberTexels),
		spectraTexels: new Float32Array(spectraTexels),
		proxyMembers: Object.freeze(proxyMembers.map(({id, derivation}) => Object.freeze({id, derivation}))),
	});
}
