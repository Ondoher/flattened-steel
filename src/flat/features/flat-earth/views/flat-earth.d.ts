/**
 * Public scoped Flat Earth presentation capability.
 */
export interface FlatEarthView extends EventBus {
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
	getState(viewId: string): FlatEarthSceneState;

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
	 * Call this method to provide scoped camera-tool presentation.
	 *
	 * @param viewId - Exact owning view.
	 * @returns - Feature-owned toolbar controls.
	 */
	getToolsComponent(viewId: string): React.ReactElement;
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
	getTimeState(): FlatEarthTimePresentation;

	/**
	 * Call this method to obtain a shared time control surface.
	 *
	 * @param owner - Control lifetime identity.
	 * @param panel - Whether full configuration presentation is needed.
	 * @returns - Feature-owned presentation.
	 */
	getTimeComponent(owner: string, panel: boolean): React.ReactElement;

	/**
	 * Call this method to obtain scoped Camera settings.
	 *
	 * @param viewId - Exact owning view.
	 * @returns - Camera presentation.
	 */
	getCameraComponent(viewId: string): React.ReactElement;
}
