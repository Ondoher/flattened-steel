import {Registry, Service} from '@polylith/core';
import {AppContextService} from '../app-context.js';

describe('app context', () => {
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
		const value = service.get();
		expect(value.locale).toBe('en-US');
		expect(value.localize).toBe(registry.subscribe('localize'));
		expect(value.localizationEnabled).toBe(true);
		expect(value.accessibilityEnabled).toBe(false);
		value.locale = 'changed';
		expect(service.get().locale).toBe('en-US');
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
		expect(listener).toHaveBeenCalledWith('fr-CA');
		expect(changed).toHaveBeenCalledWith(service.get());
	});
});
