import React from 'react';
import {createRoot} from 'react-dom/client';
import {registry} from '@polylith/core';

import '../services/localize.js';
import '../services/app-context.js';
import '../services/io.js';

import '../services/app-pages.js';
import '../services/url.js';
import App from './App.jsx';

let root = null;

/** Call this method to unmount the generated application presentation. */
export function stopApplication() {
	root?.unmount();
	root = null;
}

registry.listen('ready', () => {
	const app = <App registry={registry} />;
	const content = app;
	root = createRoot(document.getElementById('main-content'));
	root.render(<React.StrictMode>{content}</React.StrictMode>);
});
