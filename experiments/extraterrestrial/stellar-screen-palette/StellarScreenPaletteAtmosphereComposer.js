export const STELLAR_SCREEN_PALETTE_COMPOSITION_CONTRACT = Object.freeze({
	id: 'stellar-screen-palette-atmosphere-composition-v1',
	channelCount: 15,
	indexFetchesPerPixel: 1,
	paletteScalarFetchesPerPixel: 15,
	catalogIterationsPerPixel: 0,
	paletteSearchIterationsPerPixel: 0,
	formula: 'pathRadiance + visibility * viewTransmittance * stellarBoundaryRadiance',
	visibility: 'sceneHitMask < 0.5 && horizonMask < 0.5',
	compositionStage: 'native-15 pre-display radiance before unchanged Bruneton Color',
});

export const STELLAR_SCREEN_PALETTE_COMPOSITION_VERTEX_SHADER = `#version 300 es
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0)
		: vec2(-1.0, 3.0);
	gl_Position = vec4(position, 0.0, 1.0);
}`;

export const STELLAR_SCREEN_PALETTE_COMPOSITION_FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

const int SPECTRAL_CHANNEL_COUNT = 15;
uniform usampler2D uStellarScreenIndex;
uniform sampler2D uStellarPalette;
uniform ivec2 uPixelCoordinate;
uniform float uPathRadiance[SPECTRAL_CHANNEL_COUNT];
uniform float uViewTransmittance[SPECTRAL_CHANNEL_COUNT];
uniform float uSceneHitMask;
uniform float uHorizonMask;

layout(location = 0) out vec4 outChannels0To3;
layout(location = 1) out vec4 outChannels4To7;
layout(location = 2) out vec4 outChannels8To11;
layout(location = 3) out vec4 outChannels12To14;

void storeNative15(float values[SPECTRAL_CHANNEL_COUNT]) {
	outChannels0To3 = vec4(values[0], values[1], values[2], values[3]);
	outChannels4To7 = vec4(values[4], values[5], values[6], values[7]);
	outChannels8To11 = vec4(values[8], values[9], values[10], values[11]);
	outChannels12To14 = vec4(values[12], values[13], values[14], 0.0);
}

void main() {
	uint paletteIndex = texelFetch(uStellarScreenIndex, uPixelCoordinate, 0).r;
	float visibility = uSceneHitMask < 0.5 && uHorizonMask < 0.5 ? 1.0 : 0.0;
	float preDisplayRadiance[SPECTRAL_CHANNEL_COUNT];
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		float stellarBoundaryRadiance = texelFetch(
			uStellarPalette,
			ivec2(channelIndex, int(paletteIndex)),
			0
		).r;
		float transportedStellarRadiance = visibility
			* uViewTransmittance[channelIndex]
			* stellarBoundaryRadiance;
		preDisplayRadiance[channelIndex] = uPathRadiance[channelIndex]
			+ transportedStellarRadiance;
	}
	storeNative15(preDisplayRadiance);
}`;

function requireNative15(values, label) {
	if ((!Array.isArray(values) && !ArrayBuffer.isView(values)) || values.length !== 15) {
		throw new TypeError(`${label} must contain exactly 15 values.`);
	}
	return Array.from(values, (value, channelIndex) => {
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new TypeError(`${label}[${channelIndex}] must be finite.`);
		}
		return value;
	});
}

/** Binary64 oracle for the shader's native-15 pre-Color composition boundary. */
export function composeStellarBoundaryRadiance({
	pathRadiance,
	viewTransmittance,
	stellarBoundaryRadiance,
	sceneHitMask,
	horizonMask,
}) {
	const path = requireNative15(pathRadiance, 'Path radiance');
	const transmittance = requireNative15(viewTransmittance, 'View transmittance');
	const stellar = requireNative15(stellarBoundaryRadiance, 'Stellar boundary radiance');
	if (
		transmittance.some((value) => value < 0 || value > 1)
		|| !Number.isFinite(sceneHitMask)
		|| !Number.isFinite(horizonMask)
	) {
		throw new RangeError('Composition transmittance and masks are outside their supported domains.');
	}
	const visibility = sceneHitMask < 0.5 && horizonMask < 0.5 ? 1 : 0;
	return Object.freeze(path.map((value, channelIndex) => value
		+ visibility * transmittance[channelIndex] * stellar[channelIndex]));
}
