import {Service} from '@polylith/core';

/**
 * Workspace workflow and registered feature-session owner.
 *
 * @implements {WorkspaceControllerService}
 */
export class WorkspaceController extends Service {
	/**
	 * Creates the app-local controller capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('workspace-controller', registry);
		this.implement([
			'start',
			'ready',
			'stop',
			'getState',
			'requestPage',
			'toggleComparison',
			'closeView',
			'toggleConfiguration',
			'selectConfigurationTarget',
			'selectConfigurationSection',
			'openConfiguration',
			'mount',
			'unmount',
			'mountPage',
			'clearPrimary',
			'getPrimaryViewId',
		]);
	}

	/**
	 * Call this method to initialize only local workspace state.
	 */
	start() {
		/** @type {Map<string, WorkspacePageSession>} */
		this._pages = new Map();
		/** @type {Map<number, WorkspaceContributionSession>} */
		this._contributions = new Map();
		this._listeners = [];
	}

	/**
	 * Called by view release to retire one page lifetime exactly once.
	 *
	 * @param {string} viewId - Mounted view identity.
	 */
	_releasePage(viewId) {
		let session = this._pages.get(viewId);
		if (!session) {
			return;
		}
		this._pages.delete(viewId);
		session.controller.unmount(viewId);
	}

	/**
	 * Called by contribution reconciliation to retire one exact presentation lifetime.
	 *
	 * @param {number} registrationId - Mounted registration identity.
	 */
	_releaseContribution(registrationId) {
		let session = this._contributions.get(registrationId);
		if (!session) {
			return;
		}
		this._contributions.delete(registrationId);
		session.controller.unmountContribution({contribution: session.contribution});
	}

	/**
	 * Called by contribution reconciliation to check whether a registered host is visible.
	 *
	 * @param {UiContributionRecord} contribution - Registered scope and slot.
	 * @param {WorkspaceSnapshot} snapshot - Canonical open-view and panel state.
	 * @returns {boolean} - Whether presentation is needed now.
	 */
	_isVisible(contribution, snapshot) {
		if (contribution.viewId !== null && !snapshot.views.some((view) => view.id === contribution.viewId)) {
			return false;
		}
		return (
			contribution.slot !== 'configuration' ||
			(snapshot.configuration.open &&
				contribution.viewId === snapshot.configuration.target &&
				contribution.id === snapshot.configuration.section)
		);
	}

	/**
	 * Called by state publication to reconcile mounted feature contributions through public capabilities.
	 */
	_syncContributions() {
		let snapshot = this._workspace.getSnapshot();
		let sections = this.contributions
			.get()
			.filter((record) => record.slot === 'configuration' && record.viewId === snapshot.configuration.target);
		if (snapshot.configuration.open && !sections.some((record) => record.id === snapshot.configuration.section)) {
			this._workspace.setConfigurationSection(sections[0]?.id ?? null);
			snapshot = this._workspace.getSnapshot();
		}
		let visible = this.contributions.get().filter((record) => this._isVisible(record, snapshot));
		let retained = new Set(visible.map((record) => record.registrationId));
		for (let registrationId of this._contributions.keys()) {
			if (!retained.has(registrationId)) {
				this._releaseContribution(registrationId);
			}
		}
		for (let contribution of visible) {
			if (this._contributions.has(contribution.registrationId)) {
				continue;
			}
			let controller = /** @type {WorkspaceContributionController} */ (
				this.registry.subscribe(contribution.controller)
			);
			let component = controller.mountContribution({contribution});
			if (component) {
				this._contributions.set(contribution.registrationId, {
					registrationId: contribution.registrationId,
					contribution,
					controller,
					component,
				});
			}
		}
	}

	/**
	 * Called after a completed workspace transition to publish a disposable presentation snapshot.
	 */
	_emitState() {
		this._syncContributions();
		this.fire('state-changed', this.getState());
	}

