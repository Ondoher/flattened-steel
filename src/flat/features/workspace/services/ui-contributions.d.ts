/**
 * Shared registration and exact-lifetime removal capability for feature UI contributions.
 */
export interface UiContributionsService extends EventBus {
	/**
	 * Call this method to register feature-owned UI metadata at an explicit workspace host.
	 *
	 * @param definition - Contribution identity, controller, host, scope, and optional ordering.
	 * @returns - Exact lifetime token required to remove this registration.
	 * @throws {TypeError} - The host scope is incompatible or the ordering is nonfinite.
	 * @throws {Error} - The identity is already registered in the same host and scope.
	 */
	add(definition: UiContributionDefinition): number;

	/**
	 * Call this method to remove only the registration matching its original lifetime token.
	 *
	 * @param registrationId - Exact registration token to release.
	 * @returns - Whether an active registration was removed; false after prior removal.
	 */
	remove(registrationId: number): boolean;

	/**
	 * Call this method to release all contribution registrations scoped to a closed view.
	 *
	 * @param viewId - Closed-view identity whose registrations are no longer usable.
	 */
	removeForView(viewId: string): void;

	/**
	 * Call this method to read ordered defensive copies of contribution metadata.
	 *
	 * @returns - Current registrations ordered by configured order and contribution identity.
	 */
	get(): UiContributionRecord[];
}
