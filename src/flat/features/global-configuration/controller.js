import {Service} from '@polylith/core';

/**
 * Registers global configuration presentation through the workspace's public contribution capability.
 *
 * @implements {GlobalConfigurationControllerService}
 */
export class GlobalConfigurationController extends Service {
	/**
	 * Creates the global configuration provider capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('global-configuration-controller', registry);
		this.implement([
			'start',
			'ready',
			'stop',
			'mountContribution',
			'unmountContribution',
			'getState',
			'setQuery',
			'selectCity',
			'setCoordinate',
			'applyCoordinates',
			'retryCities',
			'setDateTimeField',
			'applyDateTime',
			'setNow',
			'openEditor',
		]);
	}

	/**
	 * Call this method to initialize local registration ownership.
	 */
	start() {
		/** @type {number|null} */
		this._registrationId = null;
		this._summaryRegistration = null;
		this._generation = 0;
		this._configurationListener = null;
	}

	/**
	 * Call this method after dependency readiness to register the workspace-wide settings provider.
	 */
	ready() {
		this.stop();
		this.view = /** @type {GlobalConfigurationViewService} */ (
			this.registry.subscribe('global-configuration-view')
		);
		this.contributions = /** @type {WorkspaceUiContributionsService} */ (
			this.registry.subscribe('ui-contributions')
		);
		this.workspace = /** @type {WorkspaceControllerService} */ (this.registry.subscribe('workspace-controller'));
		this.configuration = /** @type {ConfigurationService} */ (this.registry.subscribe('configuration'));
		this.editor = /** @type {LocationEditorModelService} */ (this.registry.subscribe('location-editor-model'));
		this.dateTimeEditor = /** @type {DateTimeEditorModelService} */ (
			this.registry.subscribe('date-time-editor-model')
		);
		this.catalog = /** @type {CityCatalogService} */ (this.registry.subscribe('city-catalog'));
		let snapshot = this.configuration.get();
		this.editor.reset(snapshot.location);
		this.dateTimeEditor.reset(snapshot.timestamp);
		this._configurationListener = this.configuration.listen('changed', (configuration, properties) =>
			this._configurationChanged(configuration, properties),
		);
		this._registrationId = this.contributions.add({
			label: 'global-configuration.section',
			id: 'global-configuration',
			controller: 'global-configuration-controller',
			slot: 'configuration',
			viewId: null,
		});
		this._summaryRegistration = this.contributions.add({
			id: 'global-summary',
			controller: 'global-configuration-controller',
			slot: 'toolbar',
		});
	}

	/**
	 * Called by accepted configuration updates to reset only the affected editor drafts.
	 *
	 * @param {ApplicationConfiguration} configuration - Accepted configuration snapshot.
	 * @param {ConfigurationProperty[]} properties - Properties covered by this update.
	 */
	_configurationChanged(configuration, properties) {
		if (properties.includes('location')) {
			this.editor.reset(configuration.location);
		}
		if (properties.includes('timestamp') && !this.dateTimeEditor.getState().dirty) {
			this.dateTimeEditor.reset(configuration.timestamp);
		}
		this._emitState();
	}

	/**
	 * Call this method to remove only the registration owned by this provider lifetime.
	 */
	stop() {
		this._generation++;
		this.catalog?.stop();
		if (this._configurationListener) {
			this.configuration.unlisten('changed', this._configurationListener);
		}
		this._configurationListener = null;
		if (this._summaryRegistration != null) {
			this.contributions.remove(this._summaryRegistration);
		}
		let registrationId = this._registrationId;
		this._registrationId = null;
		this._summaryRegistration = null;
		if (registrationId != null) {
			this.contributions.remove(registrationId);
		}
	}

	/**
	 * Call this method to obtain global configuration presentation through its owning view.
	 *
	 * @param {WorkspaceContributionMount} request - Exact contribution lifetime requested by the host.
	 * @returns {React.ReactElement} - Global location editor and city picker.
	 */
	mountContribution({contribution}) {
		if (contribution.slot === 'toolbar') {
			return this.view.getSummaryComponent();
		}
		void this.retryCities();
		return this.view.getComponent();
	}

	/**
	 * Call this method when the host releases presentation; the feature retains its catalog and accepted location.
	 *
	 * @param {WorkspaceContributionMount} request - Exact contribution lifetime being released.
	 */
	unmountContribution(request) {}

