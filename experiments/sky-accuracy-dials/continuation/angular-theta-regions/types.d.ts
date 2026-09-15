type SkyThetaRegion = 'sun' | 'horizon' | 'other';
type SkyThetaRegionsComponent =
	'atmosphereRayleigh' | 'atmosphereMie' | 'groundRayleigh' | 'groundMie' | 'atmosphere' | 'ground' | 'combined';
/** Incident uncertainty and numerical arithmetic remain separate; neither bounds angular error. */
type SkyThetaRegionsValue = SkySourceReconstructionValue &
	Readonly<{incidentAllowance: number; arithmeticAllowance: number}>;
type SkyThetaRegionsArithmeticCheck = Readonly<{
	value: number;
	arithmeticAllowance: number;
	state: SkySourceAuditState;
}>;
type SkyThetaRegionsRow = Readonly<{
	stage: SkyAngularThetaStage;
	channel: number;
	component: SkyThetaRegionsComponent;
	full: SkyThetaRegionsValue;
	retained: SkyThetaRegionsValue;
	regions: Readonly<Record<SkyThetaRegion, SkyThetaRegionsValue>>;
	replay: SkyThetaRegionsArithmeticCheck;
	partition: SkyThetaRegionsArithmeticCheck;
}>;
type SkyThetaRegionsResponse = Omit<SkyThetaRegionsRow, 'stage'>;
type SkyThetaRegionsResult = Readonly<{
	schemaId: 'sky-angular-theta-regions-v1';
	packageId: 'angular-theta-regions-v1';
	target: SkyVolumeJ2Target;
	components: readonly SkyThetaRegionsRow[];
	responses: readonly SkyThetaRegionsResponse[];
	stages: readonly Readonly<{
		stage: SkyAngularThetaStage;
		representativeCount: number;
		independentWitnessCount: number;
		directionCount: number;
		admissionChecks: readonly SkyVolumeJ2Check[];
	}>[];
	implementationChecks: Readonly<Record<string, SkySourceAuditState>>;
	checks: Readonly<{horizonSameSign: SkySourceAuditState; horizonAtLeastHalf: SkySourceAuditState}>;
	predicates: readonly SkySourceAuditState[];
}>;
/** In-memory sum bookkeeping; only compact completed estimates are retained. */
type SkyThetaRegionsAccumulator = {value: number; incident: number; arithmetic: number; scale: number; count: number};
