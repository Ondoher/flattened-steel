export const CR6G_RUNTIME_PACKAGE_CONTRACT = Object.freeze({
	id: 'color-reset-cr6g-brightest-2000-runtime-package-v1',
	memberCount: 2000,
	spectralChannelCount: 15,
	spectraTexture: Object.freeze({format: 'R32F', width: 2000, height: 15}),
	memberTexture: Object.freeze({format: 'RGBA32F', width: 2000, height: 1}),
	memberTexel: Object.freeze({channels: ['directionX', 'directionY', 'directionZ', 'visualMagnitude']}),
	claim: 'contained resource-capacity and exact ordered replacement-package seam',
});

function requireFiniteArray(values, length, label) {
	if (!Array.isArray(values) || values.length !== length || values.some((value) => !Number.isFinite(value))) {
		throw new TypeError(`${label} must contain ${length} finite values.`);
	}
}

export function buildCr6gRuntimePackage({members, packets}) {
	if (!Array.isArray(members) || members.length !== CR6G_RUNTIME_PACKAGE_CONTRACT.memberCount) {
		throw new TypeError('CR6G requires exactly 2,000 roster members.');
	}
	if (!Array.isArray(packets) || packets.length !== members.length) {
		throw new TypeError('CR6G packets must exactly cover the roster.');
	}
	const memberTexels = new Float32Array(members.length * 4);
	const spectraTexels = new Float32Array(
		members.length * CR6G_RUNTIME_PACKAGE_CONTRACT.spectralChannelCount,
	);
	for (let memberIndex = 0; memberIndex < members.length; memberIndex += 1) {
		const member = members[memberIndex];
		const packet = packets[memberIndex];
		if (member.memberId !== packet.memberId || member.canonicalIndex !== memberIndex) {
			throw new Error(`CR6G roster/packet mismatch at ${memberIndex}.`);
		}
		requireFiniteArray(member.direction, 3, `${member.memberId} direction`);
		requireFiniteArray(packet.spectralIrradiance, 15, `${member.memberId} spectrum`);
		if (packet.spectralIrradiance.some((value) => value < 0)) {
			throw new RangeError(`${member.memberId} spectrum is negative.`);
		}
		memberTexels.set([...member.direction, member.visualMagnitude], memberIndex * 4);
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			spectraTexels[channelIndex * members.length + memberIndex]
				= packet.spectralIrradiance[channelIndex];
		}
	}
	return Object.freeze({
		contract: CR6G_RUNTIME_PACKAGE_CONTRACT,
		memberTexels,
		spectraTexels,
		memberIds: Object.freeze(members.map(({memberId}) => memberId)),
	});
}