	/**
	 * Call this method to read accepted configuration, editor drafts, and model-owned search results.
	 *
	 * @returns {GlobalConfigurationState} - Facts for projection by the owning view.
	 */
	getState() {
		let editor = this.editor.getState();
		let configuration = this.configuration.get();
		return {
			location: configuration.location,
			timestamp: configuration.timestamp,
			dateTimeEditor: this.dateTimeEditor.getState(),
			editor,
			catalogStatus: this.catalog.getStatus(),
			matches: this.catalog.search(editor.query),
		};
	}

	/**
	 * Called after an owned transition to notify the presentation boundary.
	 */
	_emitState() {
		this.fire('state-changed', this.getState());
	}

	/**
	 * Call this method to load the catalog on demand or retry a failed request.
	 *
	 * @returns {Promise<void>} - Completion without publishing results after controller shutdown.
	 */
	async retryCities() {
		if (this.catalog.getStatus() === 'loading' || this.catalog.getStatus() === 'ready') {
			return;
		}
		let generation = this._generation;
		let pending = this.catalog.load();
		this._emitState();
		await pending;
		if (generation === this._generation) {
			this._emitState();
		}
	}

	/**
	 * Call this method to edit search text without replacing the accepted location.
	 *
	 * @param {string} query - User-entered city query.
	 */
	setQuery(query) {
		this.editor.setQuery(query);
		this._emitState();
	}

	/**
	 * Call this method to commit a selected catalog city's coordinates through the configuration owner.
	 *
	 * @param {string} id - Stable selected-city identity.
	 */
	selectCity(id) {
		let location = this.catalog.getLocation(id);
		if (location) {
			this._acceptLocation(location);
		}
	}

	/**
	 * Called by city or coordinate selection to reconcile drafts after acceptance, including unchanged values.
	 *
	 * @param {ConfiguredLocation} location - Complete location to offer to the configuration owner.
	 */
	_acceptLocation(location) {
		if (!this.configuration.setLocation(location)) {
			this.editor.reset(location);
			this._emitState();
		}
	}

	/**
	 * Call this method to edit one coordinate draft while preserving the current accepted location.
	 *
	 * @param {LocationCoordinateField} field - Coordinate field being edited.
	 * @param {string} value - Uncommitted input text.
	 */
	setCoordinate(field, value) {
		this.editor.setCoordinate(field, value);
		this._emitState();
	}

	/**
	 * Call this method to offer complete coordinate drafts to the configuration owner and report domain rejection.
	 */
	applyCoordinates() {
		let location = this.editor.getCoordinates();
		if (!location) {
			this._emitState();
			return;
		}
		try {
			this._acceptLocation(location);
		} catch (error) {
			if (!(error instanceof RangeError)) {
				throw error;
			}
			this.editor.rejectCoordinates();
			this._emitState();
		}
	}

	/**
	 * Call this method to edit the shared date or time draft without accepting it yet.
	 *
	 * @param {DateTimeDraftField} field - Date or time field being edited.
	 * @param {string} value - Uncommitted local-format input text.
	 */
	setDateTimeField(field, value) {
		this.dateTimeEditor.setField(field, value);
		this._emitState();
	}

	/**
	 * Call this method to accept a complete date/time pair through the shared configuration owner.
	 */
	applyDateTime() {
		let timestamp = this.dateTimeEditor.getValue();
		if (timestamp == null) {
			this._emitState();
			return;
		}
		this.dateTimeEditor.reset(timestamp);
		if (!this.configuration.setTimestamp(timestamp)) {
			this._emitState();
		}
	}

	/**
	 * Call this method to replace the date/time drafts and shared timestamp with the current instant.
	 */
	setNow() {
		let timestamp = Date.now();
		this.dateTimeEditor.reset(timestamp);
		if (!this.configuration.setTimestamp(timestamp)) {
			this._emitState();
		}
	}

	/**
	 * Call this method to open a provider-owned editor through generic settings navigation.
	 *
	 * @param {string} focus - Editor focus intent, location or date-time.
	 */
	openEditor(focus) {
		this.workspace.openConfiguration(null, 'global-configuration', focus);
	}
}

new GlobalConfigurationController();
