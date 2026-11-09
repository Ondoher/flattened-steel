/**
 * Application-local camera registration, requested-state and subscription capability without UI assumptions.
 */
export interface CameraSync extends EventBus {
	/**
	 * Call this method to register an independently named receiver for one participant.
	 *
	 * @param serviceName - Existing instance-specific receiver in the owning application registry.
	 * @returns - Non-reused registration handle.
	 * @throws {Error} - The service is stopped, the receiver is missing or already owned, or two participants exist.
	 */
	register(serviceName: string): CameraSyncHandle;

	/**
	 * Call this method to remove participation, its owned receiver service and affected subscriptions.
	 * Stale or foreign handles have no effect; a surviving linked participant receives off.
	 *
	 * @param handle - Exact registration being retired.
	 */
	unregister(handle: CameraSyncHandle): void;

	/**
	 * Call this method to remember initial or user-requested settings and update subscribed receivers.
	 * Receiver promises may overlap; completion and returned errors do not change requested state.
	 *
	 * @param handle - Source registration; stale or foreign handles have no effect.
	 * @param cameraControls - Requested orientation and elevation copied by the service.
	 */
	update(handle: CameraSyncHandle, cameraControls: CameraSyncControls): void;

	/**
	 * Call this method to copy the other participant's settings and establish or cancel subscriptions.
	 * Missing peer state makes positive requests no-ops. Now preserves subscriptions;
	 * reciprocal them becomes both, them never downgrades both, and off cancels all.
	 *
	 * @param handle - Requesting registration; stale or foreign handles have no effect.
	 * @param mode - Synchronization action, independently of any UI availability.
	 */
	sync(handle: CameraSyncHandle, mode: CameraSyncMode): void;
}
