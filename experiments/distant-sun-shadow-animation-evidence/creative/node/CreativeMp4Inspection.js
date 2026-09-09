/** Independent complete MP4 packet inspection using the installed S9 Mediabunny dependency. */
export const CreativeMp4Inspection = {
	/**
	 * Call this method to demux every encoded frame and validate sixty seconds of native-4K thirty-Hz video.
	 * The supplied module URL must identify a previously validated read-only installed dependency.
	 *
	 * @param {string} videoPath - Validated absolute parent MP4 path.
	 * @param {string} mediabunnyModuleUrl - Validated installed Node module URL.
	 * @returns {Promise<CreativeVerificationDemux>} - Complete independent container and packet facts.
	 */
	async inspect(videoPath, mediabunnyModuleUrl) {
		const {ALL_FORMATS, EncodedPacketSink, FilePathSource, Input} = await import(mediabunnyModuleUrl);
		const input = new Input({
			source: new FilePathSource(videoPath, {maxCacheSize: 8 * 1024 * 1024}),
			formats: ALL_FORMATS,
		});
		try {
			if (!(await input.canRead())) throw new Error('Mediabunny could not read the creative MP4.');
			const track = await input.getPrimaryVideoTrack();
			if (!track) throw new Error('Creative MP4 has no primary video track.');
			const width = await track.getDisplayWidth();
			const height = await track.getDisplayHeight();
			const durationSeconds = await input.computeDuration();
			if (width !== 3840 || height !== 2160 || Math.abs(durationSeconds - 60) > 0.000002) {
				throw new Error(
					`Creative MP4 native dimensions or duration changed: ${width}x${height}, ${durationSeconds}s.`,
				);
			}
			const sink = new EncodedPacketSink(track);
			/** @type {CreativeVerificationDecodedPacket[]} */
			const decodeOrder = [];
			for await (const packet of sink.packets(undefined, undefined, {metadataOnly: true})) {
				const decodeIndex = decodeOrder.length;
				if (
					decodeIndex >= 1800 ||
					!Number.isFinite(packet.microsecondTimestamp) ||
					!Number.isFinite(packet.microsecondDuration) ||
					Math.abs(packet.microsecondDuration - 1_000_000 / 30) > 1 ||
					!Number.isSafeInteger(packet.byteLength) ||
					packet.byteLength < 1 ||
					(packet.type !== 'key' && packet.type !== 'delta')
				) {
					throw new Error(`Creative MP4 packet ${decodeIndex} violates its encoded packet contract.`);
				}
				decodeOrder.push({
					decodeIndex,
					type: packet.type,
					timestampMicroseconds: packet.microsecondTimestamp,
					durationMicroseconds: packet.microsecondDuration,
					byteLength: packet.byteLength,
				});
			}
			if (decodeOrder.length !== 1800 || decodeOrder[0]?.type !== 'key') {
				throw new Error('Creative MP4 must contain exactly 1800 frames beginning with a key frame.');
			}
			const packets = [...decodeOrder]
				.sort((left, right) => left.timestampMicroseconds - right.timestampMicroseconds)
				.map((packet, frameIndex) => ({...packet, frameIndex}));
			for (const packet of packets) {
				const expectedTimestamp = Math.round((packet.frameIndex * 1_000_000) / 30);
				const previous = packets[packet.frameIndex - 1];
				if (
					Math.abs(packet.timestampMicroseconds - expectedTimestamp) > 1 ||
					(previous && packet.timestampMicroseconds <= previous.timestampMicroseconds)
				) {
					throw new Error(
						`Creative MP4 presentation frame ${packet.frameIndex} violates its monotone thirty-Hz cadence.`,
					);
				}
			}
			return {
				width,
				height,
				durationSeconds,
				framesPerSecond: packets.length / durationSeconds,
				frameCount: packets.length,
				mimeType: await input.getMimeType(),
				codec: await track.getCodec(),
				keyFrameCount: packets.filter((packet) => packet.type === 'key').length,
				encodedPayloadBytes: packets.reduce((sum, packet) => sum + packet.byteLength, 0),
				presentationWasMonotoneInDecodeOrder: decodeOrder.every(
					(packet, index) =>
						index === 0 || packet.timestampMicroseconds > decodeOrder[index - 1].timestampMicroseconds,
				),
				packets,
			};
		} finally {
			input.dispose();
		}
	},
};
