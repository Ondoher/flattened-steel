/**
 * Presentation state and intent capability.
 */
export interface SphericalEarthView extends EventBus {
	/**
	 * Call this method to construct feature-owned presentation.
	 *
	 * @param viewId - Exact view identity.
	 * @returns - Mountable page presentation.
	 */
	getComponent(viewId: string): React.ReactElement;

	/**
	 * Call this method to read a view's presentation facts.
	 *
	 * @param viewId - Exact view identity.
	 * @returns - Current presentation state.
	 */
	getState(viewId: string): SphericalEarthPageState;

	/**
	 * Call this method to relay an independent retry intent.
	 *
	 * @param viewId - Exact view identity.
	 */
	retry(viewId: string): void;
}
