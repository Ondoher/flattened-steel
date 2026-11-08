/**
 * Flat's shared spherical cache preparation capability.
 */
export interface DistantSunCacheService extends EventBus {
	/**
	 * Call this method to obtain authenticated metadata and shared transport for scene attachment.
	 *
	 * @param solarZenithDegrees - Physical solar angle.
	 * @param signal - Independent subscriber lifetime.
	 * @returns - Engine-owned renderer-independent selection.
	 */
	select(solarZenithDegrees: number, signal: AbortSignal): Promise<DistantSunSharedCacheSelection>;

	/**
	 * Call this method to authenticate metadata and decode a required block for the view's connection proof.
	 *
	 * @param solarZenithDegrees - Physical solar angle.
	 * @param signal - Independent view cancellation.
	 * @returns - Selected package and decoded-block facts; failures reject.
	 */
	prepare(solarZenithDegrees: number, signal: AbortSignal): Promise<SphericalCachePreparation>;

	/**
	 * Call this method to read bounded transport telemetry.
	 *
	 * @returns - Shared counters, or null before first use.
	 */
	getDiagnostics(): DistantSunSharedCacheTransportDiagnostics | null;
}
