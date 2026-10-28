/** Public registry contract implemented by the PageController application service. */
interface PageController extends EventBus {
	/**
	 * Call this method to mount the feature presentation for a page.
	 *
	 * @param props - The props value required by this operation.
	 * @returns - The mount operation result.
	 */
	mount(props?: Record<string, unknown>): import('react').ReactElement;
}
