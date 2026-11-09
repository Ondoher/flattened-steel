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
 * Exported application-service capability referenced without runtime JSDoc imports.
 */
type CameraSyncService = import('./camera-sync.js').CameraSync;
