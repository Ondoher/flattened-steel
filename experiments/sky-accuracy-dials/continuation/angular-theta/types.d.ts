type SkyAngularThetaStage = 'pilot' | 'fine';
type SkyAngularThetaCase = Readonly<{
	stage: SkyAngularThetaStage;
	frame: 'theta';
	radialCount: 16 | 32;
	azimuthCount: 32 | 64;
	fullDirectionCount: number;
}>;
type SkyAngularThetaReplay = Readonly<{
	value: number;
	allowance: number;
	difference: number;
	comparisonAllowance: number;
	passed: boolean;
}>;
type SkyAngularThetaInput = Readonly<{
	spec: SkyTransportSpec;
	target: SkyVolumeJ2Target;
	mu16: readonly SkyVolumeJ2Row[];
	radial32: readonly SkyVolumeJ2Row[];
	radial64: readonly SkyVolumeJ2Row[];
	analyticReplay: SkyAngularThetaReplay;
	identities: readonly DialFileIdentity[];
}>;
type SkyAngularThetaDocument = Omit<SkyAngularFrameDocument, 'schemaId' | 'packageId' | 'stage' | 'candidate'> &
	Readonly<{
		schemaId: 'sky-angular-theta-stage-v1';
		packageId: 'angular-theta-attribution-v1';
		stage: SkyAngularThetaStage;
		candidate: SkyAngularThetaCase;
	}>;
type SkyAngularThetaRole = 'mu16' | 'theta16' | 'theta32' | 'radial32' | 'radial64';
type SkyAngularThetaComponent = Readonly<{
	channel: number;
	component: SkyAngularFrameComponent;
	values: Readonly<Record<SkyAngularThetaRole, SkySourceReconstructionValue>>;
	reference: SkySourceReconstructionValue;
	angularCentralAllowance: number;
	angularInputAllowance: number;
	refinementChanges: readonly SkySourceReconstructionValue[];
	errors: Readonly<Record<SkyAngularThetaRole, SkySourceReconstructionValue>>;
	response: SkySourceReconstructionValue;
	referenceAdmitted: SkySourceAuditState;
	checks: Readonly<{positive: SkySourceAuditState; candidate80: SkySourceAuditState}>;
}>;
type SkyAngularThetaAssessment = Readonly<{
	schemaId: 'sky-angular-theta-assessment-v1';
	packageId: 'angular-theta-attribution-v1';
	allStagesComplete: boolean;
	missingOrIncomplete: readonly SkyAngularThetaStage[];
	components: readonly SkyAngularThetaComponent[];
	predicates: readonly SkySourceAuditState[];
}>;