	/**
	 * Call this method once collaborators are ready to wire workspace-owned coordination.
	 */
	ready() {
		this.stop();
		this._workspace = /** @type {WorkspaceModelService} */ (this.registry.subscribe('workspace-model'));
		this.pages = this.registry.subscribe('app-pages');
		this.contributions = this.registry.subscribe('ui-contributions');
		this.view = this.registry.subscribe('workspace-view');
		this.navigation = this.registry.subscribe('app-controller');
		let onPages = () => this._emitState();
		let onContributions = () => this._emitState();
		this._listeners = [
			{owner: this.pages, event: 'updated', token: this.pages.listen('updated', onPages)},
			{owner: this.contributions, event: 'changed', token: this.contributions.listen('changed', onContributions)},
		];
		for (let viewport of this._workspace.getSnapshot().views) {
			if (viewport.pageId) {
				this.mountPage(viewport.pageId, viewport.id);
			}
		}
		this._emitState();
	}

	/**
	 * Call this method to detach listeners and release every mounted owner lifetime safely.
	 */
	stop() {
		for (let listener of this._listeners ?? []) {
			listener.owner.unlisten(listener.event, listener.token);
		}
		this._listeners = [];
		for (let viewId of this._pages?.keys() ?? []) {
			this._releasePage(viewId);
		}
		for (let registrationId of this._contributions?.keys() ?? []) {
			this._releaseContribution(registrationId);
		}
	}

	/**
	 * Call this method to mount a registered page in an independently identified view.
	 *
	 * @param {string} pageId - Available page definition.
	 * @param {string} [viewId] - Target view; omission denotes the primary view.
	 * @returns {AppPageRecord|null} - Selected metadata, or no change for missing/empty targets.
	 * @throws {Error} - The page owner fails to mount; its partial lifetime is released.
	 */
	mountPage(pageId, viewId) {
		let snapshot = this._workspace.getSnapshot();
		let viewport = snapshot.views.find((view) => view.id === (viewId ?? snapshot.views[0].id));
		let page = this.pages.getById(pageId);
		if (!page || !viewport) {
			return null;
		}
		if (viewport.pageId === page.id && this._pages.get(viewport.id)?.page.controller === page.controller) {
			return page;
		}
		let controller = /** @type {WorkspacePageController} */ (this.registry.subscribe(page.controller));
		this._releasePage(viewport.id);
		this._workspace.selectPage(viewport.id, null);
		let component;
		try {
			component = controller.mount({page, viewId: viewport.id});
		} catch (error) {
			controller.unmount(viewport.id);
			this._emitState();
			throw error;
		}
		if (!component) {
			controller.unmount(viewport.id);
			this._emitState();
			return null;
		}
		this._workspace.selectPage(viewport.id, page.id);
		this._pages.set(viewport.id, {page, controller, component});
		this._emitState();
		return page;
	}

	/**
	 * Call this method to relay selection through application-owned navigation.
	 *
	 * @param {string} pageId - Requested registered definition.
	 * @param {string} viewId - Explicit target view.
	 * @returns {AppPageRecord|null} - Mounted definition or no selection.
	 */
	requestPage(pageId, viewId) {
		return this.navigation.requestPage(pageId, {viewId});
	}

	/**
	 * Call this method to identify the primary host without exposing model internals.
	 *
	 * @returns {string} - Stable primary-view identity.
	 */
	getPrimaryViewId() {
		return this._workspace.getSnapshot().views[0].id;
	}

	/**
	 * Call this method to project an empty or unknown primary route.
	 *
	 * @param {boolean} notFound - Application-owned route outcome.
	 */
	clearPrimary(notFound = false) {
		let viewId = this.getPrimaryViewId();
		this._workspace.selectPage(viewId, null);
		this._workspace.setNotFound(notFound);
		this._releasePage(viewId);
		this._emitState();
	}

	/**
	 * Call this method to release the complete workspace feature at application shutdown.
	 */
	unmount() {
		this.stop();
		this.view.stop();
	}

