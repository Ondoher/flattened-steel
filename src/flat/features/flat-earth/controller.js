import {Service} from '@polylith/core';
import {FlatEarthSession} from './FlatEarthSession.js';
import {FlatEarthGraphics} from './runtime/FlatEarthGraphics.js';
import {FlatEarthRuntime} from './runtime/FlatEarthRuntime.js';

/**
 * Registers the page and coordinates independent scene sessions through shared application capabilities.
 *
 * @implements {WorkspacePageController}
 */
export class FlatEarthController extends Service {
	/**
	 * Creates the Flat Earth feature capability.
	 *
	 * @param {unknown} registry - Owning application registry.
	 * @param {FlatEarthGraphicsFactory} [createGraphics] - Internal owner of startup graphics construction.
	 */
	constructor(registry, createGraphics = () => new FlatEarthGraphics()) {
		super('flat-earth-controller', registry);
		this.createGraphics = createGraphics;
		this.implement([
			'start',
			'ready',
			'stop',
			'mount',
			'unmount',
			'getState',
			'getCanvas',
			'attach',
			'detach',
			'retry',
			'setFieldOfView',
			'setSkyRenderMode',
			'setObserverHeight',
			'centerOnSun',
			'mountContribution',
			'unmountContribution',
			'getTimeState',
			'beginTimeEdit',
			'seekTime',
			'endTimeEdit',
			'setTimeDraft',
			'acceptTimeDraft',
			'resetTimeDraft',
			'openTimeSettings',
			'openLocationSettings',
		]);
		/**
		 * @type {Map<string, FlatEarthSession>}
		 */
		this.sessions = new Map();
		this._listener = null;
		this._timeRegistration = null;
		this._workspaceListener = null;
		/**
		 * @type {Map<string, number[]>}
		 */
		this._tools = new Map();
		/**
		 * @type {Map<string, FlatEarthSurface>}
		 */
		this._surfaces = new Map();
		/**
		 * @type {FlatEarthGraphicsResources|null}
		 */
		this._startupGraphics = null;
		this._cacheStarted = false;
	}

	/**
	 * Call this method to release a previous feature lifetime before registry startup.
	 */
	start() {
		this.stop();
	}

	/**
	 * Call this method after readiness to register the page and subscribe to shared location/time.
	 */
	ready() {
		if (this._listener) {
			this.configuration.unlisten('changed', this._listener);
		}
		this.timeModel = /** @type {FlatEarthTimeModelService} */ (this.registry.subscribe('flat-earth-time-model'));
		this.workspace = /** @type {WorkspaceControllerService} */ (this.registry.subscribe('workspace-controller'));
		this.view = /** @type {FlatEarthViewService} */ (this.registry.subscribe('flat-earth-view'));
		this.configuration = /** @type {ConfigurationService} */ (this.registry.subscribe('configuration'));
		this.model = /** @type {FlatEarthModelService} */ (this.registry.subscribe('flat-earth-model'));
		this.stellarCatalog = /** @type {FlatEarthStellarCatalogService} */ (
			this.registry.subscribe('flat-earth-stellar-catalog')
		);
		for (let tokens of this._tools.values()) {
			for (let token of tokens) {
				this.contributions.remove(token);
			}
		}
		this._tools.clear();
		this.contributions = /** @type {WorkspaceUiContributionsService} */ (
			this.registry.subscribe('ui-contributions')
		);
		for (let viewId of this.sessions.keys()) {
			this._registerTools(viewId);
		}
		if (this._timeRegistration !== null) {
			this.contributions.remove(this._timeRegistration);
		}
		if (this._workspaceListener) {
			this.workspace.unlisten('state-changed', this._workspaceListener);
		}
		this._timeRegistration = this.contributions.add({
			id: 'flat-earth-time',
			controller: 'flat-earth-controller',
			slot: 'configuration',
			viewId: null,
			order: 10,
			label: 'flat-earth.time.title',
		});
		this._workspaceListener = this.workspace.listen('state-changed', () => this._publishTime());
		this._listener = this.configuration.listen('changed', () => {
			this.timeModel.synchronize(!this._writingTime);
			this._updateSessions();
			this._publishTime();
		});
		let pages = /** @type {AppPagesService} */ (this.registry.subscribe('app-pages'));
		this._warmCache();
		pages.add({
			id: 'flat-earth',
			label: 'flat-earth.title',
			urlSlug: 'flat-earth',
			order: 0,
			controller: 'flat-earth-controller',
		});
		this._updateSessions();
	}

