/** Deep readonly projection for authenticated JSON data, excluding behavioral capabilities. */
type HorizonMigrationReadonly<Value> = Value extends object
	? {readonly [Key in keyof Value]: HorizonMigrationReadonly<Value[Key]>}
	: Value;
/** Readonly experiment view preserving the existing physical packet's canonical property meanings. */
type HorizonMigrationMedium = HorizonMigrationReadonly<HorizonAuditInput>;
/** Frozen authenticated packet used for the sparse migration reconstruction. */
type HorizonMigrationInput = {
	/** Original paired physical inputs; only spherical/distant is evaluated. */ readonly inputs: readonly HorizonMigrationMedium[];
};
/** Frozen source evaluation selector.
 * - **"actual"** - Evaluate primary scattering at the physical point.
 * - **"column"** - Evaluate at the same altitude above the reference observer column.
 */
type HorizonMigrationSourceKind = 'actual' | 'column';
/** A matched primary-source capability for independent integration. */
interface HorizonMigrationSampler {
	/** Evaluate all native spectral channels at the supplied physical point and direction. */
	(point: readonly number[], direction: readonly number[]): readonly number[];
}
/** One closed scalar-source integral and source/attenuation sample trace. */
type HorizonMigrationIntegral = {
	/** Complete spectral radiance, W/(m2 sr nm). */ readonly spectrum: readonly number[];
	/** Physical segment midpoint distance, altitude and contribution spectra. */ readonly samples: readonly HorizonMigrationViewSample[];
};
/** One positive-weight camera-path segment. */
type HorizonMigrationViewSample = {
	/** Segment midpoint distance in meters. */ readonly distance: number;
	/** Physical midpoint altitude above spherical ground, meters. */ readonly altitude: number;
	/** Local solar-zenith angle, degrees. */ readonly solarZenith: number;
	/** Unattenuated segment source density spectrum. */ readonly source: readonly number[];
	/** Weighted attenuated spectral contribution. */ readonly contribution: readonly number[];
};
/** Immutable Git source provenance; Git identities are not filesystem paths. */
type HorizonMigrationGitSource = {
	/** Fully resolved source commit. */ readonly commit: string;
	/** Repository-relative path at that commit. */ readonly path: string;
	/** Git blob object identity. */ readonly blob: string;
	/** SHA-256 of original blob bytes. */ readonly sha256: string;
	/** Original byte count. */ readonly byteLength: number;
	/** Original UTF-8 source, retained read-only as evidence. */ readonly source: string;
};
/** Complete retained independent spectral batch packet. */
type HorizonMigrationBatches = {
	/** Original independent transport groups. */ readonly groups: readonly HorizonReferenceGroup[];
	/** Original app observations, comparison-only. */ readonly observations: readonly HorizonMigrationReadonly<HorizonAuditObservation>[];
};