	/**
	 * Call this method to open an unused registered page type, or close only the second view.
	 * When no other page type is registered, the new instance uses the primary page type.
	 */
	toggleComparison() {
		let views = this._workspace.getSnapshot().views;
		if (views.length === 2) {
			this.closeView(views[1].id);
			return;
		} else {
			let viewport = this._workspace.addView();
			if (views[0].pageId) {
				let alternative = this.pages.get().find((page) => page.id !== views[0].pageId);
				let pageId = alternative?.id ?? views[0].pageId;
				try {
					this.mountPage(pageId, viewport.id);
				} catch (error) {
					this._workspace.removeView(viewport.id);
					this.contributions.removeForView(viewport.id);
					this._emitState();
					throw error;
				}
			}
		}
		this._emitState();
	}

	/**
	 * Call this method to close only the matching optional view; stale close intents do nothing.
	 *
	 * @param {string} viewId - Exact optional-view identity.
	 * @returns {boolean} - Whether the view was removed.
	 */
	closeView(viewId) {
		if (!this._workspace.removeView(viewId)) {
			return false;
		}
		this._releasePage(viewId);
		this.contributions.removeForView(viewId);
		this._emitState();
		return true;
	}

	/**
	 * Call this method to toggle the nonmodal configuration surface.
	 */
	toggleConfiguration() {
		this._workspace.setConfigurationOpen(!this._workspace.getSnapshot().configuration.open);
		this._emitState();
	}

	/**
	 * Call this method to choose the explicit configuration scope.
	 *
	 * @param {string|null} viewId - Open view identity, or workspace scope.
	 */
	selectConfigurationTarget(viewId) {
		this._workspace.setConfigurationTarget(viewId);
		this._emitState();
	}

	/**
	 * Call this method to select one registered settings section in the current scope.
	 *
	 * @param {string} section - Provider identity selected by presentation.
	 */
	selectConfigurationSection(section) {
		let target = this._workspace.getSnapshot().configuration.target;
		this.openConfiguration(target, section);
	}

	/**
	 * Call this method to open registered settings through a feature-independent capability.
	 *
	 * @param {string|null} target - Open-view identity or shared settings.
	 * @param {string|null} [section] - Registered section or first available section.
	 * @param {string|null} [focus] - Provider-owned focus intent.
	 */
	openConfiguration(target, section = null, focus = null) {
		let snapshot = this._workspace.getSnapshot();
		if (target !== null && !snapshot.views.some((view) => view.id === target)) {
			return;
		}
		let sections = this.contributions
			.get()
			.filter((record) => record.slot === 'configuration' && record.viewId === target);
		let selected = sections.find((record) => record.id === section) ?? sections[0];
		if (!selected) {
			return;
		}
		this._workspace.setConfigurationTarget(target);
		this._workspace.setConfigurationSection(selected.id, focus);
		this._workspace.setConfigurationOpen(true);
		this._emitState();
	}

	/**
	 * Call this method to read canonical workspace facts and owned mount results for view projection.
	 *
	 * @returns {WorkspaceState} - Domain/session facts without React-facing host grouping.
	 */
	getState() {
		return {
			workspace: this._workspace.getSnapshot(),
			availableContributions: this.contributions.get(),
			pages: this.pages.get(),
			pageContent: [...this._pages].map(([viewId, session]) => ({viewId, component: session.component})),
			contributions: this.contributions.get().flatMap((record) => {
				let mounted = this._contributions.get(record.registrationId);
				return mounted ? [{...record, component: mounted.component}] : [];
			}),
		};
	}

	/**
	 * Call this method to obtain the shell through its owning view service.
	 *
	 * @param {object} props - Presentation properties.
	 * @returns {React.ReactElement} - App shell presentation.
	 */
	mount(props = {}) {
		return this.view.getComponent(props);
	}
}

new WorkspaceController();