	/**
	 * Called at feature readiness to begin cache construction independently of page selection and location entry.
	 */
	_warmCache() {
		if (this._cacheStarted) {
			return;
		}
		this._cacheStarted = true;
		try {
			let graphics = this.createGraphics();
			this._startupGraphics = graphics;
			void graphics.warm().catch((error) => {
				if (!graphics.release) {
					console.error('Flat Earth startup cache construction failed.', error);
				}
			});
		} catch (error) {
			console.error('Flat Earth startup graphics initialization failed.', error);
		}
	}

	/**
	 * Called by shared updates to offer one coherent configuration snapshot to each mounted session.
	 */
	_updateSessions() {
		let configuration = this.configuration.get();
		for (let session of this.sessions.values()) {
			session.update(configuration);
		}
	}

	/**
	 * Call this method to mount a new independently owned view of the shared observation.
	 *
	 * @param {WorkspacePageMount} request - Registered page and target-view identity.
	 * @returns {React.ReactElement} - Feature-owned scene presentation.
	 */
	mount({viewId}) {
		this.unmount(viewId);
		this.model.open(viewId);
		let graphics = this._startupGraphics;
		this._startupGraphics = null;
		let surface = {canvas: graphics?.canvas ?? document.createElement('canvas'), graphics};
		this._surfaces.set(viewId, surface);
		let session = new FlatEarthSession(
			viewId,
			this.model,
			(state) => this.fire('state-changed', {viewId, state}),
			(canvas, model, id, onFailure, onCameraChange) => {
				let ownedGraphics = surface.graphics ?? new FlatEarthGraphics(canvas);
				surface.graphics = null;
				try {
					return new FlatEarthRuntime(
						canvas,
						model,
						id,
						onFailure,
						onCameraChange,
						this.stellarCatalog,
						ownedGraphics,
					);
				} catch (error) {
					void ownedGraphics
						.dispose()
						.catch((cleanupError) => console.error('Flat Earth graphics release failed.', cleanupError));
					throw error;
				}
			},
		);
		this.sessions.set(viewId, session);
		session.update(this.configuration.get());
		this._registerTools(viewId);
		return this.view.getComponent(viewId);
	}

	/**
	 * Called during mount/readiness to register controls with the generic per-view toolbar capability.
	 *
	 * @param {string} viewId - Exact owning workspace view.
	 */
	_registerTools(viewId) {
		let definitions = [
			{id: 'flat-earth-camera', slot: 'view-tools'},
			{id: 'flat-earth-camera-settings', slot: 'configuration', label: 'flat-earth.camera.title'},
		];
		let tokens = definitions.map((definition) =>
			this.contributions.add({...definition, controller: 'flat-earth-controller', viewId}),
		);
		this._tools.set(viewId, tokens);
	}

	/**
	 * Call this method to provide the camera toolbar contribution through the owning view.
	 *
	 * @param {WorkspaceContributionMount} request - Exact mounted contribution identity.
	 * @returns {React.ReactElement} - Scoped camera controls.
	 */
	mountContribution({contribution}) {
		if (contribution.id === 'flat-earth-time') {
			return this.view.getTimeComponent('configuration', true);
		}
		if (contribution.id === 'flat-earth-camera-settings') {
			return this.view.getCameraComponent(contribution.viewId);
		}
		return this.view.getToolsComponent(contribution.viewId);
	}

