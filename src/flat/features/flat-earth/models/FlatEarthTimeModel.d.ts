/**
 * Registered editor model; all accepted time remains with the clock capability.
 */
export interface FlatEarthTimeModel extends EventBus {
	/**
	 * Call this method to initialize editor-only state.
	 */
	start(): void;

	/**
	 * Call this method to invalidate stale gesture references on external changes.
	 *
	 * @param external - Whether another editor changed time or location.
	 */
	synchronize(external: boolean): void;

	/**
	 * Call this method to derive presentation from current canonical configuration.
	 *
	 * @param configuration - Accepted shared values.
	 * @returns - Reference and draft facts.
	 */
	getState(configuration: ApplicationConfiguration): FlatEarthTimeState;

	/**
	 * Call this method to freeze a reference for one control gesture.
	 *
	 * @param owner - Mounted control identity.
	 * @param configuration - Accepted shared values.
	 * @returns - Gesture token, or zero without location.
	 */
	begin(owner: string, configuration: ApplicationConfiguration): number;

	/**
	 * Call this method to resolve a current gesture's requested angle.
	 *
	 * @param owner - Original control identity.
	 * @param token - Original gesture token.
	 * @param angle - Signed degrees.
	 * @returns - Resolved timestamp, or no write for a stale gesture.
	 */
	seek(owner: string, token: number, angle: number): number | null;

	/**
	 * Call this method to release only a matching gesture.
	 *
	 * @param owner - Original control identity.
	 * @param token - Original token.
	 */
	end(owner: string, token: number): void;

	/**
	 * Call this method to retain unfinished numeric text.
	 *
	 * @param text - Unaccepted decimal input.
	 */
	setDraft(text: string): void;

	/**
	 * Call this method to accept valid complete input against the current reference.
	 *
	 * @param configuration - Accepted shared values.
	 * @returns - Resolved timestamp, or no mutation for invalid input.
	 */
	accept(configuration: ApplicationConfiguration): number | null;

	/**
	 * Call this method to discard the numeric draft without changing time.
	 */
	reset(): void;
}
