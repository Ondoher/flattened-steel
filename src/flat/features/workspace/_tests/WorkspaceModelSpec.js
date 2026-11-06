import {Registry} from '@polylith/core';
import {WorkspaceModel} from '../models/WorkspaceModel.js';

/**
 * Call this function to initialize an isolated registered workspace model.
 *
 * @returns {WorkspaceModelService} - Public composition capability.
 */
function createModel() {
	let registry = new Registry();
	let model = new WorkspaceModel(registry);
	model.start();
	return registry.subscribe('workspace-model');
}

describe('workspace composition model', () => {
	it('keeps one primary view and returns defensive composition snapshots', () => {
		let model = createModel();
		let snapshot = model.getSnapshot();
		expect(snapshot.views).toEqual([{id: 'view-1', pageId: null}]);
		snapshot.views[0].pageId = 'changed';
		snapshot.configuration.open = true;
		expect(model.getSnapshot().views[0].pageId).toBeNull();
		expect(model.getSnapshot().configuration.open).toBeFalse();
	});
	it('preserves the primary view and never reuses a closed optional identity', () => {
		let model = createModel();
		model.selectPage('view-1', 'first');
		let second = model.addView('second');
		expect(model.addView()).toBeNull();
		expect(model.removeView('view-1')).toBeFalse();
		model.setConfigurationTarget(second.id);
		expect(model.removeView(second.id)).toBeTrue();
		expect(model.getSnapshot().configuration.target).toBeNull();
		expect(model.getSnapshot().views).toEqual([{id: 'view-1', pageId: 'first'}]);
		expect(model.addView().id).not.toBe(second.id);
	});
	it('rejects selection or configuration of a closed view', () => {
		let model = createModel();
		expect(() => model.selectPage('closed', 'first')).toThrowError(/Unknown workspace view/);
		expect(() => model.setConfigurationTarget('closed')).toThrowError(/Unknown configuration target/);
	});
});
