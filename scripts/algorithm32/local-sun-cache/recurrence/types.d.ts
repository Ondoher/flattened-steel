/** Immutable full-physical-field extraction identities. */
type LocalSunPhysicalControlManifest = Readonly<{
	/** Immutable control schema. */ schema: 'local-sun-physical-controls-run-v1';
	/** Accepted derivation state. */ state: 'passed';
	/** Complete sealed artifact inventory. */ artifacts: readonly Readonly<{
		/** Relative immutable artifact path. */ path: string;
		/** Exact SHA-256 of its sealed bytes. */ sha256: string;
	}>[];
}>;
/** Selected physical values from one independently constructed field. */
type LocalSunPhysicalControlField = Readonly<{
	/** Exact independently generated physical J scalars needed by fixed ray queries. */ sparse?: readonly (readonly [
		number,
		number,
	])[];
	/** Original producer field. */ id: string;
	/** Direction extent. */ width: number;
	/** Actual compact positions. */ height: number;
	/** Native15 channel extent. */ layers: number;
	/** Exact whole-field validity and identity. */ observation: Readonly<{
		/** Count of nonfinite physical scalars in the complete field. */
		nonfinite: number;
		/** Count of negative physical scalars beyond the original quantity allowance. */
		negativeBeyondAbsolute: number;
		/** SHA-256 of the complete physical FP32 field. */
		sha256?: string;
	}>;
	/** Each physical spectrum indexed by the field's selected direction list. */ selected: readonly Readonly<{
		/** Actual compact physical node address. */
		positionIndex: number;
		/** Physical J or L spectra in Native15 units, indexed by selected direction. */
		values: readonly (readonly number[])[];
	}>[];
}>;
/** Independent field observations from the sealed numerical producer. */
type LocalSunPhysicalControls = Readonly<{
	/** Pure J1-J4, pure L1-L3 and cumulative J. */ controls: readonly LocalSunPhysicalControlField[];
}>;
/** Selected physical CPU operator qualification, with full-domain/runtime claims explicitly absent. */
type LocalSunRecurrenceReport = Readonly<{
	/** Exact analytic black-source pure/cumulative checks. */ zeroComparisons: number;
	/** All original gates passed. */ status: 'PASSED';
	/** Physical pure-field scalar checks. */ pureComparisons: number;
	/** Requested cumulative scalar checks. */ cumulativeComparisons: number;
	/** Complete construction-ray scalar checks. */ rayComparisons: number;
	/** Maximum absolute J residual. */ maximumJError: number;
	/** Maximum absolute L residual. */ maximumLError: number;
	/** Explicit N1/N2/N4 selections. */ orders: readonly SupportedCacheScatteringOrder[];
	/** Held J1 memo accesses by continuous direct transport. */ directPrimaryMemoReads: 0;
	/** Full-domain production CPU fields constructed. */ fullDomainCpuFieldsConstructed: 0;
	/** Measured whole proof cost, including authentication. */ elapsedMilliseconds: number;
	/** Available system memory at start. */ freeBeforeBytes: number;
	/** Observed Node resident memory after proof. */ rssAfterBytes: number;
}>;
