/** Standard chart forms supported by the bounded renderer.
 * - **"line"** - Join ordered samples with straight lines and point markers.
 * - **"point"** - Show independent samples with unconnected markers.
 * - **"column"** - Compare signed values using grouped vertical columns.
 */
type SkyClosurePlotKind = 'line' | 'point' | 'column';
/** A scientific plot rendered by the installed Windows charting library. */
type SkyClosurePlotRequest = Readonly<{
	/** Output-local PNG filename. */ name: string;
	/** Visible scientific question and scope. */ title: string;
	/** Short visible qualification or selector note. */ description: string;
	/** Horizontal axis quantity. */ xLabel: string;
	/** Vertical axis quantity, including physical units. */ yLabel: string;
	/** Standard chart form; line is the default. */ kind?: SkyClosurePlotKind;
	/** Complete finite values; missing samples must not be represented as zero. */ series: readonly Readonly<{
		/** Legend label identifying the exact selector. */ label: string;
		/** Explicit horizontal coordinates. */ x: readonly number[];
		/** Explicit vertical values. */ y: readonly number[];
	}>[];
	/** Optional exact coordinate labels, for example observation times. */ xTicks?: readonly Readonly<{
		/** Exact horizontal coordinate. */ value: number;
		/** Visible label. */ label: string;
	}>[];
	/** Direct immutable numerical evidence. */ sources: readonly DialFileIdentity[];
	/** Scope inherited from the producing analysis. */ scope: string;
	/** Report caption with the interpretation limit. */ caption: string;
	/** Opaque scientific selectors/equations retained verbatim by the evidence owner. */ provenance?: unknown;
}>;
/** Exact installed plotting binaries; these are read-only tools, not repository inputs. */
type SkyClosurePlotTools = Readonly<{
	/** Hidden PowerShell host. */ powershell: DialContinuationToolIdentity;
	/** Standard .NET charting implementation. */ charting: DialContinuationToolIdentity;
}>;
/** Encoded child-process response, validated before accepting an image. */
type SkyClosurePlotResponse = Readonly<{
	/** Closed output schema. */ schemaId: 'sky-standard-plot-v1';
	/** Complete PNG represented for pipe transport only. */ base64: string;
	/** Actual loaded tool identities. */ tool: SkyClosurePlotTools;
}>;
/** Standard-library output retained directly by the owning immutable run. */
type SkyClosureRenderedPlot = Readonly<{
	/** Exact standalone PNG bytes. */ contents: Buffer;
	/** Exact rendering tool provenance. */ tool: SkyClosurePlotTools;
	/** Authenticated experiment-owned renderer source. */ renderer: DialFileIdentity;
	/** Explicit image encoding. */ format: 'png';
}>;
