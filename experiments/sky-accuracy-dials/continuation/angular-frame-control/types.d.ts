/** All rules have the Sun as polar axis; the origin names identify azimuth zero. */
type SkyAngularFrameControlRuleId =
	'original32x12' | 'rotated32x12' | 'unpartitioned24x16' | 'split8x16' | 'split16x32' | 'split32x64';
type SkyAngularFrameControlInput = Readonly<{
	spec: SkyTransportSpec;
	target: SkyVolumeJ2Target;
	original: SkyAngularLobesRow;
	identities: readonly DialFileIdentity[];
}>;
/** Empirical arithmetic allowances do not include quadrature error. */
type SkyAngularFrameControlEstimate = Readonly<{
	product: SkySourceReconstructionValue;
	phaseMass: Readonly<{rayleigh: SkySourceReconstructionValue; mie: SkySourceReconstructionValue}>;
	directionCount: number;
	phaseEvaluations: number;
	solidAngle: SkySourceReconstructionValue;
	maximumUnitResidual: number;
	positiveWeights: boolean;
	geometryChecks: Readonly<Record<string, SkySourceAuditState>>;
}>;
type SkyAngularFrameControlRule = SkyAngularFrameControlEstimate &
	Readonly<{
		id: SkyAngularFrameControlRuleId;
		polarCount: number;
		azimuthCount: number;
		partitioned: boolean;
		azimuthOrigin: 'outgoing-projection' | 'radial-projection';
		error: SkySourceReconstructionValue;
		phaseMassErrors: Readonly<{rayleigh: SkySourceReconstructionValue; mie: SkySourceReconstructionValue}>;
	}>;
/** Seventeen frozen scientific gates, with geometry/replay checks kept separate. */
type SkyAngularFrameControlResult = Readonly<{
	schemaId: 'sky-angular-frame-control-v1';
	target: SkyVolumeJ2Target;
	g: number;
	reference: SkyAngularLobesReference;
	referenceAdequate: boolean;
	rows: readonly SkyAngularFrameControlRule[];
	replay: SkySourceReconstructionValue;
	contrasts: Readonly<Record<string, SkySourceReconstructionValue>>;
	implementationChecks: Readonly<Record<string, SkySourceAuditState>>;
	checks: Readonly<Record<string, SkySourceAuditState>>;
	predicates: readonly SkySourceAuditState[];
}>;
/** Narrow sealed-source contract used for authenticated historical inputs. */
type SkyAngularFrameControlTerminal = SkyMechanismTerminal &
	Readonly<{
		recipe: SkyMechanismTerminalRecipe &
			Readonly<{
				parameters: SkyMechanismTerminalParameters & Readonly<{sourceIdentities: readonly DialFileIdentity[]}>;
			}>;
	}>;
