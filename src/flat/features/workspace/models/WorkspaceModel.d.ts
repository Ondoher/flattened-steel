/**
 * Registered feature-owned WorkspaceModel capability.
 */
export interface WorkspaceModel extends EventBus {
	/**
	 * Call this method to initialize local model state before dependency readiness.
	 */
	start(): void;

	/**
	 * Call this method to read a defensive composition snapshot.
	 *
	 * @returns - Current workspace facts without presentation or scene state.
	 */
	getSnapshot(): WorkspaceSnapshot;

	/**
	 * Call this method to select a registered page in an existing view.
	 *
	 * @param viewId - Stable open-view identity.
	 * @param pageId - Registered definition or an empty view.
	 * @throws {Error} - The view is no longer open.
	 */
	selectPage(viewId: string, pageId: string | null): void;

	/**
	 * Call this method to open an optional second view with a fresh identity.
	 *
	 * @param pageId - Initial registered definition, without copied scene state.
	 * @returns - New open view, or no change when comparison is already open.
	 */
	addView(pageId?: string | null): WorkspaceViewRecord | null;

	/**
	 * Call this method to close the optional view while preserving the primary view.
	 *
	 * @param viewId - Optional-view identity.
	 * @returns - Whether an open optional view was removed.
	 */
	removeView(viewId: string): boolean;

	/**
	 * Call this method to set routed not-found state for the primary view.
	 *
	 * @param notFound - Whether the URL identifies an unavailable page.
	 */
	setNotFound(notFound: boolean): void;

	/**
	 * Call this method to open or close the shared configuration surface.
	 *
	 * @param open - Requested presentation state.
	 */
	setConfigurationOpen(open: boolean): void;

	/**
	 * Call this method to select workspace or view-scoped configuration.
	 *
	 * @param target - Open view identity, or workspace scope.
	 * @throws {Error} - The target view is no longer open.
	 */
	setConfigurationTarget(target: string | null): void;

	/**
	 * Call this method to select a registered section and optional provider focus intent.
	 *
	 * @param section - Contribution identity.
	 * @param focus - Provider-owned editor key.
	 */
	setConfigurationSection(section: string | null, focus?: string | null): void;
}
