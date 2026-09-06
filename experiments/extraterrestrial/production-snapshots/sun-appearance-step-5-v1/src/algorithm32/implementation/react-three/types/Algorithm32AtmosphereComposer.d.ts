/** Renderer setup values used by the default composer binding-value constructor. */
type Algorithm32DefaultBindingValuesRequest = {
	/** Three namespace used to construct mutable binding values. */
	readonly THREE: Algorithm32BindingsThreeNamespace;
	/** Active composer properties required by binding-value construction. */
	readonly props: {
		/** Optional geometry-owned scene-depth cap. */
		readonly sceneDepthMax: Distance | null;
	};
};

/** Required-object packet accepted from a default or caller-provided adapter constructor. */
type Algorithm32RequiredObjectsPacket = Readonly<Record<string, unknown>> & {
	/** Combined scene objects in deterministic owner order. */
	readonly objects: readonly unknown[];
};
