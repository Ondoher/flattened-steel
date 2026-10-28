/** Public registry contract implemented by the PageView application service. */
interface PageView extends EventBus {
	/**
	 * Call this method to create the service-owned React presentation.
	 *
	 * @param props - The props value required by this operation.
	 * @returns - The getComponent operation result.
	 */
	getComponent(props?: Record<string, unknown>): import('react').ReactElement;
}
