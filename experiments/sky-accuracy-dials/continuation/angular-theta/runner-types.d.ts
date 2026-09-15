import type {Buffer} from 'node:buffer';

declare global {
	/** The numerical stages have one final assessment that closes this package. */
	type SkyAngularThetaCommand = SkyAngularThetaStage | 'assess';
	type SkyAngularThetaTerminal = SkyMechanismTerminal &
		Readonly<{
			recipe: SkyMechanismTerminalRecipe &
				Readonly<{
					parameters: SkyMechanismTerminalParameters &
						Readonly<{
							packageId: 'angular-theta-attribution-v1';
							extensionId: 'compensation-attribution-v1';
							extensionStage: string;
							stage: SkyAngularThetaCommand;
							pilotRun: string | null;
							candidate: SkyAngularThetaCase | null;
							sourceIdentities: readonly DialFileIdentity[];
						}>;
				}>;
			result: Readonly<{jobElapsedMilliseconds: number; failure?: string | null}>;
		}>;
	/** A failed or assessment record may contain no reference document. */
	type SkyAngularThetaRunEntry = Readonly<{
		run: string;
		seal: DialFileIdentity;
		terminal: SkyAngularThetaTerminal;
		retainedBytes: number;
		document?: SkyAngularThetaDocument;
	}>;
	type SkyAngularThetaStageRecord = Readonly<{
		terminal: Readonly<{recipe: Readonly<{parameters: Readonly<{stage: SkyAngularThetaCommand}>}>}>;
	}>;
	type SkyAngularThetaAssessmentEntry = Readonly<{
		terminal: Readonly<{
			state: string;
			recipe: Readonly<{parameters: Readonly<{stage: SkyAngularThetaCommand}>}>;
		}>;
		document?: SkyAngularThetaDocument;
	}>;
	type SkyAngularThetaUsageEntry = Readonly<{
		retainedBytes: number;
		terminal: Readonly<{result: Readonly<{jobElapsedMilliseconds: number}>}>;
	}>;
	type SkyAngularThetaRunnerProof = Readonly<{checks: number; scope: string}>;
	type SkyAngularThetaSourceSnapshot = Readonly<{
		sources: readonly DialFileIdentity[];
		delta: readonly DialFileIdentity[];
		baseSnapshot: DialFileIdentity;
	}>;
	/** Read-only preparation; the immutable run and workers do not yet exist. */
	type SkyAngularThetaPreparation = Readonly<{
		started: number;
		registration: DialContinuationRegistrationRead;
		entries: readonly SkyAngularThetaRunEntry[];
		usage: SkyAngularFramePackageUsage;
		input: SkyAngularThetaInput;
		plan: DialFileIdentity;
		planBytes: Buffer;
		snapshot: SkyAngularThetaSourceSnapshot;
		packed: Buffer;
		sourceBytes: Buffer;
		candidate: SkyAngularThetaCase | null;
		expectedCount: number;
		sealReserveBytes: number;
		forecast: SkyAngularFrameForecast;
		allocatedBytes: number;
		maximumJobMilliseconds: number;
		parents: readonly DialFileIdentity[];
		caseId: string;
		recipe: DialDerivation;
	}>;
	type SkyAngularThetaRunResult = Readonly<{
		run: string;
		seal: DialFileIdentity;
		matrixComplete: boolean | null;
	}>;
}
