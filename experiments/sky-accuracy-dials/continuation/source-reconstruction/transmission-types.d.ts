/** Exact replay boundary for the preceding phase attribution. */
type SkyTransmissionBaseline = Readonly<{
	document: Readonly<{
		schemaId: 'sky-phase-reconstruction-v1';
		rows: SkySourcePhaseRow[];
		groups: SkySourceReconstructionGroup[];
	}>;
	identities: readonly DialFileIdentity[];
}>;
/** A new independent source column at query solar cosine and original altitude. */
type SkyTransmissionCross = Readonly<{
	probeId: string;
	sampleIndex: number;
	planeIndex: number;
	altitudeMeters: number;
	solarCosine: number;
	geometry: SkySourceAuditGeometry;
	passes: readonly SkySourceAuditPass[];
	references: readonly SkySourceAuditReference[];
}>;
