import {Service} from '@polylith/core';

/**
 * Application activation and URL coordination through public workspace capabilities.
 *
 * @implements {AppControllerService}
 */
export class AppController extends Service {
	/**
	 * Creates the application navigation capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('app-controller', registry);
		this.implement(['start', 'ready', 'activate', 'stop', 'requestPage', 'getState', 'getComponent']);
	}

	/**
	 * Call this method to initialize only local activation state.
	 */
	start() {
		this._activated = false;
		this._content = null;
		this._listeners = [];
	}

	/**
	 * Called by application navigation to reconcile only the primary routed selection.
	 */
	_reconcileLocation() {
		if (!this._activated) {
			return;
		}
		let slug = this.url.getPageSlug();
		let page = slug ? this.pages.getBySlug(slug) : this.pages.getDefault();
		if (page) {
			this.requestPage(page.id, {history: slug ? 'none' : 'replace'});
		} else {
			this.workspace.clearPrimary(Boolean(slug));
		}
	}

	/**
	 * Call this method once dependencies are ready to locate public capabilities and listen for routing changes.
	 */
	ready() {
		this.stop();
		this.workspace = this.registry.subscribe('workspace-controller');
		this.pages = this.registry.subscribe('app-pages');
		this.url = this.registry.subscribe('url');
		this.view = this.registry.subscribe('app-view');
		this.context = this.registry.subscribe('app-context');
		let onLocation = () => this._reconcileLocation();
		let onContext = () => this.fire('state-changed', this.getState());
		this._listeners = [
			{owner: this.url, event: 'changed', token: this.url.listen('changed', onLocation)},
			{owner: this.pages, event: 'updated', token: this.pages.listen('updated', onLocation)},
			{owner: this.context, event: 'changed', token: this.context.listen('changed', onContext)},
		];
	}

	/**
	 * Call this method from the executor after registry readiness to activate the application workspace.
	 */
	activate() {
		if (this._activated) {
			return;
		}
		this._content = this.workspace.mount();
		this._activated = true;
		this._reconcileLocation();
		this.fire('state-changed', this.getState());
	}

	/**
	 * Call this method to detach application listeners and end the activated workspace lifetime.
	 */
	stop() {
		for (let listener of this._listeners ?? []) {
			listener.owner.unlisten(listener.event, listener.token);
		}
		this._listeners = [];
		let activated = this._activated;
		if (activated) {
			this._activated = false;
			this.workspace.unmount();
		}
		this._content = null;
		if (activated) {
			this.fire('state-changed', this.getState());
		}
	}

	/**
	 * Call this method to coordinate registered selection with primary-view browser history.
	 *
	 * @param {string} pageId - Requested registered definition.
	 * @param {AppPageOptions} options - Target view and history intent.
	 * @returns {AppPageRecord|null} - Selected metadata or no change before activation/unavailable selection.
	 */
	requestPage(pageId, {viewId, history = 'push'} = {}) {
		if (!this._activated) {
			return null;
		}
		let page = this.workspace.mountPage(pageId, viewId);
		if (
			page &&
			(!viewId || viewId === this.workspace.getPrimaryViewId()) &&
			this.url.getPageSlug() !== page.urlSlug
		) {
			if (history === 'replace') {
				this.url.replacePageSlug(page.urlSlug);
			} else if (history === 'push') {
				this.url.pushPageSlug(page.urlSlug);
			}
		}
		return page;
	}

	/**
	 * Call this method to read activated content and the canonical application context without mounting.
	 *
	 * @returns {AppState} - Controller state supplied to the owning view for projection.
	 */
	getState() {
		return {content: this._content, context: this.context.get()};
	}

	/**
	 * Call this method to obtain presentation through the application view.
	 *
	 * @param {object} props - Presentation properties.
	 * @returns {React.ReactElement} - Application boundary.
	 */
	getComponent(props = {}) {
		return this.view.getComponent(props);
	}
}
new AppController();
