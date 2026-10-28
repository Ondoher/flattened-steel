import {Registry} from '@polylith/core';
import {createTranslator, LocalizeService, parsePhraseJson, replaceText} from '../localize.js';

describe('localization', () => {
	it('resolves literal phrases, valid replacements, and locale plural forms', () => {
		const translate = createTranslator('en-US', {
			greeting: 'Hello %{name}: %{count}',
			count: {one: 'one item', other: '%{count} items'},
		});
		expect(translate('greeting', {name: 'Ada', count: 2})).toBe('Hello Ada: 2');
		expect(translate('count', {count: 1}, 1)).toBe('one item');
		expect(translate('count', {count: 3}, 3)).toBe('3 items');
		expect(createTranslator('en-US', {fallback: {other: 'fallback'}})('fallback', {}, 1)).toBe('fallback');
	});

	it('supports generated defaults and the registry service facade', () => {
		spyOn(console, 'warn');
		expect(createTranslator()('not-installed')).toBe('');
		const service = new LocalizeService(new Registry());
		service.start();
		expect(service.supportsLocale('en-US')).toBeTrue();
		expect(service.supportsLocale('fr-CA')).toBeFalse();
		expect(service.translate('not-installed')).toBe('');
		expect(service.translate('not-installed', {}, undefined, 'fr-CA')).toBe('');
	});

	it('parses valid phrase JSON and throws for invalid configuration', () => {
		expect(parsePhraseJson('{"message":"Hello"}')).toEqual({message: 'Hello'});
		expect(() => parsePhraseJson('[]')).toThrowError(SyntaxError);
		expect(() => parsePhraseJson('{')).toThrowError(SyntaxError);
	});

	it('warns and returns empty text for a missing phrase', () => {
		spyOn(console, 'warn');
		expect(createTranslator('en-US', {})('missing')).toBe('');
		expect(console.warn).toHaveBeenCalledWith('Missing translation: missing');
	});

	it('requires the plural other value', () => {
		spyOn(console, 'error');
		expect(createTranslator('en-US', {count: {one: 'one'}})('count', {}, 1)).toBe('');
		expect(console.error).toHaveBeenCalledWith('Plural translation lacks other: count');
	});

	it('warns and returns empty text for unsupported phrase values', () => {
		spyOn(console, 'warn');
		const translate = createTranslator('en-US', {number: 12, list: ['value'], empty: null});
		expect(translate('number')).toBe('');
		expect(translate('list')).toBe('');
		expect(translate('empty')).toBe('');
		expect(console.warn).toHaveBeenCalledTimes(3);
	});

	it('warns and removes an unknown replacement', () => {
		spyOn(console, 'warn');
		expect(createTranslator('en-US', {message: 'Hello %{name}'})('message')).toBe('Hello ');
		expect(console.warn).toHaveBeenCalledWith('Missing replacement: name');
	});

	it('logs invalid replacement values and substitutes empty text', () => {
		spyOn(console, 'error');
		const translate = createTranslator('en-US', {message: '%{object}|%{infinite}'});
		expect(translate('message', {object: {}, infinite: Infinity})).toBe('|');
		expect(console.error).toHaveBeenCalledWith('Invalid replacement: object');
		expect(console.error).toHaveBeenCalledWith('Invalid replacement: infinite');
	});

	it('escapes replacement markup for trusted HTML and Markdown paths', () => {
		spyOn(console, 'warn');
		expect(replaceText('Hello %{name}', {name: '<Ada>'}, true)).toBe('Hello &lt;Ada&gt;');
		const service = new LocalizeService(new Registry());
		service.start();
		expect(service.replace('%{value}', {value: '"quoted"'}, true)).toBe('&quot;quoted&quot;');
		expect(replaceText('%{value}')).toBe('');
		expect(replaceText('%{value}', {value: "&'"})).toBe("&'");
		expect(service.replace('%{value}')).toBe('');
	});
});
