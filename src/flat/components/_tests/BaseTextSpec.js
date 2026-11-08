import React from 'react';
import BaseText from '../BaseText.jsx';
import Text from '../Text.jsx';
import {createTestHarness} from '../../testing/TestHarness.js';

describe('BaseText and Text', () => {
	let harness;
	const localize = {
		translate: jasmine
			.createSpy('translate')
			.and.callFake((phrase, replacements, cardinal) =>
				phrase === 'Literal'
					? 'Translated literal'
					: phrase === 'welcome'
						? `Hello ${replacements.name}:${cardinal}`
						: '<strong>Trusted</strong>',
			),
	};
	beforeEach(() => localize.translate.calls.reset());
	afterEach(() => harness?.unmount());

	it('routes base text through localization without an opt-in property', () => {
		harness = createTestHarness().withContext({localize});
		const result = harness.render(BaseText, {value: 'Literal'});
		expect(result.container.textContent).toBe('Translated literal');
		expect(localize.translate).toHaveBeenCalledWith('Literal', undefined, undefined, 'disabled', false);
	});

	it('passes phrase arguments through the concrete Text component', () => {
		harness = createTestHarness().withContext({localize});
		const result = harness.render(Text, {value: 'welcome', replacements: {name: 'Ada'}, cardinal: 2});
		expect(result.container.textContent).toBe('Hello Ada:2');
		expect(localize.translate).toHaveBeenCalledWith('welcome', {name: 'Ada'}, 2, 'disabled', false);
	});

	it('renders trusted HTML only when explicitly enabled', () => {
		harness = createTestHarness().withContext({localize});
		let result = harness.render(Text, {value: 'html'});
		expect(result.container.querySelector('strong')).toBeNull();
		result = result.rerender({html: true});
		expect(result.container.querySelector('strong').textContent).toBe('Trusted');
	});

	it('supports semantic element props and suppresses empty text', () => {
		harness = createTestHarness();
		let result = harness.render(BaseText, {as: 'p', value: 'Paragraph', id: 'copy'});
		expect(result.query('p#copy').textContent).toBe('Paragraph');
		result = result.rerender({value: ''});
		expect(result.container.children.length).toBe(0);
	});

	it('uses the disabled translator for base text, including replacements and trusted HTML escaping', () => {
		harness = createTestHarness();
		let result = harness.render(BaseText, {value: 'Hello %{name}', replacements: {name: 'Ada'}});
		expect(result.query('span').textContent).toBe('Hello Ada');
		result.rerender({value: '<strong>%{name}</strong>', html: true, replacements: {name: '<Ada>'}});
		expect(result.query('strong').textContent).toBe('<Ada>');
		result.rerender({value: undefined});
		expect(result.container.children.length).toBe(0);
	});
});
