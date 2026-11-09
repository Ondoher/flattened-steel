/**
 * Owned registration and requested state retained for one service lifetime.
 */
type CameraSyncParticipant = {
	/**
	 * Non-reused registration identity.
	 */
	handle: CameraSyncHandle;

	/**
	 * Application-local receiver name removed when this registration retires.
	 */
	serviceName: string;

	/**
	 * Exact registered receiver identity, protecting replacements under the same name.
	 */
	receiver: CameraSyncReceiver;

	/**
	 * Latest requested controls, absent until the first update or synchronization delivery.
	 */
	controls: CameraSyncControls | null;

	/**
	 * Source registration followed by this participant, or no subscription.
	 */
	follows: CameraSyncHandle | null;
};
