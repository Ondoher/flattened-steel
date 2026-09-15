/** Retained physical target and one of four original quadrature rules. */
type SkyAngularBackgroundCell = Readonly<{
	id: string;
	target: SkyVolumeJ2Target;
	groups: readonly SkyVolumeJ2Group[];
	nodes: readonly SkyVolumeJ2Node[];
	rows: readonly SkyVolumeJ2Row[];
}>;
type SkyAngularBackgroundInput = Readonly<{
	spec: SkyTransportSpec;
	cells: readonly SkyAngularBackgroundCell[];
	identities: readonly DialFileIdentity[];
}>;
/** Authenticated factorial document; rows share the target order. */
type SkyAngularBackgroundDocument = SkyVolumeJ2Document & Readonly<{cases?: readonly SkyVolumeJ2Case[]}>;
type SkyAngularBackgroundEncoding = Readonly<{uncompressedByteLength: number; uncompressedSha256: string}>;
type SkyAngularBackgroundPart = 'atmosphereRayleigh' | 'atmosphereMie' | 'groundRayleigh' | 'groundMie' | 'combined';
type SkyAngularBackgroundComponent = Readonly<{
	cell: string;
	channel: number;
	component: SkyAngularBackgroundPart;
	constant: SkySourceReconstructionValue;
	phaseMass: SkySourceReconstructionValue;
	normalization: SkySourceReconstructionValue;
	quadrature: SkySourceReconstructionValue;
	background: SkySourceReconstructionValue;
	directional: SkySourceReconstructionValue;
}>;
type SkyAngularBackgroundResponse = Readonly<{
	channel: number;
	component: SkyAngularBackgroundPart;
	response: string;
	total: SkySourceReconstructionValue;
	background: SkySourceReconstructionValue;
	directional: SkySourceReconstructionValue;
	identityResidual: number;
	backgroundSmall: SkySourceAuditState | null;
}>;
