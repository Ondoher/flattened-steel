/** Authenticated preceding transmission case, including all independent passes. */
type SkyColumnBaseline = Readonly<{
	document: Readonly<{
		schemaId: 'sky-transmission-reconstruction-v1';
		rows: SkySourcePhaseRow[];
		groups: SkySourceReconstructionGroup[];
	}>;
	crosses: readonly SkyTransmissionCross[];
	identities: readonly DialFileIdentity[];
}>;
type SkyColumnMode = 'linear' | 'factored' | 'adjusted';
