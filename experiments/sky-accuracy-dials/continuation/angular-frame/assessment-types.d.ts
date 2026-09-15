type SkyAngularFrameRole = 'original' | 'candidate' | 'sun16' | 'sun32' | 'radial32' | 'radial64';
type SkyAngularFrameComponent = 'atmosphereRayleigh' | 'atmosphereMie' | 'groundRayleigh' | 'groundMie' | 'combined';
type SkyAngularFrameComponentAssessment = Readonly<{
	channel: number;
	component: SkyAngularFrameComponent;
	values: Readonly<Record<SkyAngularFrameRole, SkySourceReconstructionValue>>;
	reference: SkySourceReconstructionValue;
	angularCentralAllowance: number;
	angularInputAllowance: number;
	refinementChanges: readonly SkySourceReconstructionValue[];
	errors: Readonly<Record<SkyAngularFrameRole, SkySourceReconstructionValue>>;
	response: SkySourceReconstructionValue;
	referenceAdmitted: SkySourceAuditState;
	checks: Readonly<{
		negative: SkySourceAuditState;
		candidate80: SkySourceAuditState;
		refinement50: SkySourceAuditState;
	}>;
}>;
type SkyAngularFrameAssessment = Readonly<{
	schemaId: 'sky-angular-frame-assessment-v1';
	packageId: 'angular-frame-morning-v1';
	allStagesComplete: boolean;
	missingOrIncomplete: readonly SkyAngularFrameStage[];
	components: readonly SkyAngularFrameComponentAssessment[];
	predicates: readonly SkySourceAuditState[];
}>;
