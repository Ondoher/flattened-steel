import {Registry, Service} from '@polylith/core';
import {AppContextService} from '../app-context.js';
import {LocalizeService, createTranslator} from '../localize.js';

describe('app context', () => {
	it('resolves localization in ready rather than start and publishes replacement only once', () => {
		let registry = new Registry();
		let localize = {translate: () => '', supportsLocale: () => true, setLocale: jasmine.createSpy('setLocale')};
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
		expect(localize.setLocale).toHaveBeenCalledOnceWith('en-US');
		expect(changed).toHaveBeenCalledTimes(1);
	});
	it('owns defensive locale and generated feature flags', () => {
		const registry = new Registry();
		const localize = {
			translate: () => '',
			supportsLocale: (locale) => locale === 'en-US',
			setLocale: jasmine.createSpy('setLocale'),
		};
		class LocalizeStub extends Service {
			constructor() {
				super('localize', registry);
				this.implement(['translate', 'supportsLocale', 'setLocale']);
			}

			translate(...args) {
				return localize.translate(...args);
			}

			supportsLocale(locale) {
				return localize.supportsLocale(locale);
			}

			setLocale(locale) {
				localize.setLocale(locale);
			}
		}
		new LocalizeStub();
		const service = new AppContextService(registry);
		service.start();
		service.ready();
		const value = service.get();
		expect(value.locale).toBe('en-US');
		expect(value.localize).toBe(registry.subscribe('localize'));
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
		const localize = {
			translate: () => '',
			supportsLocale: (locale) => locale === 'en-US',
			setLocale: jasmine.createSpy('setLocale'),
		};
		class LocalizeStub extends Service {
			constructor() {
				super('localize', registry);
				this.implement(['translate', 'supportsLocale', 'setLocale']);
			}

			translate(...args) {
				return localize.translate(...args);
			}

			supportsLocale(locale) {
				return localize.supportsLocale(locale);
			}

			setLocale(locale) {
				localize.setLocale(locale);
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
		expect(localize.setLocale.calls.allArgs()).toEqual([['en-US'], ['fr-CA']]);
	});

	it('selects pass-through translation for disabled context through the same service call path', async () => {
		const registry = new Registry();
		new LocalizeService(registry);
		class DisabledContext extends AppContextService {
			start() {
				super.start();
				this.value.locale = 'disabled';
			}
		}
		const service = new DisabledContext(registry);
		await registry.start();
		const context = service.get();
		expect(context.locale).toBe('disabled');
		expect(context.localize.translate('Hello %{name}', {name: 'Ada'})).toBe('Hello Ada');
		expect(context.localize.translate('Hello %{name}', {name: 'Ada'}, undefined, context.locale)).toBe('Hello Ada');
		expect(service.setLocale('en-US')).toBeTrue();
		expect(service.get().locale).toBe('en-US');
		expect(service.setLocale('disabled')).toBeTrue();
		expect(service.get().locale).toBe('disabled');
	});

	it('updates the real translator before notifying context consumers of a locale change', () => {
		const registry = new Registry();
		const localize = new LocalizeService(registry);
		localize.start();
		localize.translators.set('fr-CA', createTranslator('fr-CA', {greeting: 'Bonjour %{name}'}));
		const service = new AppContextService(registry);
		service.start();
		service.ready();
		const seen = [];
		service.listen('changed', (context) => {
			seen.push({locale: context.locale, text: context.localize.translate('greeting', {name: 'Ada'})});
		});
		expect(service.setLocale('fr-CA')).toBeTrue();
		const context = service.get();
		expect(context.localize.translate('greeting', {name: 'Ada'}, undefined, context.locale)).toBe('Bonjour Ada');
		expect(seen).toEqual([{locale: 'fr-CA', text: 'Bonjour Ada'}]);
		expect(service.setLocale('fr-CA')).toBeFalse();
		expect(seen.length).toBe(1);
	});
});
