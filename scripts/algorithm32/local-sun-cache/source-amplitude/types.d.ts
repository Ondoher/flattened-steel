/** Independent analytic source-strength authority; no live source algorithm owns its expected values. */
interface LocalSunAmplitudeFixture {
	/** Serialized control schema; selected once for this bounded comparison. */
	schema: string;
	/** Normalized finite-source radiometry and canonical placement in metres. */
	source: LocalSunShellFactSourceConfiguration;
	/** Geometry-owned admitted source-center distance extrema. */
	bounds: SourceDistanceBounds;
	/** Fixed amplitude-band count, separate from spatial topology. */
	bandCount: number;
	/** Independent dimensionless binary64 held amplitude for each ordered band. */
	heldScales: number[];
	/** Authenticated Native15 irradiance-density input calibration. */
	packet: {
		/** Spectral irradiance density, rather than total emitted power. */
		quantity: string;
		/** Physical density units, W m^-2 nm^-1. */
		units: string;
		/** Contiguous wavelength-bin averages, rather than integrated bin power. */
		semantics: string;
		/** Ordered calibration channels, copied without tuning. */
		channels: {
			/** Accepted channel identifier. */ id: string;
			/** Bin center in nanometres. */ center: number;
			/** Bin width in nanometres; no bandwidth multiplier applies to density samples. */ width: number;
			/** Irradiance density at reference distance, W m^-2 nm^-1. */ value: number;
		}[];
	};
	/** Predeclared binary64 roundoff comparison limits, with no physical-accuracy claim. */
	limits: {
		/** Dimensionless scale absolute allowance. */ absoluteScale: number;
		/** Irradiance-density absolute allowance, W m^-2 nm^-1. */ absoluteIrradiance: number;
		/** Dimensionless relative allowance, added to the absolute allowance. */ relative: number;
	};
	/** Complete derivation links and tool identities of this independent authority. */
	derivation: {
		/** Authenticated geometry authority and approved literal source calibration. */
		parents: {
			/** Repository-relative immutable input identity. */ path: string;
			/** SHA-256 of complete parent bytes. */ sha256: string;
		}[];
		/** Original authenticated P0 derivation record, retained without reinterpretation. */
		p0Derivation: unknown;
		/** Independent equation, material parameters and source/spectral meaning. */
		operation: string;
		/** Offline producer identity, without live source algorithm imports. */
		producer: {
			/** Repository-relative implementation path. */ path: string;
			/** SHA-256 of exact implementation bytes. */ sha256: string;
		};
		/** Authoring Node version; consumer runtime is recorded separately. */
		node: string;
	};
}

/** Scalar-source comparison only; fields, GPU and runtime frame acceptance remain separate. */
interface LocalSunAmplitudeProofReport {
	/** Terminal successful comparison state, returned only after all gates pass. */
	status: 'PASSED';
	/** SHA-256 of exact independent held-strength fixture bytes. */
	authoritySha256: string;
	/** Number of accepted amplitude bands. */
	bands: number;
	/** Number of held and continuous per-channel irradiance comparisons. */
	spectralComparisons: number;
	/** Largest observed dimensionless scalar discrepancy. */
	maximumScaleError: number;
	/** Largest observed irradiance-density discrepancy, W m^-2 nm^-1. */
	maximumIrradianceError: number;
	/** Number of independently checked continuous source queries. */
	continuousSamples: number;
	/** Explicitly false; scalar-source qualification does not accept scattering fields. */
	fieldsQualified: false;
}