	/**
	 * Call this method when the host releases tool presentation; the page retains its camera model.
	 *
	 * @param {WorkspaceContributionMount} request - Exact released contribution identity.
	 */
	unmountContribution({contribution}) {
		if (contribution.id === 'flat-earth-time' || contribution.id === 'flat-earth-camera') {
			let owner = contribution.viewId ?? 'configuration';
			this.endTimeEdit(owner, this._gestureTokens?.get(owner));
		}
	}

	/**
	 * Call this method to change one view's retained camera framing.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @param {number} degrees - Vertical perspective angle.
	 */
	setFieldOfView(viewId, degrees) {
		this.sessions.get(viewId)?.setFieldOfView(degrees);
	}

	/**
	 * Call this method to request one view's physical observer elevation.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @param {Distance} height - Requested distance above ground.
	 */
	setObserverHeight(viewId, height) {
		this.sessions.get(viewId)?.setObserverHeight(height);
	}

	/**
	 * Call this method to aim one retained camera at its displayed Sun.
	 *
	 * @param {string} viewId - Exact owning view.
	 */
	centerOnSun(viewId) {
		this.sessions.get(viewId)?.centerOnSun();
	}

	/**
	 * Call this method to read one exact session's disposable scene state.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @returns {FlatEarthSceneState} - Current scene state.
	 */
	getState(viewId) {
		return this.sessions.get(viewId).getState();
	}

	/**
	 * Call this method to obtain the exact feature-owned canvas, retaining a startup cache's graphics context.
	 *
	 * @param {string} viewId - Exact mounted workspace view.
	 * @returns {HTMLCanvasElement} - Surface mounted inside the React-owned scene host.
	 */
	getCanvas(viewId) {
		return this._surfaces.get(viewId).canvas;
	}

	/**
	 * Call this method to attach a mounted surface to its owning session.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @param {HTMLCanvasElement} canvas - React-owned scene surface.
	 */
	attach(viewId, canvas) {
		this.sessions.get(viewId)?.attach(canvas);
	}

	/**
	 * Call this method to detach only the supplied session surface.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @param {HTMLCanvasElement} canvas - Surface being released.
	 */
	detach(viewId, canvas) {
		this.sessions.get(viewId)?.detach(canvas);
	}

	/**
	 * Call this method to retry the selected scene's failed renderer lifetime.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 */
	retry(viewId) {
		this.sessions.get(viewId)?.retry();
	}

	/**
	 * Call this method to select one mounted view's sky presentation.
	 *
	 * @param {string} viewId - Exact owning view.
	 * @param {FlatEarthSkyRenderMode} mode - Complete composition selection.
	 */
	setSkyRenderMode(viewId, mode) {
		this.sessions.get(viewId)?.setSkyRenderMode(mode);
	}

	/**
	 * Call this method to release the exact session removed from the workspace.
	 *
	 * @param {string} viewId - Exact workspace view being closed.
	 */
	unmount(viewId) {
		let session = this.sessions.get(viewId);
		if (!session) {
			return;
		}
		this.sessions.delete(viewId);
		this.timeModel.end(viewId, this._gestureTokens?.get(viewId));
		this._gestureTokens?.delete(viewId);
		let tokens = this._tools.get(viewId);
		this._tools.delete(viewId);
		if (tokens != null) {
			for (let token of tokens) {
				this.contributions.remove(token);
			}
		}
		if (session.canvas) {
			session.detach(session.canvas);
		}
		let surface = this._surfaces.get(viewId);
		this._surfaces.delete(viewId);
		if (surface?.graphics) {
			void surface.graphics
				.dispose()
				.catch((error) => console.error('Unused Flat Earth graphics release failed.', error));
		}
		this.model.close(viewId);
	}

