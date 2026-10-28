import {Registry} from '@polylith/core';
import {AppPagesService} from '../../../services/app-pages.js';
import {PageController} from '../controller.js';
import {PageView} from '../views/page.js';
import Page from '../components/Page.jsx';
import {createTestHarness} from '../../../testing/TestHarness.js';
describe('initial page feature', () => {
	it('registers metadata in its controller and renders through its view service', () => {
		const registry = new Registry();
		const pages = new AppPagesService(registry);
		pages.start();
		const view = new PageView(registry);
		const controller = new PageController(registry);
		controller.ready();
		const page = pages.getById('workspace');
		expect(page.controller).toBe('workspace-controller');
		expect(page.default).toBeTrue();
		expect(page.literalLabel).toBe('Workspace');
		const component = controller.mount();
		expect(component.props.pageView).toBe(view);
		expect(view.getComponent().props.pageView).toBe(view);
		expect(view.getComponent({page}).props.page).toBe(page);
		let harness = createTestHarness();
		let result = harness.render(Page, component.props);
		expect(result.query('h1').textContent).toBe('Workspace');
		harness.unmount();
		harness = createTestHarness().withContext({
			localizationEnabled: true,
			localize: {
				translate: (key, _replacements, _cardinal, locale) =>
					key === 'workspace.title' && locale === 'en-US' ? 'Workspace' : '',
			},
		});
		result = harness.render(Page, component.props);
		expect(result.query('h1').textContent).toBe('Workspace');
		harness.unmount();
		harness = createTestHarness().withContext({localizationEnabled: true, localize: null});
		result = harness.render(Page, component.props);
		expect(result.query('h1').textContent).toBe('');
		harness.unmount();
	});
});
