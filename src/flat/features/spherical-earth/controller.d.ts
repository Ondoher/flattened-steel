/**
 * Scoped page workflow capability.
 */
export interface SphericalEarthController extends EventBus, WorkspacePageController {
	/**
	 * Call this method to read one view's state.
	 *
	 * @param viewId - Exact mounted view.
	 * @returns - Model-owned presentation facts.
	 */
	getState(viewId: string): SphericalEarthPageState;

	/**
	 * Call this method to retry one independent subscriber.
	 *
	 * @param viewId - Exact mounted view.
	 */
	retry(viewId: string): void;
}
