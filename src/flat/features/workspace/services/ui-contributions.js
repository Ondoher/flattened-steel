import {Service} from '@polylith/core';

/**
 * Application-wide contribution catalog; contributors retain their own presentation and behavior.
 *
 * @implements {WorkspaceUiContributionsService}
 */
export class UiContributionsService extends Service {
	/**
	 * Creates the contribution capability in the owning application registry.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('ui-contributions', registry);
		this.implement(['start', 'add', 'remove', 'removeForView', 'get']);
	}

	/**
	 * Call this method to initialize local registration state without locating collaborators.
	 */
	start() {
		this._records = new Map();
		this._nextRegistration ??= 1;
	}

	/**
	 * Call this method to register feature-owned presentation at an explicit workspace host.
	 *
	 * @param {UiContributionDefinition} definition - Controller-owned contribution and scope.
	 * @returns {number} - Exact lifetime token used to remove this registration.
	 * @throws {TypeError} - The host scope is incompatible or the ordering is nonfinite.
	 * @throws {Error} - A contribution with the same id, slot, and view scope is already registered.
	 */
	add(definition) {
		let viewId = definition.viewId ?? null;
		if (definition.slot === 'toolbar' && viewId !== null) {
			throw new TypeError('Shared toolbar contributions use workspace scope.');
		}
		if (['view-tools', 'view-tools-secondary', 'status'].includes(definition.slot) && viewId === null) {
			throw new TypeError('View tools and status require an open-view identity.');
		}
		let order = definition.order ?? 0;
		if (!Number.isFinite(order)) {
			throw new TypeError('Contribution order must be finite.');
		}
		if (
			this.get().some(
				(record) => record.id === definition.id && record.slot === definition.slot && record.viewId === viewId,
			)
		) {
			throw new Error(`Duplicate contribution: ${definition.id}`);
		}
		let registrationId = this._nextRegistration++;
		this._records.set(registrationId, {
			...definition,
			viewId,
			order,
			registrationId,
		});
		this.fire('changed');
		return registrationId;
	}

	/**
	 * Call this method to remove only the registration matching its original lifetime token.
	 *
	 * @param {number} registrationId - Exact registration to release.
	 * @returns {boolean} - Whether an active registration was removed.
	 */
	remove(registrationId) {
		let removed = this._records.delete(registrationId);
		if (removed) {
			this.fire('changed');
		}
		return removed;
	}

	/**
	 * Call this method to remove all contributions scoped to a closed view.
	 *
	 * @param {string} viewId - Closed view identity.
	 */
	removeForView(viewId) {
		let removed = false;
		for (let [registrationId, record] of this._records) {
			if (record.viewId === viewId) {
				removed = this._records.delete(registrationId) || removed;
			}
		}
		if (removed) {
			this.fire('changed');
		}
	}

	/**
	 * Call this method to read ordered defensive copies of contribution metadata.
	 *
	 * @returns {UiContributionRecord[]} - Current registrations without feature implementations.
	 */
	get() {
		return [...this._records.values()]
			.map((record) => ({...record}))
			.sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
	}
}
new UiContributionsService();
