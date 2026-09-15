/** Only the pilot, fine and historical analytic-replay pairs are admitted. */
type SkyThetaPolarCount = 16 | 32;
type SkyThetaAzimuthCount = 32 | 64;
/** Synthetic geometry evidence contains no physical incident evaluations. */
type SkyThetaGeometryProof = Readonly<{checks: number; scope: string}>;
