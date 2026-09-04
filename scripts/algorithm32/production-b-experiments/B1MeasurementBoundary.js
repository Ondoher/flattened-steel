export const B1_PHYSICAL_MEASUREMENT_BOUNDARY = Object.freeze({
	schemaId: 'algorithm32-b1-physical-measurement-boundary-v1',
	identity: 'b1-direct40-post-transport-pre-color-rgba32f-v1',
	observable: 'directional-spectral-radiance-density',
	stage: 'post-transport-pre-color',
	spectralChannelCount: 40,
	gpuReadback: Object.freeze({
		format: 'RGBA32F',
		channelsPerPass: 4,
		passCount: 10,
	}),
	colorDisplayModel: null,
	displayEncoding: 'none',
	toneMapping: 'none',
	stellarPresentationFilters: Object.freeze([]),
});

export const B1_FIGURE_COLOR_CONTROL = Object.freeze({
	schemaId: 'algorithm32-b1-figure-color-control-v1',
	selectionId: 'basic-bruneton',
	implementationId: 'bruneton-figure1-display',
	role: 'six-b1-visual-comparison-figures-only',
	artifactCount: 6,
	participatesInPhysicalScoring: false,
});

/** Require the exact Color-free physical measurement contract. */
export function requireB1PhysicalMeasurementBoundary(record) {
	if (JSON.stringify(record) !== JSON.stringify(B1_PHYSICAL_MEASUREMENT_BOUNDARY)) {
		throw new Error('B1 physical measurement boundary must remain native-spectral and Color-free.');
	}
	return B1_PHYSICAL_MEASUREMENT_BOUNDARY;
}

/** Require Basic Bruneton only as the separately recorded six-figure control. */
export function requireB1FigureColorControl(record) {
	if (JSON.stringify(record) !== JSON.stringify(B1_FIGURE_COLOR_CONTROL)) {
		throw new Error('B1 visual figures require the explicit Basic Bruneton Color control.');
	}
	return B1_FIGURE_COLOR_CONTROL;
}

/** Reject an assembled physical readout shader if a display or presentation path reached it. */
export function requireB1PhysicalMeasurementShader(source) {
	if (
		typeof source !== 'string' ||
		!source.includes('uB1SpectralChannelBase') ||
		!source.includes('state.pathRadiance.channels[uB1SpectralChannelBase]') ||
		!source.includes('outColor = state.outputRgba;')
	) {
		throw new Error('B1 physical measurement shader is missing its native spectral readout boundary.');
	}
	if (
		/uColorReset|colorResetDisplayGain|humanMesopic|humanLowLight|stellarPresentation|toneMapping|LinearTosRGB/u.test(
			source,
		)
	) {
		throw new Error('B1 physical measurement shader contains a Color, encoding, tone, or presentation contribution.');
	}
	return source;
}
