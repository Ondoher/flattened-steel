/** Authenticated saved arrays remain in memory and are never copied into new evidence. */
type SkyThetaRegionsRead = Readonly<{
	input: SkyAngularThetaInput;
	pilot: SkyAngularThetaDocument;
	pilotNodes: readonly SkyVolumeJ2Node[];
	fine: SkyAngularThetaDocument;
	fineNodes: readonly SkyVolumeJ2Node[];
	assessment: Readonly<{seal: DialFileIdentity; artifact: DialFileIdentity}>;
	identities: readonly DialFileIdentity[];
}>;
type SkyThetaRegionsRetainedThetaInput = Readonly<{
	target: SkyVolumeJ2Target;
	channels: readonly [0, 8];
	mu16: readonly SkyVolumeJ2Row[];
	radial32: readonly SkyVolumeJ2Row[];
	radial64: readonly SkyVolumeJ2Row[];
	analyticReplay: SkyAngularThetaReplay;
	identities: readonly DialFileIdentity[];
}>;
type SkyThetaRegionsTerminal = SkyMechanismTerminal &
	Readonly<{
		recipe: SkyMechanismTerminalRecipe &
			Readonly<{
				parameters: SkyMechanismTerminalParameters & Readonly<{packageId?: string}>;
			}>;
	}>;
type SkyThetaRegionsRunResult = Readonly<{run: string; seal: DialFileIdentity}>;

type SkyThetaRegionsParentParameters = SkyAngularThetaTerminal['recipe']['parameters'] &
	Readonly<{node: DialContinuationToolIdentity}>;
