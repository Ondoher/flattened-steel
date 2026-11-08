/**
 * Narrow Polylith build capability, separate from runtime registry services.
 */
type SphericalEarthBuildApplication = {
	/**
	 * Effective standalone or parent-owned output directory.
	 */
	destPath: string;

	/**
	 * Call this method to register the feature's runtime entry.
	 *
	 * @param index - Source-root-relative feature entry.
	 */
	addFeatureIndex(index: string): void;

	/**
	 * Call this method to register feature-owned CSS assets.
	 *
	 * @param root - Source-root-relative feature directory.
	 * @param specs - Owned CSS asset descriptors.
	 */
	addMainCss(root: string, specs: {cwd: string; glob: string; dest: string; keepNest: boolean}[]): void;
};
