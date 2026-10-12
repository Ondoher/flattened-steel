/** Implementation-private proof setup; expected factors never enter production construction. */
type LocalSunNormalizationSetup = Readonly<{
	/** Actual production geometry capability. */ geometry: LocalSunCompactReconstructionGeometry;
	/** Candidate topology from physical input controls. */ topology: FlatCompactTopology;
	/** Unchanged physical medium owner. */ atmosphere: AtmosphereModel;
	/** Authenticated independent spatial control, used only by comparisons. */ p0: LocalSunP0Fixture;
}>;
