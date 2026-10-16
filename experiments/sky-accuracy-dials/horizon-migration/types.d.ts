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
/** Source-history calculation controls, independent of cache storage. */
type HorizonSecondOrderControl = {
	/** Immutable authenticated material and illumination packet. */ readonly input: HorizonMigrationMedium;
	/** Physical receiver position, meters. */ readonly point: readonly number[];
	/** Physical viewing direction. */ readonly outgoing: readonly number[];
	/** Physical incoming angular nodes. */ readonly directions: readonly (readonly number[])[];
	/** Corresponding positive solid angle, steradians. */ readonly weights: readonly number[];
	/** Primary source position approximation under test. */ readonly kind: HorizonMigrationSourceKind;
	/** Gauss nodes per physical path segment. */ readonly pathCount: number;
};
/** Ordered first/second species matrix with immutable Native15 spectra. */
type HorizonSecondOrderHistory = readonly (readonly (readonly number[])[])[];
/** Two immutable species spectra, ordered Rayleigh then Mie. */
type HorizonSecondOrderIncident = readonly (readonly number[])[];
/** Immutable H33 registration fields needed for the constant-light qualification. */
type HorizonSecondOrderRegistration = {
	/** Authenticated spherical paper-material packet. */ readonly input: HorizonMigrationMedium;
	/** Frozen receiving points and outgoing directions. */ readonly receivers: readonly HorizonSecondOrderReceiver[];
};
/** Canonical receiver geometry shared by the physical and phase-only runners. */
type HorizonSecondOrderReceiver = {
	/** Elevation above the observer horizontal, degrees. */ readonly elevation: number;
	/** Receiver altitude above spherical ground, meters. */ readonly height: number;
	/** Receiver world coordinates, meters. */ readonly point: readonly number[];
	/** World outgoing unit direction. */ readonly outgoing: readonly number[];
};
/** Independently callable deadline/progress capability supplied by the run owner. */
interface HorizonSecondOrderGuard {
	/** Check allocation and flush progress; failures abort the owning run. */
	(): void;
}
/** Readonly subset of the retained angular qualification consumed for parity. */
type HorizonSecondOrderQualification = {
	/** Original independent receivers and their semantic selectors. */
	readonly angular: readonly HorizonSecondOrderQualifiedReceiver[];
};
/** One source parity witness from the previous angular qualification packet. */
type HorizonSecondOrderQualifiedReceiver = {
	/** Original mode selector: zero local, one distant. */ readonly mode: number;
	/** Registered receiver altitude, meters. */ readonly altitude: number;
	/** Refined source with unchanged original meanings. */ readonly reference: HorizonMigrationReadonly<HorizonAuditAngular>;
};
/** Exact source-failure facts retained by the immutable producer seal. */
type HorizonSecondOrderRecoverySeal = {
	/** Original terminal disposition, including the failed physical producer. */ readonly state: string;
	/** Exact source inventory captured before its computation. */ readonly sources: readonly HorizonMigrationReadonly<DialFileIdentity>[];
	/** Changed source paths detected at finalization. */ readonly sourceFailures: readonly HorizonSecondOrderSourceFailure[];
	/** Separate heartbeat failure, null when progress remained valid. */ readonly heartbeatFailure: string | null;
	/** Original execution accounting. */ readonly result: HorizonMigrationReadonly<HorizonAuditTimingSeal>['result'];
};
/** One immutable source-integrity failure selector from the original producer. */
type HorizonSecondOrderSourceFailure = {
	/** Repository-relative source that changed during the run. */ readonly path: string;
};
/** Immutable complete receiver artifact qualified by the recovery. */
type HorizonSecondOrderRecoveryReceiver = HorizonSecondOrderReceiver & {
	/** Every original angular/position source packet. */ readonly controls: readonly HorizonSecondOrderRecordedControl[];
};
/** One recorded numerical control shared by the producer and recovery reader. */
type HorizonSecondOrderRecordedControl = {
	/** Frozen angular rule label. */ readonly rule: string;
	/** Frozen primary-source evaluation selector. */ readonly kind: HorizonMigrationSourceKind;
	/** Original four-history source result. */ readonly value: HorizonSecondOrderSource;
};
/** Minimal interrupted run definition retained before any finalization. */
type HorizonSecondOrderInterruptedDefinition = {
	/** Exclusive output identity of the stopped, unsealed run. */ readonly run: string;
	/** Its original producer source identities. */ readonly sources: readonly HorizonMigrationReadonly<DialFileIdentity>[];
	/** Its original derivation recipe, reused without modification. */ readonly recipe: HorizonMigrationReadonly<DialDerivation>;
};
/** Separate first- and second-scatter species, preserving complete spectra. */
type HorizonSecondOrderSource = {
	/** First species, then second species, then Native15 channel; R before M. */ readonly history: HorizonSecondOrderHistory;
	/** Ground/grazing/sky histories under the same ordered species convention. */ readonly regions: Readonly<
		Record<string, HorizonSecondOrderHistory>
	>;
	/** Sum over first species, indexed by final species then channel. */ readonly species: HorizonSecondOrderIncident;
	/** Sum of all histories in W/(m3 sr nm). */ readonly spectrum: readonly number[];
	/** Integrated solid angle in steradians. */ readonly solidAngle: number;
	/** Maximum absolute history/species/region closure discrepancy. */ readonly closureAbsolute: number;
};
