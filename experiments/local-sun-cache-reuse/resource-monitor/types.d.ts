/** Read-only process facts returned by the fixed Windows CIM query. */
type LocalSunCimProcess = {
	/** Operating-system process identifier. */ ProcessId: number;
	/** Identifier of the creating process. */ ParentProcessId: number;
	/** Process-private allocated memory, bytes. */ PrivatePageCount: number | string;
	/** Resident memory, bytes; includes shared pages. */ WorkingSetSize: number | string;
	/** CIM creation time serialized by the installed PowerShell runtime. */ CreationDate: string;
};

/** Script-owned lifetime for sequential, fail-closed Windows resource sampling. */
interface LocalSunScriptResourceSampler {
	/** Measure this wrapper and live owned descendants; previously observed roots may exit between samples. */
	sample(rootPid: number): Promise<LocalSunHostResourceSample>;
	/** Abort and await any current query; subsequent requests reject. */
	stop(): Promise<void>;
}
