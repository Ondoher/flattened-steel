/** Narrow TypeScript AST traversal capability; no production code is evaluated. */
interface SkyContractSyntaxNode {
	/** Installed TypeScript syntax-kind identifier. */ readonly kind: number;
	/** Exclusive UTF-16 end offset into the original source text. */ readonly end: number;
	/** Locate the token start while excluding preceding comments/JSDoc. */ getStart(
		source: SkyContractSourceFile,
		includeJsDoc: boolean,
	): number;
}

/** Parsed JavaScript source exposed only to the parity serializer. */
interface SkyContractSourceFile extends SkyContractSyntaxNode {
	/** Parser errors; any nonempty array rejects the source before comparison. */ readonly parseDiagnostics: readonly unknown[];
}

/** Installed TypeScript printer with comments explicitly disabled. */
interface SkyContractPrinter {
	/** Serialize one parsed source without evaluating or transforming its code. */ printFile(
		source: SkyContractSourceFile,
	): string;
}

/** Fixed printer options used identically for historical/current/control sources. */
type SkyContractPrinterOptions = Readonly<{
	/** Required exclusion of comments and JSDoc. */ removeComments: boolean;
	/** Installed TypeScript LF enum value. */ newLine: number;
}>;

/** Minimal authenticated TypeScript module capability used by the proof. */
interface SkyContractTypeScript {
	/** Runtime package version, checked against package.json. */ readonly version: string;
	/** Installed parser target constants. */ readonly ScriptTarget: Readonly<Record<string, number>>;
	/** Installed source-kind constants. */ readonly ScriptKind: Readonly<Record<string, number>>;
	/** Installed printer line-ending constants. */ readonly NewLineKind: Readonly<Record<string, number>>;
	/** Installed syntax-kind names and reverse enum entries. */ readonly SyntaxKind: Readonly<
		Record<string, string | number>
	>;
	/** Parse source as JavaScript without evaluating it. */ createSourceFile(
		name: string,
		text: string,
		target: number,
		setParentNodes: boolean,
		kind: number,
	): SkyContractSourceFile;
	/** Construct the comment-free deterministic printer. */ createPrinter(
		options: SkyContractPrinterOptions,
	): SkyContractPrinter;
	/** Visit syntax children; callbacks return void so traversal cannot short-circuit. */ forEachChild(
		node: SkyContractSyntaxNode,
		visitor: (child: SkyContractSyntaxNode) => void,
	): void;
}

/** Exact original literal token and its location, retained only in memory. */
type SkyContractLiteral = Readonly<{
	/** Canonical literal syntax-kind name. */ kind: string;
	/** Exact token text including delimiters, escapes, shader whitespace and newlines. */ raw: string;
	/** UTF-16 start offset used only to construct in-memory negative controls. */ start: number;
	/** Exclusive UTF-16 end offset; offsets are excluded from parity comparison. */ end: number;
}>;

/** Runtime serialization and raw literal inventory, never executable output. */
type SkyContractSerialization = Readonly<{
	/** TypeScript printer output with comments removed. */ printed: string;
	/** Ordered raw tokens; comments/JSDoc are not traversed. */ literals: readonly SkyContractLiteral[];
	/** Number of syntax nodes visited without early termination. */ nodeCount: number;
}>;

/** Compact hashes and counts of one source's runtime representation. */
type SkyContractSerializationSummary = Readonly<{
	/** SHA-256 of the comment-free printed UTF-8 source. */ printerSha256: string;
	/** Number of UTF-8 bytes in the printer output. */ printerByteLength: number;
	/** SHA-256 of ordered JSON {kind,raw} tokens, excluding positions. */ literalSha256: string;
	/** Number of exact raw literal tokens. */ literalCount: number;
	/** Number of syntax nodes visited. */ nodeCount: number;
	/** Token counts grouped by the eight explicit literal kinds. */ countsByKind: Readonly<Record<string, number>>;
}>;

/** One deliberately altered in-memory source rejected by the real parity checks. */
type SkyContractNegativeControl = Readonly<{
	/** Concrete attempted executable/literal change. */ operation: string;
	/** Hash of the altered source; the source is never evaluated. */ alteredSourceSha256: string;
	/** Whether comment-free printer equality rejects this candidate. */ rejectedByPrinter: boolean;
	/** Whether exact raw-literal equality rejects this candidate. */ rejectedByLiterals: boolean;
}>;

/** Verified TypeScript package/implementation and actual registered Node identity. */
type SkyContractProofTools = Readonly<{
	/** Exact actual executable identity from C0, reauthenticated before and after work. */ node: DialContinuationToolIdentity;
	/** Installed TypeScript package metadata. */ typeScriptPackage: DialFileIdentity;
	/** Exact parser/printer implementation loaded by Node. */ typeScriptImplementation: DialFileIdentity;
	/** Runtime and package versions must agree. */ typeScriptVersion: string;
}>;

/** Immutable contract-only proof report; no production module or shader is executed. */
type SkyContractParityReport = Readonly<{
	/** Distinct contract-only proof identity. */ schemaId: 'sky-continuation-contract-parity-v1';
	/** Original compiler identity declared by the accepted H GPU capture. */ historicalCompiler: DialFileIdentity;
	/** Exact historical source snapshot consumed as data. */ historicalSnapshot: DialFileIdentity;
	/** Current compiler source identity, captured only at execution time. */ currentCompiler: DialFileIdentity;
	/** Current adjacent ambient contract identity. */ currentTypes: DialFileIdentity;
	/** Historical comment-free/literal hashes and full traversal counts. */ historical: SkyContractSerializationSummary;
	/** Current hashes and counts, required to match the historical values. */ current: SkyContractSerializationSummary;
	/** Whether both production source comparisons passed. */ executableParity: boolean;
	/** Synthetic all-literal fixture traversal and comment-only positive control. */ manufacturedLiteralKinds: readonly string[];
	/** Rejections of numeric, shader-text and raw-escape mutations. */ negativeControls: readonly SkyContractNegativeControl[];
	/** Malformed template syntax must be rejected before serialization. */ malformedSourceRejected: boolean;
	/** Authenticated independent-reference control retained in 00109. */ physicalControl: DialFileIdentity;
	/** Exact expanded policy, deep-equal to the historical control. */ physicalPolicy: SkyPhysicalReferencePolicy;
	/** Hash of the policy value, independent of Object.freeze or source formatting. */ physicalPolicySha256: string;
	/** Existing manufactured physical/reference admission checks on current source. */ physicalManufacturedProof: SkyPhysicalReferenceProof;
	/** Exact parser/runtime tool chain. */ tools: SkyContractProofTools;
	/** Explicit limits of comment/type-only verification. */ limitations: readonly string[];
}>;
