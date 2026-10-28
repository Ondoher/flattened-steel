import React from 'react';
import {Service} from '@polylith/core';
import Page from '../components/Page.jsx';
/**
 * View service that creates the initial-page React presentation.
 *
 * @implements {PageView}
 */
export class PageView extends Service {
	/**
	 * Creates the initial-page view service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('workspace-view', registry);
		this.implement(['getComponent']);
	}
	/**
	 * Call this method to create the initial-page presentation.
	 *
	 * @param {object} props - The page properties.
	 * @returns {React.ReactElement} - The page element.
	 */
	getComponent(props = {}) {
		return React.createElement(Page, {...props, pageView: this});
	}
}
new PageView();
