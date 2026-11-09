/**
 * Registered feature-owned FlatEarthModel capability.
 */
export interface FlatEarthModel extends EventBus {
	/**
	 * Call this method to initialize this application's view records before readiness.
	 */
	start(): void;

	/**
	 * Call this method to release all camera records when the application stops.
	 */
	stop(): void;

	/**
	 * Call this method to initialize independent camera defaults for a newly mounted view.
	 *
	 * @param viewId - Exact mounted view identity.
	 */
	open(viewId: string): void;

	/**
	 * Call this method to release only the camera record belonging to the closed view.
	 *
	 * @param viewId - Exact released view identity.
	 */
	close(viewId: string): void;

	/**
	 * Call this method to read independent camera values for presentation.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @returns - Accepted height, framing and orientation.
	 */
	getCamera(viewId: string): FlatEarthCameraValues;

	/**
	 * Call this method to read one view's derived shader and Sun presentation policy.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @returns - Accepted mode and effective Sun multipliers.
	 */
	getShaderOptions(viewId: string): FlatEarthShaderOptions;

	/**
	 * Call this method to select a supported per-view sky composition.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @param mode - Supported composition selection.
	 * @throws {RangeError} - The requested mode is not supported.
	 */
	setSkyRenderMode(viewId: string, mode: FlatEarthSkyRenderMode): void;

	/**
	 * Call this method to toggle only this view's directional ribbon.
	 *
	 * @param viewId - Exact mounted view identity.
	 */
	toggleCompass(viewId: string): void;

	/**
	 * Call this method to retain the accepted rendered camera orientation across scene updates and retry.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @param orientation - Renderer-produced unit quaternion.
	 */
	setOrientation(viewId: string, orientation: FlatEarthCameraOrientation): void;

	/**
	 * Call this method to accept a perspective FOV without clamping or choosing a different projection.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @param degrees - Vertical field of view in degrees.
	 * @throws {RangeError} - The angle is nonfinite or outside (0, 180).
	 */
	setFieldOfView(viewId: string, degrees: number): void;

	/**
	 * Call this method to normalize an elevation request before preparing its physical scene.
	 *
	 * @param height - Requested distance above the flat ground.
	 * @returns - Independent nonnegative height in meters; engine geometry validates physical support.
	 * @throws {RangeError} - Height is nonfinite or below ground.
	 */
	resolveHeight(height: Distance): Distance;

	/**
	 * Call this method after complete frame publication to accept the new elevation.
	 *
	 * @param viewId - Exact mounted view identity.
	 * @param height - Height belonging to the successfully displayed frame.
	 */
	acceptHeight(viewId: string, height: Distance): void;

	/**
	 * Call this method to derive an exact engine observation from shared location and current time.
	 *
	 * @param configuration - Current application configuration snapshot.
	 * @returns - Unit-bearing observation, or null until location/time are available.
	 */
	getObservation(configuration: ApplicationConfiguration): GeometryObservation | null;
}
