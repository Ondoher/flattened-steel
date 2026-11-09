/**
 * Camera synchronization request or participant notification.
 * - **"now"** - Immediate copy without changing subscriptions.
 * - **"them"** - Immediate copy and subscription to the other participant.
 * - **"both"** - Immediate caller copy and reciprocal subscriptions.
 * - **"off"** - Cancellation of all synchronization.
 */
type CameraSyncMode = 'now' | 'them' | 'both' | 'off';

/**
 * Opaque, non-reused identity owned by one camera-sync registration.
 */
type CameraSyncHandle = symbol;

/**
 * Unit quaternion in local east/up/south scene axes, ordered x/y/z/w.
 */
type CameraSyncOrientation = readonly [x: number, y: number, z: number, w: number];

/**
 * Requested camera settings copied at service ownership boundaries.
 */
type CameraSyncControls = {
	/**
	 * Requested unit-quaternion orientation in the shared local scene axes.
	 */
	readonly orientation: CameraSyncOrientation;

	/**
	 * Requested observer elevation above ground in meters, including pending preparation.
	 */
	readonly observerHeightMeters: number;
};

/**
 * Independently registered, instance-specific camera synchronization receiver.
 */
interface CameraSyncReceiver extends EventBus {
	/**
	 * Call this method to notify the receiver of a synchronization action or relationship.
	 *
	 * @param mode - Initiated action or effective subscription mode.
	 */
	synced(mode: CameraSyncMode): void;

	/**
	 * Call this method to apply requested settings without echoing another update.
	 * Calls may overlap; expected failures resolve to Error and are currently ignored.
	 *
	 * @param cameraControls - Independent snapshot of the latest requested settings.
	 * @returns - Completion without a value, or an expected application error.
	 */
	cameraChanged(cameraControls: CameraSyncControls): Promise<Error | void>;
}

/**
 * Application-local camera registration, requested-state and subscription capability without UI assumptions.
 */
interface CameraSyncService extends EventBus {
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
