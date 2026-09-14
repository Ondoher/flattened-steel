/** Higher-order representation, with analytic L1 and raw final J1 unchanged.
 * - **"splitraw"** - Store each species density at retained altitude knots.
 * - **"factored"** - Store each species lighting and apply density at query points.
 */
type SkyDensityMode = 'splitraw' | 'factored';
/** Independently streamed scattering species.
 * - **"rayleigh"** - Molecular scattering contribution.
 * - **"mie"** - Aerosol scattering contribution.
 */
type SkyDensitySpecies = 'rayleigh' | 'mie';
/** Exact contained compiler capability with the unchanged production common GLSL. */
type SkyDensityCompileRequest = SkyGpuCompileRequest &
	Readonly<{
		/** Authenticated physical/geometry shader generator. */ commonModule: SkySixCommonModule;
		/** Explicit higher-order representation. */ densityMode: SkyDensityMode;
	}>;
/** Planned pass dependencies shared by the driver and its structural proof. */
type SkyDensityStage = Readonly<{
	/** Unique texture field identity. */ id: string;
	/** Fragment variant used for this pass. */ program:
		| 'direct'
		| 'first'
		| 'analytic-l1'
		| 'scatter-rayleigh'
		| 'scatter-mie'
		| 'transport-rayleigh'
		| 'transport-mie';
	/** J denotes outgoing scalar density/coefficient; L denotes incoming radiance; base is two components. */ layout:
		'J' | 'L' | 'base';
	/** Required live scalar fields, excluding immutable direction textures. */ inputs: readonly string[];
	/** Fields released after this pass and its awaited sparse callback. */ release: readonly string[];
	/** Whether this pass has a requested sparse extraction opportunity. */ capture: boolean;
}>;
/** Mutable row readback owned only during a single sparse callback. */
type SkyDensityReadbackSpan = {
	/** First requested texture column. */ first: number;
	/** Last requested texture column. */ last: number;
	/** Row span populated before extraction. */ values?: Float32Array;
};
/** Observable logical allocation or executed pass. */
type SkyDensityLedgerEntry = Readonly<{
	/** Kind of resource or dependency observation. */ operation: 'allocate' | 'release' | 'pass';
	/** Exact owned stage identity. */ id: string;
	/** Field allocation bytes, for allocation/release. */ bytes?: number;
	/** Live scalar bytes following allocation/release. */ liveBytes?: number;
	/** False is required after a normal release. */ isTextureAfterDelete?: boolean;
	/** Exact output identity of a pass. */ outputField?: string;
	/** Exact input identities of a pass. */ inputFields?: readonly string[];
}>;
/** One measured wavelength pass. */
type SkyDensityTiming = Readonly<{
	/** Unique output field identity. */ id: string;
	/** Wall time including awaited progress callbacks. */ milliseconds: number;
	/** Same output field recorded in the dependency ledger. */ outputField: string;
	/** Bound scalar and direction textures. */ inputFields: readonly string[];
}>;
/** Logical lifetime proof for one allowed texture layout. */
type SkyDensityLifetimeProof = Readonly<{
	/** Number of executed fragment passes. */ passCount: number;
	/** Highest simultaneously live logical field allocation. */ peakBytes: number;
	/** Zero after the terminal pass. */ finalBytes: number;
	/** Orders whose two scatter passes read the same prior incoming field. */ samePreviousOrders: readonly number[];
	/** Exactly one ground contribution for each transported higher order. */ groundOrders: readonly number[];
}>;
/** Manufactured numerical and structural controls; no GPU result is implied. */
type SkyDensityProof = Readonly<{
	/** Bounded proof schema. */ schemaId: 'sky-density-recurrence-proof-v1';
	/** Number of successful explicit assertions. */ checks: number;
	/** All attempted controls succeeded. */ passed: true;
	/** Exact production and contained parent source identities. */ shaderParents: readonly SkyGpuSourceIdentity[];
	/** Byte-equal generator bodies before the explicit higher-density transforms. */ unchangedFragments: readonly Readonly<{
		/** Direct base, cached J1, analytic L1 or parent transport generator. */ name: string;
		/** Normalized generator-body SHA-256. */ sha256: string;
	}>[];
	/** Largest admitted layout lifetime observation. */ largestLayout: SkyDensityLifetimeProof;
	/** Numerical cancellation/grouping witnesses with their actual differences. */ witnesses: Readonly<
		Record<string, number>
	>;
	/** Explicit limits of manufactured and source-structural checks. */ scope: string;
}>;
/** Opaque manufactured GPU object identity, never a real WebGL object. */
type SkyDensityMockObject = Readonly<{
	/** Mock resource class. */ kind: string;
	/** One-based creation attempt identity. */ id: number;
}>;
/** Bounded dispatch double exposed only inside the self-verifying proof. */
type SkyDensityGlHarness = Readonly<{
	/** Inert methods consumed by this driver; no shader calculation is performed. */ gl: WebGL2RenderingContext;
	/** Snapshot mutable resource counters without exposing the owned set. */ observe: () => Readonly<{
		/** Objects still awaiting deletion. */ liveObjects: number;
		/** Total attempted creations, including a deliberately failed one. */ allocations: number;
		/** Completed inert draw dispatches. */ draws: number;
	}>;
}>;
