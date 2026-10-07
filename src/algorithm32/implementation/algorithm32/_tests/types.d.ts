/** Externally settled build operation for shader ownership and supersession checks. */
type ShaderHandleDeferredBuildResult = {
	/** Build completion observed by the handle. */ promise: Promise<ShaderBuildResult>;
	/** Complete the pending build with its owned resources. */ resolve: (value: ShaderBuildResult) => void;
};
