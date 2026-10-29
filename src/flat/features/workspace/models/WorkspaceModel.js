/**
 * Canonical in-memory composition of the workspace, independent of React and scene state.
 */
export class WorkspaceModel {
	/**
	 * Creates one empty primary view and closed workspace configuration.
	 */
	constructor() {
		this._nextViewNumber = 2;
		this._views = [{id: 'view-1', pageId: null}];
		this._configuration = {open: false, target: null};
		this._notFound = false;
	}

	/**
	 * Call this method to read a defensive composition snapshot.
	 *
	 * @returns {WorkspaceSnapshot} - Current workspace facts without presentation or scene state.
	 */
	getSnapshot() {
		return {
			views: this._views.map((view) => ({...view})),
			configuration: {...this._configuration},
			notFound: this._notFound,
		};
	}

	/**
	 * Call this method to select a registered page in an existing view.
	 *
	 * @param {string} viewId - Stable open-view identity.
	 * @param {string|null} pageId - Registered definition or an empty view.
	 * @throws {Error} - The view is no longer open.
	 */
	selectPage(viewId, pageId) {
		let view = this._views.find((item) => item.id === viewId);
		if (!view) {
			throw new Error(`Unknown workspace view: ${viewId}`);
		}
		view.pageId = pageId;
		if (viewId === this._views[0].id) {
			this._notFound = false;
		}
	}

	/**
	 * Call this method to open an optional second view with a fresh identity.
	 *
	 * @param {string|null} pageId - Initial registered definition, without copied scene state.
	 * @returns {WorkspaceViewRecord|null} - New open view, or no change when comparison is already open.
	 */
	addView(pageId = null) {
		if (this._views.length === 2) {
			return null;
		}
		let view = {id: `view-${this._nextViewNumber++}`, pageId};
		this._views.push(view);
		return {...view};
	}

	/**
	 * Call this method to close the optional view while preserving the primary view.
	 *
	 * @param {string} viewId - Optional-view identity.
	 * @returns {boolean} - Whether an open optional view was removed.
	 */
	removeView(viewId) {
		if (this._views.length !== 2 || this._views[1].id !== viewId) {
			return false;
		}
		this._views.pop();
		if (this._configuration.target === viewId) {
			this._configuration.target = null;
		}
		return true;
	}

	/**
	 * Call this method to set routed not-found state for the primary view.
	 *
	 * @param {boolean} notFound - Whether the URL identifies an unavailable page.
	 */
	setNotFound(notFound) {
		this._notFound = notFound;
	}

	/**
	 * Call this method to open or close the shared configuration surface.
	 *
	 * @param {boolean} open - Requested presentation state.
	 */
	setConfigurationOpen(open) {
		this._configuration.open = open;
	}

	/**
	 * Call this method to select workspace or view-scoped configuration.
	 *
	 * @param {string|null} target - Open view identity, or workspace scope.
	 * @throws {Error} - The target view is no longer open.
	 */
	setConfigurationTarget(target) {
		if (target !== null && !this._views.some((view) => view.id === target)) {
			throw new Error(`Unknown configuration target: ${target}`);
		}
		this._configuration.target = target;
	}
}
