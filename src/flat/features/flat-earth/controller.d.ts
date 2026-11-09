/**
 * Public scoped Flat Earth controller capability.
 */
export interface FlatEarthController extends EventBus {
	/**
	 * Call this method to stop subscriptions and retire all view and startup resources.
	 *
	 * @returns - Completion before shared providers can be released.
	 */
	stop(): Promise<void>;

	/**
	 * Call this method to read scoped scene preparation state.
	 *
	 * @param viewId - Exact workspace view identity.
	 * @returns - Disposable scene-state snapshot.
	 */
	getState(viewId: string): FlatEarthSceneState;

	/**
	 * Call this method to select one view's sky presentation through its owning boundary.
	 *
	 * @param viewId - Exact owning view.
	 * @param mode - Supported composition selection.
	 */
	setSkyRenderMode(viewId: string, mode: FlatEarthSkyRenderMode): void;

	/**
	 * Call this method to obtain the retained graphics surface for a mounted view.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @returns - Feature-owned canvas for the React-owned host.
	 */
	getCanvas(viewId: string): HTMLCanvasElement;

	/**
	 * Call this method to relay attachment of one mounted scene surface.
	 *
	 * @param viewId - Exact workspace view identity.
	 * @param canvas - Mounted React-owned scene surface.
	 */
	attach(viewId: string, canvas: HTMLCanvasElement): void;

	/**
	 * Call this method to release only the original scene surface.
	 *
	 * @param viewId - Exact workspace view identity.
	 * @param canvas - Exact surface being detached.
	 */
	detach(viewId: string, canvas: HTMLCanvasElement): void;

	/**
	 * Call this method to retry the selected scene after a graphics failure.
	 *
	 * @param viewId - Exact workspace view identity.
	 */
	retry(viewId: string): void;

	/**
	 * Call this method to create a scoped scene session and its page.
	 *
	 * @param request - Exact page/view mount identity.
	 * @returns - Feature-owned scene page.
	 */
	mount(request: WorkspacePageMount): React.ReactElement;

	/**
	 * Call this method to release the exact scene session.
	 *
	 * @param viewId - Exact workspace view being closed.
	 */
	unmount(viewId: string): void;

	/**
	 * Call this method to change one view's vertical camera framing.
	 *
	 * @param viewId - Exact owning view.
	 * @param degrees - Vertical perspective field of view in degrees.
	 */
	setFieldOfView(viewId: string, degrees: number): void;

	/**
	 * Call this method to request one view's physical elevation.
	 *
	 * @param viewId - Exact owning view.
	 * @param height - Requested distance above ground.
	 */
	setObserverHeight(viewId: string, height: Distance): void;

	/**
	 * Call this method to aim one view at the displayed Sun.
	 *
	 * @param viewId - Exact owning view.
	 */
	centerOnSun(viewId: string): void;

	/**
	 * Call this method to aim this view at Polaris in the displayed observation.
	 *
	 * @param viewId - Exact owning view.
	 */
	centerOnPolaris(viewId: string): void;

	/**
	 * Call this method to toggle the directional ribbon for this view.
	 *
	 * @param viewId - Exact owning view.
	 */
	toggleCompass(viewId: string): void;

	/**
	 * Call this method to mount feature-owned camera controls.
	 *
	 * @param request - Exact contribution identity.
	 * @returns - Scoped camera controls.
	 */
	mountContribution(request: WorkspaceContributionMount): React.ReactElement;

	/**
	 * Call this method to release tool presentation while the page retains camera state.
	 *
	 * @param request - Exact released contribution.
	 */
	unmountContribution(request: WorkspaceContributionMount): void;
	/**
	 * Call this method to beginTimeEdit through the owning feature boundary.
	 *
	 * @param owner - Control intent value.
	 * @returns - Exact gesture token.
	 */
	beginTimeEdit(owner: string): number;

	/**
	 * Call this method to seekTime through the owning feature boundary.
	 *
	 * @param owner - Control intent value.
	 * @param token - Control intent value.
	 * @param angle - Control intent value.
	 */
	seekTime(owner: string, token: number, angle: number): void;

	/**
	 * Call this method to endTimeEdit through the owning feature boundary.
	 *
	 * @param owner - Control intent value.
	 * @param token - Control intent value.
	 */
	endTimeEdit(owner: string, token: number): void;

	/**
	 * Call this method to setTimeDraft through the owning feature boundary.
	 *
	 * @param text - Control intent value.
	 */
	setTimeDraft(text: string): void;

	/**
	 * Call this method to acceptTimeDraft through the owning feature boundary.
	 */
	acceptTimeDraft(): void;

	/**
	 * Call this method to resetTimeDraft through the owning feature boundary.
	 */
	resetTimeDraft(): void;

	/**
	 * Call this method to openTimeSettings through the owning feature boundary.
	 */
	openTimeSettings(): void;

	/**
	 * Call this method to openLocationSettings through the owning feature boundary.
	 */
	openLocationSettings(): void;

	/**
	 * Call this method to read shared alternate-time state.
	 *
	 * @returns - Current derived time and draft facts.
	 */
	getTimeState(): FlatEarthTimeFacts;
}
