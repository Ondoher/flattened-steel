/**
 * Registered per-view state and solar-angle capability.
 */
export interface SphericalEarthModel extends EventBus {
	/**
	 * Call this method to read one view's current state.
	 *
	 * @param viewId - Exact view identity.
	 * @returns - Defensive presentation snapshot.
	 */
	get(viewId: string): SphericalEarthPageState;

	/**
	 * Call this method to accept one view's state.
	 *
	 * @param viewId - Exact view identity.
	 * @param state - Complete presentation facts.
	 */
	set(viewId: string, state: SphericalEarthPageState): void;

	/**
	 * Call this method to release a retired view.
	 *
	 * @param viewId - Exact view identity.
	 */
	remove(viewId: string): void;

	/**
	 * Call this method to derive cache selection from shared physical inputs.
	 *
	 * @param configuration - Accepted location and absolute time.
	 * @returns - Solar zenith in degrees, or null until inputs exist.
	 */
	getSolarZenith(configuration: ApplicationConfiguration): number | null;
}
