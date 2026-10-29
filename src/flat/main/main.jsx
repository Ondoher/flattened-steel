import React from 'react';
import {createRoot} from 'react-dom/client';
import {registry} from '@polylith/core';

import '../services/localize.js';
import '../services/app-context.js';
import '../services/io.js';

import '../services/app-pages.js';
import '../services/url.js';

let root = null;

/**
 * Call this method to unmount the generated application presentation.
 */
export function stopApplication() {
	root?.unmount();
	root = null;
	registry.subscribe('app-controller')?.stop();
	registry.subscribe('app-view')?.stop();
}

registry.listen('ready', () => {
	registry.subscribe('app-controller').activate();
	let content = registry.subscribe('app-view').getComponent();
	root ??= createRoot(document.getElementById('main-content'));
	root.render(<React.StrictMode>{content}</React.StrictMode>);
});
