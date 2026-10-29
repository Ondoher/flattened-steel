/**
 * Workspace presentation projection and intent relay.
 */
export interface WorkspaceView extends EventBus {
	/**
	 * Call this method to read the workspace presentation projected from controller state.
	 *
	 * @returns - Workspace hosts, page choices, contributed content, and configuration scope.
	 */
	getShellState(): WorkspaceShellState;

	/**
	 * Call this method to request a registered page in an explicit open view.
	 *
	 * @param pageId - Registered page definition to select.
	 * @param viewId - Open view receiving the selection.
	 * @returns - Selected page metadata, or null when no page is selected.
	 */
	requestPage(pageId: string, viewId: string): AppPageRecord | null;

	/**
	 * Call this method to request opening or closing the optional comparison view.
	 */
	toggleComparison(): void;

	/**
	 * Call this method to request closure of the matching optional view.
	 *
	 * @param viewId - Exact optional-view identity; stale identities have no effect.
	 */
	closeView(viewId: string): void;

	/**
	 * Call this method to release the owned controller update listener at application shutdown.
	 */
	stop(): void;

	/**
	 * Call this method to request a change in configuration-panel visibility.
	 */
	toggleConfiguration(): void;

	/**
	 * Call this method to request workspace-wide or open-view configuration scope.
	 *
	 * @param viewId - Open-view identity, or null for workspace-wide configuration.
	 */
	selectConfigurationTarget(viewId: string | null): void;

	/**
	 * Call this method to create the workspace shell using this view's presentation state.
	 *
	 * @param props - Optional presentation properties supplied by the mounting owner.
	 * @returns - Workspace shell element bound to this view.
	 */
	getComponent(props?: object): React.ReactElement;
}
