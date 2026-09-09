/** Parsed command-line values accepted by the experiment scaffold helper. */
type ExperimentScaffoldArguments = {
	/** Repository root supplied by the caller. */
	repo?: string;
	/** Optional requested five-digit sequence prefix. */
	prefix?: string;
	/** Descriptive experiment slug. */
	slug?: string;
	/** Human-readable experiment title. */
	title?: string;
	/** One-sentence experiment objective. */
	objective?: string;
	/** Initial experiment acceptance question. */
	acceptance?: string;
	/** Whether the helper validates an existing scaffold. */
	check?: boolean;
};

/** Repository paths owned or inspected by one experiment scaffold. */
type ExperimentScaffoldPaths = {
	/** Real repository root. */
	repoRoot: string;
	/** Experiment topic root. */
	topicRoot: string;
	/** Authored experiment source root. */
	sourceRoot: string;
	/** Generated experiment output root. */
	outputRoot: string;
	/** Topic entry document. */
	topicReadme: string;
	/** Experiment design document. */
	design: string;
	/** Experiment plan document. */
	plan: string;
	/** Experiment status document. */
	status: string;
	/** Source-root instruction document. */
	sourceInstructions: string;
};

/** Folder standards assignment returned for an experiment source root. */
type ExperimentStandardsAssignment = {
	/** Selected standards-set name. */
	set: string;
};

/** Shared fields for generated experiment documents. */
type ExperimentDocumentOptions = {
	/** Human-readable experiment title. */
	title: string;
	/** Allocated experiment folder identity. */
	experimentFolder: string;
};

/** Fields used to generate an experiment topic entry. */
type ExperimentTopicOptions = ExperimentDocumentOptions & {
	/** One-sentence experiment objective. */
	objective: string;
};

/** Fields used to generate an experiment design. */
type ExperimentDesignOptions = ExperimentTopicOptions & {
	/** Initial experiment acceptance question. */
	acceptance: string;
	/** Resolved output and run contract. */
	outputContract: string;
};

/** Fields used to generate an experiment plan. */
type ExperimentPlanOptions = {
	/** Human-readable experiment title. */
	title: string;
	/** Initial experiment acceptance question. */
	acceptance: string;
};
