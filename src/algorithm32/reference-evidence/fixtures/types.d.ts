/**
 * Point to the exact part of a production reference that supports one
 * implementation decision, fixture row, expected value, or validation claim.
 */
type Algorithm32ProductionReferencePointer = {
	/** Value that stores the AMA-style numbered reference entry from references.md. */
	referenceNumber: number;

	/** Value that stores a stable local source identifier when one exists. */
	sourceId?: string;

	/** Value that stores the section or chapter locator inside the referenced source. */
	section?: string;

	/** Value that stores the equation locator inside the referenced source. */
	equation?: string;

	/** Value that stores the figure locator inside the referenced source. */
	figure?: string;

	/** Value that stores the table locator inside the referenced source. */
	table?: string;

	/** Value that stores the row, record, wavelength, or dataset-entry locator inside the referenced source. */
	row?: string;

	/** Value that stores the page, line, or local artifact locator when that is the clearest way to find the cited fact. */
	locator?: string;

	/** Value that stores a local curated artifact path when the exact referenced data lives in a checked-in artifact. */
	localArtifactPath?: string;

	/** Explanation of how this precise locator supports the cited decision or expected value. */
	note?: string;
};

/** Bracketed production-reference citation and its source-text offset. */
type ProductionFixtureCitationGroup = Readonly<{
	/** Decimal reference-number text inside the citation brackets. */
	value: string;
	/** Zero-based source-text offset of the opening citation bracket. */
	index: number;
}>;

/**
 * Review state of a production fixture ledger.
 *
 * - **"draft"** - The ledger has a normalized production shape but rows may
 *   still change before implementation consumes them.
 * - **"accepted"** - The ledger rows are approved for production implementation
 *   and tests.
 */
type ProductionFixtureLedgerStatus = 'draft' | 'accepted';

/** Type that describes a checked-in production fixture ledger. */
type ProductionFixtureLedger = {
	/** Value that identifies the JSON fixture family. */
	kind: 'algorithm32-production-fixture-ledger';

	/** Value that identifies this ledger instance. */
	id: string;

	/** Value that describes the review state of the ledger. */
	status: ProductionFixtureLedgerStatus;

	/**
	 * Preserve the source fixture or artifact path used to promote these rows.
	 */
	sourcePath?: string;

	/** Value that describes the fixture family and promotion scope. */
	description: string;

	/** Value that stores the source-backed expectation rows. */
	rows: readonly ProductionFixtureRow[];
};

/** Type that describes one source-backed fixture expectation row. */
type ProductionFixtureRow = {
	/** Value that identifies the row with a stable dotted id. */
	id: string;

	/**
	 * Group the row by the transport or support area it exercises.
	 */
	area: string;

	/**
	 * Name the physical or algorithm quantity under test.
	 */
	quantity: string;

	/**
	 * Summarize the source-backed fact using bracket citations.
	 */
	citation: string;

	/**
	 * Point to precise locations in the numbered production reference list.
	 */
	references: readonly Algorithm32ProductionReferencePointer[];

	/** Value that stores human-reviewable assumptions for the row. */
	assumptions: unknown;

	/** Value that stores the input packet or calculation factors for the row. */
	input: unknown;

	/** Value that stores the expected values for successful rows. */
	expected?: Record<string, ProductionFixtureExpectedValue>;

	/** Value that stores the expected error for loud-failure rows. */
	expectedError?: ProductionFixtureError;

	/** Value that stores the tolerance rule by expected-value name. */
	tolerance?: Record<string, ProductionFixtureTolerance>;

	/** Explanation of why the expected value is independent of the production implementation. */
	independence: string;
};

/** Type that describes one expected fixture value. */
type ProductionFixtureExpectedValue = {
	/** Value that stores the expected scalar, array, object, or literal value. */
	value: unknown;

	/** Value that stores the physical or fixture unit label for the expected value. */
	units: string;

	/** Explanation of the hand calculation, source row, or external-tool result behind the expected value. */
	derivation: string;
};

/** Type that describes one expected fixture error. */
type ProductionFixtureError = {
	/** Value that stores the expected JavaScript error class or Algorithm32 error code. */
	type: string;

	/** Value that stores required message fragments or structured error details. */
	messageIncludes?: readonly string[];

	/** Explanation of why the source-backed row should fail loudly. */
	derivation: string;
};

/**
 * Comparison mode for one production-fixture expected value.
 *
 * - **"exact"** - Exact structural or scalar equality.
 * - **"absolute"** - Numeric agreement within an absolute threshold.
 * - **"relative"** - Numeric agreement within a relative threshold.
 */
type ProductionFixtureToleranceMode = 'exact' | 'absolute' | 'relative';

/** Type that describes how a production fixture expected value should be compared. */
type ProductionFixtureTolerance = {
	/** Value that stores the tolerance comparison mode. */
	mode: ProductionFixtureToleranceMode;

	/** Value that stores the numeric tolerance threshold for approximate comparisons. */
	value?: number;
};
