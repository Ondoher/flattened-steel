import {Registry} from '@polylith/core';
import {UiContributionsService} from '../ui-contributions.js';

describe('workspace UI contribution catalog', () => {
	let catalog;
	beforeEach(() => {
		catalog = new UiContributionsService(new Registry());
		catalog.start();
	});
	it('does not recycle registration tokens when local startup state is reinitialized', () => {
		let previous = catalog.add({id: 'tool', slot: 'toolbar', controller: 'owner'});
		catalog.start();
		let current = catalog.add({id: 'tool', slot: 'toolbar', controller: 'owner'});
		expect(catalog.remove(previous)).toBeFalse();
		expect(catalog.get()[0].registrationId).toBe(current);
	});
	it('orders defensive metadata and distinguishes equal ids in different view scopes', () => {
		catalog.add({id: 'tools', slot: 'view-tools', viewId: 'view-1', controller: 'owner', order: 2});
		catalog.add({id: 'tools', slot: 'view-tools', viewId: 'view-2', controller: 'owner', order: 1});
		let records = catalog.get();
		expect(records.map((record) => record.viewId)).toEqual(['view-2', 'view-1']);
		records[0].controller = 'changed';
		expect(catalog.get()[0].controller).toBe('owner');
	});
	it('uses exact lifetime tokens so stale cleanup cannot remove a replacement', () => {
		let definition = {id: 'location', slot: 'toolbar', controller: 'owner'};
		let previous = catalog.add(definition);
		expect(catalog.remove(previous)).toBeTrue();
		let current = catalog.add(definition);
		expect(catalog.remove(previous)).toBeFalse();
		expect(catalog.get()[0].registrationId).toBe(current);
	});
	it('removes only the closed view contributions and publishes one update', () => {
		catalog.add({id: 'shared', slot: 'configuration', controller: 'owner'});
		catalog.add({id: 'tools', slot: 'view-tools', viewId: 'view-2', controller: 'owner'});
		catalog.add({id: 'status', slot: 'status', viewId: 'view-2', controller: 'owner'});
		let changed = jasmine.createSpy('changed');
		catalog.listen('changed', changed);
		catalog.removeForView('view-2');
		expect(catalog.get().map((record) => record.id)).toEqual(['shared']);
		expect(changed).toHaveBeenCalledTimes(1);
	});
	it('rejects duplicate scope identities, nonfinite ordering, and incompatible host scope', () => {
		expect(() => catalog.add({id: 'bad', slot: 'status', controller: 'owner'})).toThrow();
		expect(() => catalog.add({id: 'bad', slot: 'toolbar', controller: 'owner', viewId: 'view-1'})).toThrow();
		expect(() => catalog.add({id: 'bad', slot: 'toolbar', controller: 'owner', order: NaN})).toThrow();
		let definition = {id: 'shared', slot: 'toolbar', controller: 'owner'};
		catalog.add(definition);
		expect(() => catalog.add(definition)).toThrowError(/Duplicate/);
	});
});
