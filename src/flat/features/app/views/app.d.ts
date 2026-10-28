/** Public registry contract implemented by the AppView application service. */
interface AppView extends EventBus {
	/**
	 * Call this method to read the current application-shell presentation state.
	 *
	 * @returns - The getShellState operation result.
	 */
	getShellState(): AppShellState;
	/**
	 * Call this method to request that the application select and mount a page.
	 *
	 * @param pageId - The pageId value required by this operation.
	 * @returns - The requestPage operation result.
	 */
	requestPage(pageId: string): AppPageRecord | null;
	/**
	 * Call this method to create the service-owned React presentation.
	 *
	 * @param props - The props value required by this operation.
	 * @returns - The getComponent operation result.
	 */
	getComponent(props?: Record<string, unknown>): import('react').ReactElement;
}