	/**
	 * Call this method to release feature subscriptions and every remaining view session.
	 */
	stop() {
		if (this._startupGraphics) {
			void this._startupGraphics
				.dispose()
				.catch((error) => console.error('Flat Earth startup graphics release failed.', error));
			this._startupGraphics = null;
		}
		this._cacheStarted = false;
		this.timeModel?.synchronize(true);
		this.timeModel?.reset();
		if (this._timeRegistration != null) {
			this.contributions.remove(this._timeRegistration);
		}
		if (this._workspaceListener) {
			this.workspace.unlisten('state-changed', this._workspaceListener);
		}
		if (this._listener) {
			this.configuration.unlisten('changed', this._listener);
		}
		this._listener = null;
		this._timeRegistration = null;
		this._workspaceListener = null;
		this._gestureTokens?.clear();
		for (let viewId of this.sessions.keys()) {
			this.unmount(viewId);
		}
	}

	/**
	 * Call this method to read alternate time facts and generic shared-pane selection.
	 *
	 * @returns {FlatEarthTimeFacts} - Shared editor facts without localized labels.
	 */
	getTimeState() {
		let configuration = this.configuration.get();
		let settings = this.workspace.getState().workspace.configuration;
		return {
			...this.timeModel.getState(configuration),
			configuration,
			selected: settings.open && settings.target === null && settings.section === 'flat-earth-time',
		};
	}

	/**
	 * Called after shared time/editor/navigation changes to publish derived facts.
	 */
	_publishTime() {
		this.fire('time-changed', this.getTimeState());
	}

	/**
	 * Call this method to begin a current mounted control's edit gesture.
	 *
	 * @param {string} owner - Mounted control identity.
	 * @returns {number} - Exact gesture token.
	 */
	beginTimeEdit(owner) {
		if (owner !== 'configuration' && !this.sessions.has(owner)) {
			return 0;
		}
		if (owner === 'configuration' && !this.getTimeState().selected) {
			return 0;
		}
		this._gestureTokens ??= new Map();
		let token = this.timeModel.begin(owner, this.configuration.get());
		this._gestureTokens.set(owner, token);
		return token;
	}

	/**
	 * Call this method to seek shared time from a current slider gesture.
	 *
	 * @param {string} owner - Original mounted control identity.
	 * @param {number} token - Original gesture token.
	 * @param {number} angle - Signed degree request.
	 */
	seekTime(owner, token, angle) {
		this._acceptTime(this.timeModel.seek(owner, token, angle));
	}

	/**
	 * Called by time acceptance to write only through the shared clock facade.
	 *
	 * @param {number|null} timestamp - Complete accepted input, or no write.
	 */
	_acceptTime(timestamp) {
		if (timestamp !== null) {
			this._writingTime = true;
			try {
				this.configuration.setTimestamp(timestamp);
			} finally {
				this._writingTime = false;
			}
		}
		this._publishTime();
	}

	/**
	 * Call this method to end only the matching control's edit gesture.
	 *
	 * @param {string} owner - Original control identity.
	 * @param {number} token - Original gesture token.
	 */
	endTimeEdit(owner, token) {
		this.timeModel.end(owner, token);
	}

	/**
	 * Call this method to retain numeric input without changing time.
	 *
	 * @param {string} text - Unfinished numeric draft.
	 */
	setTimeDraft(text) {
		this.timeModel.setDraft(text);
		this._publishTime();
	}

	/**
	 * Call this method to accept complete numeric input against the current reference.
	 */
	acceptTimeDraft() {
		this._acceptTime(this.timeModel.accept(this.configuration.get()));
	}

	/**
	 * Call this method to discard unfinished numeric text without changing time.
	 */
	resetTimeDraft() {
		this.timeModel.reset();
		this._publishTime();
	}

	/**
	 * Call this method to open the shared feature time section through generic navigation.
	 */
	openTimeSettings() {
		this.workspace.openConfiguration(null, 'flat-earth-time');
	}

	/**
	 * Call this method to open location editing without importing the editor feature.
	 */
	openLocationSettings() {
		this.workspace.openConfiguration(null, null, 'location');
	}
}

new FlatEarthController();
