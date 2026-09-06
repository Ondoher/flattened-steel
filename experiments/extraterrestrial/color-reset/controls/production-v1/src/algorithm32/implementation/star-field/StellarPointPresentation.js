/**
 * Camera-independent presentation policy for unresolved catalog stars.
 *
 * The accepted experimental image used a fixed 640 by 400, 78-degree camera.
 * Its center-pixel solid angle is retained only as the provenance of this
 * fixed irradiance-to-one-pixel boundary-radiance scale. Runtime viewport,
 * projection, field of view, and pixel position never enter the conversion.
 */
export const STELLAR_ONE_PIXEL_PRESENTATION = /** @type {const} */ ({
	id: 'stellar-one-pixel-presentation-000435-v1',
	reference: {
		runId: '000435-sun-layer-screen-palette-three-scenes',
		viewportWidthPixels: 640,
		viewportHeightPixels: 400,
		verticalFieldOfViewDegrees: 78,
		centerPixelSolidAngleSteradians: 1.639348576039236e-5,
	},
	irradianceToBoundaryRadianceScale: 60999.839486002405,
});

