import {Registry} from '@polylith/core';
import {AppPagesService} from '../app-pages.js';
describe('app pages', () => {
	it('sorts defensive copies by order and id without inferring a default', () => {
		const service = new AppPagesService(new Registry());
		service.start();
		service.add({id: 'later', order: 2});
		service.add({id: 'beta', order: 1});
		service.add({id: 'alpha', order: 1});
		const pages = service.get();
		pages[0].id = 'changed';
		expect(service.get().map((page) => page.id)).toEqual(['alpha', 'beta', 'later']);
		expect(service.getDefault()).toBeNull();
		expect(service.getById('missing')).toBeNull();
	});
	it('updates records and reports the established event names', () => {
		const service = new AppPagesService(new Registry());
		service.start();
		const added = jasmine.createSpy('added');
		const updated = jasmine.createSpy('updated');
		service.listen('page-added', added);
		service.listen('page-updated', updated);
		service.add({id: 'one', default: true});
		service.add({id: 'one', label: 'One'});
		expect(added).toHaveBeenCalled();
		expect(updated).toHaveBeenCalled();
		expect(service.getById('one').label).toBe('One');
		expect(service.getBySlug('one').id).toBe('one');
		expect(service.getBySlug('missing')).toBeNull();
		expect(service.getDefault().id).toBe('one');
	});
	it('rejects invalid configuration', () => {
		const service = new AppPagesService(new Registry());
		service.start();
		expect(() => service.add({})).toThrowError(/id/);
		service.add({id: 'one', urlSlug: 'same', default: true});
		expect(() => service.add({id: 'two', urlSlug: 'same'})).toThrowError(/Duplicate/);
		expect(() => service.add({id: 'two', default: true})).toThrowError(/Multiple/);
	});
});
