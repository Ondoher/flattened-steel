/**
 * Application-level activation and navigation capability.
 */
export interface AppController extends EventBus {
	/**
	 * Call this method to activate the configured workspace and reconcile routing after registry readiness.
	 */
	activate(): void;

	/**
	 * Call this method to release routing listeners and the activated workspace.
	 */
	stop(): void;

	/**
	 * Call this method to select a registered page through the public workspace mounting capability.
	 *
	 * @param pageId - Registered page definition to select.
	 * @param options - Optional target view and primary-view history behavior.
	 * @returns - Selected page metadata, or null when no page is selected.
	 */
	requestPage(pageId: string, options?: AppPageOptions): AppPageRecord | null;

	/**
	 * Call this method to read activated content and canonical application context without mounting.
	 *
	 * @returns - Current application context and activated feature content.
	 */
	getState(): AppState;

	/**
	 * Call this method to obtain application presentation through its owning view.
	 *
	 * @param props - Optional presentation properties supplied to the application view.
	 * @returns - Application root element.
	 */
	getComponent(props?: object): React.ReactElement;
}
