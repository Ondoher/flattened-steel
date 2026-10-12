/** Hash-authenticated historical layout, used only by offline projection. */
type LocalSunP0SealedLayout = Readonly<{
	/** Historical format identity. */ schema: string;
	/** Source height in metres. */ height: number;
	/** Atmospheric top altitude in metres. */ top: number;
	/** Source-centered cylinder radius in metres. */ maximumRho: number;
	/** Physical band endpoints and admission. */ bands: readonly {
		/** Physical band identity. */
		id: number;
		/** Inner source distance, metres. */
		inner: number;
		/** Outer source distance, metres. */
		outer: number;
		/** Expected complete support; unsupported probes have no fallback. */
		admitted: boolean;
	}[];
	/** Complete sealed positions; historical scalars are metres. */ nodes: readonly {
		/** Contiguous compact position address. */
		index: number;
		/** Owning altitude-row index. */
		rowIndex: number;
		/** Original physical scattering band. */
		band: number;
		/** Historical altitude, metres. */
		z: number;
		/** Historical source-axis horizontal separation, metres. */
		rho: number;
		/** Historical Euclidean source distance, metres. */
		radius: number;
		/** Historical radius minus row-axis distance, metres. */
		excess: number;
	}[];
	/** Altitude rows and compact addresses. */ rows: readonly {
		/** Altitude above flat ground, metres. */ z: number;
		/** Ordered compact support addresses. */ indices: readonly number[];
		/** Ordered stable radius-excess coordinates, metres. */ excesses: readonly number[];
	}[];
	/** Omitted physical band identities. */ omittedBands: readonly number[];
	/** Selected spatial interpolation. */ interpolation: string;
	/** Selected spectral-density reconstruction. */ reconstruction: string;
}>;

/** Independent positive support returned by the authenticated retained helper. */
type LocalSunP0OracleStencil = Readonly<{
	/** Ordered compact support addresses. */
	indices: readonly number[];
	/** Positive dimensionless stencil weights. */
	weights: readonly number[];
}>;

/** Authoring-only hash-authenticated pure stencil function. */
type LocalSunP0StencilOracle = (
	layout: LocalSunP0SealedLayout,
	horizontalMeters: number,
	altitudeMeters: number,
) => LocalSunP0OracleStencil;
