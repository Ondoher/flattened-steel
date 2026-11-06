/**
 * Public workspace host, composition, and feature-lifetime capability.
 */
export interface WorkspaceController extends EventBus {
	/**
	 * Call this method to obtain workspace presentation through its owning view.
	 *
	 * @param props - Optional presentation properties supplied to the workspace view.
	 * @returns - Workspace shell element.
	 */
	mount(props?: object): React.ReactElement;

	/**
	 * Call this method to release workspace listeners, view mediation, and mounted feature lifetimes.
	 */
	unmount(): void;

	/**
	 * Call this method to read canonical workspace facts and owned mount results for view projection.
	 *
	 * @returns - Workspace state and mounted content, without presentation-host grouping.
	 */
	getState(): WorkspaceState;

	/**
	 * Call this method to mount a registered definition in an independently identified view.
	 *
	 * @param pageId - Registered page definition to mount.
	 * @param viewId - Target open-view identity; omission selects the primary view.
	 * @returns - Selected page metadata, or null for a missing or empty target.
	 * @throws {Error} - The page owner fails to mount; its partial lifetime is released.
	 */
	mountPage(pageId: string, viewId?: string): AppPageRecord | null;

	/**
	 * Call this method to relay page selection through application-owned navigation.
	 *
	 * @param pageId - Registered page definition to select.
	 * @param viewId - Explicit open-view identity receiving the selection.
	 * @returns - Selected page metadata, or null when no page is selected.
	 */
	requestPage(pageId: string, viewId: string): AppPageRecord | null;

	/**
	 * Call this method to identify the primary host for application routing.
	 *
	 * @returns - Stable primary-view identity.
	 */
	getPrimaryViewId(): string;

	/**
	 * Call this method to display application-owned empty or unknown-route state in the primary host.
	 *
	 * @param notFound - Whether the application route is unknown; defaults to false.
	 */
	clearPrimary(notFound?: boolean): void;

	/**
	 * Call this method to open a fresh optional view or close the existing comparison view.
	 */
	toggleComparison(): void;

	/**
	 * Call this method to close only the matching optional-view lifetime.
	 *
	 * @param viewId - Exact optional-view identity; primary and stale identities have no effect.
	 * @returns - Whether the optional view was removed.
	 */
	closeView(viewId: string): boolean;

	/**
	 * Call this method to toggle visibility of the nonmodal workspace configuration host.
	 */
	toggleConfiguration(): void;

	/**
	 * Call this method to select workspace-wide or open-view configuration scope.
	 *
	 * @param viewId - Open-view identity, or null for workspace-wide configuration.
	 */
	selectConfigurationTarget(viewId: string | null): void;

	/**
	 * Call this method to select a registered settings section.
	 *
	 * @param section - Contribution identity.
	 */
	selectConfigurationSection(section: string): void;

	/**
	 * Call this method to open settings without depending on provider implementation.
	 *
	 * @param target - Shared scope or exact view identity.
	 * @param section - Optional registered section.
	 * @param focus - Optional provider-owned focus intent.
	 */
	openConfiguration(target: string | null, section?: string | null, focus?: string | null): void;
}
