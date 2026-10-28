import {Service} from '@polylith/core';
/**
 * Controller owner of page selection, mounting, URL reconciliation, and shell state.
 *
 * @implements {AppController}
 */
export class AppController extends Service {
	/**
	 * Creates the application controller service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('app-controller', registry);
		this.implement(['ready', 'stop', 'getShellState', 'requestPage', 'getComponent']);
	}
	/** Call this method when registry dependencies are ready for cross-service wiring. */
	ready() {
		this.stop();
		this.pages = this.registry.subscribe('app-pages');
		this.view = this.registry.subscribe('app-view');
		this.url = this.registry.subscribe('url');
		this.urlChanged = () => this.reconcileLocation();
		this.urlListener = this.url.listen('changed', this.urlChanged);
		this.activePageId = null;
		this.pageComponent = null;
		this.notFound = false;
		this.registryReady = false;
		this.pagesChanged = (pages) => this.onPagesUpdated(pages);
		this.pagesListener = this.pages.listen('updated', this.pagesChanged);
		this.registryReadyChanged = () => {
			this.registryReady = true;
			this.reconcileLocation();
		};
		this.registryReadyListener = this.registry.listen('ready', this.registryReadyChanged);
		this.reconcileLocation();
	}
	/** Call this method to remove every cross-service listener owned by the controller. */
	stop() {
		if (this.url && this.urlListener) this.url.unlisten('changed', this.urlListener);
		if (this.pages && this.pagesListener) this.pages.unlisten('updated', this.pagesListener);
		if (this.registryReadyListener) this.registry.unlisten('ready', this.registryReadyListener);
		this.urlListener = null;
		this.pagesListener = null;
		this.registryReadyListener = null;
	}
	/**
	 * Called by the page registry to publish metadata and reconcile selection.
	 *
	 * @param {AppPageRecord[]} pages - The current ordered pages.
	 */
	onPagesUpdated(pages) {
		this.fire('pages-updated', pages);
		const before = this.activePageId;
		const component = this.pageComponent;
		const notFound = this.notFound;
		this.reconcileLocation();
		if (before === this.activePageId && component === this.pageComponent && notFound === this.notFound)
			this.emitState(null);
	}
	/**
	 * Call this method to reconcile the current URL or selection with registered pages.
	 *
	 * @returns {AppPageRecord | null} - The selected page or no selection.
	 */
	reconcileLocation() {
		const slug = this.url.getPageSlug();
		if (slug) {
			const page = this.pages.getBySlug(slug);
			if (page) return this.requestPage(page.id, {history: 'none'});
			if (this.registryReady) this.clearSelection(true);
			return null;
		}
		const page = this.pages.getDefault();
		return page ? this.requestPage(page.id, {history: 'replace'}) : null;
	}
	/**
	 * Call this method to mount a registered page and coordinate browser history.
	 *
	 * @param {string} pageId - The page identifier to select.
	 * @param {object} options - History behavior for the selection.
	 * @returns {AppPageRecord | null} - The mounted page or no selection.
	 * @throws {Error} - When the registered feature controller cannot mount its page.
	 */
	requestPage(pageId, {history = 'push'} = {}) {
		const page = this.pages.getById(pageId);
		if (!page) return null;
		if (this.activePageId === page.id && this.pageComponent) return page;
		const controller = this.registry.subscribe(page.controller);
		if (!controller?.mount) throw new Error(`Page controller "${page.controller}" cannot mount page "${page.id}".`);
		const component = controller.mount({page});
		if (!component) return null;
		this.activePageId = page.id;
		this.pageComponent = component;
		this.notFound = false;
		if (history === 'replace') this.url.replacePageSlug(page.urlSlug);
		else if (history === 'push') this.url.pushPageSlug(page.urlSlug);
		this.emitState(page);
		return page;
	}
	/**
	 * Called by reconciliation to remove the mounted page and optionally expose a not-found state.
	 *
	 * @param {boolean} notFound - Whether the URL identifies an unknown page.
	 */
	clearSelection(notFound = false) {
		this.activePageId = null;
		this.pageComponent = null;
		this.notFound = notFound;
		this.emitState(null);
	}
	/**
	 * Called after selection changes to publish controller-owned presentation state.
	 *
	 * @param {AppPageRecord | null} page - The newly mounted page or no selection.
	 */
	emitState(page) {
		const state = this.getShellState();
		this.fire('state-changed', state);
		if (page) this.fire('page-mounted', {component: this.pageComponent, page});
	}
	/**
	 * Call this method to read current shell presentation state.
	 *
	 * @returns {AppShellState} - The current shell state.
	 */
	getShellState() {
		return {
			activePageId: this.activePageId,
			notFound: this.notFound,
			pageComponent: this.pageComponent,
			pages: this.pages.get(),
		};
	}
	/**
	 * Call this method to create the application presentation through its view service.
	 *
	 * @param {object} props - Presentation properties.
	 * @returns {React.ReactElement} - The application presentation.
	 */
	getComponent(props = {}) {
		return this.view.getComponent(props);
	}
}
new AppController();
