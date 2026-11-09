/**
 * Scoped spherical feature capability.
 */
interface SphericalEarthViewService extends EventBus {
	/**
	 * Call this method to obtain scoped feature-owned scene presentation.
	 *
	 * @param viewId - Exact workspace view identity.
	 * @returns - Scene page element.
	 */
	getComponent(viewId: string): React.ReactElement;

	/**
	 * Call this method to read scoped scene preparation state.
	 *
	 * @param viewId - Exact workspace view identity.
	 * @returns - Disposable scene-state snapshot.
	 */
	getState(viewId: string): SphericalEarthSceneState;

	/**
	 * Call this method to select one view's sky presentation through its owning boundary.
	 *
	 * @param viewId - Exact owning view.
	 * @param mode - Supported composition selection.
	 */
	setSkyRenderMode(viewId: string, mode: SphericalEarthSkyRenderMode): void;

	/**
	 * Call this method to obtain the controller's retained graphics surface for presentation.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @returns - Feature-owned canvas mounted inside the React-owned host.
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
	 * Call this method to provide scoped camera-tool presentation.
	 *
	 * @param viewId - Exact owning view.
	 * @returns - Feature-owned toolbar controls.
	 */
	getToolsComponent(viewId: string): React.ReactElement;

	/**
	 * Call this method to obtain scoped Camera settings.
	 *
	 * @param viewId - Exact owning view.
	 * @returns - Camera presentation.
	 */
	getCameraComponent(viewId: string): React.ReactElement;

	/**
	 * Call this method to relay a synchronization action for the exact owning view.
	 *
	 * @param viewId - Mounted view identity.
	 * @param mode - Requested action.
	 */
	syncCamera(viewId: string, mode: CameraSyncMode): void;

	/**
	 * Call this method to prepare localized text-only menu availability.
	 *
	 * @param viewId - Mounted view identity.
	 * @returns - Prepared action choices.
	 */
	getSyncOptions(viewId: string): AppSelectOption[];
}
