/**
 * Application presentation supplied through its controller.
 */
export interface AppView extends EventBus {
	/**
	 * Call this method to release the owned controller update listener.
	 */
	stop(): void;

	/**
	 * Call this method to project canonical context and activated content through the owning controller.
	 *
	 * @returns - Application context and concrete shell presentation.
	 */
	getState(): AppPresentationState;

	/**
	 * Call this method to create the root application presentation bound to this view.
	 *
	 * @param props - Optional presentation properties supplied by the executor.
	 * @returns - Application root element with its initial view projection.
	 */
	getComponent(props?: object): React.ReactElement;
}
