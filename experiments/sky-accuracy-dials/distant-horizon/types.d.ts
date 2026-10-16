/** Standalone spherical N1 rendering request, independent of app/cache execution. */
type DistantAerosolGpuInput = {
	/** Complete generated GLSL with frozen physical coefficients and quadrature. */ readonly shader: string;
	/** Angular image dimensions in pixels. */ readonly width: number; readonly height: number;
	/** Unit ray directions for independent spectral parity. */ readonly directions: readonly (readonly number[])[];
};
/** A rendered sky and spectral readbacks at one fixed aerosol amplitude. */
type DistantAerosolGpuCase = {
	/** Remaining aerosol fraction, one or zero. */ fraction: number;
	/** Bottom-up RGBA Float32 readback; RGB is signed linear sRGB in physical units. */ pixels: number[];
	/** Native15 radiance for each requested probe direction. */ spectra: number[][];
};
/** Completed standalone hardware execution; failed operations reject without an accepted result. */
type DistantAerosolGpuResult = {
	/** Hardware adapter name; software rendering is rejected. */ renderer: string;
	/** Browser-side compile/render/readback duration. */ milliseconds: number;
	/** Matched baseline and zero-aerosol outputs. */ cases: DistantAerosolGpuCase[];
};
