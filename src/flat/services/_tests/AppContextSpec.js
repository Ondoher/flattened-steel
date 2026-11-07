import {Registry, Service} from '@polylith/core';
import {AppContextService} from '../app-context.js';

describe('app context', () => {
	it('resolves localization in ready rather than start and publishes replacement only once', () => {
		let registry = new Registry();
		let localize = {translate: () => '', supportsLocale: () => true};
		registry.register('localize', localize);
		let lookup = spyOn(registry, 'subscribe').and.callThrough();
		let service = new AppContextService(registry);
		service.start();
		expect(service.get().localize).toBeNull();
		expect(lookup).not.toHaveBeenCalled();
		let changed = jasmine.createSpy('changed');
		service.listen('changed', changed);
		service.ready();
		service.ready();
		expect(service.get().localize).toBe(localize);
		expect(changed).toHaveBeenCalledTimes(1);
	});
	it('owns defensive locale and generated feature flags', () => {
		const registry = new Registry();
		const localize = {translate: () => '', supportsLocale: (locale) => locale === 'en-US'};
		class LocalizeStub extends Service {
			constructor() {
				super('localize', registry);
				this.implement(['translate', 'supportsLocale']);
			}

			translate(...args) {
				return localize.translate(...args);
			}

			supportsLocale(locale) {
				return localize.supportsLocale(locale);
			}
		}
		new LocalizeStub();
		const service = new AppContextService(registry);
		service.start();
		service.ready();
		const value = service.get();
		expect(value.locale).toBe('en-US');
		expect(value.localize).toBe(registry.subscribe('localize'));
		expect(value.localizationEnabled).toBe(true);
		expect(value.accessibilityEnabled).toBe(false);
		expect(value.controlSize).toBe('small');
		expect(value.controlVariant).toBe('outlined');
		value.locale = 'changed';
		value.controlSize = 'medium';
		value.controlVariant = 'filled';
		expect(service.get().locale).toBe('en-US');
		expect(service.get().controlSize).toBe('small');
		expect(service.get().controlVariant).toBe('outlined');
	});

	it('rejects unloaded locales and publishes a loaded locale change once', () => {
		const registry = new Registry();
		const localize = {translate: () => '', supportsLocale: (locale) => locale === 'en-US'};
		class LocalizeStub extends Service {
			constructor() {
				super('localize', registry);
				this.implement(['translate', 'supportsLocale']);
			}

			translate(...args) {
				return localize.translate(...args);
			}

			supportsLocale(locale) {
				return localize.supportsLocale(locale);
			}
		}
		new LocalizeStub();
		const service = new AppContextService(registry);
		service.start();
		service.ready();
		const listener = jasmine.createSpy('locale');
		const changed = jasmine.createSpy('changed');
		service.listen('locale', listener);
		service.listen('changed', changed);
		spyOn(console, 'warn');
		expect(service.setLocale('fr-CA')).toBeFalse();
		expect(service.get().locale).toBe('en-US');
		expect(console.warn).toHaveBeenCalledWith('Locale is not loaded: fr-CA');
		expect(service.setLocale('en-US')).toBeFalse();
		expect(listener).not.toHaveBeenCalled();
		expect(changed).not.toHaveBeenCalled();
		localize.supportsLocale = (locale) => locale === 'fr-CA';
		expect(service.setLocale('fr-CA')).toBeTrue();
		expect(service.get().locale).toBe('fr-CA');
		expect(service.get().controlSize).toBe('small');
		expect(service.get().controlVariant).toBe('outlined');
		expect(listener).toHaveBeenCalledWith('fr-CA');
		expect(changed).toHaveBeenCalledWith(service.get());
	});
});
