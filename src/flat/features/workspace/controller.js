import {Service} from '@polylith/core';
/**
 * Feature controller that registers and mounts the generated initial page.
 *
 * @implements {PageController}
 */
export class PageController extends Service {
	/**
	 * Creates the initial-page controller.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('workspace-controller', registry);
		this.implement(['ready', 'mount']);
	}
	/** Call this method when the view and page registry are ready for registration. */
	ready() {
		this.view = this.registry.subscribe('workspace-view');
		this.registry.subscribe('app-pages').add({
			id: 'workspace',
			label: 'workspace.title',
			literalLabel: 'Workspace',
			urlSlug: 'workspace',
			order: 0,
			default: true,
			controller: this.serviceName,
		});
	}
	/**
	 * Call this method to mount the initial page through its view service.
	 *
	 * @param {object} props - The page properties.
	 * @returns {React.ReactElement} - The mounted page.
	 */
	mount(props = {}) {
		return this.view.getComponent(props);
	}
}
new PageController();
